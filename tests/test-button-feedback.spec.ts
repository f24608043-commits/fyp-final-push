import { test, expect } from '@playwright/test';

test('Button instant feedback - Add Friend shows loading state', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('Logged in as learner');
  
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 60000 });
  
  const addFriendButtons = page.locator('button:has-text("Add Friend")');
  const count = await addFriendButtons.count();
  
  if (count > 0) {
    const firstButton = addFriendButtons.first();
    await firstButton.click();
    
    // Check for loading state
    const isLoading = await firstButton.getAttribute('disabled') !== null || 
                      await firstButton.getAttribute('aria-disabled') === 'true';
    
    expect(isLoading).toBeTruthy();
  } else {
    test.skip(true, 'No Add Friend buttons found');
  }
});

test('Button instant feedback - Book Session shows loading state', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('Logged in as learner');
  
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 60000 });
  
  const bookButtons = page.locator('button:has-text("Book Session")');
  const count = await bookButtons.count();
  
  if (count > 0) {
    const firstButton = bookButtons.first();
    await firstButton.click();
    
    // Check for loading state
    const isLoading = await firstButton.getAttribute('disabled') !== null || 
                      await firstButton.getAttribute('aria-disabled') === 'true';
    
    expect(isLoading).toBeTruthy();
  } else {
    test.skip(true, 'No Book Session buttons found');
  }
});
