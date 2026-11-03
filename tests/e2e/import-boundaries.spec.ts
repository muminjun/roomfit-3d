import { expect, test, type Page } from './fixtures';
import { readFile } from 'node:fs/promises';
import type { ProjectDataV2 } from '../../src/types/model';

async function exported(page: Page): Promise<ProjectDataV2> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON 내보내기', exact: true }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('JSON 백업 파일이 없습니다.');
  return JSON.parse(await readFile(path, 'utf8')) as ProjectDataV2;
}

async function upload(page: Page, contents: string) {
  await page.getByLabel('JSON 불러오기', { exact: true }).setInputFiles({ name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
}

test('AC-33/45/72/82/87: 상한 입력을 허용하고 실패 시 데이터·선택·Undo·저장본을 보존한다', async ({ page }) => {
  await page.goto('/');
  const legal = await readFile(new URL('../fixtures/boundary-64vertices-100furniture.json', import.meta.url), 'utf8');
  page.once('dialog', (dialog) => dialog.accept());
  await upload(page, legal);
  const title = page.getByLabel('프로젝트 이름', { exact: true });
  await expect(title).toHaveValue('입력 상한 검증 64점 100가구');
  await title.fill('보존할 상한 프로젝트');
  await title.press('Enter');
  await page.getByRole('button', { name: '성능 의자 1 선택', exact: true }).click();
  const before = await exported(page);
  expect(before.room.polygon).toHaveLength(64);
  expect(before.furniture).toHaveLength(100);
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('roomfit3d:v2:/:autosave');
    return raw ? JSON.parse(raw).title : null;
  })).toBe('보존할 상한 프로젝트');
  const saved = await page.evaluate(() => localStorage.getItem('roomfit3d:v2:/:autosave'));
  const invalidInputs = [
    await readFile(new URL('../fixtures/invalid-65vertices.json', import.meta.url), 'utf8'),
    await readFile(new URL('../fixtures/invalid-101furniture.json', import.meta.url), 'utf8'),
    JSON.stringify({ ...before, schemaVersion: 999 }),
    JSON.stringify(before).replace('"schemaVersion":2', '"__proto__":{"polluted":true},"schemaVersion":2'),
    ' '.repeat(2 * 1024 * 1024 + 1),
  ];
  for (const raw of invalidInputs) {
    await upload(page, raw);
    await expect(page.getByRole('alert').last()).toBeVisible();
    expect(await exported(page)).toEqual(before);
    await expect(page.getByRole('heading', { name: '성능 의자 1', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '실행 취소', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => localStorage.getItem('roomfit3d:v2:/:autosave'))).toBe(saved);
    expect(await page.evaluate(() => Reflect.get(Object.prototype, 'polluted'))).toBeUndefined();
  }
});

test('AC-76/89: 반시계 JSON의 변경 설명을 먼저 보이고 취소 후 원본을 유지한다', async ({ page }) => {
  await page.goto('/');
  const original = await exported(page);
  const candidate: ProjectDataV2 = {
    ...original,
    title: '반시계 가져오기',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2021-01-01T00:00:00.000Z',
    room: { ...original.room, polygon: [...original.room.polygon].reverse() },
  };
  let summary = '';
  page.once('dialog', async (dialog) => { summary = dialog.message(); await dialog.dismiss(); });
  await upload(page, JSON.stringify(candidate));
  await expect.poll(() => summary).toContain('시계 방향');
  expect(await exported(page)).toEqual(original);
  page.once('dialog', (dialog) => dialog.accept());
  await upload(page, JSON.stringify(candidate));
  await expect(page.getByLabel('프로젝트 이름', { exact: true })).toHaveValue(candidate.title);
  const restored = await exported(page);
  expect(restored).toEqual({ ...candidate, room: { ...candidate.room, polygon: original.room.polygon } });
});
