import { getFurnitureRect,getNearestClearance,validateAllPlacements,type Rect } from "../../lib/geometry";
import { getPartitionSolidRects } from "../architecture/geometry";
import type { ProjectDataV2 } from "../../types/model";
export type FrontClearanceWarning={itemId:string;name:string;availableMm:number;minimumMm:number;obstacleNames:string[]};
export function getFrontClearanceWarnings(project:ProjectDataV2):FrontClearanceWarning[] {
  const minimumMm=project.settings.minimumClearanceMm ?? 0;
  if(!minimumMm)return [];
  const validity=validateAllPlacements(project.room,project.furniture);
  return project.furniture.flatMap(item=>{
    if(!validity[item.id]?.valid || item.catalogId.startsWith("column-"))return [];
    const direction=({0:"up",90:"right",180:"down",270:"left"} as const)[item.rotationDeg];
    const availableMm=getNearestClearance(project.room,project.furniture,item)[direction];
    if(availableMm>=minimumMm)return [];
    const r=getFurnitureRect(item),vertical=direction==="up"||direction==="down";
    const gap=(q:Rect)=>{
      if(vertical && Math.min(r.maxX,q.maxX)<=Math.max(r.minX,q.minX))return Infinity;
      if(!vertical && Math.min(r.maxY,q.maxY)<=Math.max(r.minY,q.minY))return Infinity;
      if(direction==="up")return q.maxY<=r.minY ? r.minY-q.maxY:Infinity;
      if(direction==="down")return q.minY>=r.maxY ? q.minY-r.maxY:Infinity;
      if(direction==="left")return q.maxX<=r.minX ? r.minX-q.maxX:Infinity;
      return q.minX>=r.maxX ? q.minX-r.maxX:Infinity;
    };
    const names=project.furniture.filter(other=>other.id!==item.id && gap(getFurnitureRect(other))===availableMm).map(other=>other.name);
    for(const p of project.room.partitions ?? [])if(getPartitionSolidRects(project.room,p,item.heightMm).some(q=>gap(q)===availableMm))names.push(p.name);
    if(getNearestClearance({...project.room,partitions:[]},[],item)[direction]===availableMm)names.push("벽");
    return [{itemId:item.id,name:item.name,availableMm,minimumMm,obstacleNames:[...new Set(names)]}];
  });
}
