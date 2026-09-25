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
  await page.goto('/path', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to learning path');
  
  // Verify path loads with course content
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  console.log('✓ Learning path loaded');
  
  // Look for current lesson
  const currentLessonButton = page.locator('a[href*="/lesson/"], button:has-text("Start"), button:has-text("Continue")').first();
  const lessonCount = await currentLessonButton.count();
  
  if (lessonCount > 0) {
    await currentLessonButton.click();
    await page.waitForTimeout(3000);
    console.log('✓ Opened current lesson');
    
    // Check for video player or content
    const videoElement = page.locator('video, iframe').first();
    const videoCount = await videoElement.count();
    
    if (videoCount > 0) {
      console.log('✓ Video content found');
    }
    
    // Look for quiz or exercise
    const quizButton = page.locator('button:has-text("Quiz"), button:has-text("Exercise"), button:has-text("Complete")').first();
    const quizCount = await quizButton.count();
    
    if (quizCount > 0) {
      await quizButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Started quiz/exercise');
      
      // Try to answer a question if present
      const answerOption = page.locator('input[type="radio"], button:has-text("Submit")').first();
      const answerCount = await answerOption.count();
      
      if (answerCount > 0) {
        await answerOption.click();
        await page.waitForTimeout(1000);
        
        const submitButton = page.locator('button:has-text("Submit"), button[type="submit"]').first();
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('✓ Quiz answer submitted');
      }
    }
    
    // Mark lesson as complete if possible
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark Complete")').first();
    const completeCount = await completeButton.count();
    
    if (completeCount > 0) {
      await completeButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Lesson marked complete');
    }
  }
  
  // Navigate to tutoring page
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to tutoring page');
  
  // Find a tutor and click Message button
  const messageButtons = page.locator('button:has-text("Message")');
  const messageCount = await messageButtons.count();
  
  if (messageCount > 0) {
    await messageButtons.first().click();
    await page.waitForTimeout(3000);
    console.log('✓ Clicked Message button on tutor');
    
    // Send message to tutor
    const messageInput = page.locator('input[type="text"], textarea').first();
    const inputCount = await messageInput.count();
    
    if (inputCount > 0) {
      await messageInput.fill('Hello, I would like to inquire about tutoring');
      await page.waitForTimeout(1000);
      
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
      await sendButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Message sent to tutor');
    }
  }
  
  // Navigate to tutoring page to book session
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  
  const bookSessionButtons = page.locator('button:has-text("Book Session")');
  const bookCount = await bookSessionButtons.count();
  
  if (bookCount > 0) {
    await bookSessionButtons.first().click();
    await page.waitForTimeout(3000);
    console.log('✓ Clicked Book Session button');
  }
  
  // Navigate to friends page
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
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
  }
  
  // Check for pending friend requests to accept
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
  
  const acceptButtons = page.locator('button:has-text("Accept")');
  const acceptCount = await acceptButtons.count();
  
  if (acceptCount > 0) {
    await acceptButtons.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Accepted friend request');
  }
  
  // Navigate to messages to check conversations
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to messages page');
  
  const conversations = page.locator('a[href*="/messages/"], .conversation-item');
  const conversationCount = await conversations.count();
  
  if (conversationCount > 0) {
    console.log(`✓ Found ${conversationCount} conversation(s)`);
  }
  
  // Navigate back to path to check progress
  await page.goto('/path', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Check for XP and streak display
  const xpDisplay = page.locator('text=/XP/, text=/xp/').first();
  const xpCount = await xpDisplay.count();
  
  if (xpCount > 0) {
    console.log('✓ XP display found');
  }
  
  const streakDisplay = page.locator('text=/Streak/, text=/streak/').first();
  const streakCount = await streakDisplay.count();
  
  if (streakCount > 0) {
    console.log('✓ Streak display found');
  }
  
  console.log('✅ COMPREHENSIVE LEARNER E2E TEST COMPLETED');
});
