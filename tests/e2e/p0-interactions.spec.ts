import { type Page } from "./fixtures";
import { test, expect } from "./fixtures";

async function setup(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /책상 1200/ }).click();
  const area = page.getByLabel("2D 편집 영역");
  await expect
    .poll(async () =>
      [
        await area.getAttribute("data-pan-x"),
        await area.getAttribute("data-pan-y"),
      ].some((n) => Number(n) !== 50),
    )
    .toBe(true);
  const box = (await area.boundingBox())!;
  const zoom = Number(await area.getAttribute("data-zoom"));
  const px = Number(await area.getAttribute("data-pan-x"));
  const py = Number(await area.getAttribute("data-pan-y"));
  const x = Number(await page.getByLabel("위치 X (mm)").inputValue());
  const y = Number(await page.getByLabel("위치 Y (mm)").inputValue());
  return { area, box, zoom, px, py, x, y };
}

test("Space drag over furniture pans without moving it", async ({ page }) => {
  const { area, box, zoom, px, py, x, y } = await setup(page);
  await area.focus();
  await page.keyboard.down("Space");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + x * zoom + 70,
    box.y + py + y * zoom + 30,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.keyboard.up("Space");
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(x));
  await expect
    .poll(async () => Number(await area.getAttribute("data-pan-x")))
    .toBeCloseTo(px + 70, 0);
});

test("Shift horizontal drag preserves an off-grid Y after snapping", async ({
  page,
}) => {
  const { area, box, zoom, px, py, x } = await setup(page);
  const yInput = page.getByLabel("위치 Y (mm)");
  await yInput.fill("1755");
  await yInput.press("Enter");
  await area.focus();
  await page.keyboard.down("Shift");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + 1755 * zoom);
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + (x + 300) * zoom,
    box.y + py + 1775 * zoom,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await expect(yInput).toHaveValue("1755");
});

test("Escape deselects furniture when idle", async ({ page }) => {
  const { area } = await setup(page);
  await area.focus();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "책상", exact: true }),
  ).toHaveCount(0);
});

test("Shift 2 fits the selected furniture", async ({ page }) => {
  const { area } = await setup(page);
  const before = Number(await area.getAttribute("data-zoom"));
  await area.focus();
  await page.keyboard.press("Shift+2");
  await expect
    .poll(async () => Number(await area.getAttribute("data-zoom")))
    .toBeGreaterThan(before);
});

test("Alt exposes clearance for selected furniture while hovering a wall", async ({
  page,
}) => {
  const { area, box, zoom, px, py } = await setup(page);
  await area.focus();
  await page.keyboard.down("Alt");
  await page.mouse.move(box.x + px + 1000 * zoom, box.y + py);
  await expect(page.getByRole("status", { name: "거리 측정" })).toContainText(
    "책상",
  );
  await page.keyboard.up("Alt");
  await expect(page.getByRole("status", { name: "거리 측정" })).toHaveCount(0);
});

test("middle drag on a furniture resize handle pans without changing the furniture", async ({
  page,
}) => {
  const { area, box, zoom, px, py, x, y } = await setup(page);
  const width = await page.getByLabel("가로 W (mm)").inputValue();
  const depth = await page.getByLabel("깊이 D (mm)").inputValue();
  await page.mouse.move(
    box.x + px + (x + Number(width) / 2) * zoom,
    box.y + py + (y + Number(depth) / 2) * zoom,
  );
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(
    box.x + px + (x + Number(width) / 2) * zoom + 55,
    box.y + py + (y + Number(depth) / 2) * zoom + 20,
    { steps: 5 },
  );
  await page.mouse.up({ button: "middle" });
  await expect(page.getByLabel("가로 W (mm)")).toHaveValue(width);
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(x));
  await expect
    .poll(async () => Number(await area.getAttribute("data-pan-x")))
    .toBeCloseTo(px + 55, 0);
});

