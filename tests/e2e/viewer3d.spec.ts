import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function exportedProject(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON 내보내기" }).click();
  const path = await (await download).path();
  return JSON.parse(await readFile(path, "utf8"));
}

test("3D 실제 캔버스와 카메라 조작을 거쳐도 프로젝트가 유지된다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /퀸 침대/ }).click();
  const before = await exportedProject(page);
  await page.getByRole("button", { name: "3D 보기", exact: true }).click();
  const canvas = page.getByLabel("3D 방 보기").locator("canvas");
  await expect(canvas).toBeVisible();
  await expect(
    page.getByText("방과 가구는 2D에서 편집할 수 있습니다."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /퀸 침대 1500/ })).toHaveCount(
    0,
  );
  const box = await canvas.boundingBox();
  if (!box) throw new Error("3D 캔버스를 찾을 수 없습니다");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 80,
    box.y + box.height / 2 + 30,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.getByRole("button", { name: "전체 보기", exact: true }).click();
  await page.getByRole("button", { name: "카메라 초기화" }).click();
  expect(await exportedProject(page)).toEqual(before);
  await page.getByRole("button", { name: "2D에서 편집" }).click();
  await expect(page.getByLabel("2D 편집 영역")).toBeVisible();
  expect(await exportedProject(page)).toEqual(before);
});

test("WebGL이 없으면 복구 안내와 2D 편집을 제공한다", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      ...args: Parameters<typeof original>
    ) {
      if (
        args[0] === "webgl" ||
        args[0] === "webgl2" ||
        args[0] === "experimental-webgl"
      )
        return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "3D 보기", exact: true }).click();
  await expect(
    page.getByText(
      "현재 브라우저에서는 3D 보기를 사용할 수 없습니다. 2D 편집은 계속 사용할 수 있습니다.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await page.getByRole("button", { name: "2D에서 편집" }).click();
  await expect(page.getByLabel("2D 편집 영역")).toBeVisible();
});

test("WebGL 연결이 끊기면 재시도 안내를 표시한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "3D 보기", exact: true }).click();
  const canvas = page.getByLabel("3D 방 보기").locator("canvas");
  await expect(canvas).toBeVisible();
  await canvas.dispatchEvent("webglcontextlost", { cancelable: true });
  await expect(
    page.getByText("3D 연결이 끊겼습니다. 다시 시도해 주세요."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
});
test("Alt 단축키로 보기 전환해도 확정한 방과 가구가 유지된다", async ({
  page,
}) => {
  await page.goto("/");
  const roomWidth = page.getByLabel("전체 가로 (mm)");
  await roomWidth.fill("3800");
  await roomWidth.press("Enter");
  await page.getByRole("button", { name: /퀸 침대/ }).click();
  const before = await exportedProject(page);
  await page.getByLabel("2D 편집 영역").focus();
  await page.keyboard.press("Alt+2");
  await expect(page.getByLabel("3D 방 보기").locator("canvas")).toBeVisible();
  expect(await exportedProject(page)).toEqual(before);
  await page.keyboard.press("Alt+1");
  await expect(page.getByLabel("2D 편집 영역")).toBeVisible();
  expect(await exportedProject(page)).toEqual(before);
});
test("3D 화면은 같은 프로젝트의 가구 실행 취소를 반영한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /퀸 침대/ }).click();
  await page.getByRole("button", { name: "3D 보기", exact: true }).click();
  const canvas = page.getByLabel("3D 방 보기").locator("canvas");
  await expect(canvas).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const withFurniture = await canvas.screenshot();
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(withFurniture))
    .toBe(false);
  const project = await exportedProject(page);
  expect(project.furniture).toHaveLength(0);
});
