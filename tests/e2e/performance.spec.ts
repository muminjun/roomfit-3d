import { expect, test } from "./fixtures";
import { readFile } from "node:fs/promises";

test("AC-36/82: 30벽 50가구에서 선택·편집·저장·3D 표시를 측정한다", async ({
  page,
  browserName,
}, testInfo) => {
  const fixture = JSON.parse(
    await readFile(
      new URL(
        "../fixtures/performance-30walls-50furniture.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await page.addInitScript((project) => {
    localStorage.setItem("roomfit3d:v2:/:autosave", JSON.stringify(project));
  }, fixture);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?measure=1");
  const startSelection = Date.now();
  await page
    .getByRole("button", { name: "성능 의자 1 선택", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "성능 의자 1", exact: true }),
  ).toBeVisible();
  const selectionMs = Date.now() - startSelection;
  const startEdit = Date.now();
  const width = page.getByLabel("가로 W (mm)");
  await width.fill("501");
  await width.press("Enter");
  await expect(width).toHaveValue("501");
  const editMs = Date.now() - startEdit;
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("roomfit3d:v2:/:autosave");
        return raw ? JSON.parse(raw).furniture[0].widthMm : null;
      }),
    )
    .toBe(501);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "JSON 내보내기", exact: true })
    .click();
  const file = await (await pending).path();
  if (!file)
    throw new Error("성능 프로젝트의 JSON 백업이 생성되지 않았습니다.");
  const saved = JSON.parse(await readFile(file, "utf8"));
  expect(saved.room.polygon).toHaveLength(30);
  expect(saved.furniture).toHaveLength(50);
  expect(saved.furniture[0].widthMm).toBe(501);
  await page.getByRole("button", { name: "3D 보기", exact: true }).click();
  await expect(page.getByLabel("3D 방 보기").locator("canvas")).toBeVisible();
  const renderer = page.getByLabel("렌더러 측정");
  await expect
    .poll(async () => Number(await renderer.getAttribute("data-frames")))
    .toBeGreaterThan(5);
  expect(
    Number(await renderer.getAttribute("data-draw-calls")),
  ).toBeGreaterThan(0);
  expect(Number(await renderer.getAttribute("data-triangles"))).toBeGreaterThan(
    0,
  );
  const cadence = await page.evaluate(
    () =>
      new Promise<{ samples: number; elapsedMs: number; rafHz: number }>(
        (resolve) => {
          const started = performance.now();
          let samples = 0;
          const tick = (now: number) => {
            samples++;
            if (now - started >= 1500)
              resolve({
                samples,
                elapsedMs: now - started,
                rafHz: ((samples - 1) * 1000) / (now - started),
              });
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
      ),
  );
  const rendered = await renderer.evaluate((el) => ({ ...el.dataset }));
  const measurement = {
    rendered,
    browserName,
    headless: true,
    fixture: "30 walls / 50 furniture",
    selectionMs,
    editMs,
    ...cadence,
    note: "Playwright end-to-end action times and requestAnimationFrame cadence; CPU submission and requestAnimationFrame cadence do not measure GPU completion or guarantee performance.",
  };
  console.log(JSON.stringify(measurement));
  await testInfo.attach("performance-measurement", {
    body: JSON.stringify(measurement, null, 2),
    contentType: "application/json",
  });
  await page.screenshot({
    path: testInfo.outputPath("30walls-50furniture-3d.png"),
  });
  await page.getByRole("button", { name: "2D에서 편집", exact: true }).click();
  await expect(page.getByLabel("2D 편집 영역")).toBeVisible();
  expect(errors).toEqual([]);
});
