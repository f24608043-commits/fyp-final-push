// Capture design-pass evidence screenshots per role at 390 and 1440.
//   node evidence/capture-screenshots.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const OUT = 'evidence/screenshots';
mkdirSync(OUT, { recursive: true });

const ROLES = [
  {
    label: 'public',
    email: null,
    pages: [['home', '/'], ['sign-in', '/sign-in'], ['sign-up', '/sign-up']],
  },
  {
    label: 'learner',
    email: 'testlearner+test@gmail.com',
    password: 'Test123456!',
    pages: [
      ['path', '/path'], ['library', '/library'], ['classes', '/classes'],
      ['tutoring', '/tutoring'], ['friends', '/friends'], ['messages', '/messages'],
      ['leaderboard', '/leaderboard'], ['settings', '/settings'],
    ],
  },
  {
    label: 'tutor',
    email: 'orphix.itsolutions@gmail.com',
    password: 'Qasim.11',
    pages: [
      ['dashboard', '/tutoring/dashboard'], ['classes', '/tutoring/classes'],
      ['groups', '/tutoring/groups'], ['history', '/tutoring/history'],
      ['learner-dashboard', '/tutoring/learner-dashboard'],
    ],
  },
  {
    label: 'admin',
    email: 'alexabraham587@gmail.com',
    password: 'Qasim.11',
    pages: [
      ['dashboard', '/admin'], ['users', '/admin/users'], ['courses', '/admin/courses'],
      ['badges', '/admin/badges'], ['tutoring', '/admin/tutoring'],
    ],
  },
];

const VIEWPORTS = [
  ['390', 390, 844],
  ['1440', 1440, 900],
];

const browser = await chromium.launch();
let shots = 0;

for (const role of ROLES) {
  for (const [vpName, width, height] of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    // the app registers a service worker that caches aggressively; disable it
    await page.addInitScript(() => {
      if ('serviceWorker' in navigator) {
        Object.defineProperty(navigator, 'serviceWorker', {
          get: () => ({ register: () => Promise.reject(new Error('sw disabled')) }),
        });
      }
    });

    if (role.email) {
      await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', role.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    for (const [name, route] of role.pages) {
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1200);
        const file = `${OUT}/${role.label}-${name}-${vpName}.png`;
        await page.screenshot({ path: file, fullPage: false });
        shots++;
        console.log(`ok   ${file}`);
      } catch (e) {
        console.log(`FAIL ${role.label}-${name}-${vpName}  ${String(e.message).slice(0, 70)}`);
      }
    }
    await ctx.close();
  }
}

await browser.close();
console.log(`\n${shots} screenshots written to ${OUT}/`);
