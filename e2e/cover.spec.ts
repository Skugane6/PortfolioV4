import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, gotoHome } from './helpers';

test.describe('cover sheet', () => {
  test('the name is prerendered and painted at full opacity before any script runs', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1, name: 'Searan Kuganesan' });
    await expect(h1).toBeVisible();
    expect(await h1.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.getByText('I build the systems operators run on:')).toBeVisible();
    await context.close();
  });

  test('the résumé link serves the PDF', async ({ page, request }) => {
    await gotoHome(page);
    const href = await page.locator('#cover').getByRole('link', { name: /Résumé/ }).getAttribute('href');
    const res = await request.get(href!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
  });

  test('availability shows a HOLD until the role type is supplied', async ({ page }) => {
    await gotoHome(page);
    const block = page.locator('#cover').getByRole('definition').filter({ hasText: 'Open to opportunities' });
    await expect(block).toContainText('Hold');
    await expect(block).toContainText('role type, start date to be confirmed');
  });

  test('local time is a live 24-hour clock', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#cover time')).toHaveText(/^\d{2}:\d{2}$/);
  });

  test('has no axe violations', async ({ page }) => {
    await gotoHome(page);
    await expectNoAxeViolations(page, '#cover');
  });
});
