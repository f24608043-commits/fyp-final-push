import { test, expect } from '@playwright/test';

test('Measure load times for key pages', async ({ page }) => {
  test.setTimeout(120000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 30000 });
  const url = page.url();
  if (url.includes('/onboarding')) {
    await page.goto('/path', { waitUntil: 'networkidle', timeout: 30000 });
  }
  
  const pages = ['/tutoring', '/friends', '/messages'];
  const results = [];
  
  for (const pagePath of pages) {
    const startTime = Date.now();
    await page.goto(pagePath, { waitUntil: 'networkidle', timeout: 30000 });
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    results.push({ page: pagePath, loadTime });
    console.log(`${pagePath}: ${loadTime}ms`);
  }
  
  // Test /tutoring/dashboard as tutor
  await page.goto('/sign-out');
  await page.waitForURL('/sign-in', { timeout: 15000 });
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 30000 });
  
  const startTime = Date.now();
  await page.goto('/tutoring/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  const endTime = Date.now();
  const loadTime = endTime - startTime;
  results.push({ page: '/tutoring/dashboard', loadTime });
  console.log(`/tutoring/dashboard: ${loadTime}ms`);
  
  console.log('=== LATENCY RESULTS ===');
  results.forEach(r => console.log(`${r.page}: ${r.loadTime}ms`));
});
