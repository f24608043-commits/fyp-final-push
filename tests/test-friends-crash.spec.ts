import { test, expect } from '@playwright/test';

test('Reproduce /friends crash', async ({ page }) => {
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
  const url = page.url();
  if (url.includes('/onboarding')) {
    await page.goto('/path');
  }
  
  // Navigate to /friends to trigger the crash
  await page.goto('/friends');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Check if page loads or shows error
  const pageTitle = await page.locator('h1').first().textContent();
  console.log('Page title:', pageTitle);
  
  await page.screenshot({ path: 'friends-crash-screenshot.png' });
});
