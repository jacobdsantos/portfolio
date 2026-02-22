import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', title: 'Jacob Santos' },
  { path: '/about', title: 'About' },
  { path: '/research', title: 'Research' },
  { path: '/tools', title: 'Tools' },
  { path: '/blog', title: 'Blog' },
  { path: '/speaking', title: 'Speaking' },
  { path: '/contact', title: 'Contact' },
  { path: '/resume', title: 'Resume' },
];

for (const route of routes) {
  test(`${route.path} loads and has title containing "${route.title}"`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(route.title, 'i'));
  });
}

test('404 page renders for unknown route', async ({ page }) => {
  const response = await page.goto('/this-does-not-exist');
  // Astro serves 404.html with 200 in preview mode, check content
  await expect(page.locator('text=404')).toBeVisible();
});
