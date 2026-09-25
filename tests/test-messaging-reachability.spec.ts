import { test, expect } from '@playwright/test';

test('PART 4.1: /messages loads for learner', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Learner /messages loads:', await heading.textContent());
});

test('PART 4.1: /messages loads for tutor', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 30000 });
  
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Tutor /messages loads:', await heading.textContent());
});
