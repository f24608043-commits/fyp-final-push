import { Page } from '@playwright/test';

export async function loginAsTutor(page: Page) {
  await page.goto('http://localhost:3000/sign-in');
  
  // Fill in tutor credentials
  await page.fill('input[name="email"]', process.env.TEST_TUTOR_EMAIL || 'tutor@example.com');
  await page.fill('input[name="password"]', process.env.TEST_TUTOR_PASSWORD || 'tutorpassword');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation - should land on dashboard or home, NOT sign-in
  await page.waitForLoadState('networkidle');
  
  const currentUrl = page.url();
  if (currentUrl.includes('/sign-in')) {
    throw new Error('Login failed - still on sign-in page');
  }
}

export async function loginAsLearner(page: Page) {
  await page.goto('http://localhost:3000/sign-in');
  
  // Fill in learner credentials
  await page.fill('input[name="email"]', process.env.TEST_LEARNER_EMAIL || 'learner@example.com');
  await page.fill('input[name="password"]', process.env.TEST_LEARNER_PASSWORD || 'learnerpassword');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForLoadState('networkidle');
  
  const currentUrl = page.url();
  if (currentUrl.includes('/sign-in')) {
    throw new Error('Login failed - still on sign-in page');
  }
}
