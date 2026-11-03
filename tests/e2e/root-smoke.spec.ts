import { expect, test, type Page } from './fixtures';
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

test('AC-88: 800×500 돌출은 함몰과 구별되는 실제 음수 좌표를 저장한다', async ({ page }) => {
  await createRoom(page);
  const before = await exportProject(page);
  await page.getByRole('button', { name: '벽 1 선택', exact: true }).click();
  await page.getByLabel('시작 위치 (mm)', { exact: true }).fill('1700');
  await page.getByLabel('폭 (mm)', { exact: true }).fill('800');
  await page.getByLabel('깊이 (mm)', { exact: true }).fill('500');
  await page.getByRole('button', { name: '돌출 적용', exact: true }).click();
  await expect(page.getByText('14.68 ㎡', { exact: true })).toBeVisible();
  const after = await exportProject(page);
  expect(after.room.polygon.map(({ x, y }) => [x, y])).toEqual([
    [0, 0], [1700, 0], [1700, -500], [2500, -500], [2500, 0], [4200, 0], [4200, 3400], [0, 3400],
  ]);
  expect(after.room.polygon.filter((point) => before.room.polygon.some((old) => old.id === point.id))).toEqual(before.room.polygon);
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  expect((await exportProject(page)).room.polygon).toEqual(before.room.polygon);
});

test('AC-42: 음수 좌표의 방을 숫자로 늘릴 때 왼쪽 위 꼭짓점을 고정한다', async ({ page }) => {
  await createRoom(page);
  await page.getByRole('button', { name: '벽 1 선택', exact: true }).click();
  await page.getByLabel('벽 이동 거리 (mm)', { exact: true }).fill('200');
  await page.getByRole('button', { name: '벽 이동 적용', exact: true }).click();
  const width = page.getByLabel('전체 가로 (mm)', { exact: true });
  await width.fill('5000');
  await width.press('Enter');
  const project = await exportProject(page);
  expect(project.room.polygon.map(({ x, y }) => [x, y])).toEqual([[0, -200], [5000, -200], [5000, 3400], [0, 3400]]);
});

test('AC-18/62/85: 회전한 홀수 치수 가구의 로컬 치수와 반 mm 중심을 저장한다', async ({ page }) => {
  await createRoom(page);
  await page.getByRole('button', { name: /퀸 침대 1500/ }).click();
  await page.getByRole('button', { name: '90° 회전', exact: true }).click();
  const rotated = await exportProject(page);
  expect(rotated.furniture).toHaveLength(1);
  expect(rotated.furniture[0]).toMatchObject({ widthMm: 1500, depthMm: 2000, heightMm: 500, rotationDeg: 90 });
  for (const [label, value] of [['가로 W (mm)', '1001'], ['위치 X (mm)', '1000'], ['위치 Y (mm)', '500.5']]) {
    const input = page.getByLabel(label, { exact: true });
    await input.fill(value);
    await input.press('Enter');
  }
  const touching = await exportProject(page);
  expect(touching.furniture[0]).toMatchObject({ widthMm: 1001, depthMm: 2000, rotationDeg: 90, position: { x: 1000, y: 500.5 } });
  const height = page.getByLabel('높이 H (mm)', { exact: true });
  await height.fill('2401');
  await height.press('Enter');
  await expect(page.getByRole('alert')).toContainText('높이');
  expect(await exportProject(page)).toEqual(touching);
});
