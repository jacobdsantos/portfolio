import { test, expect } from '@playwright/test';

const seoRoutes = [
  '/',
  '/about',
  '/research',
  '/tools',
  '/blog',
  '/speaking',
  '/contact',
  '/resume',
];

for (const route of seoRoutes) {
  test(`${route} has required SEO meta tags`, async ({ page }) => {
    await page.goto(route);

    // Title exists and is not empty
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Meta description
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);

    // OG tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();

    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    expect(ogDescription).toBeTruthy();

    // Canonical link
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBeTruthy();
    expect(canonical).toContain('jacobsantos.pages.dev');
  });
}

test('homepage has Person JSON-LD', async ({ page }) => {
  await page.goto('/');
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(jsonLd).toBeTruthy();
  const data = JSON.parse(jsonLd!);
  expect(data['@type']).toBe('Person');
  expect(data.name).toBe('Jacob Santos');
});
