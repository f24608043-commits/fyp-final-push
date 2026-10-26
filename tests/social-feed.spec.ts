import { test, expect } from '@playwright/test';

test.describe('Social Feed - MVP', () => {
  // Test credentials
  const LEARNER_EMAIL = 'learner@example.com';
  const LEARNER_PASSWORD = 'password123';
  const TUTOR_EMAIL = 'tutor@example.com';
  const TUTOR_PASSWORD = 'password123';

  test.beforeEach(async ({ page }) => {
    // Migration has been applied
  });

  test('feed page loads and displays empty state', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    // Navigate to feed
    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Check empty state
    await expect(page.locator('text=No posts yet')).toBeVisible();
    await expect(page.locator('text=Share something or follow a friend')).toBeVisible();
  });

  test('user can create a post', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Fill post composer
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'This is a test post #test');
    
    // Select post type
    await page.click('text=Share an update');

    // Submit post
    await page.click('button:has-text("Post")');
    
    // Wait for post to appear (page reloads)
    await page.waitForLoadState('networkidle');

    // Verify post appears
    await expect(page.locator('text=This is a test post')).toBeVisible();
    await expect(page.locator('text=#test')).toBeVisible();
  });

  test('user can like a post', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a post first
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Test post for likes');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Like the post
    const likeButton = page.locator('button:has-text("favorite_border")').first();
    await likeButton.click();

    // Verify like count increased and icon changed
    await expect(page.locator('text=favorite')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible();
  });

  test('user can comment on a post', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a post first
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Test post for comments');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Open comments
    await page.click('button:has-text("chat_bubble")');

    // Add a comment
    await page.fill('input[placeholder*="Write a comment"]', 'This is a test comment');
    await page.click('button:has-text("Post")');

    // Verify comment appears
    await expect(page.locator('text=This is a test comment')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible(); // Comment count
  });

  test('user can delete their own post', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a post
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Post to be deleted');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Delete the post
    const deleteButton = page.locator('button[title="Delete post"]').first();
    await deleteButton.click();

    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await deleteButton.click();

    // Verify post is removed
    await expect(page.locator('text=Post to be deleted')).not.toBeVisible();
  });

  test('non-friend cannot see friends-only post (RLS)', async ({ page, context }) => {
    // User 1 creates a post
    const page1 = await context.newPage();
    await page1.goto('/sign-in');
    await page1.fill('input[type="email"]', LEARNER_EMAIL);
    await page1.fill('input[type="password"]', LEARNER_PASSWORD);
    await page1.click('button[type="submit"]');
    await page1.waitForURL('/path');

    await page1.click('text=Feed');
    await page1.waitForURL('/feed');

    await page1.fill('textarea[placeholder*="What\'s on your mind?"]', 'Private post for friends only');
    await page1.click('button:has-text("Post")');
    await page1.waitForLoadState('networkidle');

    await page1.close();

    // User 2 (not friends) tries to view feed
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', TUTOR_EMAIL);
    await page.fill('input[type="password"]', TUTOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/tutoring/dashboard');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Verify post is NOT visible
    await expect(page.locator('text=Private post for friends only')).not.toBeVisible();
  });

  test('pagination loads second page via cursor', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create multiple posts to trigger pagination
    for (let i = 0; i < 25; i++) {
      await page.fill('textarea[placeholder*="What\'s on your mind?"]', `Post number ${i + 1}`);
      await page.click('button:has-text("Post")');
      await page.waitForLoadState('networkidle');
    }

    // Scroll to bottom to trigger pagination
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for loading indicator
    await expect(page.locator('text=Loading more posts')).toBeVisible();

    // Wait for second page to load
    await page.waitForLoadState('networkidle');

    // Verify more posts loaded
    const postCount = await page.locator('text=Post number').count();
    expect(postCount).toBeGreaterThan(20);
  });

  test('hashtag parsing works with multiple tags', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create post with multiple hashtags
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Learning #coding #webdev #nextjs');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Verify hashtags are rendered as links
    await expect(page.locator('a:has-text("#coding")')).toBeVisible();
    await expect(page.locator('a:has-text("#webdev")')).toBeVisible();
    await expect(page.locator('a:has-text("#nextjs")')).toBeVisible();
  });

  test('achievement post type has distinct visual treatment', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Select achievement post type
    await page.click('text=Celebrate achievement');
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Just completed my first course!');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Verify achievement styling
    await expect(page.locator('text=achievement')).toBeVisible();
    await expect(page.locator('span:has-text("emoji_events")')).toBeVisible();
  });

  test('post type selector works correctly', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Test each post type
    const postTypes = [
      { label: 'Share an update', value: 'general' },
      { label: 'Celebrate achievement', value: 'achievement' },
      { label: 'Share a resource', value: 'resource' },
      { label: 'Milestone reached', value: 'milestone' },
      { label: 'Ask a question', value: 'question' },
    ];

    for (const type of postTypes) {
      await page.click(`text=${type.label}`);
      await expect(page.locator(`text=${type.label}`).first()).toHaveClass(/bg-tertiary/);
    }
  });

  test('character limit enforced on post body', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    const textarea = page.locator('textarea[placeholder*="What\'s on your mind?"]');
    
    // Type 3000 characters
    await textarea.fill('a'.repeat(3000));
    
    // Check remaining characters
    await expect(page.locator('text=0 characters remaining')).toBeVisible();

    // Try to type more - should not allow
    await textarea.type('b');
    const value = await textarea.inputValue();
    expect(value.length).toBe(3000);
  });

  test('comment character limit enforced', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/path');

    await page.click('text=Feed');
    await page.waitForURL('/feed');

    // Create a post
    await page.fill('textarea[placeholder*="What\'s on your mind?"]', 'Test post');
    await page.click('button:has-text("Post")');
    await page.waitForLoadState('networkidle');

    // Open comments
    await page.click('button:has-text("chat_bubble")');

    const commentInput = page.locator('input[placeholder*="Write a comment"]');
    
    // Type 1000 characters
    await commentInput.fill('a'.repeat(1000));
    
    // Try to type more - should not allow
    await commentInput.type('b');
    const value = await commentInput.inputValue();
    expect(value.length).toBe(1000);
  });
});
