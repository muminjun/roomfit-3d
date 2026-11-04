import { test, expect } from "./fixtures";
test("select all furniture and lock the selection without moving it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  await page.getByRole("button", { name: /협탁 450/ }).click();
  const area = page.getByLabel("2D 편집 영역");
  await area.focus();
  await page.keyboard.press("Control+a");
  await expect(page.getByText("가구 2개 선택")).toBeVisible();
  await page.getByRole("button", { name: "선택 잠금", exact: true }).click();
  await area.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/잠긴 가구/).first()).toBeVisible();
});

test("group nudge is atomic and can be undone once", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  await page.getByRole("button", { name: /협탁 450/ }).click();
  const y = page.getByLabel("위치 Y (mm)");
  const before = Number(await y.inputValue());
  const area = page.getByLabel("2D 편집 영역");
  await area.focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("ArrowDown");
  await expect(y).toHaveValue(String(before + 100));
  await page.keyboard.press("Control+z");
  await expect(y).toHaveValue(String(before));
});

test("two-point ruler shows distance without creating undo history", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await expect
    .poll(async () =>
      [
        await area.getAttribute("data-pan-x"),
        await area.getAttribute("data-pan-y"),
      ].some((n) => Number(n) !== 50),
    )
    .toBe(true);
  const box = (await area.boundingBox())!,
    zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await area.focus();
  await page.keyboard.press("m");
  await page.mouse.click(box.x + px + 500 * zoom, box.y + py + 500 * zoom);
  await page.mouse.click(box.x + px + 800 * zoom, box.y + py + 900 * zoom);
  await expect(page.getByLabel("두 점 실측 결과")).toContainText("거리 500 mm");
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
});

test("dragging a selected group moves it together and one undo restores it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const firstY = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  await page.getByRole("button", { name: /협탁 450/ }).click();
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue());
  const y = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  const area = page.getByLabel("2D 편집 영역");
  const box = (await area.boundingBox())!;
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await area.focus();
  await page.keyboard.press("Control+a");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.mouse.down();
  await page.mouse.move(box.x + px + x * zoom, box.y + py + (y + 100) * zoom, {
    steps: 8,
  });
  await page.mouse.up();
  const moved = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  expect(moved).not.toBe(y);
  await page.getByRole("button", { name: "책상 선택" }).click();
  await expect(page.getByLabel("위치 Y (mm)")).toHaveValue(
    String(firstY + moved - y),
  );
  await area.focus();
  await page.keyboard.press("Control+z");
  await expect(page.getByLabel("위치 Y (mm)")).toHaveValue(String(firstY));
});

test("Shift click toggles multiple furniture selections", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue()),
    y = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  await page.getByRole("button", { name: /협탁 450/ }).click();
  const area = page.getByLabel("2D 편집 영역"),
    box = (await area.boundingBox())!;
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.keyboard.down("Shift");
  await page.mouse.click(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.keyboard.up("Shift");
  await expect(page.getByText("가구 2개 선택")).toBeVisible();
});

test("Escape cancels a group drag without creating history", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  await page.getByRole("button", { name: /협탁 450/ }).click();
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue()),
    y = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  const area = page.getByLabel("2D 편집 영역"),
    box = (await area.boundingBox())!;
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await area.focus();
  await page.keyboard.press("Control+a");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.mouse.down();
  await page.mouse.move(box.x + px + x * zoom, box.y + py + (y + 200) * zoom, {
    steps: 8,
  });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(page.getByLabel("위치 Y (mm)")).toHaveValue(String(y));
  await page.keyboard.press("Control+z");
  await expect(page.getByRole("button", { name: "협탁 선택" })).toHaveCount(0);
});

test("keyboard copy and paste duplicates the selected group as one undo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  await page.getByRole("button", { name: /협탁 450/ }).click();
  const area = page.getByLabel("2D 편집 영역");
  await area.focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Control+c");
  await page.keyboard.press("Control+v");
  await expect(page.getByRole("button", { name: "책상 선택" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "협탁 선택" })).toHaveCount(2);
  await expect(page.getByText("가구 2개 선택")).toBeVisible();
  await page.keyboard.press("Control+z");
  await expect(page.getByRole("button", { name: "책상 선택" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "협탁 선택" })).toHaveCount(1);
});

