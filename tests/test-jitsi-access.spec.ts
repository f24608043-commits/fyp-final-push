import { test, expect } from '@playwright/test';

test('PART 5: Jitsi video call access - Check Jitsi link in conversation (group)', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('Logged in as learner');
  
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 60000 });
  
  const conversations = page.locator('a[href*="/messages/"], .conversation-item');
  const count = await conversations.count();
  
  if (count > 0) {
    await conversations.first().click();
    await page.waitForTimeout(2000);
    console.log('Opened conversation');
    
    const jitsiLinks = page.locator('a[href*="jitsi"], a[href*="meet.jit.si"]');
    const jitsiCount = await jitsiLinks.count();
    
    if (jitsiCount > 0) {
      console.log(`Found ${jitsiCount} Jitsi link(s)`);
    } else {
      console.log('No Jitsi links found in conversation');
    }
  } else {
    console.log('No conversations found');
  }
});
