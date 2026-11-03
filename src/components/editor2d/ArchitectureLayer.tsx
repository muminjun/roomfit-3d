import { getDoorEnvelope, getDoorWarnings, getOpeningCutRect, getOpeningSegment, getPartitionRect } from "../../features/architecture/geometry";
import type { FurnitureItem, Room } from "../../types/model";
import { Group, Line, Rect, Text } from "./konva";
const zoneColors = { bathroom:"#bfdfeb", kitchen:"#f0dfb5", entry:"#e4d7ca", living:"#d5e6d2", bedroom:"#ded6eb" };

export function ZonePartitionLayer({ room, zoom }: { room:Room; zoom:number }) {
  return <Group listening={false}>
    {(room.zones ?? []).map(z => <Group key={z.id}>
      <Rect x={z.x} y={z.y} width={z.widthMm} height={z.depthMm} fill={zoneColors[z.kind]} opacity={0.4} stroke={zoneColors[z.kind]} strokeWidth={2/zoom}/>
      <Text x={z.x+10/zoom} y={z.y+10/zoom} text={z.name} fontSize={13/zoom} fill="#526b77"/>
    </Group>)}
    {(room.partitions ?? []).map(p => { const r = getPartitionRect(p); return <Rect key={p.id} x={r.minX} y={r.minY} width={r.maxX-r.minX} height={r.maxY-r.minY} fill="#7d909a" stroke="#415a67" strokeWidth={1/zoom}/>; })}
  </Group>;
}
export function OpeningLayer({ room, items, zoom }: { room:Room; items:FurnitureItem[]; zoom:number }) {
  const blocked = new Set(getDoorWarnings(room,items).map(i=>i.itemId));
  return <Group listening={false}>
    {(room.openings ?? []).map(o => {
      const s = getOpeningSegment(room,o), r = getOpeningCutRect(room,o);
      if (!s || !r) return null;
      const color = blocked.has(o.id) ? "#b13f37" : o.kind === "window" ? "#3a8eb1" : "#a07743";
      const hinge = o.hinge === "start" ? s.start:s.end, direction = o.hinge === "start" ? 1:-1;
      const depth = o.widthMm * (o.swing === "inward" ? 1:-1);
      const arc:number[]=[];
      for (let i=0;i<=20;i++) { const a=Math.PI*i/40; arc.push(hinge.x+s.tangent.x*direction*o.widthMm*Math.cos(a)+s.normal.x*depth*Math.sin(a),hinge.y+s.tangent.y*direction*o.widthMm*Math.cos(a)+s.normal.y*depth*Math.sin(a)); }
      const envelope = getDoorEnvelope(room,o);
      return <Group key={o.id}>
        <Rect x={r.minX} y={r.minY} width={r.maxX-r.minX} height={r.maxY-r.minY} fill={o.kind === "window" ? "#d3edf3":"#fff"} stroke={color} strokeWidth={1/zoom}/>
        {o.kind === "window" ? <Line points={[s.start.x,s.start.y,s.end.x,s.end.y]} stroke={color} strokeWidth={2/zoom}/> : <>
          {envelope && <Rect x={envelope.minX} y={envelope.minY} width={envelope.maxX-envelope.minX} height={envelope.maxY-envelope.minY} fill={blocked.has(o.id) ? "#c85a3b16":"#af8b4e0c"}/>}
          <Line points={arc} stroke={color} strokeWidth={1/zoom} dash={[4/zoom,3/zoom]}/>
          <Line points={[hinge.x,hinge.y,hinge.x+s.normal.x*depth,hinge.y+s.normal.y*depth]} stroke={color} strokeWidth={2/zoom}/>
        </>}
        <Text x={(s.start.x+s.end.x)/2+5/zoom} y={(s.start.y+s.end.y)/2+8/zoom} text={`${o.name} ${o.widthMm} mm`} fontSize={11/zoom} fill={color}/>
      </Group>;
    })}
  </Group>;
}
