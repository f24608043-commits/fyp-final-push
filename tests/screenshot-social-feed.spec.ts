import { test, expect } from '@playwright/test';

test.describe('Social Feed Screenshots', () => {
  const LEARNER_EMAIL = 'learner@example.com';
  const LEARNER_PASSWORD = 'password123';

  test.beforeEach(async ({ page }) => {
    test.skip(true, 'Database migration not yet applied - run: supabase db push');
  });

  test('screenshot feed at 390px (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'evidence/feed-mobile-390px.png',
      fullPage: true,
    });
  });

  test('screenshot feed at 1440px (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'evidence/feed-desktop-1440px.png',
      fullPage: true,
    });
  });

  test('screenshot feed with posts at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a test post
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Test post for screenshot #screenshot');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'evidence/feed-with-posts-mobile-390px.png',
      fullPage: true,
    });
  });

  test('screenshot feed with posts at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a test post
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Test post for screenshot #screenshot');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'evidence/feed-with-posts-desktop-1440px.png',
      fullPage: true,
    });
  });

  test('screenshot post composer at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Focus on composer
    await page.click('textarea[placeholder*="What\'s on your mind?"]');

    // Take screenshot of composer
    await page.screenshot({
      path: 'evidence/feed-composer-mobile-390px.png',
      fullPage: false,
    });
  });

  test('screenshot post composer at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Focus on composer
    await page.click('textarea[placeholder*="What\'s on your mind?"]');

    // Take screenshot of composer
    await page.screenshot({
      path: 'evidence/feed-composer-desktop-1440px.png',
      fullPage: false,
    });
  });

  test('screenshot post card with comments at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a post with comment
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Test post with comments');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Open comments
    await page.click('button:has-text("chat_bubble")');
    await page.fill('input[placeholder*="Write a comment"]', 'Test comment');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'evidence/feed-comments-mobile-390px.png',
      fullPage: true,
    });
  });

  test('screenshot post card with comments at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a post with comment
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Test post with comments');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Open comments
    await page.click('button:has-text("chat_bubble")');
    await page.fill('input[placeholder*="Write a comment"]', 'Test comment');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'evidence/feed-comments-desktop-1440px.png',
      fullPage: true,
    });
  });
});
