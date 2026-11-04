import { useEffect,useId,useState } from "react";
import { getFrontClearanceWarnings } from "../../features/furniture/frontClearance";
import { useProjectStore } from "../../store/useProjectStore";
import styles from "../../styles/App.module.css";
export function ClearancePanel(){
  const project=useProjectStore(s=>s.project),setSettings=useProjectStore(s=>s.setSettings);
  const value=project.settings.minimumClearanceMm ?? 0,[draft,setDraft]=useState(String(value)),[error,setError]=useState(false),id=useId();
  useEffect(()=>{setDraft(String(value));setError(false);},[value]);
  const warnings=getFrontClearanceWarnings(project);
  const commit=()=>{
    const text=draft.replace(/[\s,]/g,"");
    if(!/^\d+$/.test(text)||Number(text)>3000){setError(true);return;}
    setError(false);if(Number(text)!==value)setSettings({minimumClearanceMm:Number(text)});
  };
  return <section className={styles.panel} aria-label="사용 여유 검사"><h3>앞면 사용 여유</h3>
    <p className={styles.muted}>가구 앞면의 도면상 자유 거리를 사용자가 정한 기준과 비교합니다. 0은 끄기이며 법정 통로 폭이나 설치 적합성 판정은 아닙니다.</p>
    <label className={styles.field}>사용 여유 기준 (mm)<input inputMode="numeric" value={draft} aria-invalid={error||undefined} aria-describedby={id} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();if(e.key==="Escape"){setDraft(String(value));setError(false);}}}/></label>
    <small id={id}>{error ? "0–3000 mm 정수를 입력해 주세요.":"0–3000 mm · 설정 변경은 Undo 대상에서 제외됩니다."}</small>
    <p>여유 경고 {warnings.length}개</p>{warnings.map(w=><p key={w.itemId} className={styles.error}>{w.name}: 앞면 {w.availableMm} mm / 기준 {w.minimumMm} mm · {w.obstacleNames.join(", ")}</p>)}
  </section>;
}
