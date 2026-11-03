import { containsRectInRoom, getFurnitureRect, intersectRects } from '../../lib/geometry/placement';
import { getPartitionSolidRects } from '../architecture/geometry';
import type { Rect } from '../../lib/geometry/placement';
import type { FurnitureItem, Room } from '../../types/model';

/** Conservative full-front planning allowance; not a manufacturer door sweep. */
export function getOperationEnvelope(item: FurnitureItem): Rect | null {
  const operation = item.operation;
  if (!operation?.enabled || operation.clearanceMm <= 0) return null;
  const r = getFurnitureRect(item), c = operation.clearanceMm;
  switch (item.rotationDeg) {
    case 0: return { minX:r.minX, maxX:r.maxX, minY:r.minY-c, maxY:r.minY };
    case 90: return { minX:r.maxX, maxX:r.maxX+c, minY:r.minY, maxY:r.maxY };
    case 180: return { minX:r.minX, maxX:r.maxX, minY:r.maxY, maxY:r.maxY+c };
    case 270: return { minX:r.minX-c, maxX:r.minX, minY:r.minY, maxY:r.maxY };
  }
}
export type OperationWarning = { kind: 'wall' | 'partition' | 'furniture'; name: string; id?: string };
export function getOperationWarnings(room: Room, items: FurnitureItem[], item: FurnitureItem): OperationWarning[] {
  const envelope = getOperationEnvelope(item);
  if (!envelope) return [];
  const warnings: OperationWarning[] = [];
  if (!containsRectInRoom(room.polygon, envelope)) warnings.push({kind:'wall',name:'벽'});
  for (const partition of room.partitions ?? []) {
    if (getPartitionSolidRects(room, partition, item.heightMm).some(rect => intersectRects(envelope,rect))) warnings.push({kind:'partition',name:partition.name,id:partition.id});
  }
  for (const other of items) if (other.id !== item.id && intersectRects(envelope,getFurnitureRect(other))) warnings.push({kind:'furniture',name:other.name,id:other.id});
  return warnings;
}
