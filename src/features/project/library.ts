import { z } from 'zod';
import { projectSchema } from '../../types/schema';
import type { ProjectDataV2 } from '../../types/model';
import { createId } from './createProject';

export const libraryKey = `roomfit3d:v2:${import.meta.env.BASE_URL}:library`;
const recordSchema = z.object({ id:z.string().min(1).max(200), project:projectSchema }).strict();
const librarySchema = z.object({ version:z.literal(1), records:z.array(recordSchema).max(20) }).strict().refine(v => new Set(v.records.map(r => r.id)).size === v.records.length);
export type LibraryRecord = { id:string; project:ProjectDataV2 };
type LibraryResult = {ok:true; records:LibraryRecord[]} | {ok:false; message:string};
type MutationResult = {ok:true; id:string} | {ok:false; message:string};
const invalid = {ok:false as const, message:'프로젝트 보관함을 읽을 수 없습니다. 기존 데이터는 보존되었습니다. 현재 프로젝트를 JSON으로 백업해 주세요.'};
export function readLibrary(): LibraryResult {
  try {
    const raw = localStorage.getItem(libraryKey);
    if (raw === null) return {ok:true, records:[]};
    const parsed = librarySchema.safeParse(JSON.parse(raw));
    return parsed.success ? {ok:true, records:parsed.data.records} : invalid;
  } catch { return invalid; }
}
function mutate(change:(records:LibraryRecord[]) => {records:LibraryRecord[]; id:string} | {message:string}):MutationResult {
  const current = readLibrary();
  if (!current.ok) return current;
  const next = change(current.records);
  if ('message' in next) return {ok:false,message:next.message};
  if (next.records.length > 20) return {ok:false,message:'보관함은 최대 20개입니다. 항목을 삭제하거나 JSON으로 백업해 주세요.'};
  const checked = librarySchema.safeParse({version:1,records:next.records});
  if (!checked.success) return {ok:false,message:'프로젝트 이름 또는 데이터가 올바르지 않습니다.'};
  try { localStorage.setItem(libraryKey, JSON.stringify(checked.data)); return {ok:true,id:next.id}; }
  catch { return {ok:false,message:'보관함 저장에 실패했습니다. 현재 프로젝트를 JSON으로 백업해 주세요.'}; }
}
export function saveLibraryProject(project:ProjectDataV2):MutationResult {
  if (!projectSchema.safeParse(project).success) return {ok:false,message:'프로젝트 데이터가 올바르지 않습니다.'};
  const id = createId();
  return mutate(records => ({records:[...records,{id,project}],id}));
}
export function renameLibraryProject(id:string, title:string):MutationResult {
  return mutate(records => records.some(r => r.id === id) ? {id,records:records.map(r => r.id === id ? {...r,project:{...r.project,title:title.trim()}} : r)} : {message:'보관된 프로젝트를 찾을 수 없습니다.'});
}
export function cloneLibraryProject(id:string):MutationResult {
  const newId = createId(), projectId = createId();
  return mutate(records => { const source = records.find(r => r.id === id); return source ? {id:newId,records:[...records,{id:newId,project:{...source.project,id:projectId}}]} : {message:'보관된 프로젝트를 찾을 수 없습니다.'}; });
}
export function deleteLibraryProject(id:string):MutationResult {
  return mutate(records => records.some(r => r.id === id) ? {id,records:records.filter(r => r.id !== id)} : {message:'보관된 프로젝트를 찾을 수 없습니다.'});
}
