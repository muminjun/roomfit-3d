import { test, expect } from "./fixtures";
test("벽 수치 변경과 되돌리기에서 실제 방 면적이 바뀐다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "벽 1 선택" }).click();
  await page.getByLabel("벽 이동 거리 (mm)").fill("200");
  await page.getByRole("button", { name: "벽 이동 적용" }).click();
  await expect(page.getByText("15.12 ㎡")).toBeVisible();
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.getByText("14.28 ㎡")).toBeVisible();
});
test("벽을 바깥으로 끌어 한 번 적용하고 되돌린다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "벽 이동", exact: true }).click();
  const box = await page.getByLabel("2D 편집 영역").boundingBox();
  if (!box) throw new Error("canvas missing");
  const zoom = Math.min((box.width - 100) / 4200, (box.height - 100) / 3400);
  const x = box.x + box.width / 2,
    y = box.y + (box.height - 3400 * zoom) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 200 * zoom, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByText("15.12 ㎡")).toBeVisible();
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.getByText("14.28 ㎡")).toBeVisible();
});
test("예제와 함몰 수치가 실제 면적에 반영된다", async ({ page }) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "ㄱ자", exact: true }).click();
  await expect(page.getByText("12.36 ㎡")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "직사각형", exact: true }).click();
  await page.getByRole("button", { name: "벽 1 선택" }).click();
  await page.getByRole("button", { name: "함몰 적용" }).click();
  await expect(page.getByText("13.88 ㎡")).toBeVisible();
});
test("캔버스에서 폭과 깊이를 지정해 함몰한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "함몰 만들기" }).click();
  const box = await page.getByLabel("2D 편집 영역").boundingBox();
  if (!box) throw new Error("canvas missing");
  const zoom = Math.min((box.width - 100) / 4200, (box.height - 100) / 3400),
    left = box.x + (box.width - 4200 * zoom) / 2,
    top = box.y + (box.height - 3400 * zoom) / 2;
  await page.mouse.move(left + 1700 * zoom, top);
  await page.mouse.down();
  await page.mouse.move(left + 2500 * zoom, top, { steps: 5 });
  await page.mouse.up();
  await page.mouse.move(left + 2500 * zoom, top + 500 * zoom, { steps: 5 });
  await expect(page.getByText("800 × 500 mm")).toContainText("800 × 500 mm");
  await page.mouse.click(left + 2500 * zoom, top + 500 * zoom);
  await expect(page.getByText("13.88 ㎡")).toBeVisible();
});
test("잘못된 함몰은 방과 되돌리기 이력을 바꾸지 않는다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "벽 1 선택" }).click();
  await page.getByLabel("시작 위치 (mm)").fill("99");
  await page.getByRole("button", { name: "함몰 적용" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("14.28 ㎡")).toBeVisible();
  await expect(page.getByRole("button", { name: "실행 취소" })).toBeDisabled();
});
test("ㄷ자와 돌출 예제는 지정된 면적을 가진다", async ({ page }) => {
  await page.goto("/");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "ㄷ자", exact: true }).click();
  await expect(page.getByText("13.08 ㎡")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "돌출 방", exact: true }).click();
  await expect(page.getByText("14.88 ㎡")).toBeVisible();
});
test("함몰 안쪽 벽 이동으로 홈을 합치고 무효 이동을 거절한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "벽 1 선택" }).click();
  await page.getByRole("button", { name: "함몰 적용" }).click();
  await page.getByRole("button", { name: "벽 3 선택" }).click();
  await page.getByLabel("벽 이동 거리 (mm)").fill("450");
  await page.getByRole("button", { name: "벽 이동 적용" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("13.88 ㎡")).toBeVisible();
  await page.getByLabel("벽 이동 거리 (mm)").fill("500");
  await page.getByRole("button", { name: "벽 이동 적용" }).click();
  await expect(page.getByText("14.28 ㎡")).toBeVisible();
});
test("미리보기 취소와 휠 방식 변경은 방을 수정하지 않는다", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "함몰 만들기" }).click();
  const box = await area.boundingBox();
  if (!box) throw new Error("canvas missing");
  const zoom = Math.min((box.width - 100) / 4200, (box.height - 100) / 3400),
    left = box.x + (box.width - 4200 * zoom) / 2,
    top = box.y + (box.height - 3400 * zoom) / 2;
  await page.mouse.move(left + 1700 * zoom, top);
  await page.mouse.down();
  await page.mouse.move(left + 2500 * zoom, top);
  await page.mouse.up();
  await page.mouse.move(left + 2500 * zoom, top + 500 * zoom);
  await expect(page.getByText("800 × 500 mm")).toContainText("800 × 500 mm");
  await page.keyboard.press("Escape");
  await expect(page.getByText("14.28 ㎡")).toBeVisible();
  await expect(page.getByRole("button", { name: "실행 취소" })).toBeDisabled();
  await page.getByRole("button", { name: "휠 = 줌" }).click();
  await expect(page.getByRole("button", { name: "Figma 방식" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Figma 방식" })).toBeVisible();
});
test("확대와 팬 후에도 벽 드래그는 모델 밀리미터로 적용된다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "벽 이동", exact: true }).click();
  await page.getByLabel("격자 간격").selectOption("50");
  const area = page.getByLabel("2D 편집 영역");
  const box = await area.boundingBox();
  if (!box) throw new Error("canvas missing");
  await page.getByRole("button", { name: "확대", exact: true }).click();
  await area.dispatchEvent("wheel", {
    deltaY: 80,
    shiftKey: true,
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2,
  });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const panX = Number(await area.getAttribute("data-pan-x")),
    panY = Number(await area.getAttribute("data-pan-y"));
  const currentZoom = Number(await area.getAttribute("data-zoom"));
  const x = box.x + panX + 4200 * currentZoom,
    y = box.y + panY + 1700 * currentZoom;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 150 * currentZoom, y, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByText("14.79 ㎡")).toBeVisible();
});
