import { test, expect, type Page } from './fixtures';
import { readFile } from 'node:fs/promises';
import { createProject } from '../../src/features/project/createProject';
import { createFurnitureCandidate } from '../../src/features/furniture/commands';

async function exported(page:Page) {
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'JSON 내보내기',exact:true}).click();
  const path=await (await pending).path(); if(!path) throw Error('missing download');
  return JSON.parse(await readFile(path,'utf8'));
}
function fixture() {
  const p=createProject();
  return {...p, furniture:[
    createFurnitureCandidate('nightstand',{x:500,y:500},'f1')!,
    createFurnitureCandidate('desk',{x:1800,y:1000},'f2')!,
    createFurnitureCandidate('office-chair',{x:3300,y:2400},'f3')!,
  ]};
}

test('AC-31/32 three furniture coordinates survive autosave reload and JSON roundtrip',async({page})=>{
  await page.goto('/');
  for(const name of [/협탁 450/,/책상 1200/,/사무 의자 600/]) await page.getByRole('button',{name}).click();
  const before=await exported(page); expect(before.furniture).toHaveLength(3);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('roomfit3d:v2:/:autosave') ?? 'null')?.furniture?.length)).toBe(3);
  await page.reload(); const restored=await exported(page); expect(restored).toEqual(before);
  page.once('dialog',d=>d.accept());
  await page.getByLabel('JSON 불러오기',{exact:true}).setInputFiles({name:'room.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(before))});
  await expect.poll(async()=>await exported(page)).toEqual(before);
});

test('AC-34 imports out-of-room furniture intact and displays warning',async({page})=>{
  const p=fixture(); p.furniture[0].position={x:-100,y:500};
  await page.goto('/'); page.once('dialog',d=>d.accept());
  await page.getByLabel('JSON 불러오기',{exact:true}).setInputFiles({name:'invalid-placement.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});
  await page.getByRole('button',{name:'협탁 선택'}).click();
  await expect(page.getByRole('alert')).toContainText('배치 경고');
  expect((await exported(page)).furniture[0]).toEqual(p.furniture[0]);
});

test('AC-35 SecurityError protects existing autosave and retains export',async({page})=>{
  await page.goto('/'); const title=page.getByLabel('프로젝트 이름');
  await title.fill('기존 방'); await title.press('Enter');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('roomfit3d:v2:/:autosave'))).toContain('기존 방');
  const before=await page.evaluate(()=>{
    const saved=localStorage.getItem('roomfit3d:v2:/:autosave'), original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){ if(key==='roomfit3d:v2:/:autosave') throw new DOMException('blocked','SecurityError'); return original.call(this,key,value); };
    return saved;
  });
  await title.fill('새 방'); await title.press('Enter');
  await expect(page.getByText('자동 저장에 실패했습니다')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('roomfit3d:v2:/:autosave'))).toBe(before);
  const download=page.waitForEvent('download'); await page.getByRole('button',{name:'이 탭 내용 내보내기'}).click(); await download;
});

test('AC-48 wheel zoom anchors pointer, Shift pans horizontally, and Figma preference stays out of JSON',async({page})=>{
  await page.goto('/'); const area=page.getByLabel('2D 편집 영역'),box=await area.boundingBox(); if(!box) throw Error('missing editor');
  const state=async()=>({z:Number(await area.getAttribute('data-zoom')),x:Number(await area.getAttribute('data-pan-x')),y:Number(await area.getAttribute('data-pan-y'))});
  const initial=await state(), clientX=Math.round(box.x+box.width*0.4),clientY=Math.round(box.y+box.height*0.45),px=clientX-box.x,py=clientY-box.y;
  await page.mouse.move(clientX,clientY); await page.mouse.wheel(0,-100);
  await expect.poll(async()=>(await state()).z).toBeGreaterThan(initial.z);
  const zoomed=await state(); expect((px-zoomed.x)/zoomed.z).toBeCloseTo((px-initial.x)/initial.z,4); expect((py-zoomed.y)/zoomed.z).toBeCloseTo((py-initial.y)/initial.z,4);
  await page.keyboard.down('Shift'); await page.mouse.wheel(0,80); await page.keyboard.up('Shift');
  await expect.poll(async()=>(await state()).x).toBeLessThan(zoomed.x); expect((await state()).y).toBeCloseTo(zoomed.y,4);
  await page.getByRole('button',{name:'휠 = 줌'}).click(); await expect(page.getByRole('button',{name:'Figma 방식'})).toBeVisible();
  const project=await exported(page); expect(JSON.stringify(project)).not.toContain('Figma');
  await page.reload(); await expect(page.getByRole('button',{name:'Figma 방식'})).toBeVisible();
});

