import type { IdGenerator, ProjectDataV2 } from '../../types/model';
export const createId: IdGenerator = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function createProject(widthMm=4200, depthMm=3400, heightMm=2400, thicknessMm=120, id: IdGenerator=createId): ProjectDataV2 {
  const now = new Date().toISOString();
  return {schemaVersion:2,id:id(),title:'새 프로젝트',createdAt:now,updatedAt:now,unit:'mm',room:{id:id(),name:'내 방',polygon:[[0,0],[widthMm,0],[widthMm,depthMm],[0,depthMm]].map(([x,y])=>({id:id(),x,y})),wallHeightMm:heightMm,wallThicknessMm:thicknessMm},furniture:[],settings:{gridSizeMm:100,snapEnabled:true,gridVisible:true}};
}
