/**
 * Accessibility testing helpers for Playwright + axe-core.
 */

import type { Page } from '@playwright/test';

/**
 * Run axe accessibility scan on a page.
 * Use with @axe-core/playwright in test files.
 */
export async function checkAccessibility(page: Page) {
  // This is a helper - actual axe scanning is done via @axe-core/playwright
  // in test files with: new AxeBuilder({ page }).analyze()
  const title = await page.title();
  if (!title) {
    throw new Error('Page has no title - accessibility violation');
  }

  // Check for skip link
  const skipLink = await page.$('[href="#main-content"], .skip-link');
  if (!skipLink) {
    console.warn('No skip-to-content link found');
  }

  // Check for lang attribute
  const lang = await page.getAttribute('html', 'lang');
  if (!lang) {
    throw new Error('HTML element missing lang attribute');
  }

  return { title, hasSkipLink: !!skipLink, lang };
}
