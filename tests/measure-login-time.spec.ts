import { test } from '@playwright/test';

test.describe('Login Time Measurement', () => {
  test('measure login time', async ({ page }) => {
    // Navigate to sign-in page
    const startTime = Date.now();
    await page.goto('http://localhost:4005/sign-in');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
    await page.fill('input[type="password"]', 'Test123456!');
    
    // Click submit and measure time to reach path page or onboarding
    const submitStartTime = Date.now();
    await page.click('button[type="submit"]');
    
    // Wait for navigation with increased timeout
    try {
      await page.waitForURL(/\/(path|onboarding)/, { timeout: 30000 });
    } catch (error) {
      // If waitForURL fails, check current URL and log it
      const currentUrl = page.url();
      console.log(`âš ï¸ Navigation timeout. Current URL: ${currentUrl}`);
      throw error;
    }
    
    const submitEndTime = Date.now();
    
    const loginTime = submitEndTime - submitStartTime;
    const totalTime = submitEndTime - startTime;
    
    console.log(`ðŸ“Š Login Time Measurement:`);
    console.log(`   Submit to Path: ${loginTime}ms`);
    console.log(`   Total Time: ${totalTime}ms`);
    
    if (loginTime > 10000) {
      console.log(`âš ï¸ Login time exceeds 10 seconds: ${loginTime}ms`);
    } else {
      console.log(`âœ… Login time is acceptable: ${loginTime}ms`);
    }
  });
});
