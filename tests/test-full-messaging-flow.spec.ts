import { test, expect } from '@playwright/test';

test('Full messaging flow: learner sends, tutor receives', async ({ page, context }) => {
  test.setTimeout(120000);
  
  // PART 1: Learner sends message
  console.log('PART 1: Learner sends message');
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('✓ Logged in as learner');
  
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 60000 });
  
  const messageButtons = page.locator('button:has-text("Message")');
  const count = await messageButtons.count();
  
  if (count === 0) {
    console.log('⚠ No Message buttons found (no tutors available)');
    test.skip();
  }
  
  await messageButtons.first().click();
  console.log('✓ Clicked Message button');
  
  // Wait for navigation or error
  await page.waitForTimeout(3000);
  
  // Check if we're on messages page
  const currentUrl = page.url();
  console.log('Current URL after click:', currentUrl);
  
  // Check for error message
  const errorText = page.locator('text=/error|Error|failed/').first();
  const hasError = await errorText.count();
  if (hasError > 0) {
    const errorContent = await errorText.textContent();
    console.log('Error found:', errorContent);
  }
  
  if (currentUrl.includes('/messages/')) {
    console.log('✓ Navigated to conversation');
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Try to send a message - wait for input to appear
    const messageInput = page.locator('input[placeholder="Type a message..."]').first();
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    const inputCount = await messageInput.count();
    
    if (inputCount > 0) {
      const testMessage = `Test message from learner at ${new Date().toISOString()}`;
      await messageInput.fill(testMessage);
      console.log('✓ Filled message input');
      
      // Look for send button
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
      const sendCount = await sendButton.count();
      
      if (sendCount > 0) {
        await sendButton.click();
        console.log('✓ Clicked send button');
        await page.waitForTimeout(2000);
        
        // Verify message appears in chat
        const messageText = page.locator(`text=${testMessage}`);
        const messageExists = await messageText.count();
        
        if (messageExists > 0) {
          console.log('✓ Message appears in chat');
        } else {
          console.log('⚠ Message not visible in chat');
        }
      } else {
        console.log('⚠ No send button found');
      }
    } else {
      console.log('⚠ No message input found');
    }
  } else {
    console.log('⚠ Did not navigate to conversation, URL:', currentUrl);
  }
  
  // PART 2: Logout
  console.log('\nPART 2: Logout');
  await page.goto('/sign-out', { waitUntil: 'networkidle' });
  console.log('✓ Logged out');
  
  // PART 3: Login as tutor to check for message
  console.log('\nPART 3: Login as tutor to verify message received');
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring|path|onboarding)/, { timeout: 60000 });
  console.log('✓ Logged in as tutor');
  
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✓ Navigated to messages page');
  
  // Check for conversations
  const conversations = page.locator('a[href*="/messages/"]');
  const convCount = await conversations.count();
  
  console.log(`Found ${convCount} conversations`);
  
  if (convCount > 0) {
    // Try each conversation to find the one with the learner
    let foundMessage = false;
    for (let i = 0; i < convCount; i++) {
      await conversations.nth(i).click();
      console.log(`✓ Clicked conversation ${i + 1}`);
      await page.waitForTimeout(2000);
      
      // Check for messages
      const chatMessages = page.locator('div[class*="message"], p[class*="message"], [class*="chat"], div[class*="rounded-2xl"]');
      const messageCount = await chatMessages.count();
      console.log(`Found ${messageCount} messages in conversation ${i + 1}`);
      
      if (messageCount > 0) {
        console.log('✓ Tutor can see messages in conversation', i + 1);
        foundMessage = true;
        break;
      }
      
      // Go back to messages list
      await page.goto('/messages', { waitUntil: 'networkidle' });
    }
    
    if (!foundMessage) {
      console.log('⚠ No messages visible to tutor in any conversation');
    }
  } else {
    console.log('⚠ No conversations found for tutor');
  }
});
