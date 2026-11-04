// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../../src/features/project/createProject';
import { libraryKey, readLibrary, saveLibraryProject, renameLibraryProject, cloneLibraryProject, deleteLibraryProject } from '../../src/features/project/library';
import { createPlanSvg, planRasterSize } from '../../src/features/project/planExport';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ProjectLibraryDialog } from '../../src/components/common/ProjectLibraryDialog';
import { useProjectStore } from '../../src/store/useProjectStore';
import { useUIStore } from '../../src/store/useUIStore';
import { autosaveKey } from '../../src/features/project/autosave';

describe('local project library', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  it('saves, renames, duplicates and deletes strict project snapshots', () => {
    const project = createProject();
    const saved = saveLibraryProject(project); expect(saved.ok).toBe(true); if (!saved.ok) return;
    expect(renameLibraryProject(saved.id, '복사본').ok).toBe(true);
    const clone = cloneLibraryProject(saved.id); expect(clone.ok).toBe(true);
    const data = readLibrary(); expect(data.ok && data.records).toHaveLength(2);
    expect(deleteLibraryProject(saved.id).ok).toBe(true);
    expect(readLibrary().ok && (readLibrary() as { records: unknown[] }).records).toHaveLength(1);
    expect(project.title).toBe('새 프로젝트');
  });
  it('preserves corrupt and quota-failed storage', () => {
    localStorage.setItem(libraryKey, '{bad');
    expect(saveLibraryProject(createProject()).ok).toBe(false);
    expect(localStorage.getItem(libraryKey)).toBe('{bad');
    localStorage.removeItem(libraryKey);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    expect(saveLibraryProject(createProject()).ok).toBe(false);
    expect(localStorage.getItem(libraryKey)).toBeNull();
  });
  it('preserves project, history, selection and autosave on cancelled or failed switch', () => {
    const target = createProject(); target.title = '다른 방';
    expect(saveLibraryProject(target).ok).toBe(true);
    const active = createProject(); useProjectStore.getState().loadProject(active);
    useProjectStore.getState().commit({...active,title:'작업 중'});
    useUIStore.getState().setSelected({kind:'wall',id:active.room.polygon[0].id});
    localStorage.setItem(autosaveKey,'keep');
    const before=useProjectStore.getState(), selected=useUIStore.getState().selected;
    const callback=vi.fn();
    render(createElement(ProjectLibraryDialog,{onClose:vi.fn(),onSelectedProject:callback}));
    vi.spyOn(window,'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button',{name:'다른 방 열기'}));
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('full','QuotaExceededError');});
    fireEvent.click(screen.getByRole('button',{name:'다른 방 열기'}));
    expect(useProjectStore.getState().project).toEqual(before.project);
    expect(useProjectStore.getState().past).toEqual(before.past);
    expect(useUIStore.getState().selected).toEqual(selected);
    expect(localStorage.getItem(autosaveKey)).toBe('keep');
    expect(callback).not.toHaveBeenCalled();
    cleanup();
  });
});
describe('full plan export', () => {
  it('escapes user text and draws model contents independent of viewport', () => {
    const p = createProject(); p.title = '<unsafe & title>'; p.room.zones = [{ id:'zone',name:'A & B',kind:'living',x:100,y:100,widthMm:1000,depthMm:1000 }];
    const svg = createPlanSvg(p);
    expect(svg).toContain('&lt;unsafe &amp; title&gt;');
    expect(svg).toContain('A &amp; B');
    expect(svg).toContain('4200 mm');
    expect(svg).not.toContain('<unsafe');
    expect(Math.max(...Object.values(planRasterSize(p)))).toBeLessThanOrEqual(4096);
  });
  it('includes outlying retained furniture in the plan bounds', () => {
    const p = createProject();
    p.furniture = [{id:'f',catalogId:'custom',kind:'other',name:'멀리',position:{x:7000,y:1000},widthMm:1000,depthMm:500,heightMm:500,rotationDeg:0}];
    const match = createPlanSvg(p).match(/viewBox="([^"]+)"/);
    expect(match).not.toBeNull();
    const [x,,width] = match![1].split(' ').map(Number);
    expect(x+width).toBeGreaterThan(7500);
  });
  it('produces valid XML when project text includes XML-forbidden characters', () => {
    const p=createProject(); p.title='A\u0001B\ud800C';
    const svg=createPlanSvg(p);
    expect(new DOMParser().parseFromString(svg,'image/svg+xml').querySelector('parsererror')).toBeNull();
    expect(svg).toContain('ABC');
  });
});
