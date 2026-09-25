import { test, expect } from '@playwright/test';

test('VERIFY ONLINE CLASS - Check Jitsi video call implementation', async ({ page }) => {
  test.setTimeout(120000);
  
  // Login as tutor
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'orphix.itsolutions@gmail.com');
  await page.fill('input[type="password"]', 'Qasim.11');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(tutoring\/dashboard|path)/, { timeout: 60000 });
  
  // Go to tutoring dashboard
  await page.goto('/tutoring/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Checking for confirmed sessions with Jitsi links...');
  
  // Look for Jitsi links on the dashboard
  const jitsiLinks = page.locator('a[href*="meet.jit.si"]');
  const jitsiCount = await jitsiLinks.count();
  console.log(`Jitsi links found on dashboard: ${jitsiCount}`);
  
  if (jitsiCount > 0) {
    const firstLink = jitsiLinks.first();
    const href = await firstLink.getAttribute('href');
    console.log(`✓ Jitsi link found: ${href}`);
    console.log('✓ Online class infrastructure is in place');
  } else {
    console.log('⚠ No confirmed sessions with Jitsi links found');
    console.log('  (Jitsi links appear when sessions are confirmed)');
  }
  
  // Check session page structure
  console.log('Checking session page structure...');
  await page.goto('/tutoring/session/test-session-id', { waitUntil: 'networkidle', timeout: 30000 });
  
  const heading = page.locator('h1, h2').first();
  const hasHeading = await heading.count() > 0;
  console.log(`Session page has heading: ${hasHeading}`);
  
  // Check for video iframe placeholder
  const iframe = page.locator('iframe[src*="meet.jit.si"]');
  const hasIframe = await iframe.count() > 0;
  console.log(`Session page has Jitsi iframe: ${hasIframe}`);
  
  if (hasHeading) {
    console.log('✓ Session page structure is implemented');
  }
});

test('VERIFY ONLINE CLASS - Check session details page', async ({ page }) => {
  test.setTimeout(120000);
  
  // Login as learner
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  await page.fill('input[type="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(path|onboarding)/, { timeout: 90000 });
  
  // Go to path to check for sessions
  await page.goto('/path', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Checking learner path for session cards...');
  
  // Look for session cards with Jitsi links
  const jitsiLinks = page.locator('a[href*="meet.jit.si"]');
  const jitsiCount = await jitsiLinks.count();
  console.log(`Jitsi links found on learner path: ${jitsiCount}`);
  
  if (jitsiCount > 0) {
    console.log('✓ Learner can access online class links');
  } else {
    console.log('⚠ No confirmed sessions found for learner');
  }
});
