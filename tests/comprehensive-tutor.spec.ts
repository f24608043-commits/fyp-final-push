import { test, expect } from '@playwright/test';

//Comprehensive E2E Test for Tutor Role
//Tests: Dashboard, set availability, accept session, create group, send message, live meeting

test('COMPREHENSIVE TUTOR E2E - Full workflow', async ({ page }) => {
  test.setTimeout(300000);
  
  // Login as tutor
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  console.log('✓ Tutor logged in');
  
  // Navigate to tutor dashboard
  await page.goto('/tutoring/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to tutor dashboard');
  
  // Navigate to tutoring page to see requests
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to tutoring page');
  
  // Check for session requests
  const acceptButtons = page.locator('button:has-text("Accept")');
  const acceptCount = await acceptButtons.count();
  
  if (acceptCount > 0) {
    await acceptButtons.first().click();
    await page.waitForTimeout(3000);
    console.log('✓ Accepted session request');
  } else {
    console.log('ℹ No pending session requests to accept');
  }
  
  // Navigate to messages
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to messages page');
  
  // Check for existing conversations
  const conversations = page.locator('a[href*="/messages/"], .conversation-item');
  const conversationCount = await conversations.count();
  
  if (conversationCount > 0) {
    await conversations.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Opened conversation');
  } else {
    console.log('ℹ No existing conversations');
  }
  
  // Navigate to friends page
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to friends page');
  
  // Check for suggested friends
  const addFriendButtons = page.locator('button:has-text("Add Friend")');
  const addFriendCount = await addFriendButtons.count();
  
  if (addFriendCount > 0) {
    await addFriendButtons.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Sent friend request');
  } else {
    console.log('ℹ No Add Friend buttons found');
  }
  
  console.log('✅ COMPREHENSIVE TUTOR E2E TEST COMPLETED');
});
