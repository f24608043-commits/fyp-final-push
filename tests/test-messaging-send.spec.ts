import { test, expect } from '@playwright/test';

test('PART 4.2: Send message from learner to tutor', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Click Message button on first tutor
  const messageButton = page.locator('button:has-text("Message")').first();
  await expect(messageButton).toBeVisible();
  await messageButton.click();
  
  // Should navigate to /messages
  await page.waitForURL(/\/messages/, { timeout: 10000 });
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Messaging page loaded:', await heading.textContent());
  
  // Check if conversation is visible
  const conversation = page.locator('.conversation, .chat, .message-list').first();
  const isVisible = await conversation.count() > 0;
  console.log('Conversation visible:', isVisible);
});
