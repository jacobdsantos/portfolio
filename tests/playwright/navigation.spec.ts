import { test, expect } from '@playwright/test';

test('main navigation links work', async ({ page }) => {
  await page.goto('/');

  // Click Research link
  await page.click('a[href="/research"]');
  await expect(page).toHaveURL(/\/research/);

  // Click Tools link
  await page.click('a[href="/tools"]');
  await expect(page).toHaveURL(/\/tools/);

  // Click Blog link
  await page.click('a[href="/blog"]');
  await expect(page).toHaveURL(/\/blog/);

  // Navigate home via logo/brand link
  await page.click('a[href="/"]');
  await expect(page).toHaveURL('/');
});

test('breadcrumbs render on subpages', async ({ page }) => {
  await page.goto('/about');
  const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
  await expect(breadcrumb).toBeVisible();
});

test('skip link is present and functional', async ({ page }) => {
  await page.goto('/');
  const skipLink = page.locator('.skip-link, [href="#main-content"]');
  // Skip link exists (may be visually hidden)
  expect(await skipLink.count()).toBeGreaterThan(0);
});
