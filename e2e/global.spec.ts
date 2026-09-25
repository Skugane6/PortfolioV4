import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, gotoHome } from './helpers';

test.describe('global interactions', () => {
  test('Ctrl+K opens the palette; a command runs; Escape restores focus', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard shortcut');
    await gotoHome(page);
    const trigger = page.getByRole('link', { name: 'See the work' });
    await trigger.focus();
    await page.keyboard.press('Control+k');
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await expect(palette).toBeVisible();
    await expect(palette.getByRole('combobox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(palette).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Control+k');
    await page.keyboard.type('resume');
    const download = page.waitForEvent('download');
    await page.keyboard.press('Enter');
    expect((await download).suggestedFilename()).toBe('skuganesan_resume.pdf');
  });

  test('the palette opens a project’s detail sheet', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard shortcut');
    await gotoHome(page);
    await page.keyboard.press('Control+k');
    await page.keyboard.type('eye tracking');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Eye Tracking Mouse' })).toBeVisible();
    await expect(page).toHaveURL(/#projects\/eye-mouse$/);
  });

  test('a palette command lands focus where it sends you', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard shortcut');
    await gotoHome(page);
    await page.keyboard.press('Control+k');
    await page.keyboard.type('skills');
    await page.keyboard.press('Enter');
    await expect(page.locator('#skills-title')).toBeFocused();
  });

  test('switching projects from the palette keeps the sheet open, and one Close leaves it', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard shortcut');
    await gotoHome(page);
    const open = page.getByRole('button', { name: 'Open detail: CraftTraq' });
    await open.scrollIntoViewIfNeeded();
    await open.click();
    await expect(page.getByRole('dialog', { name: 'CraftTraq' })).toBeVisible();

    await page.keyboard.press('Control+k');
    await page.keyboard.type('portfolio risk');
    await page.keyboard.press('Enter');
    const risk = page.getByRole('dialog', { name: 'Portfolio Risk Dashboard' });
    await expect(risk).toBeVisible();
    await expect(page).toHaveURL(/#projects\/portfolio-risk-dashboard$/);
    await page.waitForTimeout(800); // past the old sheet's exit animation
    await expect(risk).toBeVisible();

    await risk.getByRole('button', { name: 'Close' }).click();
    await expect(risk).toBeHidden();
    await expect(page).not.toHaveURL(/#projects\//);
    await expect(page.getByRole('button', { name: 'Open detail: Portfolio Risk Dashboard' })).toBeFocused();
  });

  test('the palette has no axe violations', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard shortcut');
    await gotoHome(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
    await expectNoAxeViolations(page, 'dialog[open]');
  });

  test('the cat never covers content', async ({ page }) => {
    await gotoHome(page);
    const cat = page.getByRole('button', { name: /^(Wake the cat|The cat)$/ });
    await expect(cat).toBeVisible();
    const overlaps = await cat.evaluate((el) => {
      const c = el.getBoundingClientRect();
      return [...document.querySelectorAll('#cover a, #cover button, #cover h1, #cover p, #cover dl, #cover img')]
        .filter((n) => n !== el && !el.contains(n))
        .filter((n) => {
          const r = n.getBoundingClientRect();
          return r.width > 0 && c.left < r.right && c.right > r.left && c.top < r.bottom && c.bottom > r.top;
        })
        .map((n) => n.outerHTML.slice(0, 60));
    });
    expect(overlaps).toEqual([]);
  });

  test('waking the cat moves it along the rule and it settles again', async ({ page }) => {
    await gotoHome(page);
    const cat = page.getByRole('button', { name: 'Wake the cat' });
    await cat.scrollIntoViewIfNeeded();
    // Page coordinates: the click may scroll the page on a phone.
    const pagePos = () =>
      page.getByRole('button', { name: /^(Wake the cat|The cat)$/ }).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY };
      });
    const before = await pagePos();
    await cat.click();
    await expect(page.getByRole('button', { name: 'Wake the cat' })).toBeVisible({ timeout: 8000 });
    const after = await pagePos();
    expect(Math.abs(after.x - before.x)).toBeGreaterThan(20);
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  });

  test('no crosshair on touch screens or under reduced motion', async ({ page, browser }, info) => {
    await gotoHome(page);
    await page.mouse.move(400, 300);
    const crossLayers = page.locator('div[aria-hidden="true"].fixed.inset-0.pointer-events-none');
    if (info.project.name === 'phone') await expect(crossLayers).toHaveCount(0);
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const reduced = await context.newPage();
    await gotoHome(reduced);
    await reduced.mouse.move(400, 300);
    await expect(reduced.locator('div[aria-hidden="true"].fixed.inset-0.pointer-events-none')).toHaveCount(0);
    await context.close();
  });
});
