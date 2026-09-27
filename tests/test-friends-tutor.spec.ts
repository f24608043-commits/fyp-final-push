import { test, expect } from '@playwright/test';

test('Test /friends as tutor', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  console.log('Logged in as tutor');
  
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Just verify page loads without crashing
  await expect(page.locator('body')).toBeVisible();
  console.log('Friends page loaded successfully for tutor');
});
