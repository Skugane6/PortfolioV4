import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, gotoHome } from './helpers';

const CALLOUTS = ['component-tracker', 'utilization-forecasting', 'fleet-prediction', 'maintenance-scheduling'];

/** Scrolls to a fraction of the pinned survey's travel (wide layout only). */
async function scrollSurvey(page: Page, p: number) {
  await page.evaluate((prog) => {
    const track = document.querySelector<HTMLElement>('#experience [style*="vh"]');
    if (!track) throw new Error('no pinned track');
    const top = track.getBoundingClientRect().top + scrollY;
    scrollTo(0, top + prog * (track.offsetHeight - innerHeight));
  }, p);
  await page.waitForTimeout(400);
}

test.describe('experience sheet', () => {
  test('every existing experience fact is on the sheet', async ({ page }) => {
    await gotoHome(page);
    const sheet = page.locator('#experience');
    for (const text of ['Mitsubishi Heavy Industries', 'Software Engineering Intern', '05/2024', '08/2025', 'Mississauga, Canada']) {
      await expect(sheet).toContainText(text);
    }
    for (const id of CALLOUTS) await expect(page.locator(`#callout-${id}`)).toHaveCount(1);
    await expect(page.locator('#education')).toContainText('Graduated 06/2026');
  });

  test('the survey completes at 100% with the stamp down', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'pinned survey is the wide layout');
    await gotoHome(page);
    await scrollSurvey(page, 1);
    await expect(page.locator('#experience').getByText('100%')).toBeVisible();
    await expect(page.locator('#experience').getByText('Survey complete')).toBeVisible();
    for (const id of CALLOUTS) {
      expect(await page.locator(`#callout-${id}`).evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
    }
  });

  test('keyboard focus reveals every card, visible and on screen', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'pinned survey is the wide layout');
    await gotoHome(page);
    await scrollSurvey(page, 0.02);
    // Tab into the survey: station buttons first, then each card's Details button.
    let details = 0;
    for (let i = 0; i < 40 && details < CALLOUTS.length; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      const name = (await focused.textContent()) ?? '';
      if (name.includes('Details')) {
        details++;
        const card = focused.locator('xpath=ancestor::article');
        await expect(card).toBeInViewport();
        expect(await card.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
      }
    }
    expect(details).toBe(CALLOUTS.length);
  });

  test('resizing across the pin breakpoint mid-survey leaves nothing hidden', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'starts in the wide layout');
    await gotoHome(page);
    await scrollSurvey(page, 0.5);
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(500);
    for (const id of CALLOUTS) {
      expect(await page.locator(`#callout-${id}`).evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const scrollable = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight * 3);
    expect(scrollable).toBe(true);
  });

  test('station and card highlight each other', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'hover');
    await gotoHome(page);
    await scrollSurvey(page, 1);
    await page.locator('#callout-fleet-prediction').hover();
    await expect(page.getByRole('button', { name: /Station 942/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('details disclose the full description', async ({ page }, info) => {
    await gotoHome(page);
    if (info.project.name === 'desktop') await scrollSurvey(page, 1);
    const card = page.locator('#callout-maintenance-scheduling');
    await card.scrollIntoViewIfNeeded();
    const toggle = card.getByRole('button', { name: 'Details' });
    await expect(card.getByText('Designed the Oracle database architecture')).toBeHidden();
    await toggle.click();
    await expect(card.getByText('Designed the Oracle database architecture')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('reduced motion shows the finished sheet without pinning', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await gotoHome(page);
    await expect(page.locator('#experience [style*="vh"]')).toHaveCount(0);
    await page.locator('#callout-component-tracker').scrollIntoViewIfNeeded();
    for (const id of CALLOUTS) {
      expect(await page.locator(`#callout-${id}`).evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    }
    await expect(page.locator('#experience').getByText('Survey complete')).toBeVisible();
    await context.close();
  });

  test('has no axe violations when complete', async ({ page }, info) => {
    await gotoHome(page);
    if (info.project.name === 'desktop') await scrollSurvey(page, 1);
    await expectNoAxeViolations(page, '#experience');
  });
});
