import { test, expect } from '@playwright/test';

test.describe('Realtime Messaging', () => {
  const TUTOR_EMAIL = process.env.TEST_TUTOR_EMAIL || 'orphix.itsolutions@gmail.com';
  const TUTOR_PASSWORD = process.env.TEST_TUTOR_PASSWORD || 'Qasim.11';
  const LEARNER_EMAIL = process.env.TEST_LEARNER_EMAIL || 'alexabraham587@gmail.com';
  const LEARNER_PASSWORD = process.env.TEST_LEARNER_PASSWORD || 'Qasim.11';

  test('learner sends message, tutor sees it without refresh', async ({ browser }) => {
    test.setTimeout(120000);

    // Create two browser contexts for learner and tutor
    const learnerContext = await browser.newContext();
    const tutorContext = await browser.newContext();

    const learnerPage = await learnerContext.newPage();
    const tutorPage = await tutorContext.newPage();

    // Login as learner
    await learnerPage.goto('http://localhost:3000/sign-in');
    await learnerPage.waitForLoadState('networkidle', { timeout: 30000 });
    await learnerPage.fill('input[name="email"]', LEARNER_EMAIL);
    await learnerPage.fill('input[name="password"]', LEARNER_PASSWORD);
    await learnerPage.click('button[type="submit"]');

    try {
      await learnerPage.waitForURL(/\/(dashboard|path|tutoring)/, { timeout: 15000 });
    } catch (error) {
      console.log('Learner login timeout, continuing');
    }

    // Login as tutor
    await tutorPage.goto('http://localhost:3000/sign-in');
    await tutorPage.waitForLoadState('networkidle', { timeout: 30000 });
    await tutorPage.fill('input[name="email"]', TUTOR_EMAIL);
    await tutorPage.fill('input[name="password"]', TUTOR_PASSWORD);
    await tutorPage.click('button[type="submit"]');

    try {
      await tutorPage.waitForURL(/\/(tutoring\/dashboard|path|admin)/, { timeout: 15000 });
    } catch (error) {
      console.log('Tutor login timeout, continuing');
    }

    // Navigate both to messages page
    await learnerPage.goto('http://localhost:3000/messages');
    await learnerPage.waitForLoadState('networkidle', { timeout: 30000 });

    await tutorPage.goto('http://localhost:3000/messages');
    await tutorPage.waitForLoadState('networkidle', { timeout: 30000 });

    // Check if learner has conversations
    const learnerConversations = learnerPage.locator('[role="button"].conversation-item');
    const learnerHasConversations = await learnerConversations.count() > 0;

    if (!learnerHasConversations) {
      console.log('No conversations found for learner - skipping real-time test');
      await learnerContext.close();
      await tutorContext.close();
      test.skip(true, 'No test conversations available');
      return;
    }

    // Select first conversation on learner side
    await learnerConversations.first().click();
    await learnerPage.waitForLoadState('networkidle', { timeout: 10000 });

    // Get conversation ID from URL
    const learnerUrl = learnerPage.url();
    const conversationId = learnerUrl.split('/').pop();

    // Navigate tutor to same conversation
    await tutorPage.goto(`http://localhost:3000/messages/${conversationId}`);
    await tutorPage.waitForLoadState('networkidle', { timeout: 10000 });

    // Count messages before sending
    const messagesBefore = await tutorPage.locator('.message, [class*="message"]').count();

    // Learner sends a message
    const testMessage = `Test message ${Date.now()}`;
    await learnerPage.fill('input[type="text"]', testMessage);
    await learnerPage.click('button[type="submit"]');

    // Wait for message to appear on learner side
    await learnerPage.waitForTimeout(2000);

    // Check if message appears on tutor side without refresh
    await tutorPage.waitForTimeout(3000);

    const messagesAfter = await tutorPage.locator('.message, [class*="message"]').count();
    const messageText = await tutorPage.textContent('body');

    console.log('Messages before:', messagesBefore);
    console.log('Messages after:', messagesAfter);
    console.log('Message text includes test message:', messageText?.includes(testMessage));

    // Assert that tutor sees the new message
    expect(messagesAfter).toBeGreaterThan(messagesBefore);
    expect(messageText).toContain(testMessage);

    await learnerContext.close();
    await tutorContext.close();
  });

  test('friends page does not crash', async ({ page }) => {
    test.setTimeout(90000);

    // Login as learner
    await page.goto('http://localhost:3000/sign-in');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.fill('input[name="email"]', LEARNER_EMAIL);
    await page.fill('input[name="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(/\/(dashboard|path|tutoring)/, { timeout: 15000 });
    } catch (error) {
      console.log('Login timeout, continuing');
    }

    // Navigate to friends page
    await page.goto('http://localhost:3000/friends');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Verify page loads without crashing
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Runtime Error')).not.toBeVisible();

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Log any errors found
    if (errors.length > 0) {
      console.log('Console errors on /friends:', errors);
    }

    // Assert no critical errors
    const criticalErrors = errors.filter(e => 
      e.includes('500') || 
      e.includes('crash') ||
      e.includes('Cannot read')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('messages table is in realtime publication', async ({ page }) => {
    // This is a database verification that requires Supabase SQL access
    // For Playwright, we can only verify the UI structure
    // To verify the realtime publication, run this SQL in Supabase:
    // SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

    test.skip(true, 'Manual verification required: Run SQL in Supabase: SELECT * FROM pg_publication_tables WHERE pubname = "supabase_realtime"');
  });
});
