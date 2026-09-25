import { test, expect } from '@playwright/test';

test('Test /friends as tutor', async ({ page }) => {
  // Login as tutor
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 15000 });
  
  // Navigate to /friends
  await page.goto('/friends');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Check if page loads or shows error
  const pageTitle = await page.locator('h1').first().textContent();
  console.log('Page title:', pageTitle);
  
  await page.screenshot({ path: 'friends-tutor-screenshot.png' });
});
