import { expect,it } from "vitest";
import { Box3,Vector3 } from "three";
import { addFurniture,moveFurniture } from "../../src/features/furniture/commands";
import { createProject } from "../../src/features/project/createProject";
import { useProjectStore } from "../../src/store/useProjectStore";
import { buildFurnitureObject,disposeFurnitureObject } from "../../src/components/viewer3d/furniture";
it("adds room-height locked columns with exact 3D envelope and undo",()=>{
 for(const catalogId of ["column-square","column-round"]){
  const project=createProject(); project.room.wallHeightMm=2800;
  useProjectStore.getState().loadProject(project);
  expect(addFurniture({catalogId,position:{x:2100,y:1700}}).ok).toBe(true);
  const item=useProjectStore.getState().project.furniture[0];
  expect(item.locked).toBe(true);expect(item.heightMm).toBe(2800);
  expect(moveFurniture({itemId:item.id,position:{x:2000,y:1700}}).ok).toBe(false);
  const mesh=buildFurnitureObject(item),size=new Box3().setFromObject(mesh).getSize(new Vector3());
  expect(size.x).toBeCloseTo(item.widthMm/1000);expect(size.y).toBeCloseTo(2.8);expect(size.z).toBeCloseTo(item.depthMm/1000);
  disposeFurnitureObject(mesh);useProjectStore.getState().undo();
  expect(useProjectStore.getState().project.furniture).toHaveLength(0);
 }
});
