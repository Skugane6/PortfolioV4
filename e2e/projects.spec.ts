import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, gotoHome } from './helpers';

const NAMES = ['CraftTraq', 'Genshillion', 'Portfolio Risk Dashboard', 'Text Classification Pipeline'];
// Numbers the previous project visuals printed without a source (CONTENT.md §5).
const UNSOURCED = ['1.84', '14.2%', '94.1%', '0.921', '0.936', '0.908', 'RUN 47', '18ms', '0.7°'];

test.describe('projects sheet', () => {
  test('all four projects are visible at a glance, no tabs', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#projects').scrollIntoViewIfNeeded();
    for (const name of NAMES) await expect(page.getByRole('heading', { level: 3, name, exact: true })).toBeVisible();
    await expect(page.locator('#projects [role="tab"]')).toHaveCount(0);
  });

  test('no unsourced metric appears anywhere on the page', async ({ page }) => {
    await gotoHome(page);
    const text = await page.locator('body').innerText();
    for (const s of UNSOURCED) expect(text).not.toContain(s);
  });

  test('every cover proof link lands on something that exists', async ({ page }) => {
    await gotoHome(page);
    const hrefs = await page.locator('#cover a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.length).toBeGreaterThan(2);
    for (const href of hrefs) expect(await page.locator(href).count(), href).toBe(1);
  });

  test('opens a detail sheet, closes with Escape, and returns focus', async ({ page }) => {
    await gotoHome(page);
    const open = page.getByRole('button', { name: 'Open detail: Portfolio Risk Dashboard' });
    await open.scrollIntoViewIfNeeded();
    await open.click();
    const dialog = page.getByRole('dialog', { name: 'Portfolio Risk Dashboard' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/#projects\/portfolio-risk-dashboard$/);
    await expect(dialog.getByRole('heading', { name: 'How it’s built' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    await expect(page).not.toHaveURL(/#projects\//);
  });

  test('a deep link opens the sheet on load, and Back closes it', async ({ page }) => {
    await gotoHome(page);
    await page.goto('/#projects/crafttraq');
    const dialog = page.getByRole('dialog', { name: 'CraftTraq' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Live in production with tiered Stripe billing.')).toBeVisible();
    await page.goBack();
    await expect(dialog).toBeHidden();
  });

  test('the risk demo responds to the keyboard and stays labelled illustrative', async ({ page }) => {
    await gotoHome(page, '#projects/portfolio-risk-dashboard');
    const dialog = page.getByRole('dialog', { name: 'Portfolio Risk Dashboard' });
    await expect(dialog.getByText('Illustrative data, not market data.')).toBeVisible();
    const slider = dialog.getByRole('slider', { name: /Asset C/ });
    const readout = dialog.locator('dd').first();
    const before = await readout.textContent();
    await slider.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await expect(readout).not.toHaveText(before!);
  });

  test('the open detail sheet has no axe violations', async ({ page }) => {
    await gotoHome(page, '#projects/crafttraq');
    await expect(page.getByRole('dialog', { name: 'CraftTraq' })).toBeVisible();
    await page.waitForTimeout(500);
    await expectNoAxeViolations(page, 'dialog[open]');
  });

  test('the sheet has no axe violations', async ({ page }) => {
    await gotoHome(page);
    await expectNoAxeViolations(page, '#projects');
  });
});
