import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { ProjectDataV2 } from '../../src/types/model';

// The exported user file is the observation boundary: a disconnected form,
// incorrect mm conversion or rejected-input commit must fail these tests.
async function exportProject(page: Page): Promise<ProjectDataV2> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON 내보내기', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/^roomfit-.+\.json$/);
  const path = await download.path();
  if (!path) throw new Error('JSON 다운로드 파일을 찾을 수 없습니다.');
  return JSON.parse(await readFile(path, 'utf8')) as ProjectDataV2;
}

async function createRoom(page: Page, width = '4200', depth = '3400') {
  await page.getByRole('button', { name: '새 프로젝트', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '새 프로젝트', exact: true });
  await dialog.getByLabel(/^가로 \(mm\)/).fill(width);
  await dialog.getByLabel(/^세로 \(mm\)/).fill(depth);
  await dialog.getByLabel(/^높이 \(mm\)/).fill('2400');
  await dialog.getByLabel(/^벽 두께 \(mm\)/).fill('120');
  await dialog.getByRole('button', { name: '만들기', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', async (dialog) => dialog.accept());
  await page.goto('/');
});

test('AC-01/31: 새 방의 실제 mm 데이터가 내보내기와 자동 복원에 보존된다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await createRoom(page);
  await expect(page.getByLabel('2D 편집 영역', { exact: true }).locator('canvas').first()).toBeVisible();
  const first = await exportProject(page);
  expect(first.schemaVersion).toBe(2);
  expect(first.unit).toBe('mm');
  expect(first.room.polygon.map(({ x, y }) => [x, y])).toEqual([[0, 0], [4200, 0], [4200, 3400], [0, 3400]]);
  expect(first.room.wallHeightMm).toBe(2400);
  expect(first.room.wallThicknessMm).toBe(120);
  await expect.poll(() => page.evaluate((projectId) => Object.keys(localStorage)
    .filter((key) => key.endsWith(':autosave'))
    .map((key) => localStorage.getItem(key))
    .some((raw) => raw !== null && JSON.parse(raw).id === projectId), first.id)).toBe(true);
  await page.reload();
  const restored = await exportProject(page);
  expect(restored).toEqual(first);
  expect(errors).toEqual([]);
});

test('AC-67: 소수인 방 치수를 거절하고 기존 확정 프로젝트를 보존한다', async ({ page }) => {
  await createRoom(page);
  const before = await exportProject(page);
  await createRoom(page, '4200.5');
  await expect(page.getByRole('button', { name: '만들기', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await exportProject(page)).toEqual(before);
});

test('AC-67: 쉼표로 쓴 방 치수를 실제 mm 정수로 해석한다', async ({ page }) => {
  await createRoom(page, '4,200', '3,400');
  const project = await exportProject(page);
  expect(project.room.polygon.map(({ x, y }) => [x, y])).toEqual([[0, 0], [4200, 0], [4200, 3400], [0, 3400]]);
});

test('AC-73: 좁은 화면에서도 수치 생성과 JSON 백업을 사용할 수 있다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createRoom(page, '5000', '4000');
  const project = await exportProject(page);
  expect(project.room.polygon.map(({ x, y }) => [x, y])).toEqual([[0, 0], [5000, 0], [5000, 4000], [0, 4000]]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
