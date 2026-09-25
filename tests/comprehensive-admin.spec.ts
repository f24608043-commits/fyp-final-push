import { test, expect } from '@playwright/test';

//Comprehensive E2E Test for Admin Role
//Tests: Dashboard navigation, create badge, create course/unit, manage users
//SKIPPED: Admin credentials not available - requires manual setup

test.skip('COMPREHENSIVE ADMIN E2E - Full workflow', async ({ page }) => {
  test.setTimeout(300000);
  
  // Login as admin
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'admin@lego.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin', { timeout: 60000 });
  
  console.log('✓ Admin logged in');
  
  // Verify dashboard loads
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  console.log('✓ Admin dashboard loaded');
  
  // Navigate to badges
  await page.goto('/admin/badges', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to badges page');
  
  // Click create badge button
  const createBadgeButton = page.locator('button:has-text("Create"), button:has-text("Add"), a:has-text("Create")').first();
  const createBadgeCount = await createBadgeButton.count();
  
  if (createBadgeCount > 0) {
    await createBadgeButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked create badge button');
    
    // Fill badge form if present
    const badgeNameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
    const badgeNameCount = await badgeNameInput.count();
    
    if (badgeNameCount > 0) {
      await badgeNameInput.fill(`Test Badge ${Date.now()}`);
      await page.waitForTimeout(1000);
      
      const badgeDescInput = page.locator('textarea[name="description"], input[placeholder*="description"]').first();
      const badgeDescCount = await badgeDescInput.count();
      
      if (badgeDescCount > 0) {
        await badgeDescInput.fill('Test badge for E2E testing');
        await page.waitForTimeout(1000);
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
      await submitButton.click();
      await page.waitForTimeout(3000);
      console.log('✓ Badge form submitted');
    }
  }
  
  // Navigate to courses
  await page.goto('/admin/courses', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to courses page');
  
  // Click new course button
  const newCourseButton = page.locator('button:has-text("New"), button:has-text("Add"), a:has-text("New")').first();
  const newCourseCount = await newCourseButton.count();
  
  if (newCourseCount > 0) {
    await newCourseButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked new course button');
    
    // Fill course form if present
    const courseTitleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
    const courseTitleCount = await courseTitleInput.count();
    
    if (courseTitleCount > 0) {
      await courseTitleInput.fill(`Test Course ${Date.now()}`);
      await page.waitForTimeout(1000);
      
      const courseDescInput = page.locator('textarea[name="description"], input[placeholder*="description"]').first();
      const courseDescCount = await courseDescInput.count();
      
      if (courseDescCount > 0) {
        await courseDescInput.fill('Test course for E2E testing');
        await page.waitForTimeout(1000);
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
      await submitButton.click();
      await page.waitForTimeout(3000);
      console.log('✓ Course form submitted');
    }
  }
  
  // Navigate to users
  await page.goto('/admin/users', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to users page');
  
  // Verify user list loads
  await expect(page.locator('table, .grid, [role="list"]').first()).toBeVisible({ timeout: 10000 });
  console.log('✓ User list loaded');
  
  // Navigate to tutoring management
  await page.goto('/admin/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Navigated to tutoring management');
  
  // Verify tutoring page loads
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  console.log('✓ Tutoring management loaded');
  
  console.log('✅ COMPREHENSIVE ADMIN E2E TEST COMPLETED');
});
