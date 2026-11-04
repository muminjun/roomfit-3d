import { describe, expect, it } from 'vitest';
import { Box3, Vector3 } from 'three';
import { roomPresets } from '../../src/data/presets';
import { catalog } from '../../src/data/catalog';
import { createProject } from '../../src/features/project/createProject';
import { createFurnitureCandidate, moveFurniture, resizeFurniture } from '../../src/features/furniture/commands';
import { addNotch, getBBox, getRoomArea, moveWall, validateAllPlacements } from '../../src/lib/geometry';
import { moveWallSegment, updateRoomHeight } from '../../src/features/room/commands';
import { useProjectStore } from '../../src/store/useProjectStore';
import { projectSchema } from '../../src/types/schema';
import { buildFloorGeometry } from '../../src/components/viewer3d/geometry';
import { buildFurnitureObject, disposeFurnitureObject } from '../../src/components/viewer3d/furniture';

describe('original acceptance exact examples',()=>{
  it('AC-05/06 preserves the exact original L and U preset vertices',()=>{
    expect(roomPresets.find(p=>p.id==='l')?.points).toEqual([[0,0],[4200,0],[4200,3400],[1600,3400],[1600,2200],[0,2200]]);
    expect(roomPresets.find(p=>p.id==='u')?.points).toEqual([[0,0],[1200,0],[1200,1000],[2400,1000],[2400,0],[4200,0],[4200,3400],[0,3400]]);
  });
  it('AC-02/09 moves exact top and right walls preserving connectivity and dimensions',()=>{
    const p=createProject().room.polygon;
    for (const [edge,offset,expected] of [[0,200,{minX:0,minY:-200,width:4200,depth:3600}], [1,150,{minX:0,minY:0,width:4350,depth:3400}]] as const) {
      const r=moveWall(p,p[edge].id,offset); expect(r.ok).toBe(true); if(!r.ok) throw Error('move');
      expect(getBBox(r.polygon)).toMatchObject(expected);
      r.polygon.forEach((a,i)=>{const b=r.polygon[(i+1)%r.polygon.length];expect((a.x===b.x)!==(a.y===b.y)).toBe(true);});
    }
  });
  it.each([['indent',800,500,13.88],['protrude',1000,600,14.88]] as const)('AC-03/04 projects actual %s floor buffer with correct area and normals',(type,widthMm,depthMm,area)=>{
    const polygon=createProject().room.polygon; let seq=0;
    const r=addNotch(polygon,{startVertexId:polygon[0].id,startOffsetMm:1600,widthMm,depthMm,type},()=>`n${++seq}`);
    if(!r.ok) throw Error('notch'); expect(getRoomArea(r.polygon)/1e6).toBe(area);
    const g=buildFloorGeometry(r.polygon), positions=g.getAttribute('position'), indices=g.getIndex();
    let actual=0;
    for(let i=0;i<(indices?.count ?? positions.count);i+=3){
      const pt=(j:number)=>new Vector3().fromBufferAttribute(positions,indices?indices.getX(i+j):i+j);
      const a=pt(0), b=pt(1), c=pt(2), normal=b.sub(a).cross(c.sub(a)); expect(normal.y).toBeGreaterThan(0); actual+=normal.length()/2;
    }
    expect(actual).toBeCloseTo(area,6);
    for(const p of r.polygon) expect(Array.from({length:positions.count},(_,i)=>[positions.getX(i),positions.getZ(i)]).some(([x,z])=>Math.abs(x-p.x/1000)<1e-6 && Math.abs(z-p.y/1000)<1e-6)).toBe(true);
    g.dispose();
  });
  it('AC-18/19 queen 3D extents follow 90 degree rotation and edited local width',()=>{
    const original=createFurnitureCandidate('bed-queen',{x:2100,y:1700},'bed')!;
    const project=createProject(); useProjectStore.getState().loadProject({...project,furniture:[original]});
    expect(resizeFurniture({itemId:'bed',widthMm:1700,depthMm:2000,heightMm:500}).ok).toBe(true);
    const edited=useProjectStore.getState().project.furniture[0]; expect(edited.widthMm).toBe(1700);
    for(const [item,width,depth] of [[{...original,rotationDeg:90 as const},2,1.5],[edited,1.7,2]] as const){
      const g=buildFurnitureObject(item);g.updateMatrixWorld(true);const size=new Box3().setFromObject(g).getSize(new Vector3());expect(size.x).toBeCloseTo(width,6);expect(size.z).toBeCloseTo(depth,6);disposeFurnitureObject(g);
    }
  });
  it('AC-11 retains the original 20 catalog IDs and dimensions',()=>{
    const expected:[string,number,number,number][]=[['bed-single',1000,2000,500],['bed-super-single',1100,2000,500],['bed-queen',1500,2000,500],['bed-king',1800,2000,500],['nightstand',450,400,500],['sofa-2',1600,850,850],['sofa-3',2100,900,850],['sofa-1',850,850,850],['coffee-table',1100,550,400],['tv-stand',1600,400,500],['table-2',800,800,750],['table-4',1200,750,750],['refrigerator',900,750,1800],['washing-machine',650,700,1000],['desk',1200,600,750],['office-chair',600,600,950],['wardrobe',1200,600,2000],['drawers',900,450,850],['bookshelf',800,300,1800],['storage-shelf',900,400,1500]];
    for(const [id,w,d,h] of expected) expect(catalog.find(x=>x.id===id)).toMatchObject({widthMm:w,depthMm:d,heightMm:h});
  });
  it('AC-24 room undo/redo restores the original wall, area and furniture warning',()=>{
    const project=createProject(); const desk=createFurnitureCandidate('desk',{x:3300,y:1700},'desk')!;
    useProjectStore.getState().loadProject({...project,furniture:[desk]});
    const right=project.room.polygon[1].id;
    expect(moveWallSegment({startVertexId:right,offsetMm:-1200}).ok).toBe(true);
    const shrunk=useProjectStore.getState().project;
    expect(validateAllPlacements(shrunk.room,shrunk.furniture).desk.valid).toBe(false);
    useProjectStore.getState().undo(); const restored=useProjectStore.getState().project;
    expect(restored.room.polygon).toEqual(project.room.polygon);
    expect(getRoomArea(restored.room.polygon)).toBe(14280000);
    expect(validateAllPlacements(restored.room,restored.furniture).desk.valid).toBe(true);
    useProjectStore.getState().redo(); const redone=useProjectStore.getState().project;
    expect(redone.room.polygon).toEqual(shrunk.room.polygon);
    expect(validateAllPlacements(redone.room,redone.furniture).desk.valid).toBe(false);
  });
  it('AC-25 furniture movement undo/redo preserves exact coordinates',()=>{
    const project=createProject(); const desk=createFurnitureCandidate('desk',{x:1800,y:1700},'desk')!;
    useProjectStore.getState().loadProject({...project,furniture:[desk]});
    expect(moveFurniture({itemId:'desk',position:{x:2000,y:1700}}).ok).toBe(true);
    useProjectStore.getState().undo();expect(useProjectStore.getState().project.furniture[0].position).toEqual({x:1800,y:1700});
    useProjectStore.getState().redo();expect(useProjectStore.getState().project.furniture[0].position).toEqual({x:2000,y:1700});
  });

  it('AC-77 2800 to 2400 height retains 2600mm furniture and allows height recovery',()=>{
    const project=createProject(4200,3400,2800); const item={...createFurnitureCandidate('wardrobe',{x:2100,y:1700},'tall')!,heightMm:2600};
    useProjectStore.getState().loadProject({...project,furniture:[item]});
    expect(updateRoomHeight({wallHeightMm:2400}).ok).toBe(true);
    let current=useProjectStore.getState().project;
    expect(current.furniture[0].heightMm).toBe(2600);
    expect(validateAllPlacements(current.room,current.furniture).tall.issues.map(i=>i.code)).toContain('TOO_TALL');
    expect(resizeFurniture({itemId:'tall',widthMm:item.widthMm,depthMm:item.depthMm,heightMm:2400}).ok).toBe(true);
    current=useProjectStore.getState().project;expect(validateAllPlacements(current.room,current.furniture).tall.valid).toBe(true);
  });
  it('AC-67 schema rejects empty/overlong names, invalid numbers and palette colors without mutation',()=>{
    const p=createProject(), item=createFurnitureCandidate('desk',{x:2100,y:1700},'desk')!;
    for(const candidate of [{...p,title:''},{...p,title:'x'.repeat(61)}, {...p,room:{...p.room,wallHeightMm:NaN}}, {...p,room:{...p.room,wallHeightMm:Infinity}}, {...p,room:{...p.room,wallHeightMm:2400.5}}, {...p,furniture:[{...item,name:'x'.repeat(41)}]}, {...p,furniture:[{...item,color:'#123456'}]}]) expect(projectSchema.safeParse(candidate).success).toBe(false);
    expect(p.furniture).toEqual([]);
  });

});
