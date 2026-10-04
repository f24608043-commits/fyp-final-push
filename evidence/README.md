# Frontend Design Pass — Evidence

Claymorphic redesign across every public, learner, tutor, and admin surface.
Frontend-only: no backend, auth, API, `db/`, `lib/ai/`, or `*/actions.ts` logic was changed.

## 1. Root cause found first: the design system was not compiled

`tailwind.config.ts` defines the mandated palette and the `shadow-clay-*` set, but the
project is on Tailwind v4 and `app/globals.css` never referenced the config file.
Tailwind v4 does not auto-detect a legacy JS/TS config, so **every** `bg-primary`,
`text-text-primary`, `shadow-clay-surface`, and `font-label-md` utility in the app
resolved to nothing.

Evidence (before the fix, from the compiled CSS in `.next/static/chunks`):

```
grep -c '\.bg-primary{'  <built css>   -> 0
grep -c 'font-label-md'  <built css>   -> 0
```

Fix — `app/globals.css`:

```css
@import "tailwindcss";
@config "../tailwind.config.ts";
@plugin "tailwindcss-animate";
```

Evidence (after, same check on the production CSS actually served on :3001):

```
.bg-primary            -> background-color:#58cc02
.text-text-primary     -> color:#2d2a26
.bg-surface-border     -> background-color:#f5efe6
.shadow-clay-primary   -> 0 8px 24px #5c9a004d, inset 0 2px 4px #fff6
.font-label-md         -> font-family:var(--font-rubik)
```

A shadcn `@theme inline` block had also been added to `globals.css` that redefined
`--primary: oklch(0.205 0 0)` (near-black). That was reverted — it silently overrode
the brand green app-wide.

## 2. One shell, no duplicates

`app/layout.tsx` -> `components/Shell.tsx` (server) -> `components/shell/ShellChrome.tsx` (client chrome).

`components/AppShell.tsx` and `components/UnifiedShell.tsx` were deleted. Server-side
auth/profile resolution and the `/onboarding` redirect are preserved exactly as they
were; the shell no longer fetches `/api/profile/*` client-side or duplicates auth logic.

Proof there is exactly one shell entry point:

```
$ grep -rn "components/Shell\|AppShell\|UnifiedShell" app/ components/
app/admin/layout.tsx:1:// The root layout already mounts the single role-aware Shell ...
app/layout.tsx:4:import Shell from "@/components/Shell";
components/Shell.tsx:6:import ShellChrome from "@/components/shell/ShellChrome";
```

Role accents: learner = `primary`, tutor = `secondary`, admin = `tertiary`.

## 3. Token compliance

Every off-palette Tailwind colour utility was rewritten to the 12 approved tokens.

| Category | Count |
|---|---|
| Off-palette colour utilities (`bg/text/border/ring/from/via/to/…-{hue}-{shade}`) | 1953 -> **0** |
| Legacy Material-3 tokens (`surface-container*`, `on-*`, `*-container`, `*-fixed`, `outline*`, `inverse*`) | 335 -> **0** |
| Non-existent shadows (`shadow-2xl`, `shadow-beautiful-*`, `shadow-clay-lg/xl/inset`) | remapped to real `shadow-clay-*` |
| Malformed variants produced during codemod (`hover:surface-border`) | 13 -> **0** |
| Redundant gradient stops (`from-X via-X to-X`) | 297 flattened |
| Hard-coded mascot SVG hex values | 39 -> all in-palette |

Reproduce with `node evidence/verify-routes.mjs` (see §6).

## 4. Contrast, inside the mandated palette

The specified palette has real WCAG problems, so text colour was chosen to pass while
keeping the exact brand fills:

| Pair | Ratio | Verdict |
|---|---|---|
| `surface` on `primary` | 2.09 | fails |
| `text-primary` on `primary` | **6.84** | pass (used instead) |
| `text-primary` on `secondary` | **6.54** | pass (used instead) |
| `text-primary` on `error` | **5.15** | pass (used instead) |
| `text-primary` on `surface` | **14.28** | pass |
| `text-muted` on `surface` | 3.67 | AA-large only — reserved for de-emphasised text |

So 220 near-white-on-brand-fill cases were recoloured to `text-text-primary`.
One genuine invisible-text bug was fixed: `bg-surface-border text-surface`
(white on cream) in `app/tutoring/groups/[groupId]/page.tsx`.

Remaining known palette limits, unchanged because the palette is fixed:
`text-muted` (3.67) and `locked` (1.47) cannot reach 4.5:1 on `surface`.

