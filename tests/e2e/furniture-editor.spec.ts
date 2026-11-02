import { test, expect } from "@playwright/test";
test("카탈로그에서 가구를 추가하고 회전과 실행 취소를 할 수 있다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /퀸 침대/ }).click();
  await expect(page.getByRole("heading", { name: "퀸 침대" })).toBeVisible();
  await page.getByRole("button", { name: "90° 회전" }).click();
  await expect(page.getByText("2000 × 1500 mm")).toBeVisible();
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.getByText("1500 × 2000 mm")).toBeVisible();
});
test("카탈로그 검색과 분류, 중복 추가와 삭제가 동작한다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("가구 검색").fill("책상");
  await expect(page.getByRole("button", { name: /책상 1200/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /퀸 침대/ })).toHaveCount(0);
  await page.getByRole("button", { name: /책상 1200/ }).click();
  await page.getByRole("button", { name: "복제", exact: true }).click();
  await expect(page.getByRole("button", { name: "책상 선택" })).toHaveCount(2);
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(page.getByRole("button", { name: "책상 선택" })).toHaveCount(1);
});
test("확대된 캔버스에 실제 DOM 드롭으로 가구를 추가한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "확대", exact: true }).click();
  await page
    .getByRole("button", { name: /싱글 침대 1000/ })
    .dragTo(page.getByLabel("2D 편집 영역"));
  await expect(
    page.getByRole("heading", { name: "싱글 침대", exact: true }),
  ).toBeVisible();
});
test("단축키 이동은 입력 필드에서 실행되지 않는다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /퀸 침대/ }).click();
  const x = page.getByLabel("위치 X (mm)");
  const initial = await x.inputValue();
  await x.focus();
  await page.keyboard.press("ArrowRight");
  await expect(x).toHaveValue(initial);
  await page.getByLabel("2D 편집 영역").focus();
  await page.keyboard.press("ArrowRight");
  await expect(x).toHaveValue(String(Number(initial) + 100));
});
test("가구를 드래그하고 모서리 핸들로 크기를 바꾼다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const area = page.getByLabel("2D 편집 영역"),
    box = await area.boundingBox();
  if (!box) throw new Error("canvas missing");
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue()),
    y = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  await page.mouse.move(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.mouse.down();
  await page.mouse.move(box.x + px + (x + 200) * zoom, box.y + py + y * zoom, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(x + 200));
  const moved = x + 200;
  await page.mouse.move(
    box.x + px + (moved + 600) * zoom,
    box.y + py + (y + 300) * zoom,
  );
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + (moved + 800) * zoom,
    box.y + py + (y + 400) * zoom,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(page.getByLabel("가로 W (mm)")).toHaveValue("1400");
  await expect(page.getByLabel("깊이 D (mm)")).toHaveValue("700");
});
test("겹치는 위치로 드롭하면 가구가 추가되지 않는다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  await page
    .getByRole("button", { name: /책상 1200/ })
    .dragTo(page.getByLabel("2D 편집 영역"));
  await expect(page.getByRole("button", { name: "책상 선택" })).toHaveCount(1);
});
test("홀수 가구 너비와 반 밀리미터 중심을 정확히 입력할 수 있다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /싱글 침대 1000/ }).click();
  const width = page.getByLabel("가로 W (mm)");
  await width.fill("1001");
  await width.press("Enter");
  await expect(width).toHaveValue("1001");
  const x = page.getByLabel("위치 X (mm)");
  await x.fill("2100.5");
  await x.press("Enter");
  await expect(x).toHaveValue("2100.5");
});
test("방 축소로 생긴 경고 가구를 다시 방 안으로 옮겨 복구한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const x = page.getByLabel("위치 X (mm)");
  await x.fill("2950");
  await x.press("Enter");
  await page.getByRole("button", { name: "벽 이동", exact: true }).click();
  const area = page.getByLabel("2D 편집 영역"),
    box = await area.boundingBox();
  if (!box) throw new Error("canvas missing");
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.click(box.x + px + 4200 * zoom, box.y + py + 1000 * zoom);
  await page.getByLabel("벽 이동 거리 (mm)").fill("-1200");
  await page.getByRole("button", { name: "벽 이동 적용" }).click();
  await page.getByRole("button", { name: "책상 선택" }).click();
  await expect(page.getByRole("alert")).toContainText("배치 경고");
  await page.getByLabel("위치 X (mm)").fill("2200");
  await page.getByLabel("위치 X (mm)").press("Enter");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("Alt 드래그는 원본을 보존하며 복제하고 한 번에 되돌린다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const area = page.getByLabel("2D 편집 영역"),
    box = await area.boundingBox();
  if (!box) throw new Error("canvas missing");
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue()),
    y = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  await page.keyboard.down("Alt");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.mouse.down();
  await page.mouse.move(box.x + px + (x + 1400) * zoom, box.y + py + y * zoom, {
    steps: 8,
  });
  await page.mouse.up();
  await page.keyboard.up("Alt");
  await expect(page.getByRole("button", { name: "책상 선택" })).toHaveCount(2);
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.getByRole("button", { name: "책상 선택" })).toHaveCount(1);
});
test("연속 방향키는 한 번에 되돌리고 조합 입력 중 단축키는 무시한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const x = page.getByLabel("위치 X (mm)"),
    initial = Number(await x.inputValue());
  const area = page.getByLabel("2D 편집 영역");
  await area.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(x).toHaveValue(String(initial + 200));
  await page.keyboard.press("Control+z");
  await expect(x).toHaveValue(String(initial));
  await area.dispatchEvent("keydown", {
    code: "KeyR",
    key: "r",
    isComposing: true,
    bubbles: true,
  });
  await expect(page.getByText("1200 × 600 mm", { exact: true })).toBeVisible();
});
test("카탈로그 드래그 중 Escape는 취소되고 다음 드래그는 성공한다", async ({
  page,
}) => {
  await page.goto("/");
  const source = page.getByRole("button", { name: /싱글 침대 1000/ });
  await source.scrollIntoViewIfNeeded();
  const s = await source.boundingBox(),
    area = page.getByLabel("2D 편집 영역"),
    a = await area.boundingBox();
  if (!s || !a) throw new Error("missing drag elements");
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2, { steps: 10 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "싱글 침대 선택" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "실행 취소" })).toBeDisabled();
  await source.dragTo(area);
  await expect(
    page.getByRole("heading", { name: "싱글 침대", exact: true }),
  ).toBeVisible();
});
test("90도 회전한 가구의 모서리 크기 조절은 로컬 W와 D를 유지한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  await page.getByRole("button", { name: "90° 회전" }).click();
  const area = page.getByLabel("2D 편집 영역"),
    box = await area.boundingBox();
  if (!box) throw new Error("canvas missing");
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue()),
    y = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  await page.mouse.move(
    box.x + px + (x + 300) * zoom,
    box.y + py + (y + 600) * zoom,
  );
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + (x + 500) * zoom,
    box.y + py + (y + 700) * zoom,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(page.getByLabel("가로 W (mm)")).toHaveValue("1300");
  await expect(page.getByLabel("깊이 D (mm)")).toHaveValue("800");
});
