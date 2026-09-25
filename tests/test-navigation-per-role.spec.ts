import { test, expect } from '@playwright/test';

test('PART 7: Navigation - Learner redirects to /path or /onboarding', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  const url = page.url();
  console.log('Learner redirected to:', url);
  
  expect(url).toMatch(/\/(path|onboarding)/);
});

test('PART 7: Navigation - Tutor redirects to /tutoring/dashboard', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  const url = page.url();
  console.log('Tutor redirected to:', url);
  
  // Tutors should go to dashboard (or path if no profile)
  expect(url).toMatch(/\/(tutoring\/dashboard|path)/);
});

test('PART 7: Navigation - Learner can access /friends', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  await page.goto('/friends', { waitUntil: 'networkidle', timeout: 30000 });
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Learner /friends accessible');
});

test('PART 7: Navigation - Learner can access /tutoring', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  await page.goto('/tutoring', { waitUntil: 'networkidle', timeout: 30000 });
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Learner /tutoring accessible');
});

test('PART 7: Navigation - Tutor can access /messages', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Tutor /messages accessible');
});
