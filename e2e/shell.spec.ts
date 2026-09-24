import { expect, test } from '@playwright/test';
import { collectErrors, expectNoAxeViolations, gotoHome } from './helpers';

const SHEETS = [
  ['cover', '01', 'Cover'],
  ['experience', '02', 'Experience'],
  ['projects', '03', 'Projects'],
  ['skills', '04', 'Skills'],
  ['contact', '05', 'Contact'],
] as const;

test.describe('shell', () => {
  test('the skip link is the first tab stop and lands on main', async ({ page }) => {
    await gotoHome(page);
    await page.keyboard.press('Tab');
    const first = page.locator(':focus');
    await expect(first).toHaveText('Skip to content');
    await expect(first).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('fonts are self-hosted: nothing is fetched from Google Fonts', async ({ page }) => {
    const hosts = new Set<string>();
    page.on('request', (r) => hosts.add(new URL(r.url()).host));
    await gotoHome(page);
    expect([...hosts].filter((h) => h.includes('google'))).toEqual([]);
    expect(await page.evaluate(() => document.fonts.check('16px Archivo'))).toBe(true);
  });

  test('sheet numbers in the index match each sheet title block', async ({ page }, info) => {
    await gotoHome(page);
    for (const [id, number] of SHEETS) {
      if (id === 'cover') continue;
      await expect(page.locator(`#${id} dl[aria-label="Sheet ${number} title block"]`)).toContainText(`${number} of 05`);
    }
    if (info.project.name === 'desktop') {
      const index = page.getByRole('navigation', { name: 'Sheet index' });
      for (const [id, number, title] of SHEETS) {
        await expect(index.locator(`a[href="#${id}"]`)).toContainText(number);
        await expect(index.locator(`a[href="#${id}"]`)).toContainText(title);
      }
    }
  });

  test('the index moves to a sheet and marks it current', async ({ page }, info) => {
    await gotoHome(page);
    if (info.project.name === 'desktop') {
      await page.getByRole('navigation', { name: 'Sheet index' }).getByRole('link', { name: /04\s*Skills/ }).click();
    } else {
      await page.getByRole('button', { name: 'Index' }).click();
      await page.getByRole('dialog', { name: 'Sheet index' }).getByRole('link', { name: /Skills/ }).click();
    }
    await expect(page.locator('#skills-title')).toBeFocused();
    await expect(page.locator('#skills')).toBeInViewport();
    await expect(page).toHaveURL(/#skills$/);
    if (info.project.name === 'desktop') {
      await expect(page.getByRole('navigation', { name: 'Sheet index' }).locator('a[aria-current="location"]')).toHaveAttribute(
        'href',
        '#skills',
      );
    } else {
      await expect(page.getByText('04/05')).toBeVisible();
    }
  });

  test('loads without console errors and with no axe violations', async ({ page }) => {
    const errors = collectErrors(page);
    await gotoHome(page);
    await expectNoAxeViolations(page);
    expect(errors).toEqual([]);
  });
});
