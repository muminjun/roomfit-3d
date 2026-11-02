import { test, expect } from "@playwright/test";
test("도움말은 포커스를 가두고 Escape 뒤 원래 버튼으로 돌아간다", async ({
  page,
}) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "단축키 도움말" });
  await button.click();
  const dialog = page.getByRole("dialog", { name: "사용 안내와 단축키" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "닫기" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "닫기" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
});
test("좁은 화면에서도 방과 가구의 주요 도구에 접근한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "새 프로젝트" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "벽 이동", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /퀸 침대/ })).toBeVisible();
});
