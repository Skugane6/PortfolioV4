import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { width: 375, height: 812, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 844, height: 390, mobile: true },
  { width: 768, height: 1024, mobile: true },
  { width: 1024, height: 768, mobile: false },
  { width: 1366, height: 640, mobile: false },
  { width: 1440, height: 900, mobile: false },
  { width: 1920, height: 1080, mobile: false },
];

test.describe('layout at every size', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}×${vp.height}: no sideways scroll, no text under 13px, nothing under the nav`, async ({ browser }, info) => {
      test.skip(info.project.name !== 'desktop', 'each case sets its own viewport');
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
      const page = await context.newPage();
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // Walk the page so every scroll-linked state has rendered once.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        scrollTo(0, 0);
      });

      const report = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth - innerWidth;

        // Every visible text node's rendered size, SVG text scaled to the screen.
        const small: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const text = n.textContent?.trim();
          const el = n.parentElement;
          if (!text || !el || el.closest('dialog:not([open]), [hidden], script, style, noscript')) continue;
          const style = getComputedStyle(el);
          if (style.visibility === 'hidden' || style.display === 'none') continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          // Visually hidden (sr-only) text is not rendered text.
          if (r.width <= 1 && r.height <= 1) continue;
          let size = parseFloat(style.fontSize);
          const svg = el.closest('svg');
          if (svg && svg.viewBox.baseVal && svg.viewBox.baseVal.width) {
            size *= svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
          }
          if (size < 12.9) small.push(`${size.toFixed(1)}px "${text.slice(0, 30)}"`);
        }

        // The rail (from 1024px) must sit entirely outside the drawing set.
        const set = document.querySelector('.drawing-set')!.getBoundingClientRect();
        const rail = document.querySelector('nav[aria-label="Sheet index"]');
        const railBox = rail && getComputedStyle(rail).display !== 'none' ? rail.getBoundingClientRect() : null;
        const railOverlap = railBox && railBox.width > 0 ? Math.max(0, set.right - railBox.left) : 0;

        // Below 1024px the bottom strip must be clearable: the page reserves its height.
        const strip = [...document.querySelectorAll<HTMLElement>('nav.fixed.bottom-0')].find((e) => getComputedStyle(e).display !== 'none');
        const stripH = strip ? strip.getBoundingClientRect().height : 0;
        const reserved = parseFloat(getComputedStyle(document.querySelector('.drawing-set')!).paddingBottom);

        return { overflow, small: [...new Set(small)].slice(0, 10), railOverlap, stripH, reserved };
      });

      expect(report.overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
      expect(report.small, 'text rendered under 13px').toEqual([]);
      expect(report.railOverlap, 'sheet index overlapping the drawing set').toBe(0);
      if (report.stripH > 0) expect(report.reserved).toBeGreaterThanOrEqual(report.stripH - 1);
      await context.close();
    });
  }
});