test("Escape clears measurement without changing project history", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await expect
    .poll(async () =>
      [
        await area.getAttribute("data-pan-x"),
        await area.getAttribute("data-pan-y"),
      ].some((n) => Number(n) !== 50),
    )
    .toBe(true);
  const box = (await area.boundingBox())!,
    zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await area.focus();
  await page.keyboard.press("m");
  await page.mouse.click(box.x + px + 500 * zoom, box.y + py + 500 * zoom);
  await page.mouse.click(box.x + px + 800 * zoom, box.y + py + 900 * zoom);
  await expect(page.getByLabel("두 점 실측 결과")).toBeVisible();
  await area.focus();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("두 점 실측 결과")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
});

test("Shift group drag keeps the shared vertical axis fixed after snapping", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const firstY = await page.getByLabel("위치 Y (mm)").inputValue();
  await page.getByRole("button", { name: /협탁 450/ }).click();
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue()),
    y = await page.getByLabel("위치 Y (mm)").inputValue();
  const area = page.getByLabel("2D 편집 영역"),
    box = (await area.boundingBox())!;
  const zoom = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await area.focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.down("Shift");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + Number(y) * zoom);
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + (x + 300) * zoom,
    box.y + py + (Number(y) + 15) * zoom,
    { steps: 8 },
  );
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await expect(page.getByLabel("위치 Y (mm)")).toHaveValue(y);
  expect(Number(await page.getByLabel("위치 X (mm)").inputValue())).not.toBe(x);
  await page.getByRole("button", { name: "책상 선택" }).click();
  await expect(page.getByLabel("위치 Y (mm)")).toHaveValue(firstY);
});

test("large selection inventory keeps the editor usable and keyboard selections available", async ({
  page,
}) => {
  const { readFile } = await import("node:fs/promises");
  const fixture = JSON.parse(
    await readFile(
      new URL(
        "../fixtures/performance-30walls-50furniture.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await page.addInitScript(
    (project) =>
      localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(project)),
    fixture,
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "성능 의자 1 선택", exact: true })
    .click();
  const area = page.getByLabel("2D 편집 영역");
  const box = (await area.boundingBox())!;
  expect(box.height).toBeGreaterThan(200);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(720);
  await page.getByText("선택 목록", { exact: true }).click();
  await page.getByLabel("성능 의자 2", { exact: true }).check();
  await expect(page.getByText("가구 2개 선택")).toBeVisible();
});

test("panning between ruler points preserves world-space measurement", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await expect
    .poll(async () =>
      [
        await area.getAttribute("data-pan-x"),
        await area.getAttribute("data-pan-y"),
      ].some((n) => Number(n) !== 50),
    )
    .toBe(true);
  const box = (await area.boundingBox())!,
    zoom = Number(await area.getAttribute("data-zoom"));
  const px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await area.focus();
  await page.keyboard.press("m");
  await page.mouse.click(box.x + px + 500 * zoom, box.y + py + 500 * zoom);
  await page.mouse.move(box.x + px + 1200 * zoom, box.y + py + 1200 * zoom);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(
    box.x + px + 1200 * zoom + 35,
    box.y + py + 1200 * zoom + 20,
    { steps: 4 },
  );
  await page.mouse.up({ button: "middle" });
  await expect
    .poll(async () => Number(await area.getAttribute("data-pan-x")))
    .toBeCloseTo(px + 35, 0);
  const nextX = Number(await area.getAttribute("data-pan-x")),
    nextY = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.click(
    box.x + nextX + 800 * zoom,
    box.y + nextY + 900 * zoom,
  );
  await expect(page.getByLabel("두 점 실측 결과")).toContainText("거리 500 mm");
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
});
