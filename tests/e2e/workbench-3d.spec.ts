import { test,expect } from "./fixtures";
import { readFile } from "node:fs/promises";

test("3D presets and PNG export preserve the project",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/책상 1200/}).click();
  await page.getByRole("button",{name:"3D 보기",exact:true}).click();
  await expect(page.getByLabel("3D 방 보기").locator("canvas")).toBeVisible();
  await page.getByRole("button",{name:"위에서",exact:true}).click();
  await expect(page.getByRole("button",{name:"위에서",exact:true})).toHaveAttribute("aria-pressed","true");
  const image=page.waitForEvent("download");
  await page.getByRole("button",{name:"3D PNG 저장",exact:true}).click();
  const data=await readFile(await(await image).path());
  expect(data.subarray(0,8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(data.length).toBeGreaterThan(1000);
  const colors=await page.evaluate(async (base64)=>{
    const binary=atob(base64), bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
    const canvas=document.createElement('canvas'); canvas.width=bitmap.width;canvas.height=bitmap.height;
    const context=canvas.getContext('2d')!;context.drawImage(bitmap,0,0);
    const pixels=context.getImageData(0,0,bitmap.width,bitmap.height).data, colors=new Set<string>();
    for(let i=0;i<pixels.length;i+=400)colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]},${pixels[i+3]}`);
    bitmap.close(); return colors.size;
  },data.toString('base64'));
  expect(colors).toBeGreaterThan(1);
});

test("split view mounts both real editors without a project edit",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/책상 1200/}).click();
  await page.getByRole("button",{name:"분할 보기",exact:true}).click();
  await expect(page.getByLabel("2D 편집 영역")).toBeVisible();
  await expect(page.getByLabel("3D 방 보기").locator("canvas")).toBeVisible();
  await page.getByRole("button",{name:"실행 취소",exact:true}).click();
  await expect(page.getByRole("button",{name:"책상 선택",exact:true})).toHaveCount(0);
});

test('3D drag moves furniture once, undo restores it, and Escape cancels', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:/책상 1200/}).click();
  const x=page.getByLabel('위치 X (mm)');
  const initial=Number(await x.inputValue());
  await page.getByRole('button',{name:'3D 보기',exact:true}).click();
  await page.getByRole('button',{name:'위에서',exact:true}).click();
  await page.getByRole('button',{name:'3D 이동',exact:true}).click();
  const canvas=page.getByLabel('3D 방 보기').locator('canvas');
  const rect=await canvas.boundingBox(); expect(rect).not.toBeNull();
  const cx=rect!.x+rect!.width/2, cy=rect!.y+rect!.height/2;
  await page.mouse.move(cx,cy); await page.mouse.down(); await page.mouse.move(cx+35,cy,{steps:6}); await page.mouse.up();
  await expect.poll(async()=>Number(await x.inputValue())).toBeGreaterThan(initial);
  await page.getByRole('button',{name:'실행 취소',exact:true}).click();
  await expect(x).toHaveValue(String(initial));
  await page.mouse.move(cx,cy); await page.mouse.down(); await page.mouse.move(cx+35,cy,{steps:6}); await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(x).toHaveValue(String(initial));
});

test('invalid and locked 3D drags do not change furniture', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:/책상 1200/}).click();
  const x=page.getByLabel('위치 X (mm)'), initial=await x.inputValue();
  await page.getByRole('button',{name:'3D 보기',exact:true}).click();
  await page.getByRole('button',{name:'위에서',exact:true}).click();
  await page.getByRole('button',{name:'3D 이동',exact:true}).click();
  const canvas=page.getByLabel('3D 방 보기').locator('canvas');const rect=await canvas.boundingBox();expect(rect).not.toBeNull();
  const cx=rect!.x+rect!.width/2,cy=rect!.y+rect!.height/2;
  await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(rect!.x+rect!.width-1,cy,{steps:5});await page.mouse.up();
  await expect(x).toHaveValue(initial);
  await expect(page.getByRole('status').filter({hasText:/방|경계/}).first()).toBeVisible();
  await page.getByRole('button',{name:'선택 잠금'}).click();
  const lockedRect=await canvas.boundingBox();expect(lockedRect).not.toBeNull();
  const lx=lockedRect!.x+lockedRect!.width/2,ly=lockedRect!.y+lockedRect!.height/2;
  await page.mouse.move(lx,ly);await page.mouse.down();await page.mouse.move(lx+35,ly,{steps:5});await page.mouse.up();
  await expect(x).toHaveValue(initial);
  await expect(page.getByRole('status').filter({hasText:'잠긴 가구'}).first()).toBeVisible();
});

test('3D canvas keyboard controls do not intercept typing in property inputs', async ({page}) => {
  await page.goto('/');await page.getByRole('button',{name:/책상 1200/}).click();
  await page.getByRole('button',{name:'3D 보기',exact:true}).click();await page.getByRole('button',{name:'위에서',exact:true}).click();
  const input=page.getByLabel('가구 이름');await input.focus();await page.keyboard.press('End');await page.keyboard.type('r');
  await expect(input).toHaveValue('책상r');
  const canvas=page.getByLabel('3D 방 보기').locator('canvas');const rect=await canvas.boundingBox();expect(rect).not.toBeNull();
  await page.mouse.click(rect!.x+rect!.width/2,rect!.y+rect!.height/2);
  await expect(canvas).toBeFocused();await page.keyboard.press('Delete');
  await expect(page.getByLabel('가구 이름')).toHaveCount(0);
  await page.getByRole('button',{name:'실행 취소'}).click();await page.getByRole('button',{name:'2D 편집'}).click();await expect(page.getByRole('button',{name:'책상r 선택'})).toBeVisible();
});

test('3D drag cancels on blur and pointer cancellation', async ({page}) => {
  await page.goto('/');await page.getByRole('button',{name:/책상 1200/}).click();
  const x=page.getByLabel('위치 X (mm)'), initial=await x.inputValue();
  await page.getByRole('button',{name:'3D 보기',exact:true}).click();await page.getByRole('button',{name:'위에서',exact:true}).click();await page.getByRole('button',{name:'3D 이동',exact:true}).click();
  const canvas=page.getByLabel('3D 방 보기').locator('canvas');
  for(const type of ['blur','pointercancel']) {
    const rect=await canvas.boundingBox();expect(rect).not.toBeNull();const cx=rect!.x+rect!.width/2,cy=rect!.y+rect!.height/2;
    await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+35,cy,{steps:5});
    await page.evaluate(type=>window.dispatchEvent(type==='blur'?new Event('blur'):new PointerEvent('pointercancel')),type);
    await page.mouse.up();await expect(x).toHaveValue(initial);
  }
  await page.getByRole('button',{name:'실행 취소'}).click();
  await expect(page.getByLabel('가구 이름')).toHaveCount(0);
});

test('3D drag cannot commit after project replacement', async ({page}) => {
  await page.goto('/');await page.getByRole('button',{name:/책상 1200/}).click();
  await page.getByRole('button',{name:'3D 보기',exact:true}).click();await page.getByRole('button',{name:'위에서',exact:true}).click();await page.getByRole('button',{name:'3D 이동',exact:true}).click();
  const rect=await page.getByLabel('3D 방 보기').locator('canvas').boundingBox();expect(rect).not.toBeNull();const cx=rect!.x+rect!.width/2,cy=rect!.y+rect!.height/2;
  await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+35,cy,{steps:5});
  await page.getByRole('button',{name:'새 프로젝트'}).evaluate((button:HTMLElement)=>button.click());
  page.once('dialog',d=>d.accept());
  await page.getByRole('dialog').getByRole('button',{name:'만들기'}).evaluate((button:HTMLElement)=>button.click());
  await expect(page.getByLabel('가구 이름')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.getByRole('button',{name:'실행 취소'})).toBeDisabled();
});
