import { LIMITS } from "../../config/limits";
import { getFurnitureRect, validatePlacement } from "../../lib/geometry";
import { createId } from "../project/createProject";
import { useProjectStore } from "../../store/useProjectStore";
import type { FurnitureItem } from "../../types/model";
import type { CommandResult } from "../room/commands";

type Move = { id: string; position: { x: number; y: number } };
const invalid = (message: string): CommandResult => ({
  ok: false,
  kind: "Invalid",
  issues: [{ code: "BATCH_INVALID", message }],
});
function chosen(ids: string[]) {
  const items = useProjectStore.getState().project.furniture;
  const set = new Set(ids);
  return set.size === ids.length ? items.filter((i) => set.has(i.id)) : [];
}
function commit(items: FurnitureItem[], ids: string[]): CommandResult {
  const store = useProjectStore.getState(),
    p = store.project;
  if (JSON.stringify(items) === JSON.stringify(p.furniture))
    return { ok: true, kind: "NoChange" };
  if (!store.commit({ ...p, furniture: items }))
    return invalid("변경 사항을 저장할 수 없습니다.");
  return {
    ok: true,
    kind: "Committed",
    project: useProjectStore.getState().project,
    affectedIds: ids,
  };
}
export function validateFurnitureBatch(moves: Move[]) {
  const p = useProjectStore.getState().project,
    source = chosen(moves.map((m) => m.id));
  if (source.length !== moves.length || !moves.length)
    return { valid: false, message: "선택한 가구를 찾을 수 없습니다." };
  if (source.some((i) => i.locked))
    return { valid: false, message: "잠긴 가구는 이동할 수 없습니다." };
  const positions = new Map(moves.map((m) => [m.id, m.position]));
  const final = p.furniture.map((i) =>
    positions.has(i.id) ? { ...i, position: positions.get(i.id)! } : i,
  );
  for (const item of final.filter((i) => positions.has(i.id))) {
    const v = validatePlacement(p.room, final, item, { ignoreId: item.id });
    if (!v.valid)
      return {
        valid: false,
        message: v.issues
          .map((issue) => {
            const obstacle =
              final.find((f) => f.id === issue.targetId) ??
              p.room.partitions?.find((f) => f.id === issue.targetId);
            return obstacle
              ? `${issue.message} (${obstacle.name})`
              : issue.message;
          })
          .join(" "),
      };
  }
  return { valid: true, message: "" };
}
export function moveFurnitureBatch(moves: Move[]): CommandResult {
  const valid = validateFurnitureBatch(moves);
  if (!valid.valid) return invalid(valid.message);
  const map = new Map(moves.map((m) => [m.id, m.position]));
  return commit(
    useProjectStore
      .getState()
      .project.furniture.map((i) =>
        map.has(i.id) ? { ...i, position: { ...map.get(i.id)! } } : i,
      ),
    moves.map((m) => m.id),
  );
}
export function setFurnitureLocked(
  ids: string[],
  locked: boolean,
): CommandResult {
  const items = chosen(ids);
  if (!ids.length || items.length !== ids.length)
    return invalid("선택한 가구를 찾을 수 없습니다.");
  const set = new Set(ids);
  return commit(
    useProjectStore
      .getState()
      .project.furniture.map((i) => (set.has(i.id) ? { ...i, locked } : i)),
    ids,
  );
}
export function deleteFurnitureBatch(ids: string[]): CommandResult {
  const items = chosen(ids);
  if (!ids.length || items.length !== ids.length)
    return invalid("선택한 가구를 찾을 수 없습니다.");
  if (items.some((i) => i.locked))
    return invalid("잠긴 가구는 삭제할 수 없습니다.");
  const set = new Set(ids);
  return commit(
    useProjectStore.getState().project.furniture.filter((i) => !set.has(i.id)),
    ids,
  );
}
export function duplicateFurnitureBatch(
  ids: string[],
  supplied?: FurnitureItem[],
): CommandResult {
  const source = supplied ?? chosen(ids),
    p = useProjectStore.getState().project;
  if (!source.length || (!supplied && source.length !== ids.length))
    return invalid("선택한 가구를 찾을 수 없습니다.");
  if (p.furniture.length + source.length > LIMITS.maxFurniture)
    return invalid("가구 개수 제한을 초과합니다.");
  const templates = source.map((i) => ({
    ...i,
    id: createId(),
    locked: false,
  }));
  const offsets: { x: number; y: number }[] = [];
  for (let y = -32; y <= 32; y++)
    for (let x = -32; x <= 32; x++) if (x || y) offsets.push({ x, y });
  offsets.sort(
    (a, b) =>
      a.x * a.x + a.y * a.y - b.x * b.x - b.y * b.y || a.y - b.y || a.x - b.x,
  );
  for (const offset of offsets.slice(0, 1000)) {
    const candidates = templates.map((i) => ({
      ...i,
      position: {
        x: i.position.x + offset.x * 100,
        y: i.position.y + offset.y * 100,
      },
    }));
    const all = [...p.furniture, ...candidates];
    if (
      candidates.every(
        (i) => validatePlacement(p.room, all, i, { ignoreId: i.id }).valid,
      )
    )
      return commit(
        all,
        candidates.map((i) => i.id),
      );
  }
  return invalid("복제할 수 있는 위치가 없습니다.");
}
export type Arrangement =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "centerX"
  | "centerY"
  | "distributeX"
  | "distributeY";
