import { test, expect } from "@playwright/test";

test.describe("Admin Pages Functionality", () => {
  test("Admin badges page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/badges");
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });

  test("Admin users page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/users");
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });

  test("Admin users page - Search functionality", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/users");
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Test search
    await page.fill('input[name="q"]', "admin");
    await page.click('button:has-text("Search")');
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Should not show server error
    await expect(page.locator("text=This page couldn't load")).not.toBeVisible();
    await expect(page.locator("text=server error")).not.toBeVisible();
  });

  test("Admin tutoring page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/tutoring");
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });

  test("Admin courses page - Page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/courses");
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Check if page loads without error
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible({ timeout: 30000 });
  });
});
