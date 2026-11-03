import { test, expect } from './fixtures';

test('expanded catalog supports editable opening allowance and undo', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('가구 검색').fill('냉장고');
  await page.getByRole('button', { name: /냉장고 900/ }).click();
  await expect(page.getByText('여는 공간 계획 여유')).toBeVisible();
  const clearance = page.getByLabel('여는 공간 여유 (mm)');
  await expect(clearance).toHaveValue('700');
  await clearance.fill('1000');
  await clearance.press('Enter');
  await expect(clearance).toHaveValue('1000');
  await page.getByRole('button', {name:'실행 취소',exact:true}).click();
  await expect(page.getByLabel('여는 공간 여유 (mm)')).toHaveValue('700');
  await page.getByLabel('여는 공간 표시').uncheck();
  await expect(page.getByLabel('여는 공간 표시')).not.toBeChecked();
});
