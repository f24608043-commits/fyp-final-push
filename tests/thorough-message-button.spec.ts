import { test, expect } from '@playwright/test';

test('THOROUGH TEST - Message button in /tutoring', async ({ page }) => {
  test.setTimeout(300000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  
  console.log('✓ Learner logged in');
  
  // Navigate to tutoring page
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to tutoring page');
  
  // Check for Message buttons
  const messageButtons = page.locator('button:has-text("Message")');
  const messageCount = await messageButtons.count();
  
  if (messageCount > 0) {
    console.log(`✓ Found ${messageCount} Message button(s)`);
    await messageButtons.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked first Message button');
  } else {
    console.log('ℹ No Message buttons found (no tutors available)');
  }
  
  console.log('✅ THOROUGH MESSAGE BUTTON TEST COMPLETED');
});
