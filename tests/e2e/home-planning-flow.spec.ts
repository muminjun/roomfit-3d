import { test,expect } from "./fixtures";
test("a blocked rotation is retained with a visible warning and can be repaired or undone",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/퀸 침대 1500/}).click();
  const x=page.getByLabel("위치 X (mm)");
  await x.fill("750"); await x.press("Enter");
  await page.getByRole("button",{name:"90° 회전",exact:true}).click();
  await expect(page.getByRole("alert")).toContainText("가구가 방 바닥 밖 영역을 가로지릅니다.");
  await expect(page.getByText("2000 × 1500 mm",{exact:true})).toBeVisible();
  await expect(x).toHaveValue("750");
  await x.fill("1000"); await x.press("Enter");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button",{name:"실행 취소",exact:true}).click();
  await expect(page.getByRole("alert")).toContainText("가구가 방 바닥 밖 영역을 가로지릅니다.");
  await page.getByRole("button",{name:"실행 취소",exact:true}).click();
  await expect(page.getByText("1500 × 2000 mm",{exact:true})).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("opening allowance warns against a wall and clears when the allowance is reduced",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/세탁기 650/}).click();
  const allowance=page.getByLabel("여는 공간 여유 (mm)");
  await allowance.fill("2000"); await allowance.press("Enter");
  await expect(page.getByText("여는 공간에 장애물: 벽",{exact:true})).toBeVisible();
  await allowance.fill("100"); await allowance.press("Enter");
  await expect(page.getByText("여는 공간에 장애물이 없습니다.",{exact:true})).toBeVisible();
});
