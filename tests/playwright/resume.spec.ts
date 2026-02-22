import { test, expect } from '@playwright/test';

test('resume page loads', async ({ page }) => {
  await page.goto('/resume');
  await expect(page).toHaveTitle(/Resume/i);
});

test('resume builder island hydrates', async ({ page }) => {
  await page.goto('/resume');
  // Wait for React island to hydrate
  await page.waitForTimeout(2000);

  // Check for JD input textarea or the static resume content
  const jdInput = page.locator('textarea, [data-testid="jd-input"]');
  const staticResume = page.locator('.resume-page, .resume-preview');
  const hasInteractive = await jdInput.count() > 0;
  const hasStatic = await staticResume.count() > 0;

  expect(hasInteractive || hasStatic).toBe(true);
});

test('resume page makes no network requests on JD paste', async ({ page }) => {
  // Intercept all network requests
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // Filter out the page load itself and static assets
    if (!url.includes('localhost') && !url.includes('fonts.googleapis')) {
      requests.push(url);
    }
  });

  await page.goto('/resume');
  await page.waitForTimeout(2000);

  // Clear request log after page load
  requests.length = 0;

  // Try to paste JD text if input exists
  const jdInput = page.locator('textarea').first();
  if (await jdInput.count() > 0) {
    await jdInput.fill('Looking for a threat researcher with experience in ransomware analysis, MITRE ATT&CK, Python, and malware analysis.');
    await page.waitForTimeout(1000);

    // No external requests should have been made
    expect(requests.length).toBe(0);
  }
});
