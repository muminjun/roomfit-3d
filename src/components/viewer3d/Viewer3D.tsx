import { Component, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FrontSide, Plane, Vector3 } from 'three';
import type { FurnitureItem, Room } from '../../types/model';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { getBBox, getFurnitureRect, snapFurniture, validatePlacement } from '../../lib/geometry';
import { moveFurniture } from '../../features/furniture/commands';
import { resolveShortcut } from '../../config/shortcuts';
import { handleFurnitureShortcut } from '../editor2d/furnitureShortcuts';
import { exportJson } from '../../features/project/exportJson';
import { downloadBlob } from '../../features/project/planExport';
import { buildFloorGeometry } from './geometry';
import { buildArchitecturalWallGeometry } from './architecture';
import { ArchitectureMeshes } from './ArchitectureMeshes';
import { RendererTelemetry, type RendererSample } from './RendererTelemetry';
import { buildFurnitureObject, disposeFurnitureObject } from './furniture';
import { cameraForRoom } from './camera';

type Preset = 'iso' | 'top' | 'front' | 'side';
const fallbackText = '현재 브라우저에서는 3D 보기를 사용할 수 없습니다. 2D 편집은 계속 사용할 수 있습니다.';
function webglAvailable() { try {const c=document.createElement('canvas');return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));} catch{return false;} }
class ViewerBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}> {
  state={failed:false}; static getDerivedStateFromError(){return {failed:true};} componentDidCatch(){this.props.onError();} render(){return this.state.failed ? null : this.props.children;}
}
function RoomMeshes({room,showWalls}:{room:Room;showWalls:boolean}) {
  const floor=useMemo(()=>buildFloorGeometry(room.polygon),[room.polygon]);
  const walls=useMemo(()=>buildArchitecturalWallGeometry(room),[room]);
  useEffect(()=>()=>floor.dispose(),[floor]); useEffect(()=>()=>walls.dispose(),[walls]);
  return <><mesh geometry={floor}><meshStandardMaterial color="#e2e9e7" side={FrontSide}/></mesh>{showWalls && <mesh geometry={walls}><meshStandardMaterial color="#aebfc1" side={FrontSide} transparent opacity={.4} depthWrite={false}/></mesh>}</>;
}
function FurnitureMesh({item,invalid,selected,onDown,onMove,onUp}:{item:FurnitureItem;invalid:boolean;selected:boolean;onDown:(e:ThreeEvent<PointerEvent>)=>void;onMove:(e:ThreeEvent<PointerEvent>)=>void;onUp:(e:ThreeEvent<PointerEvent>)=>void}) {
  const object=useMemo(()=>buildFurnitureObject(invalid ? {...item,color:'#e04c4c'} : item),[item,invalid]);
  useEffect(()=>()=>disposeFurnitureObject(object),[object]);
  const r=getFurnitureRect(item);
  return <group onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}><primitive object={object} dispose={null}/>{selected && <mesh position={[item.position.x/1000,item.heightMm/2000,item.position.y/1000]} raycast={()=>null}><boxGeometry args={[(r.maxX-r.minX)/1000+.02,item.heightMm/1000+.02,(r.maxY-r.minY)/1000+.02]}/><meshBasicMaterial color={invalid?'#c62b2b':'#167eb2'} wireframe/></mesh>}</group>;
}
const ground=new Plane(new Vector3(0,1,0),0);
type Drag = { item:FurnitureItem; start:Vector3; project:ReturnType<typeof useProjectStore.getState>['project']; pointerId:number; target:{releasePointerCapture:(id:number)=>void} };
function Scene({room,items,preset,reset,showWalls,editing,captureRef,onSample}:{room:Room;items:FurnitureItem[];preset:Preset;reset:number;showWalls:boolean;editing:boolean;captureRef:React.MutableRefObject<(()=>Promise<Blob>)|null>;onSample?:(sample:RendererSample)=>void}) {
  const {camera,size,gl,scene}=useThree();
  const controls=useRef<ComponentRef<typeof OrbitControls>>(null), drag=useRef<Drag|null>(null);
  const [dragging,setDragging]=useState(false);
  const preview=useUIStore(s=>s.furniturePreview);
  const view=useUIStore(s=>s.view), selected=useUIStore(s=>s.selected);
  const previousView=useRef(view);
  const project=useProjectStore(s=>s.project);
  const frame=useMemo(()=>cameraForRoom(room,Math.max(size.width,1)/Math.max(size.height,1)),[room,size.width,size.height]);
  const cancel=useCallback(()=>{const old=drag.current;drag.current=null;if(old){try{old.target.releasePointerCapture(old.pointerId);}catch{/* already released */}}useUIStore.getState().setFurniturePreview(null);setDragging(false);},[]);
  useEffect(()=>{
    const box=getBBox(room.polygon), aspect=Math.max(size.width,1)/Math.max(size.height,1), tan=Math.tan(Math.PI/8);
    const target=frame.target.clone(); let position=frame.position.clone(); camera.up.set(0,1,0);
    if(preset==='top'){target.y=0; const d=Math.max(box.depth/1000/(2*tan),box.width/1000/(2*tan*aspect))*1.25 + room.wallHeightMm/1000; position=new Vector3(target.x,d,target.z);camera.up.set(0,0,-1);}
    if(preset==='front'){const d=Math.max(room.wallHeightMm/1000/(2*tan),box.width/1000/(2*tan*aspect))*1.25 + box.depth/2000;position=new Vector3(target.x,target.y,target.z+d);}
    if(preset==='side'){const d=Math.max(room.wallHeightMm/1000/(2*tan),box.depth/1000/(2*tan*aspect))*1.25 + box.width/2000;position=new Vector3(target.x+d,target.y,target.z);}
    camera.position.copy(position);camera.lookAt(target);camera.updateProjectionMatrix();
    if(controls.current){controls.current.target.copy(target);controls.current.maxDistance=Math.max(frame.maxDistance,position.distanceTo(target)*2);controls.current.update();}
  },[camera,frame,preset,reset,room,size.width,size.height]);
  useEffect(()=>{captureRef.current=()=>new Promise((resolve,reject)=>{try{gl.render(scene,camera);gl.domElement.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG 저장 실패')),'image/png');}catch(e){reject(e);}});return()=>{captureRef.current=null;};},[camera,captureRef,gl,scene]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape' && drag.current){e.preventDefault();cancel();}};window.addEventListener('keydown',onKey);window.addEventListener('blur',cancel);window.addEventListener('pointercancel',cancel);window.addEventListener('roomfit-cancel-drag',cancel);return()=>{window.removeEventListener('keydown',onKey);window.removeEventListener('blur',cancel);window.removeEventListener('pointercancel',cancel);window.removeEventListener('roomfit-cancel-drag',cancel);cancel();};},[cancel]);
  useEffect(()=>{if(drag.current && (!editing || drag.current.project!==project || (selected?.kind!=='furniture' || selected.id!==drag.current.item.id)))cancel();},[cancel,editing,project,selected,view]);
  useEffect(()=>{if(previousView.current!==view){previousView.current=view;cancel();}},[cancel,view]);
  function down(e:ThreeEvent<PointerEvent>,item:FurnitureItem){
    if(e.button!==0)return;e.stopPropagation();useUIStore.getState().setSelected({kind:'furniture',id:item.id});useUIStore.getState().setFurnitureMessage('');
    if(!editing)return;if(item.locked){useUIStore.getState().setFurnitureMessage('잠긴 가구는 이동할 수 없습니다.');return;}
    const start=e.ray.intersectPlane(ground,new Vector3());if(!start)return;
    const target=e.target as unknown as {setPointerCapture:(id:number)=>void;releasePointerCapture:(id:number)=>void};
    target.setPointerCapture(e.pointerId);drag.current={item,start,project:useProjectStore.getState().project,pointerId:e.pointerId,target};setDragging(true);
  }
  function move(e:ThreeEvent<PointerEvent>){const d=drag.current;if(!d || d.pointerId!==e.pointerId)return;e.stopPropagation();const hit=e.ray.intersectPlane(ground,new Vector3());if(!hit)return;
    const state=useProjectStore.getState().project;let candidate={...d.item,position:{x:Math.round((d.item.position.x+(hit.x-d.start.x)*1000)*2)/2,y:Math.round((d.item.position.y+(hit.z-d.start.z)*1000)*2)/2}};
    if(state.settings.snapEnabled)candidate=snapFurniture(candidate,state.settings.gridSizeMm);
    const check=validatePlacement(state.room,state.furniture,candidate,{ignoreId:d.item.id});useUIStore.getState().setFurniturePreview({item:candidate,valid:check.valid,message:check.issues.map(i=>i.message).join(' ')});
  }
  function up(e:ThreeEvent<PointerEvent>){const d=drag.current;if(!d||d.pointerId!==e.pointerId)return;e.stopPropagation();const p=useUIStore.getState().furniturePreview;cancel();if(p?.item.id===d.item.id && p.valid){const result=moveFurniture({itemId:d.item.id,position:p.item.position});if(!result.ok)useUIStore.getState().setFurnitureMessage(result.issues.map(i=>i.message).join(' '));}else if(p&&!p.valid)useUIStore.getState().setFurnitureMessage(p.message);}
  return <>{onSample && <RendererTelemetry onSample={onSample}/>}<ambientLight intensity={.6}/><directionalLight intensity={.8} position={[frame.target.x+5,frame.target.y+10,frame.target.z+5]}/><RoomMeshes room={room} showWalls={showWalls}/>{showWalls && <ArchitectureMeshes room={room}/>}
    {items.map(item=>{const shown=preview?.item.id===item.id?preview.item:item;return <FurnitureMesh key={item.id} item={shown} selected={selected?.kind==='furniture' && selected.id===item.id} invalid={preview?.item.id===item.id&&!preview.valid} onDown={e=>down(e,item)} onMove={move} onUp={up}/>;})}
    <OrbitControls ref={controls} target={frame.target} enabled={!dragging} enableRotate={!editing} minDistance={.5} maxDistance={Math.max(frame.maxDistance,camera.position.distanceTo(frame.target)*2)} maxPolarAngle={Math.PI/2-.05}/></>;
}
export default function Viewer3D(){
  const room=useProjectStore(s=>s.project.room),items=useProjectStore(s=>s.project.furniture);
  const [available,setAvailable]=useState(webglAvailable),[lost,setLost]=useState(false),[generation,setGeneration]=useState(0),[reset,setReset]=useState(0),[preset,setPreset]=useState<Preset>('iso'),[walls,setWalls]=useState(true),[editing,setEditing]=useState(false),[error,setError]=useState('');
  const [sample,setSample]=useState<RendererSample|null>(null);const measuring=new URLSearchParams(window.location.search).get('measure')==='1';
  const canvasRef=useRef<HTMLCanvasElement|null>(null),captureRef=useRef<(()=>Promise<Blob>)|null>(null);
  const preview=useUIStore(s=>s.furniturePreview), message=useUIStore(s=>s.furnitureMessage);
  const handleContextLost=useCallback((event:Event)=>{event.preventDefault();setLost(true);window.dispatchEvent(new Event('roomfit-cancel-drag'));},[]);
  const attachCanvas=useCallback((canvas:HTMLCanvasElement|null)=>{canvasRef.current?.removeEventListener('webglcontextlost',handleContextLost);canvasRef.current=canvas;if(canvas)canvas.tabIndex=0;canvas?.addEventListener('webglcontextlost',handleContextLost);},[handleContextLost]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.isComposing||document.querySelector('[aria-modal="true"]')||document.activeElement!==canvasRef.current)return;const action=resolveShortcut(e);if(!action||action==='cancel')return;if(handleFurnitureShortcut(action,e)){e.preventDefault();return;}if(action==='undo'){e.preventDefault();useProjectStore.getState().undo();}else if(action==='redo'){e.preventDefault();useProjectStore.getState().redo();}else if(action==='save'){e.preventDefault();exportJson(useProjectStore.getState().project);}else if(action==='help'){e.preventDefault();useUIStore.getState().setHelpOpen(true);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  const retry=()=>{setLost(false);setAvailable(webglAvailable());setGeneration(v=>v+1);};
  return <section aria-label="3D 보기" style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',position:'relative'}}>
    <div style={{display:'flex',gap:8,padding:8,flexWrap:'wrap'}}>
      <button type="button" onClick={()=>{setPreset('iso');setReset(v=>v+1);}}>전체 보기</button><button type="button" onClick={()=>{setPreset('iso');setReset(v=>v+1);}}>카메라 초기화</button>
      {([['top','위에서'],['front','앞에서'],['side','옆에서'],['iso','입체']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={preset===id} onClick={()=>{setPreset(id);setReset(v=>v+1);}}>{label}</button>)}
      <button type="button" aria-pressed={walls} onClick={()=>setWalls(v=>!v)}>벽 표시</button><button type="button" aria-pressed={editing} onClick={()=>{window.dispatchEvent(new Event('roomfit-cancel-drag'));setEditing(v=>!v);}}>3D 이동</button>
      <button type="button" disabled={!available||lost} onClick={async()=>{try{const blob=await captureRef.current?.();if(!blob)throw new Error();downloadBlob(blob,'roomfit-3d.png');setError('');}catch{setError('3D 이미지를 저장할 수 없습니다.');}}}>3D PNG 저장</button>
    </div>
    {(error||message||preview?.message) && <p role="status" style={{position:'absolute',bottom:8,left:8,zIndex:1,background:'white',padding:8,margin:0,pointerEvents:'none'}}>{error||preview?.message||message}</p>}
    {measuring && sample && <output aria-label="렌더러 측정" data-frames={sample.frames} data-draw-calls={sample.drawCalls} data-triangles={sample.triangles} data-cpu-ms={sample.cpuMs} data-frame-ms={sample.frameMs} data-renderer={sample.renderer} data-gpu-timer-available={String(sample.gpuTimerAvailable)}>CPU 제출 {sample.cpuMs.toFixed(2)} ms · 프레임 간격 {sample.frameMs.toFixed(2)} ms · 호출 {sample.drawCalls} · 삼각형 {sample.triangles}</output>}
    {!available||lost ? <div role="status"><p>{lost?'3D 연결이 끊겼습니다. 다시 시도해 주세요.':fallbackText}</p><button type="button" onClick={retry}>다시 시도</button></div> : <ViewerBoundary key={generation} onError={()=>setAvailable(false)}><div style={{flex:1,minHeight:0}}><Canvas ref={attachCanvas} aria-label="3D 방 보기" dpr={[1,2]} camera={{fov:45,near:.1,far:200}}><Scene room={room} items={items} preset={preset} reset={reset} showWalls={walls} editing={editing} captureRef={captureRef} onSample={measuring?setSample:undefined}/></Canvas></div></ViewerBoundary>}
  </section>;
}
