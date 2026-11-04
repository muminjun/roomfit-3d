import { test,expect } from "./fixtures";
test("column is locked by default and can be deliberately unlocked and undone",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/사각 기둥 450/}).click();
 await expect(page.getByLabel("높이 H (mm)")).toHaveValue("2400");
 const area=page.getByLabel("2D 편집 영역");
 const x=await page.getByLabel("위치 X (mm)").inputValue();
 await area.focus();await page.keyboard.press("ArrowRight");
 await expect(page.getByLabel("위치 X (mm)")).toHaveValue(x);
 await expect(page.getByText(/잠긴 가구/).first()).toBeVisible();
 await page.getByRole("button",{name:"잠금 해제",exact:true}).click();
 await area.focus();await page.keyboard.press("ArrowRight");
 await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(Number(x)+100));
 await page.keyboard.press("Control+z");
 await expect(page.getByLabel("위치 X (mm)")).toHaveValue(x);
});
test("front clearance is derived and settings do not create an undo step",async({page})=>{
 await page.goto("/");
 const threshold=page.getByLabel("사용 여유 기준 (mm)");
 await threshold.fill("3001");await threshold.press("Enter");
 await expect(threshold).toHaveAttribute("aria-invalid","true");
 await threshold.fill("600");await threshold.press("Enter");
 await expect(page.getByRole("button",{name:"실행 취소",exact:true})).toBeDisabled();
 await page.getByRole("button",{name:/책상 1200/}).click();
 const y=page.getByLabel("위치 Y (mm)");await y.fill("700");await y.press("Enter");
 await expect(page.getByLabel("사용 여유 검사")).toContainText("책상: 앞면 400 mm / 기준 600 mm");
 await page.getByRole("button",{name:"실행 취소",exact:true}).click();
 await expect(threshold).toHaveValue("600");
 await expect(page.getByLabel("사용 여유 검사")).toContainText("여유 경고 0개");
});
test("column drag uses the same current room height as click add",async({page})=>{
 await page.goto("/");
 const height=page.getByLabel("벽 높이 (mm)");await height.fill("2200");await height.press("Enter");
 const area=page.getByLabel("2D 편집 영역"),box=(await area.boundingBox())!;
 const zoom=Number(await area.getAttribute("data-zoom")),px=Number(await area.getAttribute("data-pan-x")),py=Number(await area.getAttribute("data-pan-y"));
 await page.getByRole("button",{name:/원형 기둥 450/}).dragTo(area,{targetPosition:{x:Math.round(px+2100*zoom),y:Math.round(py+1700*zoom)}});
 await expect(page.getByLabel("높이 H (mm)")).toHaveValue("2200");
 expect(box.width).toBeGreaterThan(200);
});
