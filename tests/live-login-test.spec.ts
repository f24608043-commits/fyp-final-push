import { test, expect } from '@playwright/test';

test.describe('Live Login Test - Basic Verification', () => {
  test('learner can login successfully', async ({ page }) => {
    const learnerEmail = 'testlearner+test@gmail.com';
    const learnerPassword = 'Test123456!';
    
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    
    await page.fill('input[type="email"]', learnerEmail);
    await page.fill('input[type="password"]', learnerPassword);
    await page.click('button[type="submit"]');
    
    // Wait for either /path or /onboarding (user may need onboarding)
    await page.waitForURL(/\/(path|onboarding)/, { timeout: 15000 });
    
    const currentUrl = page.url();
    if (currentUrl.includes('/onboarding')) {
      console.log('✅ Login successful, redirected to /onboarding (onboarding needed)');
    } else {
      console.log('✅ Login successful, redirected to /path');
    }
    
    // Check if we're on either the path page or onboarding
    expect(currentUrl).toMatch(/\/(path|onboarding)/);
  });
});
