import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { cloneLibraryProject, deleteLibraryProject, libraryKey, readLibrary, renameLibraryProject, saveLibraryProject, type LibraryRecord } from '../../features/project/library';
import { downloadBlob } from '../../features/project/planExport';
import styles from '../../styles/App.module.css';

export function ProjectLibraryDialog({onClose,onSelectedProject}:{onClose:()=>void; onSelectedProject:()=>void}) {
  const node=useRef<HTMLDivElement>(null);
  const [version,setVersion]=useState(0), [error,setError]=useState(''), [conflict,setConflict]=useState(false);
  const [editing,setEditing]=useState<string|null>(null), [name,setName]=useState('');
  const library=readLibrary();
  useEffect(() => {
    const previous=document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key=(e:KeyboardEvent) => {
      if(e.key==='Escape'){e.preventDefault();onClose();return;}
      if(e.key!=='Tab'||!node.current)return;
      const focusable=[...node.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')];
      if(!focusable.length)return;
      if(e.shiftKey && document.activeElement===focusable[0]) {e.preventDefault();focusable.at(-1)?.focus();}
      else if(!e.shiftKey && document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}
    };
    const storage=(e:StorageEvent)=>{if(e.key===libraryKey||e.key===null){setConflict(true);setError('다른 탭에서 보관함이 변경되었습니다. 새로 읽은 뒤 다시 시도해 주세요.');}};
    document.addEventListener('keydown',key); window.addEventListener('storage',storage);
    return ()=>{document.removeEventListener('keydown',key);window.removeEventListener('storage',storage);previous?.focus();};
  },[onClose]);
  void version;
  function run(action:()=>{ok:true}|{ok:false;message:string}) { if(conflict){setError('먼저 보관함을 새로 읽어 주세요.');return false;} const r=action(); if(!r.ok){setError(r.message);return false;} setError('');setVersion(v=>v+1);return true; }
  function open(record:LibraryRecord) {
    if(conflict){setError('먼저 보관함을 새로 읽어 주세요.');return;}
    if(!window.confirm('현재 프로젝트를 보관한 뒤 선택한 프로젝트를 열까요?'))return;
    const current=readLibrary();
    if(!current.ok){setError(current.message);return;}
    const fresh=current.records.find(r=>r.id===record.id);
    if(!fresh){setError('선택한 프로젝트를 찾을 수 없습니다.');return;}
    if(!run(()=>saveLibraryProject(useProjectStore.getState().project)))return;
    if(!useProjectStore.getState().loadProject(fresh.project)){setError('프로젝트를 열 수 없습니다.');return;}
    onClose(); onSelectedProject();
  }
  function backupRaw(){ try {const raw=localStorage.getItem(libraryKey);if(raw!==null)downloadBlob(new Blob([raw],{type:'application/json'}),'roomfit-library-backup.json');} catch {setError('보관함 원본을 읽을 수 없습니다.');} }
  return <div className={styles.overlay}><div ref={node} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="library-title">
    <h2 id="library-title">프로젝트 보관함</h2><p>이 브라우저에 스냅샷을 저장합니다. 자동 저장과 별도로 관리되므로 JSON 백업도 보관하세요. 여러 탭에서 동시에 보관함을 수정하면 변경이 덮어써질 수 있으므로 한 탭에서만 편집해 주세요.</p>
    <button type="button" onClick={()=>run(()=>saveLibraryProject(useProjectStore.getState().project))}>현재 프로젝트 보관</button>{' '}
    <button type="button" onClick={()=>{setConflict(false);setError('');setVersion(v=>v+1);}}>보관함 새로 읽기</button>
    {!library.ok && <><p role="alert">{library.message}</p><button type="button" onClick={backupRaw}>손상된 보관함 원본 백업</button></>}
    {error && <p role="alert">{error}</p>}
    {library.ok && <>{library.records.length===0 && <p>보관된 프로젝트가 없습니다.</p>}<ul>{library.records.map(record=><li key={record.id}>
      <b>{record.project.title}</b> <small>{new Date(record.project.updatedAt).toLocaleString('ko-KR')}</small>
      <div><button type="button" onClick={()=>open(record)}>{record.project.title} 열기</button>{' '}
      <button type="button" onClick={()=>{setEditing(record.id);setName(record.project.title);setError('');}}>{record.project.title} 이름 변경</button>{' '}
      <button type="button" onClick={()=>run(()=>cloneLibraryProject(record.id))}>{record.project.title} 복제</button>{' '}
      <button type="button" onClick={()=>{if(window.confirm(`“${record.project.title}” 보관본을 삭제할까요?`))run(()=>deleteLibraryProject(record.id));}}>{record.project.title} 삭제</button></div>
      {editing===record.id && <form onSubmit={e=>{e.preventDefault();if(run(()=>renameLibraryProject(record.id,name)))setEditing(null);}}><label>새 보관본 이름<input value={name} onChange={e=>setName(e.target.value)} /></label><button type="submit">이름 저장</button><button type="button" onClick={()=>setEditing(null)}>취소</button></form>}
    </li>)}</ul></>}
    <button type="button" onClick={onClose}>닫기</button>
  </div></div>;
}
