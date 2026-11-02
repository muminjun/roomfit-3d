import { roomPresets } from '../../data/presets';
import { createId } from '../../features/project/createProject';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import styles from '../../styles/App.module.css';
export function ToolsPanel(){
 const tool=useUIStore(s=>s.tool),setTool=useUIStore(s=>s.setTool),setSelected=useUIStore(s=>s.setSelected),load=useProjectStore(s=>s.loadProject),project=useProjectStore(s=>s.project);
 function preset(presetId:string){const preset=roomPresets.find(p=>p.id===presetId);if(!preset)return;if(!window.confirm('현재 프로젝트를 이 예제로 교체할까요? 필요한 경우 먼저 JSON으로 백업해 주세요.'))return;load({...project,room:{...project.room,polygon:preset.points.map(([x,y])=>({id:createId(),x,y}))},furniture:[],updatedAt:new Date().toISOString()});setSelected(null);setTool('select');}
 return <aside className={styles.panel}><p className={styles.eyebrow}>ROOM TOOLS</p><h2>방 편집</h2><p className={styles.muted}>벽을 선택하고 편집 방법을 선택하세요.</p><div className={styles.toolList}>{([['select','선택'],['wallMove','벽 이동'],['indent','함몰 만들기'],['protrude','돌출 만들기']] as const).map(([id,label])=><button key={id} aria-pressed={tool===id} onClick={()=>setTool(id)}>{label}</button>)}</div><p className={styles.muted}>벽 이동은 선택한 벽을 수직으로 움직입니다. 함몰과 돌출은 벽에서 폭을 드래그한 뒤 깊이를 선택합니다.</p><h3>방 예제</h3><div className={styles.toolList}>{roomPresets.map(p=><button key={p.id} onClick={()=>preset(p.id)}>{p.name}</button>)}</div><p className={styles.note}>예제 크기는 참고용입니다. 실제 현장 치수를 확인해 주세요.</p></aside>;
}
