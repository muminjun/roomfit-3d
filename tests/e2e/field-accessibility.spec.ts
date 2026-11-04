import { test, expect } from './fixtures';

test('new project identifies only invalid dimension and preserves draft with Escape', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'새 프로젝트',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'새 프로젝트'});
  const width=dialog.getByLabel('가로 (mm)'), depth=dialog.getByLabel('세로 (mm)');
  await width.fill('0');
  await dialog.getByRole('button',{name:'만들기',exact:true}).click();
  await expect(width).toHaveAttribute('aria-invalid','true');
  await expect(width).toHaveAccessibleDescription(/500–30,000.*범위/);
  await expect(depth).not.toHaveAttribute('aria-invalid','true');
  await width.focus(); await width.fill('9000'); await width.press('Escape');
  await expect(dialog).toBeVisible(); await expect(width).toHaveValue('4200');
});

test('invalid names are associated with their fields and Escape cancels a draft',async({page})=>{
  await page.goto('/');
  const title=page.getByLabel('프로젝트 이름');
  await title.fill('가'.repeat(61)); await title.press('Enter');
  await expect(title).toHaveAttribute('aria-invalid','true');
  await expect(title).toHaveAccessibleDescription(/1~60/);
  await title.focus(); await title.fill('draft'); await title.press('Escape');
  await expect(title).toHaveValue('새 프로젝트');
  await page.getByRole('button',{name:/책상 1200/}).click();
  const name=page.getByLabel('가구 이름');
  await name.fill('가'.repeat(41)); await name.press('Enter');
  await expect(name).toHaveAttribute('aria-invalid','true');
  await expect(name).toHaveAccessibleDescription(/1~40/);
});

test('rejected numeric placement is field-associated and Escape restores committed value',async({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:/책상 1200/}).click();
  const x=page.getByLabel('위치 X (mm)'); const original=await x.inputValue();
  await x.fill('-10000'); await x.press('Enter');
  await expect(x).toHaveAttribute('aria-invalid','true');
  await expect(x).toHaveAccessibleDescription(/범위|이탈|밖/);
  await x.focus(); await x.press('Escape'); await expect(x).toHaveValue(original);
});

test('dimension boundaries are associated locally and reject empty, nonfinite and fractional values',async({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:'새 프로젝트',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'새 프로젝트'}), width=dialog.getByLabel('가로 (mm)'), depth=dialog.getByLabel('세로 (mm)');
  for (const input of ['', '0', '4200.5', 'Infinity', 'NaN', '30001']) {
    await width.fill(input); await dialog.getByRole('button',{name:'만들기',exact:true}).click();
    await expect(width).toHaveAttribute('aria-invalid','true');
    await expect(width).toHaveAccessibleDescription(/500–30,000.*범위/);
    await expect(depth).not.toHaveAttribute('aria-invalid','true');
  }
  await width.fill('4,200'); page.once('dialog', dialog=>dialog.accept());
  await dialog.getByRole('button',{name:'만들기',exact:true}).click();
  await expect(dialog).toHaveCount(0);
});

test('name limits count Unicode characters and retain last saved name on invalid input', async ({page})=>{
  await page.goto('/'); const title=page.getByLabel('프로젝트 이름');
  const valid='😀'.repeat(60); await title.fill(valid); await title.press('Enter');
  await expect(title).toHaveValue(valid);
  await title.fill('😀'.repeat(61)); await title.press('Enter');
  await expect(title).toHaveAttribute('aria-invalid','true');
  await title.focus(); await title.press('Escape'); await expect(title).toHaveValue(valid);
});

test('wall numeric errors identify the responsible input and Escape restores its draft', async ({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:'벽 1 선택'}).click();
  const offset=page.getByLabel('벽 이동 거리 (mm)');
  await offset.fill('Infinity'); await page.getByRole('button',{name:'벽 이동 적용'}).click();
  await expect(offset).toHaveAttribute('aria-invalid','true');
  await expect(offset).toHaveAccessibleDescription(/정수/);
  await offset.focus(); await offset.press('Escape'); await expect(offset).toHaveValue('200');
});

test('notch boundary errors are attached to the field that failed',async({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:'벽 1 선택'}).click();
  const width=page.getByLabel('폭 (mm)'), start=page.getByLabel('시작 위치 (mm)');
  await width.fill('0'); await page.getByRole('button',{name:'함몰 적용'}).click();
  await expect(width).toHaveAttribute('aria-invalid','true');
  await expect(width).toHaveAccessibleDescription(/100/);
  await expect(start).not.toHaveAttribute('aria-invalid','true');
});

test('new project validates the edited field on blur without flagging other fields',async({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:'새 프로젝트',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'새 프로젝트'}),width=dialog.getByLabel('가로 (mm)'),depth=dialog.getByLabel('세로 (mm)');
  await width.fill('1');await width.press('Tab');
  await expect(width).toHaveAttribute('aria-invalid','true');await expect(width).toHaveAccessibleDescription(/500–30,000.*범위/);
  await expect(depth).not.toHaveAttribute('aria-invalid','true');
});
