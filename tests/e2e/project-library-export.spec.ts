import { test, expect } from './fixtures';
import { readFile } from 'node:fs/promises';

test('snapshots can be saved, cloned and switched while current work is archived', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', {name:'프로젝트 보관함'}).click();
  const dialog=page.getByRole('dialog',{name:'프로젝트 보관함'});
  await dialog.getByRole('button',{name:'현재 프로젝트 보관'}).click();
  await dialog.getByRole('button',{name:'새 프로젝트 복제'}).click();
  await expect(dialog.getByRole('button',{name:'새 프로젝트 열기'})).toHaveCount(2);
  await dialog.getByRole('button',{name:'새 프로젝트 이름 변경'}).first().click();
  await dialog.getByLabel('새 보관본 이름').fill('첫 번째');
  await dialog.getByRole('button',{name:'이름 저장'}).click();
  page.once('dialog', d=>d.accept());
  await dialog.getByRole('button',{name:'첫 번째 열기'}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel('프로젝트 이름')).toHaveValue('첫 번째');
  await page.getByRole('button',{name:'프로젝트 보관함'}).click();
  await expect(page.getByRole('dialog').getByRole('button',{name:'새 프로젝트 열기'})).toHaveCount(2);
});

test('corrupt library preserves active project and its raw data', async ({ page }) => {
  await page.addInitScript(()=>localStorage.setItem('roomfit3d:v2:/:library','{broken'));
  await page.goto('/');
  await page.getByRole('button',{name:'프로젝트 보관함'}).click();
  const dialog=page.getByRole('dialog',{name:'프로젝트 보관함'});
  await expect(dialog.getByRole('alert')).toContainText('보존');
  await dialog.getByRole('button',{name:'현재 프로젝트 보관'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('roomfit3d:v2:/:library'))).toBe('{broken');
  await expect(page.getByLabel('프로젝트 이름')).toHaveValue('새 프로젝트');
});

test('SVG and PNG downloads contain the full plan', async ({ page }) => {
  await page.goto('/');
  const svgDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'평면도 SVG'}).click();
  const svg=await readFile(await (await svgDownload).path(),'utf8');
  expect(svg).toContain('<svg'); expect(svg).toContain('4200 mm');
  const pngDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'평면도 PNG'}).click();
  const png=await readFile(await (await pngDownload).path());
  expect([...png.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  expect(png.length).toBeGreaterThan(1000);
  expect(png.readUInt32BE(16)).toBeLessThanOrEqual(4096);
  expect(png.readUInt32BE(20)).toBeLessThanOrEqual(4096);
});
