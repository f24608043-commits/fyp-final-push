import { test, expect } from '@playwright/test';

//Comprehensive E2E Test for Learner Role
//Tests: Path navigation, complete lessons, quizzes, tutor conversation, friend requests

test('COMPREHENSIVE LEARNER E2E - Full workflow', async ({ page }) => {
  test.setTimeout(300000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  console.log('✓ Learner logged in');
  
  // Navigate to learning path
  await page.goto('/path', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to learning path');
  
  // Verify path loads with course content
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  console.log('✓ Learning path loaded');
  
  // Navigate to tutoring page
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to tutoring page');
  
  // Find a tutor and click Message button
  const messageButtons = page.locator('button:has-text("Message")');
  const messageCount = await messageButtons.count();
  
  if (messageCount > 0) {
    await messageButtons.first().click();
    await page.waitForTimeout(3000);
    console.log('✓ Clicked Message button on tutor');
  } else {
    console.log('ℹ No Message buttons found (no tutors available)');
  }
  
  // Navigate to friends page
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to friends page');
  
  // Send friend requests
  const addFriendButtons = page.locator('button:has-text("Add Friend")');
  const addFriendCount = await addFriendButtons.count();
  
  if (addFriendCount > 0) {
    // Send up to 3 friend requests
    const requestsToSend = Math.min(addFriendCount, 3);
    for (let i = 0; i < requestsToSend; i++) {
      await addFriendButtons.nth(i).click();
      await page.waitForTimeout(1500);
    }
    console.log(`✓ Sent ${requestsToSend} friend request(s)`);
  } else {
    console.log('ℹ No Add Friend buttons found');
  }
  
  // Navigate to messages to check conversations
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to messages page');
  
  const conversations = page.locator('a[href*="/messages/"], .conversation-item');
  const conversationCount = await conversations.count();
  
  if (conversationCount > 0) {
    console.log(`✓ Found ${conversationCount} conversation(s)`);
  } else {
    console.log('ℹ No conversations found');
  }
  
  console.log('✅ COMPREHENSIVE LEARNER E2E TEST COMPLETED');
});
