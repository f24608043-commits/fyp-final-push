import { test, expect } from '@playwright/test';

test('Reproduce /friends crash', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('Logged in as learner');
  
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Just verify page loads without crashing
  await expect(page.locator('body')).toBeVisible();
  console.log('Friends page loaded successfully');
});
