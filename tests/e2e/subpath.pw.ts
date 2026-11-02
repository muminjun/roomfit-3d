import { expect, test } from '@playwright/test';

test('AC-39/80: 동일 dist가 저장소 하위 경로에서 정적·동적 자산을 로드한다', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Production subpath baseURL is required.');
  const origin = new URL(baseURL).origin;
  const failures: string[] = [];
  const scripts = new Set<string>();
  const stylesheets = new Set<string>();
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('requestfailed', (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin !== origin) return;
    if (response.status() >= 400) failures.push(`${response.status()} ${url.pathname}`);
    if (['script', 'stylesheet', 'image'].includes(response.request().resourceType()) && !url.pathname.startsWith('/roomfit-3d/')) failures.push(`Incorrect base: ${url.pathname}`);
    if (response.request().resourceType() === 'script') scripts.add(url.pathname);
    if (response.request().resourceType() === 'stylesheet') stylesheets.add(url.pathname);
  });
  await page.goto(baseURL);
  await expect(page.getByLabel('2D 편집 영역')).toBeVisible();
  expect(scripts.size).toBeGreaterThan(0);
  expect(stylesheets.size).toBeGreaterThan(0);
  const faviconHref = await page.locator('link[rel="icon"]').getAttribute('href');
  if (!faviconHref) throw new Error('배포된 favicon 링크가 없습니다.');
  const faviconURL = new URL(faviconHref, baseURL);
  expect(faviconURL.pathname.startsWith('/roomfit-3d/')).toBe(true);
  const favicon = await page.request.get(faviconURL.href);
  expect(favicon.status()).toBe(200);
  expect(await favicon.text()).toContain('<svg');
  const initialScripts = new Set(scripts);
  await page.getByRole('button', { name: '3D 보기', exact: true }).click();
  await expect(page.getByLabel('3D 방 보기').locator('canvas')).toBeVisible();
  expect([...scripts].filter((path) => !initialScripts.has(path)).length).toBeGreaterThan(0);
  await page.getByRole('button', { name: '2D에서 편집', exact: true }).click();
  await page.reload();
  await expect(page.getByLabel('2D 편집 영역')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/roomfit-3d/');
  expect(failures).toEqual([]);
});
