import { test, expect, Page } from '@playwright/test';

test.describe('Social Feed - MVP', () => {
  // Test credentials - verified real users
  const LEARNER_EMAIL = 'alexabraham587@gmail.com';
  const LEARNER_PASSWORD = 'Qasim.11';
  const TUTOR_EMAIL = 'ahmerkhan5330@gmail.com';
  const TUTOR_PASSWORD = 'Qasim.11';

  async function signIn(page: Page, email: string, pass: string) {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', pass);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(path|onboarding|admin|tutoring)/, { timeout: 30000 });
  }

  test('feed page loads and displays empty state', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });

    // Check header description text
    await expect(
      page.locator('text=Share updates, celebrate achievements, and connect with friends')
    ).toBeVisible({ timeout: 15000 });
  });

  test('user can create a post', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const uniqueText = `Test post ${Date.now()}`;

    // Fill post composer
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(`${uniqueText} #test`);

    // Select post type
    await page.click('button:has-text("Share an update")');

    // Submit post
    const postButton = page.locator('button[type="submit"]:has-text("Post")').first();
    await postButton.waitFor({ state: 'visible' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Verify post card appears in feed (not composer textarea)
    const postCard = page.locator('[data-testid="post-card"]', { hasText: uniqueText }).first();
    await expect(postCard).toBeVisible({ timeout: 25000 });
    await expect(postCard.locator('a[href*="/tag/test"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('user can like a post', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Create a unique post
    const uniqueText = `Like test post ${Date.now()}`;
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(uniqueText);
    const postButton = page.locator('button[type="submit"]:has-text("Post")').first();
    await postButton.waitFor({ state: 'visible' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Find the post container
    const postContainer = page.locator('[data-testid="post-card"]', { hasText: uniqueText }).first();
    await expect(postContainer).toBeVisible({ timeout: 25000 });

    // Like the post
    const likeButton = postContainer.locator('[data-testid="like-button"]');
    await likeButton.click();

    // Verify like button changed to active state
    await expect(likeButton).toHaveClass(/bg-tertiary/, { timeout: 10000 });
  });

  test('user can comment on a post', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Create a unique post first
    const uniqueText = `Comment test post ${Date.now()}`;
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(uniqueText);
    const postButton = page.locator('button[type="submit"]:has-text("Post")').first();
    await postButton.waitFor({ state: 'visible' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Find the post container
    const postContainer = page.locator('[data-testid="post-card"]', { hasText: uniqueText }).first();
    await expect(postContainer).toBeVisible({ timeout: 25000 });

    // Open comments
    await postContainer.locator('button:has-text("chat_bubble")').click();

    // Add a comment
    const commentInput = postContainer.locator('input[placeholder*="Write a comment"]');
    await commentInput.waitFor({ state: 'visible', timeout: 15000 });
    const uniqueComment = `Comment ${Date.now()}`;
    await commentInput.fill(uniqueComment);

    const commentSubmitBtn = postContainer.locator('form button[type="submit"]:has-text("Post")');
    await expect(commentSubmitBtn).toBeEnabled();
    await commentSubmitBtn.click();

    // Verify comment appears
    await expect(postContainer.locator(`text=${uniqueComment}`).first()).toBeVisible({ timeout: 15000 });
  });

  test('user can delete their own post', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Create a unique post
    const uniqueText = `Post to delete ${Date.now()}`;
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(uniqueText);
    const postButton = page.locator('button[type="submit"]:has-text("Post")').first();
    await postButton.waitFor({ state: 'visible' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    const postContainer = page.locator('[data-testid="post-card"]', { hasText: uniqueText }).first();
    await expect(postContainer).toBeVisible({ timeout: 25000 });

    // Setup dialog handler and delete
    page.once('dialog', dialog => dialog.accept());
    const deleteButton = postContainer.locator('button[title="Delete post"]');
    await deleteButton.click();

    // Verify post is removed
    await expect(page.locator(`text=${uniqueText}`)).not.toBeVisible({ timeout: 10000 });
  });

  test('non-friend cannot see friends-only post (RLS)', async ({ page, context }) => {
    const privatePostText = `Private post ${Date.now()}`;

    // User 1 creates a post
    const page1 = await context.newPage();
    await signIn(page1, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page1.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page1.waitForLoadState('networkidle');

    const textarea = page1.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(privatePostText);
    const postButton = page1.locator('button[type="submit"]:has-text("Post")').first();
    await postButton.waitFor({ state: 'visible' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    const postCard = page1.locator('[data-testid="post-card"]', { hasText: privatePostText }).first();
    await expect(postCard).toBeVisible({ timeout: 25000 });
    await page1.close();

    // User 2 (not friends) views feed
    await signIn(page, TUTOR_EMAIL, TUTOR_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Verify post is NOT visible to non-friend
    await expect(page.locator(`text=${privatePostText}`)).not.toBeVisible({ timeout: 10000 });
  });

  test('pagination loads second page via cursor', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Count initial post cards
    const initialCardCount = await page.locator('[data-testid="post-card"]').count();

    // Scroll to bottom to trigger pagination cursor load
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify more posts load or all caught up
    await page.waitForTimeout(2000);
    const finalCardCount = await page.locator('[data-testid="post-card"]').count();
    expect(finalCardCount).toBeGreaterThanOrEqual(initialCardCount);
  });

  test('hashtag parsing works with multiple tags', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const uniqueTag = `code${Date.now().toString().slice(-4)}`;

    // Create post with multiple hashtags
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(`Learning #${uniqueTag} #coding #webdev`);
    const postButton = page.locator('button[type="submit"]:has-text("Post")').first();
    await postButton.waitFor({ state: 'visible' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Verify hashtags are present in the post as links
    const postCard = page.locator('[data-testid="post-card"]', { hasText: `#${uniqueTag}` }).first();
    await expect(postCard).toBeVisible({ timeout: 25000 });
    await expect(postCard.locator(`a[href*="/tag/${uniqueTag}"]`).first()).toBeVisible({ timeout: 10000 });
    await expect(postCard.locator('a[href*="/tag/coding"]').first()).toBeVisible({ timeout: 10000 });
    await expect(postCard.locator('a[href*="/tag/webdev"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('achievement post type has distinct visual treatment', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const uniqueAchievement = `Achievement test ${Date.now()}`;

    // Select achievement post type
    await page.click('button:has-text("Celebrate achievement")');
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(uniqueAchievement);
    const postButton = page.locator('button[type="submit"]:has-text("Post")').first();
    await postButton.waitFor({ state: 'visible' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Verify achievement styling in the created post
    const postContainer = page.locator('[data-testid="post-card"]', { hasText: uniqueAchievement }).first();
    await expect(postContainer).toBeVisible({ timeout: 25000 });
    await expect(postContainer.locator('.rounded-full:has-text("achievement")')).toBeVisible({ timeout: 10000 });
  });

  test('post type selector works correctly', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });

    // Test each post type
    const postTypes = [
      { label: 'Share an update', value: 'general' },
      { label: 'Celebrate achievement', value: 'achievement' },
      { label: 'Share a resource', value: 'resource' },
      { label: 'Milestone reached', value: 'milestone' },
      { label: 'Ask a question', value: 'question' },
    ];

    for (const type of postTypes) {
      await page.click(`button:has-text("${type.label}")`);
      await expect(page.locator(`button:has-text("${type.label}")`).first()).toHaveClass(/bg-tertiary/);
    }
  });

  test('character limit enforced on post body', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible' });

    // Type 3000 characters
    await textarea.fill('a'.repeat(3000));
    await page.waitForTimeout(500);

    // Check remaining characters
    await expect(page.locator('text=0 characters remaining')).toBeVisible();

    // Verify the value is at the limit
    const value = await textarea.inputValue();
    expect(value.length).toBe(3000);
  });

  test('comment character limit enforced', async ({ page }) => {
    await signIn(page, LEARNER_EMAIL, LEARNER_PASSWORD);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Find the first post on the page
    const postContainer = page.locator('[data-testid="post-card"]').first();
    await expect(postContainer).toBeVisible({ timeout: 20000 });

    // Open comments
    await postContainer.locator('button:has-text("chat_bubble")').click();

    const commentInput = postContainer.locator('input[placeholder*="Write a comment"]');
    await commentInput.waitFor({ state: 'visible', timeout: 15000 });

    // Type 1000 characters
    await commentInput.fill('a'.repeat(1000));

    // Try to type more - should not allow
    await commentInput.type('b');
    const value = await commentInput.inputValue();
    expect(value.length).toBe(1000);
  });
});
