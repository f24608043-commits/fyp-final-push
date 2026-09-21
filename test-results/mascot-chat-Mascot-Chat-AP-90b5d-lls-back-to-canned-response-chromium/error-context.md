# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mascot-chat.spec.ts >> Mascot Chat API - Failure Scenarios >> OpenRouter failure falls back to canned response
- Location: tests\mascot-chat.spec.ts:114:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  26  |     // Close the chat
  27  |     const closeButton = page.locator('button:has-text("✕")').first();
  28  |     await closeButton.click();
  29  |     
  30  |     // Chat should be closed
  31  |     await expect(page.locator('text=LEGO Mascot')).not.toBeVisible();
  32  |   });
  33  | 
  34  |   test('send message and receive AI response', async ({ page }) => {
  35  |     await page.waitForTimeout(2000);
  36  |     
  37  |     // Open chat
  38  |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  39  |     await chatButton.click();
  40  |     
  41  |     // Send a message
  42  |     const input = page.locator('input[placeholder="Type a message..."]');
  43  |     await input.fill('Hello!');
  44  |     await page.click('button:has-text("Send")');
  45  |     
  46  |     // Wait for response
  47  |     await page.waitForTimeout(5000);
  48  |     
  49  |     // Check that a response appeared
  50  |     const messages = page.locator('.flex-1.overflow-y-auto p');
  51  |     const messageCount = await messages.count();
  52  |     expect(messageCount).toBeGreaterThan(1); // At least initial + response
  53  |   });
  54  | 
  55  |   test('quick action buttons work', async ({ page }) => {
  56  |     await page.waitForTimeout(2000);
  57  |     
  58  |     // Open chat
  59  |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  60  |     await chatButton.click();
  61  |     
  62  |     // Click quick action button
  63  |     await page.click('button:has-text("💡 Hint")');
  64  |     
  65  |     // Wait for response
  66  |     await page.waitForTimeout(5000);
  67  |     
  68  |     // Check that a response appeared
  69  |     const messages = page.locator('.flex-1.overflow-y-auto p');
  70  |     const messageCount = await messages.count();
  71  |     expect(messageCount).toBeGreaterThan(1);
  72  |   });
  73  | 
  74  |   test('assembly animation trigger works', async ({ page }) => {
  75  |     await page.waitForTimeout(2000);
  76  |     
  77  |     // Open chat
  78  |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  79  |     await chatButton.click();
  80  |     
  81  |     // Click assembly animation button
  82  |     const sparkleButton = page.locator('button:has-text("✨")').first();
  83  |     await expect(sparkleButton).toBeVisible();
  84  |     await sparkleButton.click();
  85  |     
  86  |     // Animation should play (we can't easily test visual animation, but we can check button is clickable)
  87  |     await expect(sparkleButton).toBeVisible();
  88  |   });
  89  | 
  90  |   test('rate limit enforcement', async ({ page }) => {
  91  |     await page.waitForTimeout(2000);
  92  |     
  93  |     // Open chat
  94  |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  95  |     await chatButton.click();
  96  |     
  97  |     // Send multiple messages rapidly to test rate limit (though 20/hour is hard to hit in a test)
  98  |     const input = page.locator('input[placeholder="Type a message..."]');
  99  |     
  100 |     for (let i = 0; i < 5; i++) {
  101 |       await input.fill(`Test message ${i}`);
  102 |       await page.click('button:has-text("Send")');
  103 |       await page.waitForTimeout(1000);
  104 |     }
  105 |     
  106 |     // Check that messages were sent
  107 |     const messages = page.locator('.flex-1.overflow-y-auto p');
  108 |     const messageCount = await messages.count();
  109 |     expect(messageCount).toBeGreaterThan(5);
  110 |   });
  111 | });
  112 | 
  113 | test.describe('Mascot Chat API - Failure Scenarios', () => {
  114 |   test('OpenRouter failure falls back to canned response', async ({ page }) => {
  115 |     // This test would require temporarily invalidating the OpenRouter key
  116 |     // For now, we'll test the API endpoint directly
  117 |     
  118 |     const response = await page.request.post('/api/mascot-chat', {
  119 |       data: {
  120 |         message: 'Test message',
  121 |         simulateOpenRouterFailure: true,
  122 |       },
  123 |     });
  124 |     
  125 |     const data = await response.json();
> 126 |     expect(response.ok()).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
  127 |     expect(data.message).toBeTruthy();
  128 |     expect(data.provider).toBe('canned');
  129 |   });
  130 | 
  131 |   test('OpenAI failure falls back to canned response', async ({ page }) => {
  132 |     const response = await page.request.post('/api/mascot-chat', {
  133 |       data: {
  134 |         message: 'Test message',
  135 |         simulateOpenRouterFailure: true,
  136 |         simulateOpenAiFailure: true,
  137 |       },
  138 |     });
  139 |     
  140 |     const data = await response.json();
  141 |     expect(response.ok()).toBeTruthy();
  142 |     expect(data.message).toBeTruthy();
  143 |     expect(data.provider).toBe('canned');
  144 |   });
  145 | });
  146 | 
```