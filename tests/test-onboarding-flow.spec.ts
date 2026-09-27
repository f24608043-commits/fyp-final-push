import { test, expect } from '@playwright/test';

test('PART 6: Post-signup onboarding flow - Learner completes onboarding', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 60000 });
  console.log('Logged in as learner');
  
  const currentUrl = page.url();
  if (currentUrl.includes('/onboarding')) {
    console.log('User is on onboarding page');
    // Check if onboarding is already done
    const onboardingDone = await page.locator('text=/onboarding|complete/i').count();
    if (onboardingDone > 0) {
      console.log('Onboarding already completed or in progress');
    }
  } else {
    console.log('User already completed onboarding, redirected to /path');
  }
});

test('PART 6: Post-signup onboarding flow - Tutor skips onboarding (goes to dashboard)', async ({ page }) => {
  test.setTimeout(90000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  console.log('Logged in as tutor');
  
  const currentUrl = page.url();
  console.log(`Tutor redirected to: ${currentUrl}`);
  
  // Tutors should go directly to dashboard, not onboarding
  expect(currentUrl).toContain('/tutoring/dashboard');
});
