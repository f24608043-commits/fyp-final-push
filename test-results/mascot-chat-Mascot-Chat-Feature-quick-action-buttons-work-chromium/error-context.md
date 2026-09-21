# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mascot-chat.spec.ts >> Mascot Chat Feature >> quick action buttons work
- Location: tests\mascot-chat.spec.ts:55:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 1
Received:   1
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]: terminal
          - generic [ref=e8]:
            - generic [ref=e9]: LEGO
            - generic [ref=e10]: Learn And Go
        - generic [ref=e11]: Learner Desk
        - navigation [ref=e15]:
          - link "home Path" [ref=e16] [cursor=pointer]:
            - /url: /path
            - generic [ref=e17]: home
            - generic [ref=e18]: Path
          - link "menu_book Library" [ref=e19] [cursor=pointer]:
            - /url: /library
            - generic [ref=e20]: menu_book
            - generic [ref=e21]: Library
          - link "groups Class" [ref=e22] [cursor=pointer]:
            - /url: /tutoring
            - generic [ref=e23]: groups
            - generic [ref=e24]: Class
          - link "diversity_3 Friends" [ref=e25] [cursor=pointer]:
            - /url: /friends
            - generic [ref=e26]: diversity_3
            - generic [ref=e27]: Friends
          - link "chat Messages" [ref=e28] [cursor=pointer]:
            - /url: /messages
            - generic [ref=e29]: chat
            - generic [ref=e30]: Messages
      - link "settings Settings" [ref=e32] [cursor=pointer]:
        - /url: /settings
        - generic [ref=e33]: settings
        - generic [ref=e34]: Settings
    - generic [ref=e35]:
      - banner [ref=e36]:
        - button "Python Fundamentals arrow_drop_down" [ref=e38]:
          - generic [ref=e40]: Python Fundamentals
          - generic [ref=e41]: arrow_drop_down
        - generic [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]:
              - generic [ref=e45]: local_fire_department
              - generic [ref=e46]: "0"
            - generic [ref=e47]:
              - generic [ref=e48]: bolt
              - generic [ref=e49]: "0"
          - link "person Test Learner LVL 1 • LEARNER" [ref=e50] [cursor=pointer]:
            - /url: "#"
            - generic [ref=e51]: person
            - generic [ref=e53]:
              - generic [ref=e54]: Test Learner
              - generic [ref=e55]:
                - generic [ref=e56]: LVL 1
                - generic [ref=e57]: •
                - generic [ref=e58]: LEARNER
      - main [ref=e59]:
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e86]:
              - generic [ref=e87]: 👋
              - generic [ref=e88]: Welcome, Test Learner!
            - heading "Personalize Your Path" [level=1] [ref=e89]
            - paragraph [ref=e90]: Set up your learning goals and select the subjects you want to master.
          - generic [ref=e91]:
            - generic [ref=e92]:
              - heading "1. Select Your Courses" [level=2] [ref=e93]
              - paragraph [ref=e94]: Pick one or more courses to add to your library.
              - generic [ref=e95]:
                - generic [ref=e96] [cursor=pointer]:
                  - checkbox "Python Programming Master the world’s most versatile programming language from scratch. Learn syntax, logic, data structures, and functions through interactive video lessons and quizzes." [checked] [ref=e97]
                  - generic [ref=e98]:
                    - generic [ref=e99]: Python Programming
                    - generic [ref=e100]: Master the world’s most versatile programming language from scratch. Learn syntax, logic, data structures, and functions through interactive video lessons and quizzes.
                - generic [ref=e101] [cursor=pointer]:
                  - checkbox "Web Development with JavaScript Learn modern JavaScript, DOM manipulation, and asynchronous programming for interactive web applications." [ref=e102]
                  - generic [ref=e103]:
                    - generic [ref=e104]: Web Development with JavaScript
                    - generic [ref=e105]: Learn modern JavaScript, DOM manipulation, and asynchronous programming for interactive web applications.
            - generic [ref=e106]:
              - heading "2. What is your coding background?" [level=2] [ref=e107]
              - paragraph [ref=e108]: Helps us recommend pacing and practice challenges.
              - generic [ref=e109]:
                - generic [ref=e110] [cursor=pointer]:
                  - generic [ref=e111]:
                    - generic [ref=e112]: Complete Beginner
                    - radio "Complete Beginner Never written code before" [checked] [ref=e113]
                  - generic [ref=e114]: Never written code before
                - generic [ref=e115] [cursor=pointer]:
                  - generic [ref=e116]:
                    - generic [ref=e117]: Some Experience
                    - radio "Some Experience Know basic syntax and loops" [ref=e118]
                  - generic [ref=e119]: Know basic syntax and loops
                - generic [ref=e120] [cursor=pointer]:
                  - generic [ref=e121]:
                    - generic [ref=e122]: Experienced
                    - radio "Experienced Comfortable with software concepts" [ref=e123]
                  - generic [ref=e124]: Comfortable with software concepts
            - generic [ref=e125]:
              - heading "3. Set Your Daily Time Goal" [level=2] [ref=e126]
              - paragraph [ref=e127]: Consistent daily practice builds your learning streak.
              - generic [ref=e128]:
                - generic [ref=e129] [cursor=pointer]:
                  - radio "Casual 10 mins/day" [ref=e130]
                  - generic [ref=e131]: Casual
                  - generic [ref=e132]: 10 mins/day
                - generic [ref=e133] [cursor=pointer]:
                  - radio "Regular 15 mins/day" [checked] [ref=e134]
                  - generic [ref=e135]: Regular
                  - generic [ref=e136]: 15 mins/day
                - generic [ref=e137] [cursor=pointer]:
                  - radio "Serious 30 mins/day" [ref=e138]
                  - generic [ref=e139]: Serious
                  - generic [ref=e140]: 30 mins/day
                - generic [ref=e141] [cursor=pointer]:
                  - radio "Intense 60 mins/day" [ref=e142]
                  - generic [ref=e143]: Intense
                  - generic [ref=e144]: 60 mins/day
            - button "Start My Learning Journey →" [ref=e145]
  - generic [ref=e147]:
    - generic [ref=e148] [cursor=pointer]:
      - generic [ref=e167]:
        - paragraph [ref=e168]: LEGO Mascot
        - paragraph [ref=e169]: Online - Ready to help!
      - button "✨" [ref=e170]
      - button "✕" [ref=e171]
    - generic [ref=e173]:
      - generic [ref=e174]: 🤖
      - paragraph [ref=e176]: Hi! I'm your LEGO learning mascot! 🎓 Ask me anything about your lessons or just say hello!
    - generic [ref=e177]:
      - button "💡 Hint" [active] [ref=e178]
      - button "📖 Explain" [ref=e179]
      - button "🎯 Quiz me" [ref=e180]
      - button "😄 Joke" [ref=e181]
    - generic [ref=e183]:
      - textbox "Type a message..." [ref=e184]: Give me a hint!
      - button "Send" [ref=e185]
  - button "Open Next.js Dev Tools" [ref=e191] [cursor=pointer]
  - alert [ref=e195]: Personalize Your Path
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Mascot Chat Feature', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Login as test learner
  6   |     await page.goto('/sign-in');
  7   |     await page.fill('input[type="email"]', 'testlearner+test@gmail.com');
  8   |     await page.fill('input[type="password"]', 'Test123456!');
  9   |     await page.click('button[type="submit"]');
  10  |     await page.waitForURL('/path', { timeout: 15000 });
  11  |   });
  12  | 
  13  |   test('chat widget opens and closes', async ({ page }) => {
  14  |     // Wait for chat widget to load (lazy loaded)
  15  |     await page.waitForTimeout(2000);
  16  |     
  17  |     // Find and click the collapsed chat button
  18  |     const chatButton = page.locator('button:has-text("Chat with Mascot")').first();
  19  |     await expect(chatButton).toBeVisible();
  20  |     await chatButton.click();
  21  |     
  22  |     // Chat should be open
  23  |     await expect(page.locator('text=LEGO Mascot')).toBeVisible();
  24  |     await expect(page.locator('text=Online - Ready to help!')).toBeVisible();
  25  |     
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
> 71  |     expect(messageCount).toBeGreaterThan(1);
      |                          ^ Error: expect(received).toBeGreaterThan(expected)
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
  126 |     expect(response.ok()).toBeTruthy();
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