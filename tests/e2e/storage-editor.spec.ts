import { test, expect } from "@playwright/test";

test("잘못된 JSON과 교체 취소는 현재 프로젝트를 보존한다", async ({ page }) => {
  await page.goto("/");
  const title = page.getByLabel("프로젝트 이름");
  await title.fill("보존할 방");
  await title.press("Enter");
  await page.getByLabel("JSON 불러오기").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(title).toHaveValue("보존할 방");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON 내보내기" }).click();
  const data = await (await download).createReadStream();
  if (!data) throw new Error("download missing");
  const chunks: Buffer[] = [];
  for await (const chunk of data) chunks.push(Buffer.from(chunk));
  const project = JSON.parse(Buffer.concat(chunks).toString());
  project.title = "불러온 방";
  const cancelled = page
    .waitForEvent("dialog")
    .then((dialog) => dialog.dismiss());
  await page.getByLabel("JSON 불러오기").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await cancelled;
  await expect(title).toHaveValue("보존할 방");
  const accepted = page
    .waitForEvent("dialog")
    .then((dialog) => dialog.accept());
  await page.getByLabel("JSON 불러오기").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await accepted;
  await expect(page.getByLabel("프로젝트 이름")).toHaveValue("불러온 방");
});
test("손상된 자동 저장을 보존하고 명시적으로 복구할 때만 덮어쓴다", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("roomfit3d:v2:/:autosave", "{broken"),
  );
  await page.goto("/");
  await expect(
    page.getByText("자동 저장 데이터가 손상되어 저장을 일시 중지했습니다"),
  ).toBeVisible();
  const title = page.getByLabel("프로젝트 이름");
  await title.fill("복구 방");
  await title.press("Enter");
  await page.waitForTimeout(650);
  expect(
    await page.evaluate(() => localStorage.getItem("roomfit3d:v2:/:autosave")),
  ).toBe("{broken");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "손상 데이터 다운로드" }).click();
  expect((await download).suggestedFilename()).toContain("손상");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "새 저장 시작" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("roomfit3d:v2:/:autosave")),
    )
    .toContain("복구 방");
});
test("다른 탭 변경은 자동 저장을 멈추고 명시적인 불러오기로 해결한다", async ({
  context,
  page,
}) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/");
  const first = page.getByLabel("프로젝트 이름");
  await first.fill("첫 번째 탭");
  await first.press("Enter");
  await expect(
    other.getByText("다른 탭에서 수정됨 — 자동 저장 일시 중지"),
  ).toBeVisible();
  const local = other.getByLabel("프로젝트 이름");
  await local.fill("두 번째 탭");
  await local.press("Enter");
  await page.waitForTimeout(650);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("roomfit3d:v2:/:autosave")!).title,
    ),
  ).toBe("첫 번째 탭");
  other.once("dialog", (d) => d.accept());
  await other.getByRole("button", { name: "다른 탭 불러오기" }).click();
  await expect(other.getByLabel("프로젝트 이름")).toHaveValue("첫 번째 탭");
  await other.close();
});
test("저장 용량 실패에도 이전 자동 저장과 현재 편집 내용은 각각 보존된다", async ({
  page,
}) => {
  await page.goto("/");
  const title = page.getByLabel("프로젝트 이름");
  await title.fill("기존 방");
  await title.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("roomfit3d:v2:/:autosave")),
    )
    .toContain("기존 방");
  const original = await page.evaluate(() => {
    const raw = localStorage.getItem("roomfit3d:v2:/:autosave");
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "roomfit3d:v2:/:autosave")
        throw new DOMException("full", "QuotaExceededError");
      return originalSet.call(this, key, value);
    };
    return raw;
  });
  await title.fill("저장 실패한 편집");
  await title.press("Enter");
  await expect(page.getByText("자동 저장에 실패했습니다")).toBeVisible();
  await expect(title).toHaveValue("저장 실패한 편집");
  expect(
    await page.evaluate(() => localStorage.getItem("roomfit3d:v2:/:autosave")),
  ).toBe(original);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "이 탭 내용 내보내기" }).click();
  await expect((await download).suggestedFilename()).toContain(
    "저장-실패한-편집",
  );
});
test("새로고침 복구는 오래된 수정 시각을 실제 저장 시각으로 표시하지 않는다", async ({
  page,
}) => {
  await page.goto("/");
  const title = page.getByLabel("프로젝트 이름");
  await title.fill("복원할 방");
  await title.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "저장됨" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("저장본 복구됨", { exact: true })).toBeVisible();
  await expect(page.getByLabel("프로젝트 이름")).toHaveValue("복원할 방");
});
