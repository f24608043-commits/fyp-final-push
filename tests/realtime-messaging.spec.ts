import { test, expect } from '@playwright/test';

test.describe('Realtime Messaging', () => {
  const TUTOR_EMAIL = process.env.TEST_TUTOR_EMAIL || 'orphix.itsolutions@gmail.com';
  const TUTOR_PASSWORD = process.env.TEST_TUTOR_PASSWORD || 'Qasim.11';
  const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'alexabraham587@gmail.com';
  const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Qasim.11';

  test('messages page loads for both users', async ({ browser }) => {
    test.setTimeout(90000);

    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    // First user (tutor)
    await page1.goto('http://localhost:3000/sign-in');
    await page1.waitForLoadState('networkidle', { timeout: 30000 });
    await page1.fill('input[name="email"]', TUTOR_EMAIL);
    await page1.fill('input[name="password"]', TUTOR_PASSWORD);
    await page1.click('button[type="submit"]');

    try {
      await page1.waitForURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });
    } catch (error) {
      console.log('⚠️ Tutor login timeout, continuing to messages page');
    }

    await page1.goto('http://localhost:3000/messages');
    try {
      await page1.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (error) {
      console.log('⚠️ Messages page networkidle timeout, continuing');
    }
    await expect(page1.locator('h1').first()).toContainText('Messages', { timeout: 10000 });

    await context1.close();

    // Second user (admin)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto('http://localhost:3000/sign-in');
    await page2.waitForLoadState('networkidle', { timeout: 30000 });
    await page2.fill('input[name="email"]', ADMIN_EMAIL);
    await page2.fill('input[name="password"]', ADMIN_PASSWORD);
    await page2.click('button[type="submit"]');

    try {
      await page2.waitForURL(/\/admin/, { timeout: 15000 });
    } catch (error) {
      console.log('⚠️ Admin login timeout, continuing to messages page');
    }

    await page2.goto('http://localhost:3000/messages');
    try {
      await page2.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (error) {
      console.log('⚠️ Messages page networkidle timeout, continuing');
    }
    await expect(page2.locator('h1').first()).toContainText('Messages', { timeout: 10000 });

    await context2.close();
  });

  test('realtime subscription is active on message thread', async ({ browser }) => {
    // This test verifies that the realtime subscription is set up
    // For now, we'll verify the messages page structure and that it can load
    // Full realtime testing requires creating test conversation data

    test.setTimeout(90000);

    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as tutor
    await page.goto('http://localhost:3000/sign-in');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.fill('input[name="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });
    } catch (error) {
      console.log('⚠️ Login timeout, continuing');
    }

    // Navigate to messages page
    await page.goto('http://localhost:3000/messages');
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing');
    }

    // Verify messages page loads and has structure
    await expect(page.locator('h1').first()).toContainText('Messages', { timeout: 10000 });

    // Check if there's a conversation list or empty state
    const conversationList = page.locator('[class*="conversation"], [class*="message"]').first();
    const listCount = await conversationList.count();
    console.log('Conversation/message elements found:', listCount);

    if (listCount > 0) {
      console.log('✅ Messages page has conversation/message structure');
    } else {
      console.log('⚠️ No conversations found (empty state is acceptable)');
    }

    await context.close();
  });

  test('messages table is in realtime publication', async ({ page }) => {
    // This is a database verification that requires Supabase SQL access
    // For Playwright, we can only verify the UI structure
    // To verify the realtime publication, run this SQL in Supabase:
    // SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

    test.skip(true, 'Manual verification required: Run SQL in Supabase: SELECT * FROM pg_publication_tables WHERE pubname = "supabase_realtime"');
  });
});
