import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { createPlanPng, createPlanSvg, downloadBlob, planFilename, printPlan } from '../../features/project/planExport';
export function ExportTools() {
  const project=useProjectStore(s=>s.project), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  return <><button type="button" title="현재 화면 확대와 관계없이 전체 평면도를 SVG로 저장합니다." onClick={()=>{try {downloadBlob(new Blob([createPlanSvg(project)],{type:'image/svg+xml;charset=utf-8'}),planFilename(project,'svg'));setError('');} catch {setError('SVG를 저장할 수 없습니다.');}}}>평면도 SVG</button>
    <button type="button" disabled={busy} title="전체 평면도를 PNG 이미지로 저장합니다." onClick={async()=>{setBusy(true);try {downloadBlob(await createPlanPng(project),planFilename(project,'png'));setError('');} catch {setError('PNG를 저장할 수 없습니다.');} finally {setBusy(false);}}}>평면도 PNG</button>
    <button type="button" onClick={()=>{try {setError(printPlan(project) ? '' : '인쇄 창을 열 수 없습니다. 팝업을 허용해 주세요.');} catch {setError('인쇄 창을 열 수 없습니다.');}}}>평면도 인쇄</button>
    {error && <span role="alert">{error}</span>}</>;
}