test('AC-72 unsupported schema versions preserve project history and autosave',async({page})=>{
  await page.goto('/'); const title=page.getByLabel('프로젝트 이름'); await title.fill('보존 프로젝트'); await title.press('Enter');
  const before=await exported(page); await expect.poll(()=>page.evaluate(()=>localStorage.getItem('roomfit3d:v2:/:autosave'))).toContain('보존 프로젝트');
  const saved=await page.evaluate(()=>localStorage.getItem('roomfit3d:v2:/:autosave'));
  for(const version of [0,999,undefined]) {
    const input={...before,schemaVersion:version};
    await page.getByLabel('JSON 불러오기',{exact:true}).setInputFiles({name:'bad-version.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(input))});
    await expect(page.getByRole('alert').last()).toBeVisible(); expect(await exported(page)).toEqual(before);
    expect(await page.evaluate(()=>localStorage.getItem('roomfit3d:v2:/:autosave'))).toBe(saved);
    await expect(page.getByRole('button',{name:'실행 취소',exact:true})).toBeEnabled();
  }
  await page.getByRole('button',{name:'실행 취소',exact:true}).click();
  await expect(title).toHaveValue('새 프로젝트');
});

test('AC-12 queen bed DOM drop keeps exact dimensions and pointer coordinates',async({page})=>{
  await page.goto('/'); await page.getByLabel('스냅',{exact:true}).uncheck();
  const area=page.getByLabel('2D 편집 영역'), box=await area.boundingBox(); if(!box) throw Error('missing editor');
  const z=Number(await area.getAttribute('data-zoom')),panX=Number(await area.getAttribute('data-pan-x')),panY=Number(await area.getAttribute('data-pan-y'));
  const targetX=Math.round(box.x+panX+2100*z), targetY=Math.round(box.y+panY+1700*z);
  await page.getByRole('button',{name:/퀸 침대 1500/}).dragTo(area,{targetPosition:{x:targetX-box.x,y:targetY-box.y}});
  const data=await exported(page);expect(data.furniture).toHaveLength(1);
  expect(data.furniture[0]).toMatchObject({catalogId:'bed-queen',widthMm:1500,depthMm:2000,heightMm:500});
  expect(data.furniture[0].position.x).toBe(Math.round(((targetX-box.x-panX)/z)*2)/2);
  expect(data.furniture[0].position.y).toBe(Math.round(((targetY-box.y-panY)/z)*2)/2);
});

test('AC-09 numeric right-wall move preserves the exact orthogonal polygon',async({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:'벽 2 선택'}).click();
  await page.getByLabel('벽 이동 거리 (mm)').fill('150'); await page.getByRole('button',{name:'벽 이동 적용'}).click();
  const p=await exported(page);
  expect(p.room.polygon.map(({x,y}:{x:number;y:number})=>[x,y])).toEqual([[0,0],[4350,0],[4350,3400],[0,3400]]);
  await expect(page.getByText('14.79 ㎡',{exact:true})).toBeVisible();
});

test('AC-04 exact 1000×600 protrusion survives actual 3D view roundtrip',async({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:'벽 1 선택'}).click();
  await page.getByLabel('시작 위치 (mm)').fill('1600'); await page.getByLabel('폭 (mm)').fill('1000'); await page.getByLabel('깊이 (mm)').fill('600');
  await page.getByRole('button',{name:'돌출 적용'}).click(); await expect(page.getByText('14.88 ㎡',{exact:true})).toBeVisible();
  const before=await exported(page); expect(before.room.polygon.map(({x,y}:{x:number;y:number})=>[x,y])).toEqual([[0,0],[1600,0],[1600,-600],[2600,-600],[2600,0],[4200,0],[4200,3400],[0,3400]]);
  await page.getByRole('button',{name:'3D 보기',exact:true}).click(); await expect(page.getByLabel('3D 방 보기').locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'2D에서 편집',exact:true}).click(); expect(await exported(page)).toEqual(before);
});

