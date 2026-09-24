import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, gotoHome } from './helpers';

const EMAIL = 'searan.kuganesan4@gmail.com';

test.describe('contact sheet (approval) and footer', () => {
  test('copies the address and confirms it', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'desktop', 'clipboard permission is a desktop Chromium grant');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoHome(page);
    await page.getByRole('button', { name: 'Copy address' }).click();
    await expect(page.getByRole('button', { name: 'Copied to clipboard' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
  });

  test('without clipboard access it selects the address and says how to copy', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }));
    await gotoHome(page);
    await page.getByRole('button', { name: 'Copy address' }).click();
    await expect(page.locator('#contact')).toContainText(/Address selected\. Press (⌘|Ctrl)\+C to copy\./);
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(EMAIL);
  });

  test('an empty form explains each field and focuses the first', async ({ page }) => {
    await gotoHome(page);
    await page.getByRole('button', { name: 'Submit for approval' }).click();
    await expect(page.getByText('Enter your name.')).toBeVisible();
    await expect(page.getByLabel('Name')).toBeFocused();
    await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  test('when sending is not configured it falls back to the mail app and says so', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 501, body: '{"ok":false}' }));
    await gotoHome(page);
    await page.getByLabel('Name').fill('Ada');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Message').fill('Hello');
    await page.getByRole('button', { name: 'Submit for approval' }).click();
    await expect(page.getByText('Couldn’t send from here. Your email app will open with the message filled in.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open it again' })).toHaveAttribute('href', /^mailto:searan\.kuganesan4@gmail\.com\?subject=/);
  });

  test('a successful send stamps the sheet approved', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
    await gotoHome(page);
    await page.getByLabel('Name').fill('Ada');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Message').fill('Hello');
    await page.getByRole('button', { name: 'Submit for approval' }).click();
    await expect(page.locator('#contact [role="status"]').getByText('Approved', { exact: true })).toBeVisible();
    await expect(page.getByText(`Sent. I’ll reply from ${EMAIL}.`)).toBeVisible();
  });

  test('the footer is a revision block with a way back to the cover', async ({ page }) => {
    await gotoHome(page);
    const footer = page.locator('footer');
    await expect(footer.getByRole('table')).toContainText('Rev');
    await expect(footer.locator('tbody tr').first()).toBeVisible();
    await footer.getByRole('link', { name: 'Back to the cover' }).click();
    await expect(page.locator('#cover-title')).toBeFocused();
  });

  test('has no axe violations', async ({ page }) => {
    await gotoHome(page);
    await expectNoAxeViolations(page, '#contact');
    await expectNoAxeViolations(page, 'footer');
  });
});
