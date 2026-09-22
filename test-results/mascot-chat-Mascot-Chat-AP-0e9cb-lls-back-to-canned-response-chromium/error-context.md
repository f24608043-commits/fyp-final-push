# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mascot-chat.spec.ts >> Mascot Chat API - Failure Scenarios >> OpenAI failure falls back to canned response
- Location: tests\mascot-chat.spec.ts:138:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  48  |     // Send a message
  49  |     const input = page.locator('input[placeholder="Type a message..."]');
  50  |     await input.fill('Hello!');
  51  |     await page.click('button:has-text("Send")');
  52  |     
  53  |     // Wait for response
  54  |     await page.waitForTimeout(5000);
  55  |     
  56  |     // Check that a response appeared
  57  |     const messages = page.locator('.flex-1.overflow-y-auto p');
  58  |     const messageCount = await messages.count();
  59  |     expect(messageCount).toBeGreaterThan(1); // At least initial + response
  60  |   });
  61  | 
  62  |   test('quick action buttons work', async ({ page }) => {
  63  |     await page.waitForTimeout(2000);
  64  |     
  65  |     // Open chat
  66  |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  67  |     await chatButton.click();
  68  |     
  69  |     // Click quick action button
  70  |     await page.click('button:has-text("💡 Hint")');
  71  |     
  72  |     // Wait for response
  73  |     await page.waitForTimeout(5000);
  74  |     
  75  |     // Check that a response appeared
  76  |     const messages = page.locator('.flex-1.overflow-y-auto p');
  77  |     const messageCount = await messages.count();
  78  |     expect(messageCount).toBeGreaterThan(1);
  79  |   });
  80  | 
  81  |   test('assembly animation trigger works', async ({ page }) => {
  82  |     await page.waitForTimeout(2000);
  83  |     
  84  |     // Open chat
  85  |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  86  |     await chatButton.click();
  87  |     
  88  |     // Click assembly animation button
  89  |     const sparkleButton = page.locator('button:has-text("✨")').first();
  90  |     await expect(sparkleButton).toBeVisible();
  91  |     await sparkleButton.click();
  92  |     
  93  |     // Animation should play (we can't easily test visual animation, but we can check button is clickable)
  94  |     await expect(sparkleButton).toBeVisible();
  95  |   });
  96  | 
  97  |   test('rate limit enforcement', async ({ page }) => {
  98  |     await page.waitForTimeout(2000);
  99  |     
  100 |     // Open chat
  101 |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  102 |     await chatButton.click();
  103 |     
  104 |     // Send multiple messages rapidly to test rate limit (though 20/hour is hard to hit in a test)
  105 |     const input = page.locator('input[placeholder="Type a message..."]');
  106 |     
  107 |     for (let i = 0; i < 5; i++) {
  108 |       await input.fill(`Test message ${i}`);
  109 |       await page.click('button:has-text("Send")');
  110 |       await page.waitForTimeout(1000);
  111 |     }
  112 |     
  113 |     // Check that messages were sent
  114 |     const messages = page.locator('.flex-1.overflow-y-auto p');
  115 |     const messageCount = await messages.count();
  116 |     expect(messageCount).toBeGreaterThan(5);
  117 |   });
  118 | });
  119 | 
  120 | test.describe('Mascot Chat API - Failure Scenarios', () => {
  121 |   test('OpenRouter failure falls back to canned response', async ({ page }) => {
  122 |     // This test would require temporarily invalidating the OpenRouter key
  123 |     // For now, we'll test the API endpoint directly
  124 |     
  125 |     const response = await page.request.post('/api/mascot-chat', {
  126 |       data: {
  127 |         message: 'Test message',
  128 |         simulateOpenRouterFailure: true,
  129 |       },
  130 |     });
  131 |     
  132 |     const data = await response.json();
  133 |     expect(response.ok()).toBeTruthy();
  134 |     expect(data.message).toBeTruthy();
  135 |     expect(data.provider).toBe('canned');
  136 |   });
  137 | 
  138 |   test('OpenAI failure falls back to canned response', async ({ page }) => {
  139 |     const response = await page.request.post('/api/mascot-chat', {
  140 |       data: {
  141 |         message: 'Test message',
  142 |         simulateOpenRouterFailure: true,
  143 |         simulateOpenAiFailure: true,
  144 |       },
  145 |     });
  146 |     
  147 |     const data = await response.json();
> 148 |     expect(response.ok()).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
  149 |     expect(data.message).toBeTruthy();
  150 |     expect(data.provider).toBe('canned');
  151 |   });
  152 | });
  153 | 
```