test('AC-02/03 edited top wall and 800×500 indent each remain intact across 3D',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'벽 1 선택'}).click();
  await page.getByLabel('벽 이동 거리 (mm)').fill('200'); await page.getByRole('button',{name:'벽 이동 적용'}).click();
  const moved=await exported(page);expect(moved.room.polygon.map(({x,y}:{x:number;y:number})=>[x,y])).toEqual([[0,-200],[4200,-200],[4200,3400],[0,3400]]);
  await page.getByRole('button',{name:'3D 보기',exact:true}).click(); await expect(page.getByLabel('3D 방 보기').locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'2D에서 편집',exact:true}).click();expect(await exported(page)).toEqual(moved);
  await page.getByRole('button',{name:'실행 취소',exact:true}).click();
  await page.getByRole('button',{name:'벽 1 선택'}).click();
  await page.getByLabel('시작 위치 (mm)').fill('1600');await page.getByLabel('폭 (mm)').fill('800');await page.getByLabel('깊이 (mm)').fill('500');
  await page.getByRole('button',{name:'함몰 적용'}).click(); await expect(page.getByText('13.88 ㎡',{exact:true})).toBeVisible();
  const indented=await exported(page);expect(indented.room.polygon).toHaveLength(8);
  await page.getByRole('button',{name:'3D 보기',exact:true}).click();await expect(page.getByLabel('3D 방 보기').locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'2D에서 편집',exact:true}).click();expect(await exported(page)).toEqual(indented);
});

test('AC-16 even furniture can touch a wall and another item exactly',async({page})=>{
  const p=createProject(); p.furniture=[createFurnitureCandidate('nightstand',{x:225,y:500},'a')!,createFurnitureCandidate('nightstand',{x:1000,y:500},'b')!];
  await page.addInitScript(project=>localStorage.setItem('roomfit3d:v2:/:autosave',JSON.stringify(project)),p); await page.goto('/');
  await page.getByRole('button',{name:'협탁 선택'}).nth(1).click();
  const x=page.getByLabel('위치 X (mm)');await x.fill('675');await x.press('Enter');await expect(x).not.toHaveAttribute('aria-invalid','true');
  const result=await exported(page);expect(result.furniture.map((f:{position:{x:number}})=>f.position.x)).toEqual([225,675]);
});

test('AC-44 invalid furniture permits rename color and delete',async({page})=>{
  const p=fixture();p.furniture[0].position={x:-100,y:500};
  await page.addInitScript(project=>localStorage.setItem('roomfit3d:v2:/:autosave',JSON.stringify(project)),p);await page.goto('/');
  await page.getByRole('button',{name:'협탁 선택'}).click();await expect(page.getByRole('alert')).toContainText('배치 경고');
  const name=page.getByLabel('가구 이름');await name.fill('경고 협탁');await name.press('Enter');
  await page.getByLabel('색상').selectOption('#64B5F6');
  const changed=await exported(page);expect(changed.furniture[0]).toMatchObject({name:'경고 협탁',color:'#64B5F6',position:{x:-100,y:500}});
  await page.getByRole('button',{name:'삭제',exact:true}).click();expect((await exported(page)).furniture).toHaveLength(2);
});

test('AC-62 odd-width numeric position rejects half-millimetre outside and permits exact contact',async({page})=>{
  const p=createProject();const item={...createFurnitureCandidate('bed-single',{x:500.5,y:1000},'odd')!,widthMm:1001};p.furniture=[item];
  await page.addInitScript(project=>localStorage.setItem('roomfit3d:v2:/:autosave',JSON.stringify(project)),p);await page.goto('/');
  await page.getByRole('button',{name:'싱글 침대 선택'}).click();const x=page.getByLabel('위치 X (mm)');
  await x.fill('500');await x.press('Enter');await expect(x).toHaveAttribute('aria-invalid','true');
  expect((await exported(page)).furniture[0].position.x).toBe(500.5);
  await x.fill('500.5');await x.press('Enter');await expect(x).not.toHaveAttribute('aria-invalid','true');
  expect((await exported(page)).furniture[0].position.x).toBe(500.5);
});
