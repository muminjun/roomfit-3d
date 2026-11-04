import { test, expect } from './fixtures';
import { createProject } from '../../src/features/project/createProject';
for (const cancellation of ['blur','view','project'] as const) {
 test(`architecture preview is discarded by ${cancellation}`,async({page})=>{
  const p=createProject();p.room.zones=[{id:'zone',name:'구역 A',kind:'living',x:400,y:400,widthMm:800,depthMm:600}];
  await page.addInitScript(p=>localStorage.setItem('roomfit3d:v2:/:autosave',JSON.stringify(p)),p);
  await page.goto('/');await page.getByRole('button',{name:'구조 편집',exact:true}).click();
  const area=page.getByLabel('2D 편집 영역'),box=(await area.boundingBox())!;
  const zoom=Number(await area.getAttribute('data-zoom')),px=Number(await area.getAttribute('data-pan-x')),py=Number(await area.getAttribute('data-pan-y'));
  await page.mouse.move(box.x+px+800*zoom,box.y+py+700*zoom);await page.mouse.down();
  await page.mouse.move(box.x+px+1000*zoom,box.y+py+700*zoom,{steps:8});
  if(cancellation==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  if(cancellation==='view')await page.getByRole('button',{name:'3D 보기',exact:true}).evaluate((b:HTMLElement)=>b.click());
  if(cancellation==='project'){
   await page.getByRole('button',{name:'새 프로젝트',exact:true}).evaluate((b:HTMLElement)=>b.click());
   page.once('dialog',d=>d.accept());
   await page.getByRole('dialog').getByRole('button',{name:'만들기',exact:true}).evaluate((b:HTMLElement)=>b.click());
  }
  await page.mouse.up();
  if(cancellation==='view')await page.getByRole('button',{name:'2D 편집',exact:true}).click();
  await expect(page.getByRole('button',{name:'실행 취소',exact:true})).toBeDisabled();
  if(cancellation!=='project'){
   await expect(page.getByRole('button',{name:'구역 A 편집',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'구역 A 편집',exact:true}).click();
   await expect(page.getByLabel('구역 X (mm)')).toHaveValue('400');
  } else await expect(page.getByRole('button',{name:'구역 A 편집',exact:true})).toHaveCount(0);
 });
}
