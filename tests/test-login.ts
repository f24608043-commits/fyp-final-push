import { test, expect } from '@playwright/test';

test('tutor login redirect', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(tutoring\/dashboard|path|onboarding)/, { timeout: 10000 });
  const url = page.url();
  console.log('Tutor login URL:', url);
});