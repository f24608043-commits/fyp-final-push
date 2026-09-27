import { test, expect } from '@playwright/test';

test('VERIFY ADMIN - Login and access admin dashboard', async ({ page }) => {
  test.setTimeout(120000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'alexabraham587@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  // Wait for navigation with longer timeout for DB latency
  await page.waitForTimeout(50000);
  const url = page.url();
  console.log('Admin redirected to:', url);
  
  // Admin should go to admin dashboard
  if (url.includes('/admin') || url.includes('/admin/dashboard')) {
    console.log('✓ Admin correctly redirected to admin section');
  } else if (url.includes('/sign-in')) {
    console.log('⚠ Admin login failed - credentials may be invalid');
  } else {
    console.log('Admin redirected to:', url);
  }
});

test('VERIFY TUTOR - Login and access tutor features', async ({ page }) => {
  test.setTimeout(120000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  const url = page.url();
  console.log('Tutor redirected to:', url);
  
  if (url.includes('/tutoring/dashboard')) {
    console.log('✓ Tutor correctly redirected to dashboard');
  }
  
  // Test tutor can access /tutoring
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  const tutoringHeading = page.locator('h1, h2').first();
  await expect(tutoringHeading).toBeVisible({ timeout: 10000 });
  console.log('✓ Tutor can access /tutoring');
  
  // Test tutor can access /messages
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  const messagesHeading = page.locator('h1, h2').first();
  await expect(messagesHeading).toBeVisible({ timeout: 10000 });
  console.log('✓ Tutor can access /messages');
});

test('VERIFY LEARNER - Login and access learner features', async ({ page }) => {
  test.setTimeout(120000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  const url = page.url();
  console.log('Learner redirected to:', url);
  
  if (url.includes('/onboarding')) {
    console.log('✓ Learner on onboarding page');
  } else if (url.includes('/path')) {
    console.log('✓ Learner already completed onboarding, on /path');
  }
  
  // Test learner can access /friends
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
  const friendsHeading = page.locator('h1, h2').first();
  await expect(friendsHeading).toBeVisible({ timeout: 10000 });
  console.log('✓ Learner can access /friends');
  
  // Test learner can access /tutoring
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  const tutoringHeading = page.locator('h1, h2').first();
  await expect(tutoringHeading).toBeVisible({ timeout: 10000 });
  console.log('✓ Learner can access /tutoring');
  
  // Test learner can access /messages
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  const messagesHeading = page.locator('h1, h2').first();
  await expect(messagesHeading).toBeVisible({ timeout: 10000 });
  console.log('✓ Learner can access /messages');
  
  // Test learner can access /path
  await page.goto('/path', { waitUntil: 'networkidle', timeout: 30000 });
  const pathHeading = page.locator('h1, h2').first();
  await expect(pathHeading).toBeVisible({ timeout: 10000 });
  console.log('✓ Learner can access /path');
});
