import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

test('JSON import from welcome enters the editor without replacing the imported project', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RoomFit 3D에 오신 것을 환영합니다' })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByLabel('JSON 불러오기', { exact: true }).setInputFiles(fileURLToPath(new URL('../fixtures/performance-30walls-50furniture.json', import.meta.url)));
  await expect(page.getByLabel('2D 편집 영역')).toBeVisible();
  await expect(page.getByRole('button', { name: '성능 의자 1 선택', exact: true })).toBeVisible();
});

test('first entry opens welcome and new project enters editor with keyboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RoomFit 3D에 오신 것을 환영합니다' })).toBeVisible();
  await expect(page.getByRole('button', { name: '계속 편집' })).toHaveCount(0);
  for (let i = 0; i < 12 && !(await page.getByRole('button', { name: '방 새로 만들기' }).evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '방 새로 만들기' })).toBeFocused();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: '새 프로젝트' });
  await expect(dialog.getByLabel('가로 (mm)')).toBeFocused();
  page.once('dialog', dialog => dialog.accept());
  for (let i = 0; i < 8 && !(await dialog.getByRole('button', { name: '만들기' }).evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: '만들기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '2D 편집' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('mm');
});

test('damaged storage does not offer continue or overwrite the original', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('roomfit3d:v2:/:autosave', '{broken'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: '계속 편집' })).toHaveCount(0);
  await expect(page.getByText(/손상/).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('roomfit3d:v2:/:autosave'))).toBe('{broken');
});

for (const width of [390, 800, 1023]) {
  test(`welcome and editor fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /오신 것을 환영합니다/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: '방 새로 만들기' }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('dialog').getByRole('button', { name: '만들기' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('valid saved project can be continued and help restores focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '방 새로 만들기' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('dialog').getByRole('button', { name: '만들기' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('roomfit3d:v2:/:autosave'))).not.toBeNull();
  await page.evaluate(() => localStorage.removeItem('roomfit3d:v2:/:welcome'));
  await page.reload();
  await page.getByRole('button', { name: '계속 편집' }).click();
  const help = page.getByRole('button', { name: '단축키 도움말' });
  await help.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: '사용 안내와 단축키' }).getByRole('button', { name: '닫기' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(help).toBeFocused();
});

test('invalid numeric field exposes its range and error', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('roomfit3d:v2:/:welcome', 'dismissed'));
  await page.goto('/');
  const height = page.getByLabel('벽 높이 (mm)');
  await expect(height).toHaveAccessibleDescription(/1,800–5,000/);
  await height.fill('1');
  await height.press('Tab');
  await expect(height).toHaveAttribute('aria-invalid', 'true');
  await expect(height).toHaveAccessibleDescription(/표시된 범위/);
});

test('desktop canvas stays within viewport while side panels scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => localStorage.setItem('roomfit3d:v2:/:welcome', 'dismissed'));
  await page.goto('/');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(720);
  const panel = page.locator('aside').first();
  expect(await panel.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
});

test('complete editor journey using keyboard navigation', async ({ page }) => {
  await page.goto('/');
  const tabTo = async (locator: import('@playwright/test').Locator) => {
    for (let i = 0; i < 300; i++) {
      if (await locator.evaluateAll(els => els.some(el => el === document.activeElement))) return;
      await page.keyboard.press(i < 100 ? 'Tab' : 'Shift+Tab');
    }
    throw new Error(`Could not reach ${locator.toString()} by Tab; active ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 300))}; matches ${await locator.count()}`);
  };
  const activate = async (locator: import('@playwright/test').Locator) => { await tabTo(locator); await page.keyboard.press('Enter'); };
  const edit = async (locator: import('@playwright/test').Locator, value: string) => { await tabTo(locator); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type(value); await page.keyboard.press('Tab'); };
  await activate(page.getByRole('button', { name: '방 새로 만들기' }));
  page.once('dialog', dialog => dialog.accept());
  await activate(page.getByRole('dialog').getByRole('button', { name: '만들기' }));
  await activate(page.getByRole('button', { name: /^싱글 침대 1000/ }));
  await expect(page.getByLabel('가구 이름')).toBeVisible();
  await edit(page.getByLabel('가구 이름'), 'Keyboard Bed');
  await edit(page.getByLabel('가로 W (mm)'), '1');
  await expect(page.getByLabel('가로 W (mm)')).toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByLabel('가로 W (mm)')).toBeFocused();
  await edit(page.getByLabel('가로 W (mm)'), '900');
  await expect(page.getByLabel('가로 W (mm)')).not.toHaveAttribute('aria-invalid', 'true');
  await activate(page.getByRole('button', { name: '삭제', exact: true }));
  await expect(page.getByLabel('가구 이름')).toHaveCount(0);
  await activate(page.getByRole('button', { name: '실행 취소' }));
  await expect(page.getByRole('button', { name: 'Keyboard Bed 선택' })).toBeVisible();
  const download = page.waitForEvent('download');
  await activate(page.getByRole('button', { name: 'JSON 내보내기' }));
  await download;
  await activate(page.getByRole('button', { name: '3D 보기' }));
  await expect(page.getByRole('button', { name: '3D 보기' })).toHaveAttribute('aria-pressed', 'true');
  await activate(page.getByRole('button', { name: '2D 편집' }));
  await expect(page.getByRole('button', { name: '2D 편집' })).toHaveAttribute('aria-pressed', 'true');
  await activate(page.getByRole('button', { name: '방 속성' }));
  await activate(page.getByText('문·창문·구역', { exact: true }));
  await activate(page.getByRole('button', { name: '새 구역' }));
  await tabTo(page.getByLabel('구역 이름'));
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Rdelete');
  await page.keyboard.press('Delete');
  await expect(page.getByLabel('구역 이름')).toHaveValue('Rdelete');
  await expect(page.getByRole('button', { name: 'Keyboard Bed 선택' })).toBeVisible();
});