## 5. Micro-interactions

* Hover lift `-translate-y-px` + shadow deepen; press `translate-y-[1px]` + pressed shadow.
* 200 ms transitions on nav, cards, buttons.
* Drawer/mobile-menu state is derived from `pathname` (no `setState`-in-effect),
  so back/forward closes it. Lint-clean under `react-hooks/set-state-in-effect`.
* Active nav item keeps `aria-current="page"`; drawer overlay and close button are real
  `<button>`s with labels.

Verified in-browser at 390 / 768 / 1440:

| Viewport | Desktop sidebar | Tablet rail | Bottom bar | Overflow |
|---|---|---|---|---|
| 390 | hidden | hidden | visible | none |
| 768 | hidden | 80 px | hidden | none |
| 1440 | 256 px | hidden | hidden | none |

## 6. Verification

Build (`npm run build`, clean `.next`): **passes** — compiled in ~20 s, TypeScript clean.

Lint parity, measured by stashing the change:

```
HEAD   : 235 errors, 126 warnings
After  : 235 errors, 119 warnings
```

Zero new lint errors; the authored shell/UI files contribute 0 errors.

Token + overflow audit, all roles, both breakpoints:

```
node evidence/verify-routes.mjs                     (learner, 14 routes x 2)  28 checks, 0 violations
ROUTES='...tutor...'  node evidence/verify-routes.mjs                        14 checks, 0 violations
ROUTES='...admin...' node evidence/verify-routes.mjs                        16 checks, 0 violations
```

58 route/viewport checks, 0 violations, no horizontal overflow anywhere.

Screenshots: `evidence/screenshots/` — 42 PNGs, `{role}-{page}-{390|1440}.png`,
covering public, learner (8 pages), tutor (5), admin (5).

Playwright, full suite of 207 tests, same server setup both runs (`:3000` and `:3001`):

| Run | Passed | Failed | Skipped | Did not run |
|---|---|---|---|---|
| Baseline (HEAD) | 163 | 17 | 15 | 12 |
| Final | **195** | **2** | 10 | 0 |

Net +32 passing, -15 failing, and 12 previously-unreached tests now execute.
Neither remaining failure is caused by this work:

* `comprehensive-verification.spec.ts:5` — fails identically at baseline.
* `test-button-feedback.spec.ts:60` — the test logs
  "Loading state not implemented, skipping assertion" and then exhausts its own 90 s
  budget while the rest of the suite saturates the DB pool. It **passes in isolation**
  (`2 passed (1.6m)`), and its sibling `:3` failed at baseline. Pre-existing flake.

Two observed non-code issues:

* `net::ERR_CONNECTION_REFUSED` on **port 3000**: six test files hardcode
  `localhost:3000` while `playwright.config.ts` uses 3001. Starting a second server
  on 3000 made all five `admin-functionality` tests pass. Not a code change.
* Blank `/tutoring/dashboard` under concurrent load:
  `EMAXCONNSESSION - max clients reached in session mode - pool_size: 15`.
  Database pool exhaustion in `db/`, i.e. backend, untouched here.

## 7. Images

4 `<img>` tags remain, all for DB-hosted URLs. They are deliberately **not**
`next/image`: `next.config.ts` allowlists only `img.youtube.com`, so routing
arbitrary Supabase/cover URLs through the optimizer would 404. Instead each got
`loading="lazy"`, `decoding="async"`, and explicit `width`/`height` to remove
layout shift. 5 files already used `next/image` correctly.

## 8. Files

New: `components/shell/ShellChrome.tsx`, `components/ui/{button,card,dialog,tabs,avatar,skeleton,tooltip}.tsx`,
`lib/utils.ts`, `components.json`.

Deleted: `components/AppShell.tsx`, `components/UnifiedShell.tsx`.

Modified: `app/globals.css` (3 lines: `@config` + `@plugin`), `components/Shell.tsx`,
`package.json`/`package-lock.json` (shadcn + Radix deps), and 79 page/component files
for the token pass.

Evidence tooling: `evidence/verify-routes.mjs`, `evidence/capture-screenshots.mjs`,
`evidence/token_codemod.py`, `evidence/pw-baseline*.txt`, `evidence/pw-after.txt`,
`evidence/pw-final.txt`, `evidence/build-final.txt`.

Out of scope and untouched: `drizzle/0015_fix_direct_key_type.sql` and
`drizzle/0016_cleanup_orphaned_conversation_members.sql` appeared untracked during the
session but were not authored here; they are DB migrations and were deliberately left
alone.
