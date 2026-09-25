import { test, expect } from '@playwright/test';

test('Measure /messages load time', async ({ page }) => {
  test.setTimeout(60000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 30000 });
  
  const startTime = Date.now();
  await page.goto('/messages', { waitUntil: 'networkidle', timeout: 30000 });
  const endTime = Date.now();
  const loadTime = endTime - startTime;
  console.log(`/messages: ${loadTime}ms`);
});