export function arrangeFurniture(
  ids: string[],
  mode: Arrangement,
): CommandResult {
  const items = chosen(ids);
  if (
    items.length !== ids.length ||
    items.length < (mode.startsWith("distribute") ? 3 : 2)
  )
    return invalid("정렬할 가구를 선택해 주세요.");
  const rects = items.map((item) => ({ item, rect: getFurnitureRect(item) }));
  const minX = Math.min(...rects.map((x) => x.rect.minX)),
    maxX = Math.max(...rects.map((x) => x.rect.maxX)),
    minY = Math.min(...rects.map((x) => x.rect.minY)),
    maxY = Math.max(...rects.map((x) => x.rect.maxY));
  const horizontal = mode === "distributeX";
  if (mode.startsWith("distribute")) {
    rects.sort((a, b) =>
      horizontal ? a.rect.minX - b.rect.minX : a.rect.minY - b.rect.minY,
    );
    const total = rects.reduce(
      (n, r) =>
        n +
        (horizontal ? r.rect.maxX - r.rect.minX : r.rect.maxY - r.rect.minY),
      0,
    );
    const span = horizontal ? maxX - minX : maxY - minY;
    const gap = (span - total) / (rects.length - 1);
    let cursor = horizontal ? minX : minY;
    return moveFurnitureBatch(
      rects.map(({ item, rect }) => {
        const size = horizontal ? rect.maxX - rect.minX : rect.maxY - rect.minY;
        const center = Math.round((cursor + size / 2) * 2) / 2;
        cursor += size + gap;
        return {
          id: item.id,
          position: horizontal
            ? { x: center, y: item.position.y }
            : { x: item.position.x, y: center },
        };
      }),
    );
  }
  return moveFurnitureBatch(
    rects.map(({ item, rect }) => ({
      id: item.id,
      position: {
        x:
          item.position.x +
          (mode === "left"
            ? minX - rect.minX
            : mode === "right"
              ? maxX - rect.maxX
              : mode === "centerX"
                ? Math.round(minX + maxX) / 2 - item.position.x
                : 0),
        y:
          item.position.y +
          (mode === "top"
            ? minY - rect.minY
            : mode === "bottom"
              ? maxY - rect.maxY
              : mode === "centerY"
                ? Math.round(minY + maxY) / 2 - item.position.y
                : 0),
      },
    })),
  );
}
