import { test, expect } from '@playwright/test';

test('PART 4.1: /messages loads for learner', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('Logged in as learner');
  
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 60000 });
  
  await expect(page.locator('body')).toBeVisible();
  console.log('Messages page loaded successfully for learner');
});

test('PART 4.1: /messages loads for tutor', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  console.log('Logged in as tutor');
  
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 60000 });
  
  await expect(page.locator('body')).toBeVisible();
  console.log('Messages page loaded successfully for tutor');
});
