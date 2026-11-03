import type { Opening, Partition, PositionMm, Room } from "../../types/model";
import { containsRectInRoom, getFurnitureRect, intersectRects, type Rect } from "../../lib/geometry/placement";

export type ArchitectureIssue = { itemId: string; code: string; message: string; targetId?: string };
export function getPartitionRect(partition: Partition): Rect {
  const horizontal = partition.start.y === partition.end.y;
  return {
    minX: Math.min(partition.start.x, partition.end.x) - (horizontal ? 0 : partition.thicknessMm / 2),
    maxX: Math.max(partition.start.x, partition.end.x) + (horizontal ? 0 : partition.thicknessMm / 2),
    minY: Math.min(partition.start.y, partition.end.y) - (horizontal ? partition.thicknessMm / 2 : 0),
    maxY: Math.max(partition.start.y, partition.end.y) + (horizontal ? partition.thicknessMm / 2 : 0),
  };
}
export function getOpeningHost(room: Room, opening: Pick<Opening, "hostId">) {
  const partition = room.partitions?.find(p => p.id === opening.hostId);
  const index = room.polygon.findIndex(p => p.id === opening.hostId);
  const start = partition?.start ?? (index >= 0 ? room.polygon[index] : null);
  const end = partition?.end ?? (index >= 0 ? room.polygon[(index + 1) % room.polygon.length] : null);
  if (!start || !end) return null;
  const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
  if (!length) return null;
  const tangent = { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
  return { start, end, length, tangent, normal: { x: -tangent.y, y: tangent.x },
    thicknessMm: partition?.thicknessMm ?? room.wallThicknessMm,
    heightMm: partition?.heightMm ?? room.wallHeightMm, partition: Boolean(partition) };
}
export function getOpeningSegment(room: Room, opening: Opening) {
  const host = getOpeningHost(room, opening);
  if (!host) return null;
  const at = (distance: number): PositionMm => ({ x: host.start.x + host.tangent.x * distance, y: host.start.y + host.tangent.y * distance });
  return { ...host, start: at(opening.offsetMm), end: at(opening.offsetMm + opening.widthMm) };
}
export function getOpeningCutRect(room: Room, opening: Opening): Rect | null {
  const segment = getOpeningSegment(room, opening);
  if (!segment) return null;
  const { start: a, end: b, normal: n, thicknessMm: t, partition } = segment;
  const inward = partition ? t / 2 : 0;
  const outward = partition ? t / 2 : t;
  return {
    minX: Math.min(a.x + n.x * inward, b.x - n.x * outward),
    maxX: Math.max(a.x + n.x * inward, b.x - n.x * outward),
    minY: Math.min(a.y + n.y * inward, b.y - n.y * outward),
    maxY: Math.max(a.y + n.y * inward, b.y - n.y * outward),
  };
}
export function isPhysicalOpening(room:Room, opening:Opening):boolean {
  const host=getOpeningHost(room,opening);
  return Boolean(host && opening.offsetMm+opening.widthMm<=host.length && opening.sillMm+opening.heightMm<=Math.min(host.heightMm,room.wallHeightMm) && !(room.openings ?? []).some(other => other.id!==opening.id && other.hostId===opening.hostId && Math.min(opening.offsetMm+opening.widthMm,other.offsetMm+other.widthMm)>Math.max(opening.offsetMm,other.offsetMm) && Math.min(opening.sillMm+opening.heightMm,other.sillMm+other.heightMm)>Math.max(opening.sillMm,other.sillMm)));
}
/** Wall pieces solid for an item resting at height0; only full-height door gaps remove collision. */
export function getPartitionSolidRects(room: Room, partition: Partition, heightMm = room.wallHeightMm): Rect[] {
  const rect = getPartitionRect(partition), horizontal = partition.start.y === partition.end.y;
  const axis = horizontal ? "x" : "y", min = horizontal ? rect.minX : rect.minY, max = horizontal ? rect.maxX : rect.maxY;
  const gaps = (room.openings ?? []).filter(o => o.hostId === partition.id && o.sillMm === 0 && o.heightMm >= heightMm && isPhysicalOpening(room,o))
    .flatMap(o => { const s = getOpeningSegment(room, o); return s ? [[Math.max(min, Math.min(s.start[axis], s.end[axis])), Math.min(max, Math.max(s.start[axis], s.end[axis]))]] : []; })
    .filter(([a,b]) => b > a).sort((a,b) => a[0] - b[0]);
  const pieces: Rect[] = [];
  const add = (a: number, b: number) => { if (b > a) pieces.push(horizontal ? { ...rect, minX:a, maxX:b } : { ...rect, minY:a, maxY:b }); };
  let cursor = min;
  for (const [a,b] of gaps) { add(cursor,a); cursor = Math.max(cursor,b); }
  add(cursor,max);
  return pieces;
}
export function getDoorEnvelope(room: Room, opening: Opening): Rect | null {
  if (opening.kind === "window") return null;
  const s = getOpeningSegment(room, opening);
  if (!s) return null;
  const d = opening.swing === "inward" ? opening.widthMm : -opening.widthMm;
  return { minX: Math.min(s.start.x, s.end.x, s.start.x + s.normal.x*d, s.end.x + s.normal.x*d),
    maxX: Math.max(s.start.x, s.end.x, s.start.x + s.normal.x*d, s.end.x + s.normal.x*d),
    minY: Math.min(s.start.y, s.end.y, s.start.y + s.normal.y*d, s.end.y + s.normal.y*d),
    maxY: Math.max(s.start.y, s.end.y, s.start.y + s.normal.y*d, s.end.y + s.normal.y*d) };
}
export function validateArchitecture(room: Room): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const add = (itemId:string, code:string, message:string, targetId?:string) => issues.push({ itemId,code,message,...(targetId ? {targetId}: {}) });
  for (const p of room.partitions ?? []) {
    if (!containsRectInRoom(room.polygon,getPartitionRect(p))) add(p.id,"PARTITION_OUTSIDE",`${p.name}: 칸막이가 방 경계 밖으로 나갑니다.`);
    if (p.heightMm > room.wallHeightMm) add(p.id,"PARTITION_HEIGHT",`${p.name}: 칸막이 높이가 방 높이를 초과합니다.`);
  }
  for (const z of room.zones ?? []) {
    if (!containsRectInRoom(room.polygon,{ minX:z.x,minY:z.y,maxX:z.x+z.widthMm,maxY:z.y+z.depthMm })) add(z.id,"ZONE_OUTSIDE",`${z.name}: 구역이 방 경계 밖으로 나갑니다.`);
  }
  const openings = room.openings ?? [];
  for (const o of openings) {
    const host = getOpeningHost(room,o);
    if (!host) { add(o.id,"MISSING_HOST",`${o.name}: 연결된 벽이 없습니다. 다른 벽에 다시 연결하세요.`); continue; }
    if (o.offsetMm + o.widthMm > host.length) add(o.id,"OPENING_LENGTH",`${o.name}: 문·창문이 벽 길이를 벗어납니다.`);
    if (o.sillMm + o.heightMm > Math.min(host.heightMm, room.wallHeightMm)) add(o.id,"OPENING_HEIGHT",`${o.name}: 하단 높이와 개구부 높이의 합이 벽 높이를 초과합니다.`);
    for (const other of openings) {
      if (other.id === o.id || other.hostId !== o.hostId) continue;
      if (Math.min(o.offsetMm+o.widthMm, other.offsetMm+other.widthMm)>Math.max(o.offsetMm,other.offsetMm) && Math.min(o.sillMm+o.heightMm,other.sillMm+other.heightMm)>Math.max(o.sillMm,other.sillMm)) add(o.id,"OPENING_OVERLAP",`${o.name}: ${other.name}와 개구부가 겹칩니다.`,other.id);
    }
  }
  return issues;
}
export function getDoorWarnings(room: Room, furniture: Parameters<typeof getFurnitureRect>[0][]): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  for (const opening of room.openings ?? []) {
    const r = getDoorEnvelope(room,opening);
    if (!r) continue;
    for (const item of furniture) if (intersectRects(r,getFurnitureRect(item))) issues.push({ itemId:opening.id,code:"DOOR_BLOCKED",targetId:item.id,message:`${opening.name}: ${item.name}가 문 여는 여유 공간을 막습니다.` });
    for (const p of room.partitions ?? []) if (p.id !== opening.hostId && getPartitionSolidRects(room,p,opening.heightMm).some(q => intersectRects(r,q))) issues.push({ itemId:opening.id,code:"DOOR_BLOCKED",targetId:p.id,message:`${opening.name}: ${p.name}이 문 여는 여유 공간을 막습니다.` });
  }
  return issues;
}
