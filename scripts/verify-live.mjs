import { chromium, firefox, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

// Each browser uses a new isolated context; this never touches the user's browser storage.
const url = process.argv[2] ?? "https://muminjun.github.io/roomfit-3d/";
const results = [];
for (const [name, engine] of [["chromium", chromium], ["firefox", firefox]]) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [], assets = new Set();
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
      if (new URL(response.url()).origin !== new URL(url).origin) return;
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      if (["script", "stylesheet", "image"].includes(response.request().resourceType())) assets.add(new URL(response.url()).pathname);
    });
    assert.equal((await page.goto(url)).status(), 200);
    await page.getByRole("button", { name: "방 새로 만들기", exact: true }).click();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("dialog").getByRole("button", { name: "만들기", exact: true }).click();
    await page.getByRole("button", { name: /책상 1200/ }).click();
    const area = page.getByLabel("2D 편집 영역");
    await expect.poll(async () => Number(await area.getAttribute("data-pan-x"))).not.toBe(50);
    const point = async (x, y) => {
      const box = await area.boundingBox(), zoom = Number(await area.getAttribute("data-zoom"));
      return { x: box.x + Number(await area.getAttribute("data-pan-x")) + x * zoom, y: box.y + Number(await area.getAttribute("data-pan-y")) + y * zoom };
    };
    const x = page.getByLabel("위치 X (mm)"), y = page.getByLabel("위치 Y (mm)");
    const originalX = Number(await x.inputValue()), originalY = Number(await y.inputValue());
    await area.focus(); await page.keyboard.down("Space");
    let p = await point(originalX, originalY);
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 70, p.y + 30, { steps: 5 }); await page.mouse.up(); await page.keyboard.up("Space");
    await expect(x).toHaveValue(String(originalX)); await expect(y).toHaveValue(String(originalY));
    await y.fill("1755"); await y.press("Enter"); await area.focus(); await page.keyboard.down("Shift");
    p = await point(originalX, 1755); const end = await point(originalX + 300, 1775);
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(end.x, end.y, { steps: 5 }); await page.mouse.up(); await page.keyboard.up("Shift");
    await expect(y).toHaveValue("1755");
    await page.keyboard.press("Control+z"); await page.keyboard.press("Escape");
    await page.getByText("문·창문·구역", { exact: true }).click();
    await page.getByRole("button", { name: "새 창문", exact: true }).click();
    await page.getByRole("button", { name: "개구부 저장", exact: true }).click();
    await page.getByRole("button", { name: "새 구역", exact: true }).click();
    await page.getByLabel("구역 이름").fill("주방"); await page.getByLabel("구역 종류").selectOption("kitchen");
    await page.getByRole("button", { name: "구역 저장", exact: true }).click();
    await page.getByLabel("가구 검색").fill("양변기");
    await page.getByRole("button", { name: /양변기 380/ }).click();
    await page.getByRole("button", { name: "3D 보기", exact: true }).click();
    await expect(page.getByLabel("3D 방 보기").locator("canvas")).toBeVisible();
    await page.getByRole("button", { name: "2D에서 편집", exact: true }).click();
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "JSON 내보내기", exact: true }).click();
    const exported = JSON.parse(await readFile(await (await pending).path(), "utf8"));
    assert.equal(exported.furniture.length, 2); assert.equal(exported.room.openings.length, 1); assert.equal(exported.room.zones[0].kind, "kitchen");
    await page.waitForTimeout(650); await page.reload();
    await expect(page.getByRole("button", { name: "책상 선택", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "양변기 선택", exact: true })).toBeVisible();
    assert.deepEqual(errors, []);
    results.push({ browser: name, version: browser.version(), url, passed: true, checks: ["welcome/new", "Space pan furniture unchanged", "off-grid Shift axis", "Undo/Esc", "window/zone", "expanded fixture catalog", "real 3D", "JSON", "autosave/reload"], assets: [...assets].sort() });
    console.log(`${name}: live regression passed`);
  } finally { await browser.close(); }
}
if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + "\n");
