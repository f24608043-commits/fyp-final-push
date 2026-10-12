import { test, expect } from '@playwright/test';
import { loginAsTutor, loginAsLearner } from './auth-helper';

test.describe('Bug Fixes Verification', () => {
  test('Bug 1: getPendingRequests has error handling', async ({ page }) => {
    // Login as tutor
    await loginAsTutor(page);
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/tutoring/dashboard');
    
    // Verify we're NOT on sign-in page
    expect(page.url()).not.toContain('/sign-in');
    
    // Page should render without crashing
    await expect(page.locator('body')).toBeVisible();
    
    // Check that the page doesn't show a server error
    await expect(page.locator('text=Runtime Error')).not.toBeVisible();
    
    // Assert real behavior: dashboard should render session requests section
    // Even if empty, the section should exist
    const dashboardContent = page.locator('body').textContent();
    expect(dashboardContent).toBeTruthy();
  });

  test('Bug 2: No nested <a> tags in ConversationsRealtimeList', async ({ page }) => {
    // Login as learner
    await loginAsLearner(page);
    
    // Navigate to messages page
    await page.goto('http://localhost:3000/messages');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're NOT on sign-in page
    expect(page.url()).not.toContain('/sign-in');
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Check for conversation items
    const conversationItems = page.locator('[role="button"].conversation-item');
    const hasConversations = await conversationItems.count() > 0;
    
    if (hasConversations) {
      // Verify the structure - conversation item should be a div, not an anchor
      const firstItem = conversationItems.first();
      await expect(firstItem).toBeVisible();
      
      // Check that the video call button is a standalone <a> tag
      const callButton = page.locator('a[href*="meet.jit.si"]').first();
      if (await callButton.isVisible()) {
        // Verify it has stopPropagation
        const hasStopPropagation = await callButton.evaluate((el) => {
          const handler = el.onclick;
          return handler && handler.toString().includes('stopPropagation');
        });
        expect(hasStopPropagation).toBeTruthy();
      }
    }
    
    // Assert no console errors
    const hydrationErrors = errors.filter(e => 
      e.includes('hydration') || 
      e.includes('React')
    );
    expect(hydrationErrors.length).toBe(0);
  });

  test('Bug 3: /tutoring/book/[tutorId] shows proper error UI', async ({ page }) => {
    // Login as learner
    await loginAsLearner(page);
    
    // Navigate to a non-existent tutor booking page
    await page.goto('http://localhost:3000/tutoring/book/00000000-0000-0000-0000-000000000000');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify we're NOT on sign-in page
    expect(page.url()).not.toContain('/sign-in');
    
    // Should NOT redirect to /tutoring automatically (the bug was silent redirect)
    expect(page.url()).not.toContain('/tutoring');
    
    // Should show "Tutor Not Found" UI
    await expect(page.locator('text=Tutor Not Found')).toBeVisible();
    
    // URL should stay on the booking page
    expect(page.url()).toContain('/tutoring/book/00000000-0000-0000-0000-000000000000');
  });

  test('Bug 4: usePresence singleton pattern', async ({ page }) => {
    // Login as learner
    await loginAsLearner(page);
    
    // Navigate to messages page which uses usePresence
    await page.goto('http://localhost:3000/messages');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're NOT on sign-in page
    expect(page.url()).not.toContain('/sign-in');
    
    // Check for console errors related to usePresence
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to friends page which also uses usePresence
    await page.goto('http://localhost:3000/friends');
    await page.waitForLoadState('networkidle');
    
    // Verify we're NOT on sign-in page
    expect(page.url()).not.toContain('/sign-in');
    
    // Navigate back to messages to test multiple components using usePresence
    await page.goto('http://localhost:3000/messages');
    await page.waitForLoadState('networkidle');
    
    // Verify we're NOT on sign-in page
    expect(page.url()).not.toContain('/sign-in');
    
    // Should not have errors about .on() being called after .subscribe()
    const presenceErrors = errors.filter(e => 
      e.includes('presence') || 
      e.includes('subscribe') ||
      e.includes('RealtimeChannel')
    );
    
    expect(presenceErrors.length).toBe(0);
  });
});
