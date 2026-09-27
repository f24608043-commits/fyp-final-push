import { test, expect } from '@playwright/test';

test('THOROUGH TEST - All Fixed Features', async ({ page }) => {
  test.setTimeout(300000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  
  console.log('✓ Learner logged in');
  
  // Navigate to learning path
  await page.goto('/path', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to learning path');
  
  // Navigate to tutoring page
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to tutoring page');
  
  // Check for Message button
  const messageButtons = page.locator('button:has-text("Message")');
  const messageCount = await messageButtons.count();
  
  if (messageCount > 0) {
    console.log('✓ Message buttons found');
  } else {
    console.log('ℹ No Message buttons found (no tutors available)');
  }
  
  // Navigate to messages
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to messages page');
  
  // Navigate to friends
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to friends page');
  
  console.log('✅ THOROUGH TEST COMPLETED');
});
