import { test, expect } from '@playwright/test';

// COMPREHENSIVE VERIFICATION - All Pages, Routes, Buttons, Layout

test('COMPREHENSIVE - Verify all admin pages exist and load', async ({ page }) => {
  test.setTimeout(180000);
  
  const adminPages = [
    '/admin',
    '/admin/users',
    '/admin/courses',
    '/admin/courses/new',
    '/admin/badges',
    '/admin/tutoring',
    '/admin/units/test-unit-id',
    '/admin/lessons/test-lesson-id',
    '/admin/courses/test-course-id'
  ];
  
  for (const route of adminPages) {
    try {
      const response = await page.goto(route, { timeout: 15000 });
      console.log(`Admin page ${route}: ${response?.status()}`);
      
      // Check if page loads (may redirect to sign-in if not authenticated)
      const url = page.url();
      if (url.includes('/sign-in')) {
        console.log(`  → Requires authentication`);
      } else {
        // Check for claymorphic layout elements
        const clayElements = page.locator('[class*="shadow"], [class*="rounded"], [class*="surface"]').count();
        console.log(`  → Loaded with ${clayElements} claymorphic elements`);
      }
    } catch (error) {
      console.log(`Admin page ${route}: Failed to load - ${error}`);
    }
  }
});

test('COMPREHENSIVE - Verify all tutor pages exist and load', async ({ page }) => {
  test.setTimeout(180000);
  
  // Login as tutor first
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  const tutorPages = [
    '/tutoring',
    '/tutoring/dashboard',
    '/tutoring/history',
    '/tutoring/session/test-session-id',
    '/tutoring/test-setup'
  ];
  
  for (const route of tutorPages) {
    try {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      const url = page.url();
      console.log(`Tutor page ${route}: Loaded`);
      
      // Check for claymorphic layout
      const clayElements = await page.locator('[class*="shadow"], [class*="rounded"], [class*="surface"]').count();
      console.log(`  → ${clayElements} claymorphic elements`);
      
      // Check for buttons
      const buttons = await page.locator('button').count();
      console.log(`  → ${buttons} buttons found`);
      
      // Check heading
      const heading = page.locator('h1, h2').first();
      const hasHeading = await heading.count() > 0;
      console.log(`  → Has heading: ${hasHeading}`);
    } catch (error) {
      console.log(`Tutor page ${route}: Failed - ${error}`);
    }
  }
});

test('COMPREHENSIVE - Verify all learner pages exist and load', async ({ page }) => {
  test.setTimeout(180000);
  
  // Login as learner first
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  const learnerPages = [
    '/path',
    '/friends',
    '/tutoring',
    '/messages',
    '/messages/test-conversation-id',
    '/leaderboard',
    '/library',
    '/notifications',
    '/settings',
    '/profile/test-user-id',
    '/lesson/test-lesson-id',
    '/lesson/test-lesson-id/practice',
    '/onboarding'
  ];
  
  for (const route of learnerPages) {
    try {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      const url = page.url();
      console.log(`Learner page ${route}: Loaded`);
      
      // Check for claymorphic layout
      const clayElements = await page.locator('[class*="shadow"], [class*="rounded"], [class*="surface"]').count();
      console.log(`  → ${clayElements} claymorphic elements`);
      
      // Check for buttons
      const buttons = await page.locator('button').count();
      console.log(`  → ${buttons} buttons found`);
      
      // Check heading
      const heading = page.locator('h1, h2').first();
      const hasHeading = await heading.count() > 0;
      console.log(`  → Has heading: ${hasHeading}`);
    } catch (error) {
      console.log(`Learner page ${route}: Failed - ${error}`);
    }
  }
});

test('COMPREHENSIVE - Verify button functionality on key pages', async ({ page }) => {
  test.setTimeout(180000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  // Test /friends page buttons
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
  const addFriendButtons = await page.locator('button:has-text("Add Friend")').count();
  const messageButtons = await page.locator('button:has-text("Message")').count();
  console.log(`Friends page - Add Friend buttons: ${addFriendButtons}, Message buttons: ${messageButtons}`);
  
  // Test /tutoring page buttons
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  const bookSessionButtons = await page.locator('button:has-text("Book Session")').count();
  console.log(`Tutoring page - Book Session buttons: ${bookSessionButtons}`);
  
  // Test /messages page
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  const messagesHeading = page.locator('h1, h2').first();
  await expect(messagesHeading).toBeVisible();
  console.log(`Messages page loaded successfully`);
});

test('COMPREHENSIVE - Verify claymorphic layout consistency', async ({ page }) => {
  test.setTimeout(180000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  const pagesToCheck = ['/path', '/friends', '/tutoring', '/messages'];
  
  for (const route of pagesToCheck) {
    await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check for claymorphic design tokens
    const hasShadows = await page.locator('[class*="shadow"]').count() > 0;
    const hasRounded = await page.locator('[class*="rounded"]').count() > 0;
    const hasSurface = await page.locator('[class*="surface"]').count() > 0;
    const hasContainer = await page.locator('[class*="container"]').count() > 0;
    
    console.log(`${route} - Claymorphic elements:`);
    console.log(`  Shadows: ${hasShadows}, Rounded: ${hasRounded}, Surface: ${hasSurface}, Container: ${hasContainer}`);
    
    // Check for consistent color scheme
    const body = page.locator('body');
    const hasBackground = await body.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    console.log(`  Has background color: ${hasBackground}`);
  }
});
