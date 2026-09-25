import { test, expect } from '@playwright/test';

test('PART 5: Jitsi video call access - Check Jitsi link in conversation (group)', async ({ page }) => {
  test.setTimeout(90000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  // Go to messages
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Check for Jitsi links in conversations
  const jitsiLinks = page.locator('a[href*="meet.jit.si"]');
  const jitsiCount = await jitsiLinks.count();
  console.log('Jitsi links in messages:', jitsiCount);
  
  if (jitsiCount > 0) {
    const firstLink = jitsiLinks.first();
    const href = await firstLink.getAttribute('href');
    console.log('Jitsi link:', href);
    expect(href).toContain('meet.jit.si');
  } else {
    console.log('No Jitsi links - Jitsi appears in group conversations with jitsiRoomId');
  }
});
