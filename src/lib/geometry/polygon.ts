import { LIMITS } from "../../config/limits";
import { geometryMessage } from "./messages";
import type { PointMm } from "../../types/model";

export type Validation =
  | { ok: true }
  | { ok: false; code: string; message: string; offenderIds: string[] };
export type EditResult =
  | {
      ok: true;
      polygon: PointMm[];
      idMap: Record<string, string>;
      selectedEdgeId: string | null;
    }
  | Extract<Validation, { ok: false }>;
export type Vec = { x: number; y: number };
const fail = (
  code: string,
  offenderIds: string[] = [],
): Extract<Validation, { ok: false }> => ({
  ok: false,
  code,
  message: geometryMessage(code),
  offenderIds,
});
const same = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y;
const signedArea = (p: PointMm[]) =>
  p.reduce((sum, a, i) => {
    const b = p[(i + 1) % p.length];
    return sum + a.x * b.y - b.x * a.y;
  }, 0) / 2;
export const getRoomArea = (polygon: PointMm[]) =>
  Math.abs(signedArea(polygon));
export function getBBox(polygon: PointMm[]) {
  const xs = polygon.map((p) => p.x),
    ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys),
    maxX = Math.max(...xs),
    maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, depth: maxY - minY };
}
export function getEdgeNormals(a: Vec, b: Vec) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (!len) throw new Error("Zero length edge");
  const dx = (b.x - a.x) / len,
    dy = (b.y - a.y) / len;
  const clean = (n: number) => (n === 0 ? 0 : n);
  return {
    nIn: { x: clean(-dy), y: clean(dx) },
    nOut: { x: clean(dy), y: clean(-dx) },
  };
}
function classify(
  a: PointMm,
  b: PointMm,
  c: PointMm,
  d: PointMm,
): string | null {
  const horizontal = a.y === b.y,
    otherHorizontal = c.y === d.y;
  if (horizontal === otherHorizontal) {
    if (horizontal ? a.y !== c.y : a.x !== c.x) return null;
    const [a1, a2, c1, c2] = horizontal
      ? [a.x, b.x, c.x, d.x]
      : [a.y, b.y, c.y, d.y];
    const lo = Math.max(Math.min(a1, a2), Math.min(c1, c2)),
      hi = Math.min(Math.max(a1, a2), Math.max(c1, c2));
    return lo <= hi ? "SELF_TOUCH" : null;
  }
  const h = horizontal ? [a, b] : [c, d],
    v = horizontal ? [c, d] : [a, b];
  const x = v[0].x,
    y = h[0].y;
  if (
    x < Math.min(h[0].x, h[1].x) ||
    x > Math.max(h[0].x, h[1].x) ||
    y < Math.min(v[0].y, v[1].y) ||
    y > Math.max(v[0].y, v[1].y)
  )
    return null;
  return x > Math.min(h[0].x, h[1].x) &&
    x < Math.max(h[0].x, h[1].x) &&
    y > Math.min(v[0].y, v[1].y) &&
    y < Math.max(v[0].y, v[1].y)
    ? "SELF_INTERSECTION"
    : "SELF_TOUCH";
}
export function validateRoomPolygon(p: PointMm[]): Validation {
  if (p.length < 4) return fail("TOO_FEW_POINTS");
  if (same(p[0], p[p.length - 1]))
    return fail("DUPLICATE_CLOSING_POINT", [p[0].id, p[p.length - 1].id]);
  const ids = new Set<string>();
  for (const q of p) {
    if (typeof q.id !== "string" || !q.id.trim())
      return fail("INVALID_ID", [q.id]);
    if (ids.has(q.id)) return fail("DUPLICATE_ID", [q.id]);
    ids.add(q.id);
    if (
      !Number.isSafeInteger(q.x) ||
      !Number.isSafeInteger(q.y) ||
      Math.abs(q.x) > LIMITS.roomMax ||
      Math.abs(q.y) > LIMITS.roomMax
    )
      return fail("INVALID_COORDINATE", [q.id]);
  }
  if (p.length > LIMITS.maxVertices) return fail("TOO_MANY_POINTS");
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length];
    if ((a.x === b.x) === (a.y === b.y))
      return fail("NOT_ORTHOGONAL", [a.id, b.id]);
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < LIMITS.minWallLength)
      return fail("SEGMENT_TOO_SHORT", [a.id, b.id]);
  }
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++) {
      if (same(p[i], p[j])) return fail("DUPLICATE_POINT", [p[i].id, p[j].id]);
    }
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++) {
      if (j === i + 1 || (i === 0 && j === p.length - 1)) continue;
      const c = classify(
        p[i],
        p[(i + 1) % p.length],
        p[j],
        p[(j + 1) % p.length],
      );
      if (c) return fail(c, [p[i].id, p[j].id]);
    }
  for (let i = 0; i < p.length; i++) {
    const a = p[(i + p.length - 1) % p.length],
      b = p[i],
      c = p[(i + 1) % p.length];
    if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y))
      return fail("COLLINEAR", [b.id]);
  }
  if (p.length % 2) return fail("ODD_POINT_COUNT");
  const box = getBBox(p);
  if (
    box.width < LIMITS.roomMin ||
    box.depth < LIMITS.roomMin ||
    box.width > LIMITS.roomMax ||
    box.depth > LIMITS.roomMax
  )
    return fail("INVALID_BOUNDS");
  if (signedArea(p) <= 0) return fail("INVALID_ORIENTATION");
  return { ok: true };
}
export function normalizeEditCandidate(
  input: PointMm[],
  previous: PointMm[],
  selectedEdgeId: string | null = null,
): EditResult {
  const seen = new Set<string>();
  for (const p of input) {
    if (!p.id || seen.has(p.id)) return fail("DUPLICATE_ID", [p.id]);
    seen.add(p.id);
  }
  const p = input.map((q) => ({ ...q }));
  const idMap: Record<string, string> = Object.fromEntries(
    input.map((q) => [q.id, q.id]),
  );
  const prevIds = new Set(previous.map((q) => q.id));
  const map = (from: string, to: string) => {
    for (const key of Object.keys(idMap))
      if (idMap[key] === from) idMap[key] = to;
  };
  let changed = true;
  while (changed && p.length > 1) {
    changed = false;
    for (let i = 0; i < p.length; i++) {
      const j = (i + 1) % p.length;
      if (same(p[i], p[j])) {
        let keep = i,
          remove = j;
        if (prevIds.has(p[j].id) && !prevIds.has(p[i].id)) {
          keep = j;
          remove = i;
        }
        map(p[remove].id, p[keep].id);
        p.splice(remove, 1);
        changed = true;
        break;
      }
    }
  }
  // A reversal along a wall is an overlapping boundary, not a removable midpoint.
  for (let i = 0; i < p.length; i++) {
    const a = p[(i + p.length - 1) % p.length],
      b = p[i],
      c = p[(i + 1) % p.length];
    if (
      ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) &&
      !(
        b.x >= Math.min(a.x, c.x) &&
        b.x <= Math.max(a.x, c.x) &&
        b.y >= Math.min(a.y, c.y) &&
        b.y <= Math.max(a.y, c.y)
      )
    )
      return fail("SELF_TOUCH", [a.id, b.id]);
  }
  changed = true;
  while (changed && p.length >= 3) {
    changed = false;
    for (let i = 0; i < p.length; i++) {
      const a = p[(i + p.length - 1) % p.length],
        b = p[i],
        c = p[(i + 1) % p.length];
      if (
        ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) &&
        b.x >= Math.min(a.x, c.x) &&
        b.x <= Math.max(a.x, c.x) &&
        b.y >= Math.min(a.y, c.y) &&
        b.y <= Math.max(a.y, c.y)
      ) {
        map(b.id, a.id);
        p.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  if (previous.length && signedArea(previous) > 0 && signedArea(p) < 0)
    return fail("INVALID_ORIENTATION");
  if (!previous.length && signedArea(p) < 0) p.reverse();
  return {
    ok: true,
    polygon: p,
    idMap,
    selectedEdgeId: selectedEdgeId ? (idMap[selectedEdgeId] ?? null) : null,
  };
}
function finish(
  candidate: PointMm[],
  previous: PointMm[],
  selected: string | null,
): EditResult {
  const n = normalizeEditCandidate(candidate, previous, selected);
  if (!n.ok) return n;
  const v = validateRoomPolygon(n.polygon);
  return v.ok ? n : v;
}
export function moveWall(
  polygon: PointMm[],
  startVertexId: string,
  offsetMm: number,
): EditResult {
  const i = polygon.findIndex((p) => p.id === startVertexId);
  if (i < 0 || !Number.isSafeInteger(offsetMm)) return fail("INVALID_PARAMS");
  const j = (i + 1) % polygon.length,
    a = polygon[i],
    b = polygon[j];
  if ((a.x === b.x) === (a.y === b.y)) return fail("NOT_ORTHOGONAL");
  const n = getEdgeNormals(a, b).nOut;
  const p = polygon.map((q) => ({ ...q }));
  for (const k of [i, j]) {
    p[k].x += n.x * offsetMm;
    p[k].y += n.y * offsetMm;
  }
  return finish(p, polygon, startVertexId);
}
export function addNotch(
  polygon: PointMm[],
  options: {
    startVertexId: string;
    startOffsetMm: number;
    widthMm: number;
    depthMm: number;
    type: "indent" | "protrude";
  },
  idGenerator: () => string,
): EditResult {
  const {
    startVertexId,
    startOffsetMm: s,
    widthMm: w,
    depthMm: d,
    type,
  } = options;
  const i = polygon.findIndex((p) => p.id === startVertexId);
  if (
    i < 0 ||
    ![s, w, d].every(Number.isSafeInteger) ||
    s < LIMITS.minWallLength ||
    w < LIMITS.minWallLength ||
    d < LIMITS.minWallLength ||
    !["indent", "protrude"].includes(type)
  )
    return fail("INVALID_PARAMS");
  const a = polygon[i],
    b = polygon[(i + 1) % polygon.length],
    length = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
  if (
    s + w > length - LIMITS.minWallLength ||
    (a.x !== b.x && a.y !== b.y) ||
    length === 0
  )
    return fail("INVALID_PARAMS");
  const t = { x: (b.x - a.x) / length, y: (b.y - a.y) / length },
    n = getEdgeNormals(a, b)[type === "indent" ? "nIn" : "nOut"];
  const points = [
    [s, 0],
    [s, d],
    [s + w, d],
    [s + w, 0],
  ].map(([along, depth]) => ({
    id: idGenerator(),
    x: a.x + t.x * along + n.x * depth,
    y: a.y + t.y * along + n.y * depth,
  }));
  return finish(
    [...polygon.slice(0, i + 1), ...points, ...polygon.slice(i + 1)],
    polygon,
    startVertexId,
  );
}
export function resizeRectangle(
  polygon: PointMm[],
  widthMm: number,
  depthMm: number,
): EditResult {
  if (
    polygon.length !== 4 ||
    ![widthMm, depthMm].every(Number.isSafeInteger) ||
    widthMm < LIMITS.roomMin ||
    depthMm < LIMITS.roomMin ||
    widthMm > LIMITS.roomMax ||
    depthMm > LIMITS.roomMax
  )
    return fail("INVALID_PARAMS");
  const box = getBBox(polygon);
  const p = polygon.map((q) => ({
    ...q,
    x: q.x === box.maxX ? box.minX + widthMm : q.x,
    y: q.y === box.maxY ? box.minY + depthMm : q.y,
  }));
  return finish(p, polygon, null);
}
