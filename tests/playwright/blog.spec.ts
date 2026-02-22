import { test, expect } from '@playwright/test';

test('blog index lists posts', async ({ page }) => {
  await page.goto('/blog');
  // Should have at least one blog post card
  const cards = page.locator('article, [class*="card"]');
  expect(await cards.count()).toBeGreaterThan(0);
});

test('blog post detail page renders content', async ({ page }) => {
  await page.goto('/blog');

  // Find and click first blog post link
  const firstLink = page.locator('a[href^="/blog/"]').first();
  if (await firstLink.count() > 0) {
    await firstLink.click();
    // Should have article content
    const content = page.locator('.prose, article');
    await expect(content.first()).toBeVisible();
  }
});
