import { describe, expect, it } from 'vitest';
import { createProject } from '../../src/features/project/createProject';
import { projectSchema } from '../../src/types/schema';
import { useProjectStore } from '../../src/store/useProjectStore';

describe('project foundation', () => {
  it('creates the default room with the specified dimensions', () => {
    const project = createProject();
    expect(project.room.polygon.map(({x,y}) => [x,y])).toEqual([[0,0],[4200,0],[4200,3400],[0,3400]]);
    expect(project.room.wallHeightMm).toBe(2400);
    expect(projectSchema.safeParse(project).success).toBe(true);
  });
  it('rejects unknown keys, duplicate IDs, and non-half-mm furniture centers', () => {
    const p = createProject();
    expect(projectSchema.safeParse({ ...p, surprise: 1 }).success).toBe(false);
    expect(projectSchema.safeParse({ ...p, room: {...p.room, polygon: p.room.polygon.map((point) => ({...point, id: 'same'}))} }).success).toBe(false);
    expect(projectSchema.safeParse({ ...p, furniture: [{ id:'f', catalogId:'bed', kind:'bed', name:'침대', position:{x:500.3,y:1000}, widthMm:1000, depthMm:2000, heightMm:500, rotationDeg:0 }] }).success).toBe(false);
  });
  it('rejects a self-intersecting orthogonal room', () => {
    const p = createProject();
    const coords = [[0,0],[3000,0],[3000,3000],[1000,3000],[1000,-1000],[2000,-1000],[2000,2000],[0,2000]];
    expect(projectSchema.safeParse({...p, room:{...p.room, polygon:coords.map(([x,y],i)=>({id:`v${i}`,x,y}))}}).success).toBe(false);
  });
  it('undo and redo domain edits without undoing settings', () => {
    const store = useProjectStore.getState();
    store.loadProject(createProject());
    const before = useProjectStore.getState().project;
    useProjectStore.getState().commit({...before, title:'수정한 방'});
    useProjectStore.getState().setSettings({gridSizeMm:50});
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.title).toBe(before.title);
    expect(useProjectStore.getState().project.settings.gridSizeMm).toBe(50);
    useProjectStore.getState().redo();
    expect(useProjectStore.getState().project.title).toBe('수정한 방');
  });
});
