import { LIMITS } from "../../config/limits";
import { geometryMessage } from "./messages";
import type { PointMm, Room, FurnitureItem } from "../../types/model";
export type Rect = { minX: number; minY: number; maxX: number; maxY: number };
export function getFurnitureRect(item: FurnitureItem): Rect {
  const swap = item.rotationDeg === 90 || item.rotationDeg === 270,
    w = swap ? item.depthMm : item.widthMm,
    d = swap ? item.widthMm : item.depthMm;
  return {
    minX: item.position.x - w / 2,
    minY: item.position.y - d / 2,
    maxX: item.position.x + w / 2,
    maxY: item.position.y + d / 2,
  };
}
function pointInPolygon(polygon: PointMm[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function containsRectInRoom(polygon: PointMm[], rect: Rect): boolean {
  if (rect.minX >= rect.maxX || rect.minY >= rect.maxY || polygon.length < 4)
    return false;
  const xs = [
      ...new Set([
        rect.minX,
        rect.maxX,
        ...polygon
          .map((p) => p.x)
          .filter((x) => x > rect.minX && x < rect.maxX),
      ]),
    ].sort((a, b) => a - b),
    ys = [
      ...new Set([
        rect.minY,
        rect.maxY,
        ...polygon
          .map((p) => p.y)
          .filter((y) => y > rect.minY && y < rect.maxY),
      ]),
    ].sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++)
    for (let j = 1; j < ys.length; j++)
      if (
        !pointInPolygon(
          polygon,
          (xs[i - 1] + xs[i]) / 2,
          (ys[j - 1] + ys[j]) / 2,
        )
      )
        return false;
  return true;
}
export const intersectRects = (a: Rect, b: Rect) =>
  Math.min(a.maxX, b.maxX) > Math.max(a.minX, b.minX) &&
  Math.min(a.maxY, b.maxY) > Math.max(a.minY, b.minY);
export type PlacementIssue = {
  code:
    "OUTSIDE_ROOM" | "FURNITURE_OVERLAP" | "TOO_TALL" | "INVALID_DIMENSIONS";
  message: string;
  targetId?: string;
};
export function validatePlacement(
  room: Room,
  items: FurnitureItem[],
  candidate: FurnitureItem,
  options: { ignoreId?: string } = {},
) {
  const issues: PlacementIssue[] = [];
  const add = (code: PlacementIssue["code"], targetId?: string) =>
    issues.push({
      code,
      message: geometryMessage(code),
      ...(targetId ? { targetId } : {}),
    });
  if (
    ![candidate.widthMm, candidate.depthMm, candidate.heightMm].every(
      Number.isSafeInteger,
    ) ||
    candidate.widthMm < LIMITS.furnitureMin ||
    candidate.widthMm > LIMITS.furnitureMax ||
    candidate.depthMm < LIMITS.furnitureMin ||
    candidate.depthMm > LIMITS.furnitureMax ||
    candidate.heightMm < LIMITS.furnitureHeightMin ||
    candidate.heightMm > LIMITS.furnitureHeightMax ||
    ![0, 90, 180, 270].includes(candidate.rotationDeg) ||
    ![candidate.position.x, candidate.position.y].every((x) =>
      Number.isSafeInteger(x * 2),
    )
  ) {
    add("INVALID_DIMENSIONS");
    return { valid: false, issues };
  }
  const rect = getFurnitureRect(candidate);
  if (!containsRectInRoom(room.polygon, rect)) add("OUTSIDE_ROOM");
  if (candidate.heightMm > room.wallHeightMm) add("TOO_TALL");
  for (const item of items)
    if (
      item.id !== options.ignoreId &&
      intersectRects(rect, getFurnitureRect(item))
    )
      add("FURNITURE_OVERLAP", item.id);
  return { valid: issues.length === 0, issues };
}
export function validateAllPlacements(room: Room, items: FurnitureItem[]) {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      validatePlacement(room, items, item, { ignoreId: item.id }),
    ]),
  );
}
export function getNearestClearance(
  room: Room,
  items: FurnitureItem[],
  candidate: FurnitureItem,
) {
  const r = getFurnitureRect(candidate);
  let left = Infinity,
    right = Infinity,
    up = Infinity,
    down = Infinity;
  const overlap = (a: number, b: number, c: number, d: number) =>
    Math.min(b, d) > Math.max(a, c);
  for (const item of items) {
    if (item.id === candidate.id) continue;
    const q = getFurnitureRect(item);
    if (overlap(r.minY, r.maxY, q.minY, q.maxY)) {
      if (q.maxX <= r.minX) left = Math.min(left, r.minX - q.maxX);
      if (q.minX >= r.maxX) right = Math.min(right, q.minX - r.maxX);
    }
    if (overlap(r.minX, r.maxX, q.minX, q.maxX)) {
      if (q.maxY <= r.minY) up = Math.min(up, r.minY - q.maxY);
      if (q.minY >= r.maxY) down = Math.min(down, q.minY - r.maxY);
    }
  }
  for (let i = 0; i < room.polygon.length; i++) {
    const a = room.polygon[i],
      b = room.polygon[(i + 1) % room.polygon.length];
    if (
      a.x === b.x &&
      overlap(r.minY, r.maxY, Math.min(a.y, b.y), Math.max(a.y, b.y))
    ) {
      if (a.x <= r.minX) left = Math.min(left, r.minX - a.x);
      if (a.x >= r.maxX) right = Math.min(right, a.x - r.maxX);
    }
    if (
      a.y === b.y &&
      overlap(r.minX, r.maxX, Math.min(a.x, b.x), Math.max(a.x, b.x))
    ) {
      if (a.y <= r.minY) up = Math.min(up, r.minY - a.y);
      if (a.y >= r.maxY) down = Math.min(down, a.y - r.maxY);
    }
  }
  return { left, right, up, down };
}
export function snapFurniture(
  item: FurnitureItem,
  gridMm: number,
): FurnitureItem {
  if (!Number.isFinite(gridMm) || gridMm <= 0) throw new Error("Invalid grid");
  const r = getFurnitureRect(item);
  return {
    ...item,
    position: {
      x: Math.round(r.minX / gridMm) * gridMm + (r.maxX - r.minX) / 2,
      y: Math.round(r.minY / gridMm) * gridMm + (r.maxY - r.minY) / 2,
    },
  };
}
