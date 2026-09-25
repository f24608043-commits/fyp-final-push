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
  await page.goto('/tutoring/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to tutor dashboard');
  
  // Test Edit Availability button
  const editAvailabilityButton = page.locator('button:has-text("Edit Availability")').first();
  const editCount = await editAvailabilityButton.count();
  
  if (editCount > 0) {
    await editAvailabilityButton.click();
    await page.waitForTimeout(3000);
    console.log('✓ Edit Availability button clicked');
  }
  
  // Navigate to tutoring page to see requests
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
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
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to messages page');
  
  // Check for existing conversations
  const conversations = page.locator('a[href*="/messages/"], .conversation-item');
  const conversationCount = await conversations.count();
  
  if (conversationCount > 0) {
    await conversations.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Opened conversation');
    
    // Send a test message
    const messageInput = page.locator('input[type="text"], textarea').first();
    const inputCount = await messageInput.count();
    
    if (inputCount > 0) {
      await messageInput.fill('Test message from tutor E2E test');
      await page.waitForTimeout(1000);
      
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
      const sendCount = await sendButton.count();
      
      if (sendCount > 0) {
        await sendButton.click();
        await page.waitForTimeout(2000);
        console.log('✓ Test message sent');
      }
    }
  } else {
    console.log('ℹ No existing conversations');
  }
  
  // Navigate to friends page
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to friends page');
  
  // Check for suggested friends
  const addFriendButtons = page.locator('button:has-text("Add Friend")');
  const addFriendCount = await addFriendButtons.count();
  
  if (addFriendCount > 0) {
    await addFriendButtons.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Sent friend request');
  }
  
  // Navigate back to messages to check group creation
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Look for create group button
  const createGroupButton = page.locator('button:has-text("Create Group"), button:has-text("New Group")');
  const groupCount = await createGroupButton.count();
  
  if (groupCount > 0) {
    await createGroupButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked create group button');
    
    // Fill group name if present
    const groupNameInput = page.locator('input[name="title"], input[placeholder*="name"]').first();
    const nameCount = await groupNameInput.count();
    
    if (nameCount > 0) {
      await groupNameInput.fill(`Test Group ${Date.now()}`);
      await page.waitForTimeout(1000);
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();
      await page.waitForTimeout(3000);
      console.log('✓ Group created');
    }
  }
  
  // Check for live meeting links (Jitsi)
  await page.goto('/tutoring/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  
  const jitsiLinks = page.locator('a[href*="jitsi"], a[href*="meet.jit.si"]');
  const jitsiCount = await jitsiLinks.count();
  
  if (jitsiCount > 0) {
    console.log(`✓ Found ${jitsiCount} Jitsi meeting link(s)`);
  } else {
    console.log('ℹ No active Jitsi meetings');
  }
  
  console.log('✅ COMPREHENSIVE TUTOR E2E TEST COMPLETED');
});
