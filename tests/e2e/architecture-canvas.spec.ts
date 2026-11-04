import { test, expect } from "./fixtures";
import { createProject } from "../../src/features/project/createProject";
const fixture = () => {
  const p = createProject();
  const edge = p.room.polygon[0].id;
  p.room.zones = [
    {
      id: "zone",
      name: "구역 A",
      kind: "living",
      x: 400,
      y: 400,
      widthMm: 800,
      depthMm: 600,
    },
  ];
  p.room.partitions = [
    {
      id: "part",
      name: "칸막이 A",
      start: { x: 1500, y: 800 },
      end: { x: 3000, y: 800 },
      thicknessMm: 100,
      heightMm: 2400,
    },
  ];
  p.room.openings = [
    {
      id: "open",
      name: "창문 A",
      kind: "window",
      hostId: edge,
      offsetMm: 2200,
      widthMm: 700,
      heightMm: 1000,
      sillMm: 900,
      hinge: "start",
      swing: "inward",
    },
  ];
  return p;
};
test("canvas drag moves a zone with one undo", async ({ page }) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 800 * z, box.y + py + 700 * z);
  await page.mouse.down();
  await page.mouse.move(box.x + px + 1000 * z, box.y + py + 700 * z, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.getByLabel("구역 X (mm)")).toHaveValue("600");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(page.getByLabel("구역 X (mm)")).toHaveValue("400");
});
test("changing a window draft to a door resets the sill", async ({ page }) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  await page.getByText("문·창문·구역", { exact: true }).click();
  await page.getByRole("button", { name: "창문 A 편집" }).click();
  await page.getByLabel("개구부 종류").selectOption("door");
  await expect(page.getByLabel("개구부 하단 높이 (mm)")).toHaveValue("0");
});

test("opening moves along its host and supports undo", async ({ page }) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 2500 * z, box.y + py);
  await page.mouse.down();
  await page.mouse.move(box.x + px + 2700 * z, box.y + py, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByLabel("개구부 시작 위치 (mm)")).toHaveValue("2400");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(page.getByLabel("개구부 시작 위치 (mm)")).toHaveValue("2200");
});

test("partition drag is cancelled by Escape without a history entry", async ({
  page,
}) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 2200 * z, box.y + py + 800 * z);
  await page.mouse.down();
  await page.mouse.move(box.x + px + 2200 * z, box.y + py + 1000 * z, {
    steps: 8,
  });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(page.getByLabel("칸막이 시작 Y (mm)")).toHaveValue("800");
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
});

test("middle pan starting on a zone leaves the project and history unchanged", async ({
  page,
}) => {
  const project = fixture();
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    project,
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 800 * z, box.y + py + 700 * z);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(box.x + px + 800 * z + 50, box.y + py + 700 * z + 20, {
    steps: 5,
  });
  await page.mouse.up({ button: "middle" });
  await expect
    .poll(async () => Number(await area.getAttribute("data-pan-x")))
    .toBeCloseTo(px + 50, 0);
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("roomfit3d:v2:/:autosave")!),
  );
  expect(saved.room.zones[0].x).toBe(400);
});

test("invalid zone drop keeps the committed coordinates and history", async ({
  page,
}) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 800 * z, box.y + py + 700 * z);
  await page.mouse.down();
  await page.mouse.move(box.x + px + 100 * z, box.y + py + 700 * z, {
    steps: 8,
  });
  await expect(area).toHaveAttribute(
    "data-architecture-preview-valid",
    "false",
  );
  await page.mouse.up();
  await expect(page.getByLabel("구역 X (mm)")).toHaveValue("400");
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
});

test("partition movement updates numeric fields and undoes once", async ({
  page,
}) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 2200 * z, box.y + py + 800 * z);
  await page.mouse.down();
  await page.mouse.move(box.x + px + 2200 * z, box.y + py + 1000 * z, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.getByLabel("칸막이 시작 Y (mm)")).toHaveValue("1000");
  await expect(page.getByLabel("칸막이 끝 Y (mm)")).toHaveValue("1000");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(page.getByLabel("칸막이 시작 Y (mm)")).toHaveValue("800");
});

test("pointer cancellation discards a zone preview", async ({ page }) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 800 * z, box.y + py + 700 * z);
  await page.mouse.down();
  await page.mouse.move(box.x + px + 1000 * z, box.y + py + 700 * z, {
    steps: 8,
  });
  await area.dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(page.getByLabel("구역 X (mm)")).toHaveValue("400");
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
});

test("deleting a selected zone clears its stale edit form", async ({
  page,
}) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.click(box.x + px + 800 * z, box.y + py + 700 * z);
  await expect(page.getByLabel("구역 X (mm)")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "구역 A 삭제" }).click();
  await expect(page.getByLabel("구역 X (mm)")).toHaveCount(0);
});

test("unrelated room changes do not overwrite another architecture draft", async ({
  page,
}) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.click(box.x + px + 800 * z, box.y + py + 700 * z);
  await page.getByRole("button", { name: "새 창문" }).click();
  await page.getByLabel("개구부 이름").fill("저장 전 창문");
  await page.getByLabel("벽 높이 (mm)").fill("2300");
  await page.getByLabel("벽 높이 (mm)").press("Enter");
  await expect(page.getByLabel("개구부 이름")).toHaveValue("저장 전 창문");
});

test("tiny movement on an off-grid opening never commits a snap", async ({
  page,
}) => {
  const p = fixture();
  p.room.openings![0].offsetMm = 2203;
  await page.addInitScript(
    (project) =>
      localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(project)),
    p,
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  const x = box.x + px + 2500 * z,
    y = box.y + py;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 1, y);
  await page.mouse.up();
  await expect(page.getByLabel("개구부 시작 위치 (mm)")).toHaveValue("2203");
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
});

test("right-button gesture cannot move an architectural element", async ({
  page,
}) => {
  await page.addInitScript(
    (p) => localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(p)),
    fixture(),
  );
  await page.goto("/");
  const area = page.getByLabel("2D 편집 영역");
  await page.getByRole("button", { name: "구조 편집", exact: true }).click();
  const box = (await area.boundingBox())!,
    z = Number(await area.getAttribute("data-zoom")),
    px = Number(await area.getAttribute("data-pan-x")),
    py = Number(await area.getAttribute("data-pan-y"));
  await page.mouse.move(box.x + px + 800 * z, box.y + py + 700 * z);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(box.x + px + 1000 * z, box.y + py + 700 * z, {
    steps: 8,
  });
  await page.mouse.up({ button: "right" });
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("roomfit3d:v2:/:autosave")!),
  );
  expect(saved.room.zones[0].x).toBe(400);
});
