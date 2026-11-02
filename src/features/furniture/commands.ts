import { COLORS, LIMITS } from "../../config/limits";
import { catalog } from "../../data/catalog";
import {
  getBBox,
  getFurnitureRect,
  validatePlacement,
} from "../../lib/geometry";
import { useProjectStore } from "../../store/useProjectStore";
import type { FurnitureItem, Room, RotationDeg } from "../../types/model";
import { projectSchema } from "../../types/schema";
import { createId } from "../project/createProject";
import type { CommandResult } from "../room/commands";

type Position = { x: number; y: number };
type Corner = "nw" | "ne" | "sw" | "se";
const invalid = (
  code: string,
  message: string,
  targetId?: string,
): CommandResult => ({
  ok: false,
  kind: "Invalid",
  issues: [{ code, message, ...(targetId ? { targetId } : {}) }],
});
const missing = (id: string) =>
  invalid("ITEM_NOT_FOUND", "가구를 찾을 수 없습니다.", id);
export function createFurnitureCandidate(
  catalogId: string,
  position: Position,
  id: string = createId(),
): FurnitureItem | null {
  const definition = catalog.find((item) => item.id === catalogId);
  if (!definition) return null;
  return {
    id,
    catalogId,
    kind: definition.kind,
    name: definition.name,
    position: { ...position },
    widthMm: definition.widthMm,
    depthMm: definition.depthMm,
    heightMm: definition.heightMm,
    rotationDeg: 0,
    color: COLORS[0],
  };
}
/** Search the nearest lattice offsets; ties are ordered by y then x. */
export function findValidPlacement(
  room: Room,
  items: FurnitureItem[],
  candidate: FurnitureItem,
  origin: Position = candidate.position,
): Position | null {
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y)) return null;
  const center = {
    x: Math.round(origin.x * 2) / 2,
    y: Math.round(origin.y * 2) / 2,
  };
  const offsets: Position[] = [];
  // Radius 32 covers more than 1000 nearest positions, including all closer positions.
  for (let y = -32; y <= 32; y++)
    for (let x = -32; x <= 32; x++) offsets.push({ x, y });
  offsets.sort(
    (a, b) =>
      a.x * a.x + a.y * a.y - (b.x * b.x + b.y * b.y) || a.y - b.y || a.x - b.x,
  );
  for (const offset of offsets.slice(0, 1000)) {
    const position = {
      x: center.x + offset.x * 100,
      y: center.y + offset.y * 100,
    };
    if (validatePlacement(room, items, { ...candidate, position }).valid)
      return position;
  }
  return null;
}
/** A corner drag keeps the opposite world corner fixed; validation happens on commit. */
export function resizeFromCorner(
  item: FurnitureItem,
  corner: Corner,
  point: Position,
): FurnitureItem {
  const rect = getFurnitureRect(item),
    left = corner.endsWith("w"),
    top = corner.startsWith("n");
  const fixedX = left ? rect.maxX : rect.minX,
    fixedY = top ? rect.maxY : rect.minY;
  const worldW = Math.round((point.x - fixedX) * (left ? -1 : 1)),
    worldD = Math.round((point.y - fixedY) * (top ? -1 : 1));
  const swapped = item.rotationDeg === 90 || item.rotationDeg === 270;
  return {
    ...item,
    widthMm: swapped ? worldD : worldW,
    depthMm: swapped ? worldW : worldD,
    position: {
      x: fixedX + ((left ? -1 : 1) * worldW) / 2,
      y: fixedY + ((top ? -1 : 1) * worldD) / 2,
    },
  };
}
function commitItems(
  items: FurnitureItem[],
  affectedId: string,
  coalesceKey?: string,
): CommandResult {
  const store = useProjectStore.getState(),
    project = store.project;
  const candidate = { ...project, furniture: items };
  if (JSON.stringify(items) === JSON.stringify(project.furniture))
    return { ok: true, kind: "NoChange" };
  const parsed = projectSchema.safeParse(candidate);
  if (!parsed.success)
    return {
      ok: false,
      kind: "Invalid",
      issues: parsed.error.issues.map((issue) => ({
        code: "INVALID_PROJECT",
        message: issue.message,
      })),
    };
  if (!store.commit(candidate, undefined, coalesceKey))
    return invalid("COMMIT_FAILED", "가구 변경 사항을 저장할 수 없습니다.");
  return {
    ok: true,
    kind: "Committed",
    project: useProjectStore.getState().project,
    affectedIds: [affectedId],
  };
}
function validateAndCommit(
  candidate: FurnitureItem,
  existing: boolean,
  coalesceKey?: string,
): CommandResult {
  const { project } = useProjectStore.getState();
  const result = validatePlacement(
    project.room,
    project.furniture,
    candidate,
    existing ? { ignoreId: candidate.id } : {},
  );
  if (!result.valid)
    return { ok: false, kind: "Invalid", issues: result.issues };
  const furniture = existing
    ? project.furniture.map((item) =>
        item.id === candidate.id ? candidate : item,
      )
    : [...project.furniture, candidate];
  return commitItems(furniture, candidate.id, coalesceKey);
}
function getItem(id: string) {
  return useProjectStore
    .getState()
    .project.furniture.find((item) => item.id === id);
}
function capacity(): CommandResult | null {
  return useProjectStore.getState().project.furniture.length >=
    LIMITS.maxFurniture
    ? invalid(
        "MAX_FURNITURE",
        `가구는 ${LIMITS.maxFurniture}개까지 추가할 수 있습니다.`,
      )
    : null;
}
export function addFurniture({
  catalogId,
  position,
}: {
  catalogId: string;
  position?: Position;
}): CommandResult {
  const full = capacity();
  if (full) return full;
  const { project } = useProjectStore.getState(),
    box = getBBox(project.room.polygon),
    origin = position ?? {
      x: (box.minX + box.maxX) / 2,
      y: (box.minY + box.maxY) / 2,
    };
  const candidate = createFurnitureCandidate(catalogId, origin);
  if (!candidate)
    return invalid("UNKNOWN_CATALOG", "카탈로그 항목을 찾을 수 없습니다.");
  if (!position) {
    const found = findValidPlacement(
      project.room,
      project.furniture,
      candidate,
      origin,
    );
    if (!found) return invalid("NO_PLACEMENT", "배치 가능한 위치가 없습니다.");
    candidate.position = found;
  }
  return validateAndCommit(candidate, false);
}
export function moveFurniture(
  { itemId, position }: { itemId: string; position: Position },
  coalesceKey?: string,
): CommandResult {
  const item = getItem(itemId);
  return item
    ? validateAndCommit(
        { ...item, position: { ...position } },
        true,
        coalesceKey,
      )
    : missing(itemId);
}
export function resizeFurniture({
  itemId,
  widthMm,
  depthMm,
  heightMm,
  position,
}: {
  itemId: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  position?: Position;
}): CommandResult {
  const item = getItem(itemId);
  return item
    ? validateAndCommit(
        {
          ...item,
          widthMm,
          depthMm,
          heightMm,
          position: position ? { ...position } : item.position,
        },
        true,
      )
    : missing(itemId);
}
export function rotateFurniture({
  itemId,
  rotationDeg,
}: {
  itemId: string;
  rotationDeg: RotationDeg;
}): CommandResult {
  const item = getItem(itemId);
  return item
    ? validateAndCommit({ ...item, rotationDeg }, true)
    : missing(itemId);
}
export function duplicateFurniture({
  itemId,
  position,
}: {
  itemId: string;
  position?: Position;
}): CommandResult {
  const full = capacity();
  if (full) return full;
  const source = getItem(itemId);
  if (!source) return missing(itemId);
  const { project } = useProjectStore.getState();
  const candidate = {
    ...source,
    id: createId(),
    position: position ? { ...position } : { ...source.position },
  };
  if (!position) {
    const found = findValidPlacement(
      project.room,
      project.furniture,
      candidate,
      source.position,
    );
    if (!found)
      return invalid("NO_PLACEMENT", "복제할 수 있는 위치가 없습니다.");
    candidate.position = found;
  }
  return validateAndCommit(candidate, false);
}
export function deleteFurniture({ itemId }: { itemId: string }): CommandResult {
  const { project } = useProjectStore.getState();
  if (!getItem(itemId)) return missing(itemId);
  return commitItems(
    project.furniture.filter((item) => item.id !== itemId),
    itemId,
  );
}
export function renameFurniture({
  itemId,
  name,
}: {
  itemId: string;
  name: string;
}): CommandResult {
  const item = getItem(itemId);
  if (!item) return missing(itemId);
  if (typeof name !== "string")
    return invalid("INVALID_NAME", "가구 이름을 입력해 주세요.");
  const clean = name.replace(/\p{Cc}/gu, "").trim();
  if ([...clean].length < 1 || [...clean].length > 40)
    return invalid("INVALID_NAME", "가구 이름은 1~40자여야 합니다.");
  return commitItems(
    useProjectStore
      .getState()
      .project.furniture.map((x) =>
        x.id === itemId ? { ...item, name: clean } : x,
      ),
    itemId,
  );
}
export function setFurnitureColor({
  itemId,
  color,
}: {
  itemId: string;
  color: string;
}): CommandResult {
  const item = getItem(itemId);
  if (!item) return missing(itemId);
  if (!(COLORS as readonly string[]).includes(color))
    return invalid("INVALID_COLOR", "허용된 색상을 선택해 주세요.");
  return commitItems(
    useProjectStore
      .getState()
      .project.furniture.map((x) => (x.id === itemId ? { ...item, color } : x)),
    itemId,
  );
}
export function resetFurnitureSize({
  itemId,
}: {
  itemId: string;
}): CommandResult {
  const item = getItem(itemId);
  if (!item) return missing(itemId);
  const preset = catalog.find((x) => x.id === item.catalogId);
  if (!preset)
    return invalid("UNKNOWN_CATALOG", "원래 크기를 찾을 수 없습니다.");
  return validateAndCommit(
    {
      ...item,
      widthMm: preset.widthMm,
      depthMm: preset.depthMm,
      heightMm: preset.heightMm,
    },
    true,
  );
}
