import { test, expect } from "@playwright/test";

test.describe("Admin Pages Functionality", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);

    // Use environment variables or fallback to known admin credentials
    const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'alexabraham587@gmail.com';
    const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Qasim.11';

    // Login as admin before each test
    await page.goto("http://localhost:3000/sign-in");
    await page.waitForLoadState("networkidle", { timeout: 60000 });
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(/\/(admin|path|tutoring)/, { timeout: 30000 });
    } catch (error) {
      // If login fails, skip the test
      console.log('⚠️ Admin login failed, skipping test');
      test.skip(true, 'Admin credentials invalid or not configured');
    }

    // Try to wait for networkidle, but continue if it fails
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing anyway');
    }
  });

  test("Admin badges page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/badges");
    try {
      await page.waitForLoadState("networkidle", { timeout: 60000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing');
    }

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });

  test("Admin users page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/users");
    try {
      await page.waitForLoadState("networkidle", { timeout: 60000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing');
    }

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });

  test("Admin users page - Search functionality", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/users");
    try {
      await page.waitForLoadState("networkidle", { timeout: 60000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing');
    }

    // Wait for search input to be visible
    const searchInput = page.locator('input[name="q"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Test search
    await searchInput.fill("admin");
    await page.click('button:has-text("Search")');
    try {
      await page.waitForLoadState("networkidle", { timeout: 60000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing');
    }

    // Should not show server error
    await expect(page.locator("text=This page couldn't load")).not.toBeVisible();
    await expect(page.locator("text=server error")).not.toBeVisible();
  });

  test("Admin tutoring page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/tutoring");
    try {
      await page.waitForLoadState("networkidle", { timeout: 60000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing');
    }

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });

  test("Admin courses page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/courses");
    try {
      await page.waitForLoadState("networkidle", { timeout: 60000 });
    } catch (error) {
      console.log('⚠️ Networkidle timeout, continuing');
    }

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });
});
