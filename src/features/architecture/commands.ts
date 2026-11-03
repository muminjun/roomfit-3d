import { useProjectStore } from "../../store/useProjectStore";
import type { Opening, Partition, Room, Zone } from "../../types/model";
import { projectSchema } from "../../types/schema";
import type { CommandResult } from "../room/commands";
import { validateArchitecture } from "./geometry";

function commit(room:Room, id:string): CommandResult {
  const store = useProjectStore.getState();
  const candidate = { ...store.project,room };
  const parsed = projectSchema.safeParse(candidate);
  if (!parsed.success) return { ok:false,kind:"Invalid",issues:parsed.error.issues.map(i => ({code:"INVALID_ARCHITECTURE",message:`치수·이름을 확인하세요: ${i.message}`})) };
  const issues = validateArchitecture(room).filter(i => i.itemId === id);
  if (issues.length) return { ok:false,kind:"Invalid",issues };
  if (JSON.stringify(room) === JSON.stringify(store.project.room)) return {ok:true,kind:"NoChange"};
  if (!store.commit(candidate)) return {ok:false,kind:"Invalid",issues:[{code:"COMMIT_FAILED",message:"공간 변경을 저장할 수 없습니다."}]};
  return {ok:true,kind:"Committed",project:useProjectStore.getState().project,affectedIds:[id]};
}
export function savePartition(partition: Partition): CommandResult {
  const room = useProjectStore.getState().project.room;
  const entries = room.partitions ?? [];
  return commit({...room, partitions: entries.some(p => p.id === partition.id) ? entries.map(p => p.id === partition.id ? partition:p) : [...entries,partition]},partition.id);
}
export function saveOpening(opening: Opening): CommandResult {
  const room = useProjectStore.getState().project.room;
  const entries = room.openings ?? [];
  return commit({...room, openings: entries.some(p => p.id === opening.id) ? entries.map(p => p.id === opening.id ? opening:p) : [...entries,opening]},opening.id);
}
export function saveZone(zone: Zone): CommandResult {
  const room = useProjectStore.getState().project.room;
  const entries = room.zones ?? [];
  return commit({...room, zones: entries.some(p => p.id === zone.id) ? entries.map(p => p.id === zone.id ? zone:p) : [...entries,zone]},zone.id);
}
export function deleteArchitecture(kind:"partition"|"opening"|"zone",id:string):CommandResult {
  const room = useProjectStore.getState().project.room;
  if (kind === "partition" && room.openings?.some(o => o.hostId === id)) return {ok:false,kind:"Invalid",issues:[{code:"HOST_IN_USE",message:"이 칸막이에 연결된 문·창문을 먼저 삭제해 주세요."}]};
  const key = kind === "partition" ? "partitions" : kind === "opening" ? "openings" : "zones";
  if (!room[key]?.some(o => o.id === id)) return {ok:true,kind:"NoChange"};
  return commit({...room,[key]:room[key]?.filter(o => o.id !== id)},id);
}
