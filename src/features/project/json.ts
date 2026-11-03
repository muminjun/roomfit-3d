import { LIMITS } from "../../config/limits";
import { catalog } from "../../data/catalog";
import { validateArchitecture } from "../architecture/geometry";
import {
  normalizeEditCandidate,
  validateAllPlacements,
  validateRoomPolygon,
} from "../../lib/geometry";
import type { Opening, PointMm, ProjectDataV2 } from "../../types/model";
import { projectSchema, rawProjectSchema } from "../../types/schema";

export type ProjectParseResult =
  | { ok: true; project: ProjectDataV2; changes: string[]; warnings: string[] }
  | { ok: false; message: string };
const error = (message: string): ProjectParseResult => ({ ok: false, message });
function hasForbiddenKeys(value: unknown): boolean {
  const pending: unknown[] = [value];
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, child] of Object.entries(current)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype")
        return true;
      pending.push(child);
    }
  }
  return false;
}
function intersects(a: PointMm, b: PointMm, c: PointMm, d: PointMm): boolean {
  const h1 = a.y === b.y,
    h2 = c.y === d.y;
  if (h1 === h2) {
    if (h1 ? a.y !== c.y : a.x !== c.x) return false;
    const [a0, a1, b0, b1] = h1 ? [a.x, b.x, c.x, d.x] : [a.y, b.y, c.y, d.y];
    return (
      Math.max(Math.min(a0, a1), Math.min(b0, b1)) <=
      Math.min(Math.max(a0, a1), Math.max(b0, b1))
    );
  }
  const h = h1 ? [a, b] : [c, d],
    v = h1 ? [c, d] : [a, b];
  return (
    v[0].x >= Math.min(h[0].x, h[1].x) &&
    v[0].x <= Math.max(h[0].x, h[1].x) &&
    h[0].y >= Math.min(v[0].y, v[1].y) &&
    h[0].y <= Math.max(v[0].y, v[1].y)
  );
}
/** Reject invalid raw structure before any normalization can discard points. */
function validateRawPolygon(points: PointMm[]): string | null {
  const coords = new Set<string>();
  for (const p of points) {
    const key = `${p.x},${p.y}`;
    if (coords.has(key)) return "방 꼭짓점 좌표가 중복되었습니다.";
    coords.add(key);
  }
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      c = points[(i + 2) % points.length];
    if ((a.x === b.x) === (a.y === b.y))
      return "벽은 수평 또는 수직이어야 합니다.";
    if (
      ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) &&
      (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y) < 0
    )
      return "벽이 같은 선에서 되돌아갑니다.";
  }
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      if (
        intersects(
          points[i],
          points[(i + 1) % points.length],
          points[j],
          points[(j + 1) % points.length],
        )
      )
        return "서로 떨어진 벽이 교차하거나 닿습니다.";
    }
  return null;
}
export function parseProjectJson(raw: string): ProjectParseResult {
  if (new TextEncoder().encode(raw).byteLength > LIMITS.maxJsonBytes)
    return error("파일 크기는 2MiB 이하여야 합니다.");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return error("올바른 JSON 파일이 아닙니다.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return error("프로젝트 형식이 올바르지 않습니다.");
  if (!("schemaVersion" in data) || data.schemaVersion !== 2)
    return error(
      "지원하지 않는 프로젝트 버전입니다. 버전 2 파일을 선택해 주세요.",
    );
  if (hasForbiddenKeys(data)) return error("허용되지 않는 필드가 있습니다.");
  const rawResult = rawProjectSchema.safeParse(data);
  if (!rawResult.success)
    return error(
      `프로젝트 형식이 올바르지 않습니다: ${rawResult.error.issues[0]?.message ?? "입력 오류"}`,
    );
  const project = rawResult.data;
  const ids = [
    project.id,
    project.room.id,
    ...project.room.polygon.map((point) => point.id),
    ...project.furniture.map((item) => item.id),
    ...(project.room.partitions ?? []).map(item => item.id),
    ...(project.room.openings ?? []).map(item => item.id),
    ...(project.room.zones ?? []).map(item => item.id),
  ];
  if (new Set(ids).size !== ids.length)
    return error("프로젝트에 중복 ID가 있습니다.");
  const polygon = project.room.polygon;
  const problem = validateRawPolygon(polygon);
  if (problem) return error(problem);
  const normalized = normalizeEditCandidate(polygon, [], null);
  if (!normalized.ok) return error(normalized.message);
  const valid = validateRoomPolygon(normalized.polygon);
  if (!valid.ok) return error(valid.message);
  const changes: string[] = [];
  if (normalized.polygon.length !== polygon.length)
    changes.push("벽 직선 위의 중간 꼭짓점을 정리했습니다.");
  const signed = polygon.reduce((sum, a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    return sum + a.x * b.y - b.x * a.y;
  }, 0);
  if (signed < 0) changes.push("방 꼭짓점 순서를 시계 방향으로 변경했습니다.");
  // An exterior host is an outgoing directed edge, so retaining only its vertex ID
  // after reversing/merging vertices would silently move its openings to another wall.
  const openings = project.room.openings?.map((opening, index): Opening => {
    const oldIndex = polygon.findIndex(p => p.id === opening.hostId);
    if (oldIndex < 0 || JSON.stringify(polygon) === JSON.stringify(normalized.polygon)) return opening;
    const a = polygon[oldIndex], b = polygon[(oldIndex + 1) % polygon.length];
    const length = Math.abs(b.x-a.x) + Math.abs(b.y-a.y);
    const tx = (b.x-a.x)/length, ty = (b.y-a.y)/length;
    const first = { x:a.x+tx*opening.offsetMm, y:a.y+ty*opening.offsetMm };
    const last = { x:first.x+tx*opening.widthMm, y:first.y+ty*opening.widthMm };
    for (let i=0;i<normalized.polygon.length;i++) {
      const start=normalized.polygon[i], end=normalized.polygon[(i+1)%normalized.polygon.length];
      const contains = (p:{x:number;y:number}) => (start.x === end.x ? p.x === start.x : p.y === start.y) && p.x >= Math.min(start.x,end.x) && p.x <= Math.max(start.x,end.x) && p.y >= Math.min(start.y,end.y) && p.y <= Math.max(start.y,end.y);
      if (!contains(first) || !contains(last)) continue;
      const newLength=Math.abs(end.x-start.x)+Math.abs(end.y-start.y);
      const at=(p:{x:number;y:number})=>((p.x-start.x)*(end.x-start.x)+(p.y-start.y)*(end.y-start.y))/newLength;
      const one=at(first),two=at(last);
      return {...opening,hostId:start.id,offsetMm:Math.min(one,two),hinge:two<one ? (opening.hinge === "start" ? "end":"start"):opening.hinge};
    }
    // Keep malformed, previously out-of-range openings visible for repair rather
    // than attaching them to a different edge carrying the same vertex ID.
    let suffix=index, hostId=`unmapped-opening-${suffix}`;
    while (ids.includes(hostId)) hostId = `unmapped-opening-${++suffix}`;
    return {...opening,hostId};
  });
  if (openings && JSON.stringify(openings) !== JSON.stringify(project.room.openings)) changes.push("문·창문의 실제 위치와 경첩을 유지하도록 정규화된 벽에 다시 연결했습니다. 연결할 수 없는 항목은 경고로 표시합니다.");
  const furniture = project.furniture.map((item) => {
    if (
      !catalog.some((entry) => entry.id === item.catalogId) &&
      item.kind !== "other"
    ) {
      changes.push(
        `알 수 없는 카탈로그 가구 “${item.name}”의 유형을 기타로 변경했습니다.`,
      );
      return { ...item, kind: "other" as const };
    }
    return item;
  });
  const candidate: ProjectDataV2 = {
    ...project,
    room: { ...project.room, polygon: normalized.polygon, ...(openings !== undefined ? {openings}: {}) },
    furniture,
  };
  const checked = projectSchema.safeParse(candidate);
  if (!checked.success)
    return error(
      `프로젝트가 유효하지 않습니다: ${checked.error.issues[0]?.message ?? "입력 오류"}`,
    );
  const placements = validateAllPlacements(candidate.room, candidate.furniture);
  const warnings = candidate.furniture.flatMap((item) =>
    placements[item.id].issues.map((issue) => `${item.name}: ${issue.message}`),
  );
  warnings.push(...validateArchitecture(candidate.room).map(issue => issue.message));
  return { ok: true, project: candidate, changes, warnings };
}
/** Explicit projection prevents accidentally exporting UI or unknown fields. */
export function serializeProjectJson(project: ProjectDataV2): string {
  return JSON.stringify(
    {
      schemaVersion: project.schemaVersion,
      id: project.id,
      title: project.title,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      unit: project.unit,
      room: {
        id: project.room.id,
        name: project.room.name,
        polygon: project.room.polygon.map(({ id, x, y }) => ({ id, x, y })),
        wallHeightMm: project.room.wallHeightMm,
        wallThicknessMm: project.room.wallThicknessMm,
        ...(project.room.partitions !== undefined ? { partitions: project.room.partitions } : {}),
        ...(project.room.openings !== undefined ? { openings: project.room.openings } : {}),
        ...(project.room.zones !== undefined ? { zones: project.room.zones } : {}),
      },
      furniture: project.furniture.map((item) => ({
        id: item.id,
        catalogId: item.catalogId,
        kind: item.kind,
        name: item.name,
        position: { x: item.position.x, y: item.position.y },
        widthMm: item.widthMm,
        depthMm: item.depthMm,
        heightMm: item.heightMm,
        rotationDeg: item.rotationDeg,
        ...(item.color !== undefined ? { color: item.color } : {}),
        ...(item.operation !== undefined ? { operation: item.operation } : {}),
      })),
      settings: {
        gridSizeMm: project.settings.gridSizeMm,
        snapEnabled: project.settings.snapEnabled,
        gridVisible: project.settings.gridVisible,
      },
    },
    null,
    2,
  );
}
export function projectFilename(
  title: string,
  date: Date = new Date(),
): string {
  const safe =
    [
      ...title
        .trim()
        .replace(/\s+/gu, "-")
        .replace(/[^\p{L}\p{N}_-]/gu, ""),
    ]
      .slice(0, 50)
      .join("") || "project";
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  return `roomfit-${safe}-${stamp}.json`;
}
