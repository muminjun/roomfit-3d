import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { projectSchema } from '../../types/schema';
export const autosaveKey = `roomfit3d:v2:${import.meta.env.BASE_URL}:autosave`;
export function startAutosave(): () => void {
 let timer: ReturnType<typeof setTimeout> | undefined; let blocked=false;
 try { const raw=localStorage.getItem(autosaveKey); if(raw) { const result=projectSchema.safeParse(JSON.parse(raw)); if(result.success) useProjectStore.getState().loadProject(result.data); else blocked=true; } } catch { blocked=true; }
 if(blocked) useUIStore.getState().setSaveStatus('failed');
 const unsubscribe=useProjectStore.subscribe((state,prev)=>{ if(state.project===prev.project || blocked)return; clearTimeout(timer); useUIStore.getState().setSaveStatus('pending'); timer=setTimeout(()=>{try {localStorage.setItem(autosaveKey,JSON.stringify(state.project)); useUIStore.getState().setSaveStatus('saved');} catch {useUIStore.getState().setSaveStatus('failed');}},500); });
 const onStorage=(event:StorageEvent)=>{if(event.key===autosaveKey){clearTimeout(timer);blocked=true;useUIStore.getState().setSaveStatus('conflict');}};
 window.addEventListener('storage',onStorage); return ()=>{clearTimeout(timer);unsubscribe();window.removeEventListener('storage',onStorage);};
}
