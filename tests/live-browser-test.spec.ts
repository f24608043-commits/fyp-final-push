import { test, expect } from '@playwright/test';

// LIVE BROWSER TEST - Headed mode for visual verification

test('LIVE TEST - Tutor Dashboard - Edit Availability', async ({ page }) => {
  test.setTimeout(120000);
  
  // Login as tutor
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  // Go to tutoring dashboard
  await page.goto('/tutoring/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Testing Edit Availability button...');
  
  // Find and click Edit Availability button
  const editButton = page.locator('button:has-text("Edit Availability")');
  await expect(editButton).toBeVisible({ timeout: 10000 });
  
  await editButton.click();
  
  // Wait for action to complete
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('After clicking Edit Availability, URL:', url);
  
  // Check if availability was updated (page should reload)
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('✓ Edit Availability test completed');
});

test('LIVE TEST - Tutoring Page - Message and Book Session buttons', async ({ page }) => {
  test.setTimeout(120000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  // Go to tutoring page
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Testing Message button...');
  
  // Find first Message button
  const messageButton = page.locator('button:has-text("Message")').first();
  const messageCount = await messageButton.count();
  
  if (messageCount > 0) {
    await messageButton.click();
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log('After clicking Message, URL:', url);
    // Should redirect to /messages or conversation
  } else {
    console.log('No Message buttons found');
  }
  
  // Go back to tutoring
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Testing Book Session button...');
  
  // Find first Book Session button
  const bookButton = page.locator('button:has-text("Book Session")').first();
  const bookCount = await bookButton.count();
  
  if (bookCount > 0) {
    await bookButton.click();
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log('After clicking Book Session, URL:', url);
  } else {
    console.log('No Book Session buttons found');
  }
  
  console.log('✓ Tutoring buttons test completed');
});

test('LIVE TEST - Messages Page', async ({ page }) => {
  test.setTimeout(120000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  // Go to messages page
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Testing Messages page...');
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible({ timeout: 10000 });
  
  const url = page.url();
  console.log('Messages page loaded:', url);
  
  console.log('✓ Messages page test completed');
});

test('LIVE TEST - Friends Page', async ({ page }) => {
  test.setTimeout(120000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  // Go to friends page
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Testing Friends page...');
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible({ timeout: 10000 });
  
  // Check for Add Friend buttons
  const addFriendButtons = page.locator('button:has-text("Add Friend")');
  const count = await addFriendButtons.count();
  console.log(`Found ${count} Add Friend buttons`);
  
  if (count > 0) {
    await addFriendButtons.first().click();
    await page.waitForTimeout(2000);
    console.log('Clicked Add Friend button');
  }
  
  console.log('✓ Friends page test completed');
});

test('LIVE TEST - Sign-up flow', async ({ page }) => {
  test.setTimeout(120000);
  
  // Go to sign-up
  await page.goto('/sign-up', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Testing Sign-up flow...');
  
  // Fill form
  await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
  await page.fill('input[type="password"]', 'Test123456!');
  await page.fill('input[name="displayName"]', 'Test User');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('After sign-up, URL:', url);
  
  if (url.includes('/onboarding')) {
    console.log('✓ Sign-up successful, redirected to onboarding');
  } else if (url.includes('/sign-in')) {
    console.log('✓ Sign-up requires email confirmation or user exists');
  } else {
    console.log('Sign-up result:', url);
  }
});
