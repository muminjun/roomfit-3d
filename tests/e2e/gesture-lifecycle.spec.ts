import { test, expect, type Page } from "./fixtures";

async function desk(page:Page) {
  await page.goto("/");
  await page.getByRole("button",{name:/책상 1200/}).click();
  const y=page.getByLabel("위치 Y (mm)");
  await y.fill("1755"); await y.press("Enter");
  const area=page.getByLabel("2D 편집 영역");
  await expect.poll(async()=>Number(await area.getAttribute("data-zoom"))).not.toBe(0.1);
  const box=(await area.boundingBox())!;
  const zoom=Number(await area.getAttribute("data-zoom"));
  const px=Number(await area.getAttribute("data-pan-x")),py=Number(await area.getAttribute("data-pan-y"));
  const point=(x:number,y:number)=>({x:box.x+px+x*zoom,y:box.y+py+y*zoom});
  await area.focus();
  return {area,point};
}
test("Undo during a drag cancels the stale candidate even when the project ID stays the same",async({page})=>{
  const {point}=await desk(page);
  const start=point(2100,1755),mid=point(2300,1755),end=point(2400,1755);
  await page.mouse.move(start.x,start.y); await page.mouse.down();
  await page.mouse.move(mid.x,mid.y,{steps:5});
  await page.keyboard.press("Control+z");
  await page.mouse.move(end.x,end.y,{steps:5}); await page.mouse.up();
  await expect(page.getByLabel("위치 Y (mm)")).toHaveValue("1700");
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue("2100");
  await page.keyboard.press("Control+z");
  await expect(page.getByRole("button",{name:"책상 선택"})).toHaveCount(0);
});

for (const cancellation of ["pointercancel","blur"] as const) {
  test(`${cancellation} cancels a furniture drag without adding history`,async({page})=>{
    const {area,point}=await desk(page);
    const start=point(2100,1755),end=point(2400,1755);
    await page.mouse.move(start.x,start.y); await page.mouse.down();
    await page.mouse.move(end.x,end.y,{steps:5});
    if(cancellation==="pointercancel") await area.dispatchEvent("pointercancel");
    else await page.evaluate(()=>window.dispatchEvent(new Event("blur")));
    await page.mouse.up();
    await expect(page.getByLabel("위치 X (mm)")).toHaveValue("2100");
    await expect(page.getByLabel("위치 Y (mm)")).toHaveValue("1755");
    await area.focus(); await page.keyboard.press("Control+z");
    await expect(page.getByLabel("위치 Y (mm)")).toHaveValue("1700");
  });
}
test("Space panning and a tiny click jitter do not schedule project changes",async({page})=>{
  const {area,point}=await desk(page);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("roomfit3d:v2:/:autosave") ?? "null")?.furniture?.[0]?.position.y)).toBe(1755);
  const before=await page.evaluate(()=>localStorage.getItem("roomfit3d:v2:/:autosave"));
  const p=point(2100,1755);
  await page.mouse.move(p.x,p.y); await page.mouse.down(); await page.mouse.move(p.x+1,p.y+1); await page.mouse.up();
  await area.focus(); await page.keyboard.down("Space");
  await page.mouse.move(p.x,p.y); await page.mouse.down(); await page.mouse.move(p.x+50,p.y+25,{steps:5}); await page.mouse.up(); await page.keyboard.up("Space");
  await page.waitForTimeout(650);
  expect(await page.evaluate(()=>localStorage.getItem("roomfit3d:v2:/:autosave"))).toBe(before);
  await area.focus(); await page.keyboard.press("Control+z");
  await expect(page.getByLabel("위치 Y (mm)")).toHaveValue("1700");
});
