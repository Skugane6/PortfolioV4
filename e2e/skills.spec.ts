import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, gotoHome } from './helpers';

test.describe('skills sheet (bill of materials)', () => {
  test('the detail panel is useful before anything is selected', async ({ page }) => {
    await gotoHome(page);
    const panel = page.locator('section[aria-labelledby="part-detail-title"]');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toContainText('Detail A: most used');
    await expect(panel.getByRole('button')).toHaveCount(5);
  });

  test('keyboard: Enter on a part shows where it was used, and the link lands on that card', async ({ page }) => {
    await gotoHome(page);
    const oracle = page.locator('#skills').getByRole('button', { name: 'Oracle', exact: true });
    await oracle.focus();
    await page.keyboard.press('Enter');
    await expect(oracle).toHaveAttribute('aria-pressed', 'true');
    const panel = page.locator('section[aria-labelledby="part-detail-title"]');
    await expect(panel).toContainText('Detail A: Oracle');
    await panel.getByRole('link', { name: 'Maintenance Scheduling Engine' }).click();
    await expect(page).toHaveURL(/#callout-maintenance-scheduling$/);
  });

  test('tap selects a part on a touch screen', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', 'touch');
    await gotoHome(page);
    const react = page.locator('#skills').getByRole('button', { name: 'React', exact: true });
    await react.scrollIntoViewIfNeeded();
    await react.tap();
    await expect(page.locator('section[aria-labelledby="part-detail-title"]')).toContainText('Component Tracker');
  });

  test('group filters narrow the table and report their counts', async ({ page }) => {
    await gotoHome(page);
    const filter = page.getByRole('group', { name: 'Filter parts by group' }).getByRole('button', { name: /Integrations/ });
    await filter.click();
    await expect(filter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#skills tbody tr')).toHaveCount(7);
  });

  test('quantities are derived: parts used nowhere on the site show a dash', async ({ page }) => {
    await gotoHome(page);
    const row = page.locator('#skills tbody tr', { has: page.getByRole('button', { name: 'Docker', exact: true }) });
    await expect(row.locator('td').last()).toHaveText('—');
  });

  test('has no axe violations', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#skills').getByRole('button', { name: 'Python', exact: true }).click();
    await expectNoAxeViolations(page, '#skills');
  });
});
