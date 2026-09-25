import { test, expect } from '@playwright/test';

test.describe('Shell Screenshots', () => {
  const TUTOR_EMAIL = 'orphix.itsolutions@gmail.com';
  const TUTOR_PASSWORD = 'Qasim.11';

  test('screenshot at 390px mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });
    
    await page.screenshot({ path: 'screenshots/shell-mobile-390px.png', fullPage: true });
    console.log('✓ Screenshot: shell-mobile-390px.png');
  });

  test('screenshot at 1440px desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });
    
    await page.screenshot({ path: 'screenshots/shell-desktop-1440px.png', fullPage: true });
    console.log('✓ Screenshot: shell-desktop-1440px.png');
  });
});
