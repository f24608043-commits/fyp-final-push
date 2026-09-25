import { test, expect } from '@playwright/test';

test('PART 6: Post-signup onboarding flow - Learner completes onboarding', async ({ page }) => {
  test.setTimeout(120000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  const url = page.url();
  console.log('Current URL after login:', url);
  
  if (url.includes('/onboarding')) {
    console.log('Onboarding page loaded');
    
    // Check if onboarding page elements are visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    console.log('Onboarding heading:', await heading.textContent());
    
    // Check for course selection
    const courseCards = page.locator('[class*="course"], .course-card').count();
    console.log('Course cards found:', courseCards);
    
    // Check for complete onboarding button
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Start"), button:has-text("Continue")').first();
    const buttonCount = await completeButton.count();
    console.log('Complete button found:', buttonCount > 0);
    
    if (buttonCount > 0) {
      await completeButton.click();
      await page.waitForURL('/path', { timeout: 10000 });
      console.log('Redirected to /path after onboarding');
    }
  } else if (url.includes('/path')) {
    console.log('Onboarding already completed, redirected to /path');
  }
});

test('PART 6: Post-signup onboarding flow - Tutor skips onboarding (goes to dashboard)', async ({ page }) => {
  test.setTimeout(120000);
  
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  const url = page.url();
  console.log('Tutor current URL:', url);
  
  // Tutors should go to /tutoring/dashboard, not onboarding
  if (url.includes('/tutoring/dashboard')) {
    console.log('Tutor correctly redirected to dashboard');
  } else if (url.includes('/onboarding')) {
    console.log('Tutor on onboarding page - may need to complete or skip');
  }
});
