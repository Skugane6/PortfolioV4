import { expect, test } from '@playwright/test';

test.describe('shareability', () => {
  test('meta, Open Graph, Twitter and JSON-LD are present and correct', async ({ page, request }) => {
    await page.goto('/');
    const meta = (sel: string) => page.locator(sel).getAttribute('content');
    await expect(page).toHaveTitle('Searan Kuganesan, software engineer');
    expect(await meta('meta[name="description"]')).toContain('2,000+ aircraft');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://searan.vercel.app/');
    expect(await meta('meta[property="og:image"]')).toBe('https://searan.vercel.app/og.png');
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');

    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Searan Kuganesan');
    expect(ld.alumniOf.name).toBe('Western University');

    const og = await request.get('/og.png');
    expect(og.status()).toBe(200);
    const buf = await og.body();
    // PNG IHDR: width and height at bytes 16–23.
    expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([1200, 630]);
  });

  test('icons, manifest, robots and sitemap are served', async ({ request }) => {
    for (const path of ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/site.webmanifest', '/sitemap.xml']) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://searan.vercel.app/sitemap.xml');
    const manifest = await (await request.get('/site.webmanifest')).json();
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toContain('512x512');
  });

  test('the 404 page is a drawn sheet with a way back', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.getByRole('heading', { name: 'Sheet not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the cover' })).toHaveAttribute('href', '/');
  });
});
