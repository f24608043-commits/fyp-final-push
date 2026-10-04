// Reusable route audit: design-token compliance + horizontal-overflow check.
//   node evidence/verify-routes.mjs
// Optional env: BASE_URL, E_EMAIL, E_PASSWORD, ROLE_LABEL
// Routes default to the learner surface; pass ROUTES separated by "|" if needed.
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const DEFAULT_ROUTES = [
  '/', '/sign-in', '/sign-up',
  '/path', '/library', '/classes', '/classes/browse',
  '/tutoring', '/friends', '/messages', '/leaderboard',
  '/notifications', '/settings', '/profile',
];
const ROUTES = process.env.ROUTES
  ? process.env.ROUTES.split('|').filter(Boolean)
  : DEFAULT_ROUTES;

// Sources are injected as strings and re-compiled inside the page context.
const OFF_TOKEN_SRC =
  '\\b(bg|text|border|ring|from|via|to|fill|stroke|divide)-(red|green|blue|pink|purple|indigo|teal|orange|amber|yellow|lime|emerald|cyan|sky|violet|fuchsia|rose|slate|gray|zinc|neutral|stone)-[0-9]{2,3}\\b';
const LEGACY_SRC =
  '\\b(bg|text|border|ring|from|via|to|fill|stroke|divide)-(surface-container[a-z-]*|surface-variant|surface-dim|surface-bright|surface-tint|outline[a-z-]*|inverse[a-z-]*|on-[a-z-]+|primary-(container|fixed[a-z-]*)|secondary-(container|fixed[a-z-]*)|tertiary-(container|fixed[a-z-]*)|error-container)\\b';
const MALFORMED_SRC =
  '(?<![\\w:-])(hover|focus|focus-visible|active|disabled|group-hover):(?!(bg|text|border|ring|from|via|to|fill|stroke|divide)-)(surface-border|text-muted|text-primary|background|locked|primary|secondary|tertiary|success|error|surface)(?![\\w/-])';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const role = process.env.ROLE_LABEL || 'anonymous';
if (process.env.E_EMAIL && process.env.E_PASSWORD) {
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', process.env.E_EMAIL);
  await page.fill('input[type="password"]', process.env.E_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  console.log(`signed in as ${process.env.E_EMAIL} -> ${new URL(page.url()).pathname}`);
}

const rows = [];
for (const width of [390, 1440]) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(900);
      const r = await page.evaluate(
        ({ OFF_TOKEN_SRC, LEGACY_SRC, MALFORMED_SRC }) => {
          const OFF = new RegExp(OFF_TOKEN_SRC);
          const LEGACY = new RegExp(LEGACY_SRC);
          const MALFORMED = new RegExp(MALFORMED_SRC);
          const off = new Set(), legacy = new Set(), malformed = new Set();
          document.querySelectorAll('*').forEach((el) => {
            const c =
              typeof el.className === 'string'
                ? el.className
                : el.getAttribute?.('class') || '';
            c.split(/\s+/).filter(Boolean).forEach((x) => {
              if (OFF.test(x)) off.add(x);
              if (LEGACY.test(x)) legacy.add(x);
              if (MALFORMED.test(x)) malformed.add(x);
            });
          });
          return {
            landed: location.pathname,
            off: off.size, offSample: [...off].slice(0, 5),
            legacy: legacy.size, legacySample: [...legacy].slice(0, 5),
            malformed: malformed.size, malformedSample: [...malformed].slice(0, 5),
            overflowX:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth + 1,
            clay: document.querySelectorAll('[class*="shadow-clay"]').length,
            r24: document.querySelectorAll('[class*="rounded-[24px]"]').length,
            bodyBg: getComputedStyle(document.body).backgroundColor,
          };
        },
        { OFF_TOKEN_SRC, LEGACY_SRC, MALFORMED_SRC }
      );
      rows.push({ width, route, ...r });
    } catch (e) {
      rows.push({ width, route, error: String(e.message || e).slice(0, 70) });
    }
  }
}
await browser.close();

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nrole=${role} base=${BASE}`);
console.log(pad('width', 7) + pad('route', 18) + pad('off', 5) + pad('legacy', 8) + pad('malform', 9) + pad('ovfX', 7) + pad('clay', 6) + 'r24');
for (const r of rows) {
  console.log(
    pad(r.width, 7) + pad(r.route, 18) +
    pad(r.off ?? '-', 5) + pad(r.legacy ?? '-', 8) + pad(r.malformed ?? '-', 9) +
    pad(r.overflowX ?? '-', 7) + pad(r.clay ?? '-', 6) + (r.r24 ?? '-') +
    (r.error ? '  ERR ' + r.error : '')
  );
}

const bad = rows.filter(
  (r) => r.error || (r.off ?? 0) > 0 || (r.legacy ?? 0) > 0 || (r.malformed ?? 0) > 0 || r.overflowX === true
);
console.log(`\n${rows.length} checks, ${bad.length} violations`);
if (bad.length) console.log(JSON.stringify(bad, null, 2));
process.exit(bad.length ? 1 : 0);
