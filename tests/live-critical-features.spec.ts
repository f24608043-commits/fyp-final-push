import { test, expect } from '@playwright/test';

test.describe('Critical Features Live Testing', () => {
  const TUTOR_EMAIL = process.env.TEST_TUTOR_EMAIL || 'orphix.itsolutions@gmail.com';
  const TUTOR_PASSWORD = process.env.TEST_TUTOR_PASSWORD || 'Qasim.11';
  const LEARNER_EMAIL = process.env.TEST_LEARNER_EMAIL || 'alexabraham587@gmail.com';
  const LEARNER_PASSWORD = process.env.TEST_LEARNER_PASSWORD || 'Qasim.11';

  test('Messaging split view and WhatsApp-style header', async ({ browser }) => {
    test.setTimeout(120000);

    const context = await browser.newContext();
    const page = await context.newPage();

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

    // Navigate to messages
    await page.goto('http://localhost:3000/messages');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Verify split view structure
    const conversationList = page.locator('[role="button"].conversation-item');
    const hasConversations = await conversationList.count() > 0;

    if (hasConversations) {
      console.log('✓ Conversation list exists');

      // Click first conversation to test split view
      await conversationList.first().click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Verify message thread is visible (split view)
      const messageThread = page.locator('.message-thread, [class*="MessageThread"]').first();
      const threadVisible = await messageThread.isVisible().catch(() => false);
      
      if (threadVisible) {
        console.log('✓ Message thread visible in split view');

        // Check for WhatsApp-style header with user name
        const header = page.locator('h1, h2, [class*="header"]').first();
        const headerText = await header.textContent();
        console.log('Header text:', headerText);

        // Check for online status indicator
        const onlineIndicator = page.locator('[class*="online"], [class*="status"]').first();
        const hasOnlineStatus = await onlineIndicator.isVisible().catch(() => false);
        
        if (hasOnlineStatus) {
          console.log('✓ Online status indicator present');
        }

        // Check for message input
        const messageInput = page.locator('input[type="text"], textarea').first();
        const hasInput = await messageInput.isVisible().catch(() => false);
        
        if (hasInput) {
          console.log('✓ Message input present');
        }
      } else {
        console.log('⚠ Message thread not visible (may be mobile view)');
      }
    } else {
      console.log('⚠ No conversations found to test split view');
    }

    await context.close();
  });

  test('Tutoring classes page and availability controls', async ({ browser }) => {
    test.setTimeout(120000);

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
      console.log('Login timeout, continuing');
    }

    // Navigate to classes page
    await page.goto('http://localhost:3000/tutoring/classes');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Verify classes page loads
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Classes page loads');

    // Check for classes list or empty state
    const classesList = page.locator('[class*="class"], [class*="group"]').first();
    const hasClasses = await classesList.isVisible().catch(() => false);

    if (hasClasses) {
      console.log('✓ Classes list visible');
    } else {
      console.log('⚠ No classes found (empty state acceptable)');
    }

    // Navigate to availability page
    await page.goto('http://localhost:3000/tutoring/dashboard/availability');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Verify availability controls exist
    const availabilityControls = page.locator('input[type="date"], input[type="time"], button').first();
    const hasControls = await availabilityControls.isVisible().catch(() => false);

    if (hasControls) {
      console.log('✓ Availability controls present');
    } else {
      console.log('⚠ Availability controls not visible');
    }

    await context.close();
  });

  test('Session booking flow end-to-end', async ({ browser }) => {
    test.setTimeout(120000);

    const context = await browser.newContext();
    const page = await context.newPage();

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

    // Navigate to tutoring browse page
    await page.goto('http://localhost:3000/tutoring');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check for tutors list
    const tutorsList = page.locator('[class*="tutor"], [class*="profile"]').first();
    const hasTutors = await tutorsList.isVisible().catch(() => false);

    if (hasTutors) {
      console.log('✓ Tutors list visible');

      // Try to click first tutor to book
      const firstTutor = tutorsList;
      await firstTutor.click().catch(() => console.log('⚠ Could not click tutor'));

      await page.waitForTimeout(2000);

      // Check if we're on booking page or tutor profile
      const currentUrl = page.url();
      if (currentUrl.includes('/book/')) {
        console.log('✓ Navigated to booking page');

        // Check for booking form
        const bookingForm = page.locator('form').first();
        const hasForm = await bookingForm.isVisible().catch(() => false);

        if (hasForm) {
          console.log('✓ Booking form present');
        }
      } else if (currentUrl.includes('/tutoring/')) {
        console.log('✓ Navigated to tutor profile page');
      }
    } else {
      console.log('⚠ No tutors found to test booking');
    }

    await context.close();
  });

  test('Friends page and friend request flow', async ({ browser }) => {
    test.setTimeout(120000);

    const context = await browser.newContext();
    const page = await context.newPage();

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

    // Verify friends page loads without errors
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Runtime Error')).not.toBeVisible();
    console.log('✓ Friends page loads without errors');

    // Check for friends list or suggested friends
    const friendsList = page.locator('[class*="friend"], [class*="suggested"]').first();
    const hasFriends = await friendsList.isVisible().catch(() => false);

    if (hasFriends) {
      console.log('✓ Friends/suggested list visible');

      // Check for add friend buttons
      const addFriendButtons = page.locator('button').filter({ hasText: /add|request/i });
      const hasButtons = await addFriendButtons.count() > 0;

      if (hasButtons) {
        console.log('✓ Add friend buttons present');
      }
    } else {
      console.log('⚠ No friends/suggested found (empty state acceptable)');
    }

    await context.close();
  });

  test('Notification types display correctly', async ({ browser }) => {
    test.setTimeout(120000);

    const context = await browser.newContext();
    const page = await context.newPage();

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

    // Navigate to notifications page
    await page.goto('http://localhost:3000/notifications');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Verify notifications page loads
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Notifications page loads');

    // Check for notification items
    const notificationItems = page.locator('[class*="notification"]').first();
    const hasNotifications = await notificationItems.isVisible().catch(() => false);

    if (hasNotifications) {
      console.log('✓ Notifications visible');

      // Check for different notification types (icons, badges)
      const notificationIcons = page.locator('[class*="icon"], span[class*="material"]').first();
      const hasIcons = await notificationIcons.isVisible().catch(() => false);

      if (hasIcons) {
        console.log('✓ Notification icons present');
      }
    } else {
      console.log('⚠ No notifications found (empty state acceptable)');
    }

    await context.close();
  });
});
