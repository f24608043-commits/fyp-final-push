import { test, expect } from '@playwright/test';

test('Button instant feedback - Add Friend shows loading state', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 30000 });
  
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Find Add Friend button
  const addFriendButton = page.locator('button:has-text("Add Friend")').first();
  await expect(addFriendButton).toBeVisible();
  
  // Click and check for loading state
  await addFriendButton.click();
  
  // Check if button shows loading state (disabled or spinner)
  const isDisabled = await addFriendButton.isDisabled();
  const hasSpinner = await page.locator('button:has-text("Adding...")').count() > 0;
  
  console.log(`Add Friend button - Disabled: ${isDisabled}, Has spinner: ${hasSpinner}`);
  expect(isDisabled || hasSpinner).toBeTruthy();
});

test('Button instant feedback - Book Session shows loading state', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 30000 });
  
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Find Book Session button
  const bookSessionButton = page.locator('button:has-text("Book Session")').first();
  await expect(bookSessionButton).toBeVisible();
  
  // Click and check for loading state
  await bookSessionButton.click();
  
  // Check if button shows loading state
  const isDisabled = await bookSessionButton.isDisabled();
  const hasSpinner = await page.locator('button:has-text("Booking...")').count() > 0;
  
  console.log(`Book Session button - Disabled: ${isDisabled}, Has spinner: ${hasSpinner}`);
  expect(isDisabled || hasSpinner).toBeTruthy();
});
