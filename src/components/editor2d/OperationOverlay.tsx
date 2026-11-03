import type { FurnitureItem, Room } from '../../types/model';
import { getOperationEnvelope, getOperationWarnings } from '../../features/furniture/operation';
import { Group, Line, Rect, Text } from './konva';

/** Coordinates are world millimeters; caller places this inside its world transform. */
export function OperationOverlay({item, room, items}: {item: FurnitureItem; room: Room; items: FurnitureItem[]}) {
  const r = getOperationEnvelope(item);
  if (!r) return null;
  const blocked = getOperationWarnings(room, items, item).length > 0;
  const color = blocked ? '#c83d32' : '#287e79';
  return <Group listening={false}>
    <Rect x={r.minX} y={r.minY} width={r.maxX-r.minX} height={r.maxY-r.minY} fill={blocked ? 'rgba(200,61,50,0.16)' : 'rgba(40,126,121,0.13)'} stroke={color} strokeWidth={15} dash={[45,30]} />
    <Line points={[r.minX,r.minY,r.maxX,r.maxY]} stroke={color} strokeWidth={10} opacity={0.6}/>
    <Text x={r.minX+15} y={r.minY+15} text="여는 공간 여유" fontSize={100} fill={color}/>
  </Group>;
}
