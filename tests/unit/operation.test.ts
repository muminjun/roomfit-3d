import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/data/catalog';
import { createFurnitureCandidate, setFurnitureOperation } from '../../src/features/furniture/commands';
import { getOperationEnvelope, getOperationWarnings } from '../../src/features/furniture/operation';
import { createProject } from '../../src/features/project/createProject';
import { useProjectStore } from '../../src/store/useProjectStore';
import type { FurnitureItem, RotationDeg } from '../../src/types/model';

const item: FurnitureItem = { id:'a', catalogId:'refrigerator', kind:'refrigerator', name:'냉장고', position:{x:2000,y:1700}, widthMm:1000, depthMm:600, heightMm:1800, rotationDeg:0, operation:{kind:'swing', clearanceMm:500, enabled:true} };
describe('opening allowance', () => {
  it('faces north, east, south and west for the four rotations', () => {
    const expected = [{minX:1500,maxX:2500,minY:900,maxY:1400}, {minX:2300,maxX:2800,minY:1200,maxY:2200}, {minX:1500,maxX:2500,minY:2000,maxY:2500}, {minX:1200,maxX:1700,minY:1200,maxY:2200}];
    ([0,90,180,270] as RotationDeg[]).forEach((rotationDeg,i) => expect(getOperationEnvelope({...item,rotationDeg})).toEqual(expected[i]));
  });
  it('reports all named obstructions, while boundary contact is clear', () => {
    const room = createProject().room;
    const blocker = {...item,id:'b',name:'의자', position:{x:2000,y:900}, widthMm:300,depthMm:300};
    const touching = {...blocker,id:'c',name:'접촉',position:{x:2000,y:750}};
    expect(getOperationWarnings(room,[item,blocker,touching],item).map(w=>w.name)).toEqual(['의자']);
    expect(getOperationWarnings(room,[item],{...item,position:{x:2000,y:300}}).map(w=>w.name)).toContain('벽');
  });
  it('returns no allowance when disabled or zero', () => {
    expect(getOperationEnvelope({...item,operation:{...item.operation!,enabled:false}})).toBeNull();
    expect(getOperationEnvelope({...item,operation:{...item.operation!,clearanceMm:0}})).toBeNull();
  });
  it('provides at least 40 unique catalog entries and copies operation defaults', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(40);
    expect(new Set(catalog.map(c=>c.id)).size).toBe(catalog.length);
    const fridge = createFurnitureCandidate('refrigerator',{x:0,y:0},'x')!;
    expect(fridge.operation?.kind).toBe('swing');
    expect(fridge.operation).not.toBe(catalog.find(c=>c.id==='refrigerator')?.operation);
  });
  it('detects named partition obstruction and permits edge contact', () => {
    const room = {...createProject().room, partitions:[{id:'p',name:'가벽', start:{x:1000,y:1000},end:{x:3000,y:1000},thicknessMm:100,heightMm:2400}]};
    expect(getOperationWarnings(room,[item],item).map(w=>w.name)).toContain('가벽');
    expect(getOperationWarnings(room,[{...item,position:{x:2000,y:150}}],{...item,position:{x:2000,y:150},rotationDeg:180}).map(w=>w.name)).not.toContain('가벽');
  });
  it('allows the opening allowance through a sufficiently tall partition doorway', () => {
    const room = {...createProject().room, partitions:[{id:'p',name:'가벽',start:{x:1000,y:1000},end:{x:3000,y:1000},thicknessMm:100,heightMm:2400}], openings:[{id:'d',name:'문',kind:'door' as const,hostId:'p',offsetMm:300,widthMm:1400,heightMm:2100,sillMm:0,hinge:'start' as const,swing:'inward' as const}]};
    expect(getOperationWarnings(room,[item],item).map(w=>w.name)).not.toContain('가벽');
  });
  it('operation changes on invalid placements are one undo step and reject malformed values', () => {
    const project = createProject(); const invalid = {...item, position:{x:-100,y:1000}};
    useProjectStore.getState().loadProject({...project,furniture:[invalid]});
    expect(setFurnitureOperation({itemId:'a',operation:{kind:'drawer',enabled:true,clearanceMm:300}}).ok).toBe(true);
    expect(useProjectStore.getState().project.furniture[0].operation?.clearanceMm).toBe(300);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.furniture[0].operation?.clearanceMm).toBe(500);
    expect(setFurnitureOperation({itemId:'a',operation:{kind:'drawer',enabled:true,clearanceMm:-1}}).ok).toBe(false);
  });

});
