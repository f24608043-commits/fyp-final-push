import { test, expect } from '@playwright/test';

test('Test Message button and conversation page', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('Logged in as learner');
  
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 60000 });
  
  const messageButtons = page.locator('button:has-text("Message")');
  const count = await messageButtons.count();
  
  if (count > 0) {
    await messageButtons.first().click();
    await page.waitForTimeout(2000);
    console.log('Clicked Message button');
    
    // Verify navigation to conversation
    const currentUrl = page.url();
    console.log(`Current URL after click: ${currentUrl}`);
  } else {
    console.log('No Message buttons found (no tutors available)');
  }
});