test("Escape cancels a furniture drag before deselecting", async ({ page }) => {
  const { area, box, zoom, px, py, x, y } = await setup(page);
  await area.focus();
  await page.mouse.move(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.mouse.down();
  await page.mouse.move(box.x + px + (x + 200) * zoom, box.y + py + y * zoom, {
    steps: 5,
  });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(x));
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("위치 X (mm)")).toHaveCount(0);
});

test("a constrained drag creates one undo step", async ({ page }) => {
  const { area, box, zoom, px, py, x, y } = await setup(page);
  await area.focus();
  await page.keyboard.down("Shift");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + y * zoom);
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + (x + 300) * zoom,
    box.y + py + (y + 10) * zoom,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(x + 300));
  await page.keyboard.press("Control+z");
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(x));
});

test("Space on an input does not activate canvas panning", async ({ page }) => {
  const { area, px } = await setup(page);
  const search = page.getByLabel("가구 검색");
  await search.fill("");
  await search.focus();
  await page.keyboard.press("Space");
  await expect(search).toHaveValue(" ");
  expect(Number(await area.getAttribute("data-pan-x"))).toBe(px);
});

test("Shift keeps a half-millimetre axis with rotated odd furniture", async ({
  page,
}) => {
  const { area, box, zoom, px, py, x } = await setup(page);
  await page.getByLabel("가로 W (mm)").fill("1201");
  await page.getByLabel("가로 W (mm)").press("Enter");
  await page.getByRole("button", { name: "90° 회전" }).click();
  const yInput = page.getByLabel("위치 Y (mm)");
  await yInput.fill("1755.5");
  await yInput.press("Enter");
  await area.focus();
  await page.keyboard.down("Shift");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + 1755.5 * zoom);
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + (x + 300) * zoom,
    box.y + py + 1765.5 * zoom,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await expect(yInput).toHaveValue("1755.5");
  await expect(page.getByLabel("위치 X (mm)")).not.toHaveValue(String(x));
});

test("Shift keeps the frozen axis with snapping disabled", async ({ page }) => {
  const { area, box, zoom, px, py, x } = await setup(page);
  await area.focus();
  await page.keyboard.press("Escape");
  await page.getByLabel("스냅", { exact: true }).uncheck();
  await page.getByRole("button", { name: "책상 선택" }).click();
  const yInput = page.getByLabel("위치 Y (mm)");
  await yInput.fill("1755.5");
  await yInput.press("Enter");
  await area.focus();
  await page.keyboard.down("Shift");
  await page.mouse.move(box.x + px + x * zoom, box.y + py + 1755.5 * zoom);
  await page.mouse.down();
  await page.mouse.move(
    box.x + px + (x + 300) * zoom,
    box.y + py + 1765.5 * zoom,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await expect(yInput).toHaveValue("1755.5");
  await expect(page.getByLabel("위치 X (mm)")).not.toHaveValue(String(x));
});

test("changing tools during a pan cannot leave furniture draggable", async ({ page }) => {
  const { area, box, zoom, px, py, x, y } = await setup(page);
  await area.focus(); await page.keyboard.down("Space");
  await page.mouse.move(box.x+px+x*zoom,box.y+py+y*zoom); await page.mouse.down();
  await page.mouse.move(box.x+px+x*zoom+30,box.y+py+y*zoom+10,{steps:3});
  await page.keyboard.press("KeyW"); await page.mouse.up(); await page.keyboard.up("Space");
  await expect(page.getByRole("button",{name:"벽 이동",exact:true})).toHaveAttribute("aria-pressed","true");
  const nextPx=Number(await area.getAttribute("data-pan-x")),nextPy=Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x+nextPx+x*zoom,box.y+nextPy+y*zoom); await page.mouse.down();
  await page.mouse.move(box.x+nextPx+(x+300)*zoom,box.y+nextPy+y*zoom,{steps:5}); await page.mouse.up();
  await expect(page.getByLabel("위치 X (mm)")).toHaveValue(String(x));
});
