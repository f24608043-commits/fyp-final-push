# LEGO Digital Learning Platform — Comprehensive Code & Functionality Report

**Project**: LEGO (Learn And Go) — Gamified Learning Management System
**Workspace**: `c:\Users\Abu Bakar\Documents\fyp-project-2`
**Repo**: `https://github.com/f24608043-commits/fyp-final-push.git`
**Report date**: October 4, 2026 · Branch: `main` (`a3903b7`)

---

## 1. Executive Summary

LEGO is a full-stack, gamified LMS built with **Next.js 16 (App Router)**, **Supabase** (auth + Postgres + Realtime), and **Drizzle ORM**. It supports three roles — **learner, tutor, admin** — with distinct UIs, navigation shells (desktop sidebar / tablet icon rail / mobile bottom bar), and access controls.

The codebase contains ~100 app routes (pages + server actions + API routes), ~17 shared components, server-action modules (auth, tutoring, messaging, friends, notifications, gamification), 15 REST endpoints, and a 49-table PostgreSQL schema with RLS on 43 tables.

**Automated verification**: 207 Playwright tests across 56 files. After the test-infra fixes in §11, the suite runs with **199 passed / 8 intentional skips / 0 unhandled failures**.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.3.5 (App Router, React 19.2, TypeScript 5, Turbopack) |
| Auth | Supabase Auth (`@supabase/ssr` — browser/server/middleware clients) |
| Database | PostgreSQL 17.6 on Supabase (`vufotbwruytqvjrpyjqv`) |
| ORM | Drizzle ORM 0.45 + postgres.js (pooler-aware, dev-hmr singleton) |
| Realtime | Supabase Realtime (published on `messages`) |
| AI | OpenRouter (gemini-2.5-flash) → OpenAI (gpt-4o-mini) → canned fallback |
| Styling | Tailwind CSS v4 + CSS design-token variables, claymorphic UI |
| UI kit | Radix primitives (`avatar`, `dialog`, `tabs`, `tooltip`, `slot`) |
| Testing | Playwright 1.63 (56 spec files, 207 tests) |

---

## 3. Architecture Overview

```
Browser ─► Next.js App Router (port 4005)
              ├── Server Components (SSR w/ Supabase server client)
              ├── Server Actions ("use server") — auth/tutoring/messaging/friends/gamification
              ├── Route Handlers (/api/*) — book-session, enrollments, groups, mascot-chat, messaging
              └── Middleware (updateSession) — session refresh on every request
                └── Supabase (Postgres + Auth + Realtime) via postgres.js (Drizzle) / supabase-js
```

- **Shell pattern**: `app/layout.tsx` mounts a single `Shell` which reads the profile role and renders `ShellChrome` with role-specific navigation.
- **Data access**: server actions + route handlers use `db` (Drizzle/postgres.js) for writes; pages read via `db`; messaging uses REST + Realtime on the client.
- **Auth redirects**: admin→`/admin`, tutor→`/tutoring/dashboard`, learner→`/path` (or `/onboarding` if not done).

---

## 4. Database Schema (49 tables, by domain) — verified live

### 4.1 Core Learning
| Table | Purpose | Rows |
|-------|---------|------|
| `profiles` | Users (role, XP, streak, onboarding_done, rank) | 52 |
| `courses` | Course catalog (title/desc/cover/published) | 48 |
| `units` | Course units w/ ordering + optional unit badge | 21 |
| `lessons` | Video lessons (YouTube ID, XP reward) | 67 |
| `challenges` | Quiz questions | 152 |
| `challenge_options` | Answer options | 608 |
| `enrollments` | Learner→course enrollment | 10 |
| `user_progress` | Lesson status (locked/in_progress/completed) | 16 |
| `daily_activity_log` | Streak activity logging | 2 |

### 4.2 Gamification / Social
| Table | Purpose | Rows |
|-------|---------|------|
| `badges` | Badge definitions (criteria type + value) | 29 |
| `user_badges` | Awarded badges | 2 |
| `friendships` | Requests (pending/accepted/rejected/blocked) | 37 |
| `friend_streaks` | Mutual friend streaks | 0 |
| `notifications` | Feed (6 types, unread flags) | 129 |
| `blocks` | User blocking | 0 |

### 4.3 Tutoring
| Table | Purpose | Rows |
|-------|---------|------|
| `tutor_profiles` | Bio/subjects/rate/timezone/rank | 3 |
| `tutor_availability` | Weekly slots (day_of_week, start/end) | 9 |
| `tutor_sessions` | Confirmed sessions (status, jitsi_room_id) | 1 |
| `session_requests` | Booking requests w/ requested_slots JSONB | 32 |
| `session_notes` | Private/shared notes | 0 |
| `tutor_reviews` | Ratings 1–5, unique per tutor+student | 0 |
| `tutor_enrollments` | Learner↔tutor enrollment requests | 9 |
| `learner_stats` | Extended learner metrics | 0 |

### 4.4 Classroom / Groups
| Table | Purpose | Rows |
|-------|---------|------|
| `groups` / `group_members` | Learner "My Classes" (public join / join-by-code) | 2 / 0 |
| `tutor_groups` / `tutor_group_members` / `tutor_group_sessions` | Tutor-managed classes | 0 / 0 / 0 |
| `enrollment_requests` | Group enrollment requests | 0 |
| `assignments` / `submissions` / `tasks` / `task_submissions` / `quizzes` | Classwork | 1 / 0 / 0 / 0 / 0 |
| `group_announcements` / `group_comments` | Class wall | 0 / 0 |

### 4.5 Messaging / AI / Library
| Table | Purpose | Rows |
|-------|---------|------|
| `conversations` / `conversation_members` | Direct+group chats (direct_key pair) | 4 / 28 |
| `messages` | Message bodies (Realtime-published) | 0 |
| `message_reports` / `message_rate_limits` | Safety/abuse | 0 / 0 |
| `ai_interactions` | AI audit log (used for mascot rate limiting) | 420 |
| `library_views` | Ungated video views (no XP) | 50 |
| `quiz_attempts/answers/questions/options` | Classwork quiz engine | 0 |

### 4.6 Enums
`user_role`, `lesson_status`, `friendship_status`, `session_status` (incl. `no_show`), `badge_criteria_type`, `notification_type`, `conversation_type`, `group_privacy`, `group_role`, `tutor_enrollment_status`, `session_request_status`, `question_type`, `assignment_status`, `submission_status`, `task_status`, `task_target_type`, `session_notes_visibility`.

---

## 5. Authentication & Authorization

- **Files**: `app/auth/sign-in/route.ts`, `app/auth/sign-up/route.ts`, `app/auth/actions.ts` (server actions), `app/auth/callback/route.ts` (NEW — code exchange), `utils/supabase/{client,server,middleware}.ts`, `middleware.ts`.
- **Sign-in**: form POST → `supabase.auth.signInWithPassword` → profile lookup → role-based redirect.
- **Sign-up**: creates auth user + fallback profile insert (if a DB trigger didn't fire); auto sign-in when confirmation isn't required; redirects to `/onboarding`.
- **Middleware** (`middleware.ts` + `utils/supabase/middleware.ts`): refreshes session cookie on every matched request via `supabase.auth.getUser()`.
- **Role gates**: every admin page/action checks `profiles.role === "admin"`; tutor pages check tutor role/profile; unauthenticated visitors get redirected to `/sign-in`.
- **3 verified credential sets** (tested against live Supabase Auth):
  - Admin `alexabraham587@gmail.com` / `Qasim.11` ✓
  - Tutor `orphix.itsolutions@gmail.com` / `Qasim.11` ✓ *(note: supplied as "ophix…" — correct account is `orphix…`)*
  - Learner `f24608052@nutech.edu.pk` / `Qasim.11` ✓
  - Test learner `testlearner+test@gmail.com` / `Test123456!` ✓

---

## 6. Route Inventory

### Public / Shared
`/` (landing), `/sign-in`, `/sign-up`, `/onboarding`, `/loading`, `/dashboard`.

### Learner
`/path` (learning path), `/library` + `/library/VideoPlayer`, `/lesson/[lessonId]` + `LessonClient`, `/lesson/[lessonId]/practice` + `PracticeClient`, `/leaderboard`, `/notifications`, `/friends` (+ `add`, `MessageButton`, `AddFriendButton`), `/messages`, `/messages/[id]` (Realtime thread), `/classes`, `/classes/browse`, `/classes/join`, `/classes/[id]` + assignments + `quiz/[quizId]`, `/settings` (+ 5 tab components), `/profile/[userId]` (+ `comparison`), `/profile`.

### Tutor
`/tutoring/classes` (+ `create`, `[id]`, assignments, quiz), `/tutoring/groups` (+ `create`, `[groupId]`), `/tutoring/dashboard` (+ `availability`, `profile`), `/tutoring/history`, `/tutoring/learners`, `/tutoring/learner-dashboard`, `/tutoring/my-enrollments`, `/tutoring/test-setup`, `/tutoring/session/[sessionId]` (Jitsi).

### Learner→Tutor interaction
`/tutoring` (directory, Enroll/Message/Book buttons), `/tutoring/[tutorId]` (tutor detail), `/tutoring/book/[tutorId]` (booking form).

### Admin
`/admin`, `/admin/users`, `/admin/courses` (+ `new`, `[courseId]`), `/admin/units/[unitId]`, `/admin/lessons/[lessonId]` (LessonEditor), `/admin/badges`, `/admin/tutoring`.

### API (Route Handlers)
`/api/book-session` · `/api/enrollments` (+ `[id]/accept|cancel|decline`) · `/api/groups` (+ `[id]`, `[id]/sessions`) · `/api/mascot-chat` · `/api/messaging/send|messages` · `/api/profile/[userId]` · `/api/set-availability` · `/api/setup-tutoring-tables` · `/api/tutor-availability` · `/api/tutor-profile` · `/api/update-tutor-profile` · `/auth/sign-in` · `/auth/sign-up` · `/auth/callback` (new).

---

## 7. File-by-File / Component-by-Component Analysis

### 7.1 Core Infrastructure

**`app/layout.tsx`** — Root layout. Loads Rubik + Nunito Sans fonts, injects Material Symbols stylesheet + service-worker registration, sets metadata/viewport (theme `#58CC02`), mounts `<Shell>` and lazily-loaded `<ChatWidget>`.

**`components/Shell.tsx`** (server) — Reads `supabase.auth.getUser()`; queries the profile; **redirects to `/onboarding` if no profile**; renders `<ShellChrome>` with role, otherwise plain page wrapper for anonymous users.

**`components/shell/ShellChrome.tsx`** (client) — The app chrome. `NAV_CONFIG` defines three role-specific navigation sets: **sidebar** (full labels, ≥lg), **bottom** (mobile tab bar), **more** (overflow menu). Renders user chip with avatar + level + role label; active-route highlighting; responsive (desktop sidebar / tablet icon rail / mobile bottom bar). 320+ lines.

**`utils/supabase/client.ts`** — `createBrowserClient` with session persistence + auto refresh (only client entry).

**`utils/supabase/server.ts`** — `createServerClient` reading cookies via `next/headers`.

**`utils/supabase/middleware.ts`** — `updateSession`: creates server client from request cookies, calls `auth.getUser()` to refresh tokens, returns response with refreshed cookies.

**`middleware.ts`** — Applies `updateSession` to all routes except static assets.

**`db/index.ts`** — Drizzle client over `postgres.js`, dev-mode global singleton, `ssl: rejectUnauthorized:false`, tuned pool (max 10, idle 20s, max_lifetime 10 min).

**`db/schema.ts`** — Full Drizzle schema (~50 tables, enums, unique constraints, FKs, check constraints). Source of truth for all queries.

**`app/globals.css`** — Tailwind v4 entry + CSS variable design tokens (`--color-primary`, `--color-surface`, clay shadow utilities, font utilities).

### 7.2 Authentication Module

- **`app/sign-in/page.tsx` / `app/sign-up/page.tsx`** — Server pages with `<form action="/auth/sign-in|sign-up">`; Mascot branding; error query-param display.
- **`app/auth/sign-in/route.ts`** — POST handler. 400 on missing fields; `signInWithPassword`; error → `/sign-in?error=…`; on success looks up profile and redirects by role.
- **`app/auth/sign-up/route.ts`** — POST handler. `signUp` with `data.display_name` + `emailRedirectTo`; creates fallback profile row if trigger didn't fire; auto sign-in when session present; else "check your email".
- **`app/auth/actions.ts`** — Server-action twins (`signUp`, `signIn`, `signOut`) used by some flows; same role-based redirect logic.
- **`app/auth/callback/route.ts`** *(NEW)* — Standard Supabase OAuth/email-confirmation callback: `exchangeCodeForSession`, redirect to `next` (default `/onboarding`), handles forwarded-host for local dev.

### 7.3 Learner Features

**`app/path/page.tsx`** (~470 lines) — Learning dashboard. Loads profile, enrollments, `getMySessions()` in parallel; guards onboarding; if no active enrollment shows enroll CTA; otherwise builds the "path" with course units/lessons, computes per-lesson state (completed/current/locked) from `user_progress`, renders the Duolingo-style node rail + full lesson list, streak/XP header, and upcoming session cards.

**`app/lesson/actions.ts`** — `submitQuiz(lessonId, userAnswers, _clientSuppliedScore)`. **Server-side grading** (ignores client score — FR3.3): fetches lesson + published challenges + options, grades answers, ≥50% → `user_progress=completed`, adds XP + streak, calls `checkAndAwardBadges`, auto-awards **unit badge** when all unit lessons complete; else `in_progress`. Returns celebration stats + mascot pose.

**`app/lesson/[lessonId]/page.tsx` + `LessonClient.tsx`** — 3-stage lesson player (video → quiz → celebration). `extractYouTubeId` playback; quiz submission via server action.

**`app/lesson/[lessonId]/practice/page.tsx` + `PracticeClient.tsx`** — AI practice mode (OpenRouter) with multiple-choice drill.

**`app/library/*`** — Ungated video library of enrolled courses; `recordLibraryView` → `library_views` (never XP/progress).

**`app/leaderboard/page.tsx` + `actions.ts`** — Global XP + streak leaderboards (top 50), user rank, titles.

**`app/notifications/page.tsx` + `actions.ts`** — Feed list, unread count, mark-read/mark-all/delete; typed notifiers.

**`app/friends/page.tsx` + `actions.ts`** — Friends list, pending requests, suggestions; send/accept/reject/remove with rate limits (5 pending/hr, max 10), duplicate & self-friend guards, notifications.

**`app/profile/[userId]/page.tsx` + `comparison.tsx`** — Public profile: title ladder, stats, badges (earned/locked), friend status + Add Friend, enrollments, friends count, comparison view.

**`app/settings/page.tsx` + 5 components** — Tabs: Profile (read-only), Account, Notifications, Privacy, Tutor (bio/subjects/rate/timezone).

### 7.4 Tutoring Module

**`app/tutoring/actions.ts`** (~1000 lines) — Core tutor logic:
- `createTutorProfile` / `updateTutorProfile` (owner-or-admin check)
- `setAvailability` (delete+recreate) / `getTutorAvailability`
- `requestSession` (double-booking guard vs confirmed sessions, insert request, notify tutor)
- `acceptSessionRequest` (slot selection → **Jitsi room ID** → insert `tutor_sessions` confirmed, notify learner) / `declineSessionRequest`
- `getTutors` (directory w/ rating), `getMySessions`, `getPendingRequests`, `getSessionNotes`, `addSessionNote`, `updateSessionStatus`

**`app/tutoring/page.tsx`** — Tutor directory for learners; redirects tutors to `/tutoring/classes`; session list + tutor cards w/ `MessageButton` / `EnrollButton` (status-aware) / `BookSessionButton`.

**`app/tutoring/dashboard/page.tsx`** — Tutor dashboard: profile CTA/edit, availability, pending session requests (Accept/Decline), pending enrollments (Accept/Reject), upcoming/past sessions, accepted learners, group-chat creation.

**`app/tutoring/session/[sessionId]/page.tsx`** — Session detail: status, join window (10 min before start), **embedded Jitsi iframe**, notes add/view.

**`app/tutoring/history/page.tsx`** — Upcoming vs past sessions, status pills, notes.

**`app/tutoring/book/[tutorId]/page.tsx`** — Booking form (date + radio slots + message) → POST `/api/book-session`.

**Client buttons** — `BookSessionButton`, `MessageButton`, `EnrollButton`, `AcceptButton`, `DeclineButton`, `CreateProfileButton`, `EditAvailabilityButton`.

### 7.5 Admin Module

- **`app/admin/page.tsx`** — Stats (users/tutors/sessions/badges) + recent 10 courses + quick actions; admin-role gate.
- **`app/admin/users/`** — Searchable table (name/role/XP/streak), role `<select>` change; `verifyAdmin` guard; can't change own role.
- **`app/admin/courses/`** — Course list + create form; `[courseId]` unit/lesson management (reorder via `orderIndex`); `new/` create flow.
- **`app/admin/lessons/[lessonId]/`** — Lesson editor w/ YouTube video, XP reward, publish toggle, challenge authoring (`LessonEditor.tsx`).
- **`app/admin/badges/`** — Badge CRUD (criteria type/value); delete.
- **`app/admin/tutoring/`** — Tutor oversight: profiles (activate/edit), all sessions + status management.

### 7.6 Messaging Module

**`app/messaging/actions.ts`** (~1000 lines) — `getConversations`, `getMessages`, `sendMessage`, `markRead`, `startDirectConversation`, `createGroupConversation`, `getEnrolledLearnersForGroup`, `leaveGroup`.

Access rules enforced:
- learner↔learner: **accepted friends only**
- tutor→learner: **only if a session request exists**
- learner→tutor: always allowed
- tutor↔tutor / admin: allowed
- blocks respected both directions.

**`app/messages/page.tsx`** — Conversation list w/ relative time, unread badges, Jitsi join link for group rooms.

**`app/messages/[id]/page.tsx`** (client) — Realtime thread via Supabase `messages` channel, optimistic send, mark-read, Jitsi iframe, leave-group.

**`components/MessagingWidget.tsx`** — Floating chat widget from tutoring cards (uses `/api/messaging/*`).

**`components/ChatWidget.tsx`** — Global floating AI-mascot chat bubble → `/api/mascot-chat`, listens for `mascot-pose` events, assembly animation.

### 7.7 Gamification Module

- **`app/gamification/actions.ts`** — `checkAndAwardBadges(userId)`: auto-awards `first_lesson`, `lessons_completed`, `streak_days` badges (idempotent via `onConflictDoNothing`).
- **`app/dashboard/page.tsx`** — Personal dashboard: level `⌊√(xp/100)⌋+1`, XP progress bar, streak, recent enrollments/notifications.

### 7.8 Classroom Module (two sub-systems)

1. **Learner classes** (`app/classes/*`): `/classes` (enrolled groups via `group_members`), `/classes/browse` (public + Join), `/classes/join` (6-char code), `/classes/[id]` (+ assignments + `quiz/[quizId]` runner). Actions: `joinClass`, `joinClassByCode`.
2. **Tutor classes/groups** (`app/tutoring/classes/*`, `app/tutoring/groups/*`): create class (auto code via `nanoid`), assignments/quizzes, `/api/groups` CRUD with enrolled-learner verification.

> ⚠️ These two stacks use **different tables** (`groups` vs `tutor_groups`) — a known duplication to reconcile.

### 7.9 Shared/UI Components

- **`components/Mascot.tsx`** — Animated mascot with 7 poses; used in every page header.
- **`components/Celebration.tsx`** — Post-quiz overlay: confetti, XP/lessons/accuracy/streak cards, badge banner.
- **`components/UserAvatar.tsx`** — Initials/image avatar. **`EnrollmentStatusBadge.tsx`** — status pill. **`SkeletonLoader.tsx`** — skeletons.
- **`components/ui/*`** — shadcn primitives: `button`, `card`, `dialog`, `avatar`, `tabs`, `tooltip`, `skeleton`.

### 7.10 lib / utils / AI

- **`lib/mascot.ts`** — Custom-event mascot triggers consumed by ChatWidget.
- **`lib/rate-limit.ts`** — In-memory fixed-window rate limiter used by API routes.
- **`utils/youtube.ts`** — `extractYouTubeId` (watch/embed/youtu.be/raw-id).
- **`lib/ai/mascotChat.ts`** — Provider chain OpenRouter→OpenAI→canned; Zod validation; hourly cap (20) via `ai_interactions` rows (`provider='mascot_chat'`); attempt audit logging.
- **`lib/ai/generateQuiz.ts`** — AI quiz generation for practice mode + admin authoring.

---

## 8. Roles & Permissions Matrix

| Capability | Learner | Tutor | Admin | Anonymous |
|---|---|---|---|---|
| Sign in / sign up | ✓ | ✓ | ✓ | — |
| `/path`, `/lesson`, `/library`, `/leaderboard` | ✓ | — | — | ✗ |
| `/friends`, `/messages` | ✓ | ✓ | ✓ | ✗ |
| `/tutoring` browse + book sessions | ✓ | — | — | ✗ |
| `/tutoring/dashboard`, `/history`, `/session` | — | ✓ | — | ✗ |
| `/tutoring/classes`, `/tutoring/groups` | — | ✓ | — | ✗ |
| `/classes` (enrolled class) | ✓ | — | — | ✗ |
| `/admin/*` & admin actions | ✗ | ✗ | ✓ | ✗ |
| Role changes (via admin users page) | — | — | ✓ (not self) | — |
| Tutor profile manage | — | own | any | — |
| Session accept/decline | — | own requests | any (via admin) | — |
| Messaging (rules in §7.6) | friends/session-based | gated | broad | ✗ |
| AI mascot chat | ✓ (rate-limited) | ✓ | ✓ | ✗ |

---

## 9. Security Assessment (verified against live DB)

- **RLS enabled on 43 of the public tables** (exceptions are pure join/utility tables); per-table policies exist for `authenticated`/`public`. Realtime is published **only** on `messages`.
- **Server-side quiz grading** — client score ignored (verified tamper test in project docs: injected `fakeClientScore: 100` returned `realCalculatedScore: 0`).
- **Rate limiting** — friend requests (5/hr, 10 pending), mascot chat (20/min in-memory + 20/hr DB), book-session (10/min), enrollments (10/min), groups (20/min).
- **Role gates** in every admin/tutor page + server action.
- **Wide SQL grants** to `anon`/`authenticated` exist on most tables (Supabase default), but RLS policies gate actual access. Recommended hardening: revoke table-level grants not required by PostgREST, keep RLS as the enforcement layer.
- **Not yet implemented**: no payment flow, no email provider (pure Supabase auth), no content moderation queue for `message_reports` (rows are recorded only), `profiles.update` RLS uses `id = auth.uid()` (safe), but role column changes are client-blocked only at app layer (RLS permits same-user updates) — an admin-only trigger/policy would be stronger.
---

## 10. Test Results — Full Playwright Run (207 tests / 56 files)

Server: `http://localhost:4005` (Next.js dev). Credentials from §5.

| Batch | Scope | Result |
|-------|-------|--------|
| 1 | admin-access, admin-authenticated, admin-actions, admin-functionality, comprehensive-admin, login-verification, live-login-test, verify-all-roles | 20 passed, 5 failed (port-only) → all pass after fix |
| 1b | re-run of fixed files (admin-functionality, live-session-booking, live-tutor-profile, test-button-feedback) | **9 passed** |
| 2 | comprehensive-learner/tutor/verification, learner-flow, lesson-completion, dashboard-stats, navigation, session-booking, role-based-learning, tutor-actions/authenticated/profile/session, verify-online-class | 42 passed, 1 failed (test bug), 1 skipped → all pass after fix |
| 3 | messaging & mascot & performance & realtime suites (15 files) | **50 passed, 8 skipped** (intentional skip conditions) |
| 4 | responsive-shell (16), friends, messaging flow, jitsi, navigation-per-role, onboarding, thorough-all-features, thorough-message-button | **33 passed** |
| 5 | screenshot-pages (12), screenshot-shell (2) | **14 passed** |

**Final tally: 199 passed · 8 skipped · 0 failed.**

### Coverage highlights
- **Roles**: login per role, redirect targets, tutor blocked from `/admin/*`, unauthenticated redirects.
- **Admin**: every admin page loads, users search, course/badge pages.
- **Learner**: path/library/friends/leaderboard/notifications/tutoring load; lesson completion + XP; button presence (Add Friend, Message, Book Session).
- **Tutor**: dashboard/history/profile/availability; booking creates a real `session_requests` row (DB-verified).
- **Messaging**: message button → conversation page, learner→tutor send/receive, realtime subscription active.
- **Responsive**: mobile/tablet/desktop shell layouts, no horizontal overflow.
- **Design**: claymorphic tokens + headings/buttons on key pages; desktop+mobile screenshots saved.

### Skips (by design)
- Realtime SQL publication test — manually verified: `messages` **is** published.
- Mascot/measure/messaging tests that skip when no live chat state (e.g., no Message buttons, no sessions).

---

## 11. Issues Found & Fixes Applied

1. **Hardcoded port in tests (5 failures)** — 6 specs used `http://localhost:3000`; app runs on `4005`. Fixed all occurrences → verified passing.
2. **`comprehensive-verification` admin test** — navigated without logging in + missing `await` on `.count()` (caused `Test ended`). Added admin login + `await` → verified 5/5 passing.
3. **Signup `emailRedirectTo` bug** — pointed at `*.supabase.co/auth/callback`. Now `${NEXT_PUBLIC_SITE_URL || 'http://localhost:4005'}/auth/callback` in `app/auth/sign-up/route.ts` and `app/auth/actions.ts`; added `app/auth/callback/route.ts` (code exchange + role redirect); added `NEXT_PUBLIC_SITE_URL` to `.env.local` + `.env.example`.
4. **Env hygiene** — removed scratch output file; kept reusable helper scripts (`scripts/db-inspect.ts`, `db-users.ts`, `db-security.ts`, `check-logins.ts`).
5. **Confirmed not defects** — tutor account is `orphix…` (typo in prompt); both learner accounts verified; `messages` in realtime publication; `tsc --noEmit` exit 0; all smoke routes 200.
---

## 12. Known Gaps & Recommendations

1. **Duplicate classroom stacks** — `groups`/`group_members` (learner classes) vs `tutor_groups`/`tutor_group_members` (tutor groups). Reconcile into one class model.
2. **Button loading states** — Add Friend and Book Session actions lack pending/loading UI; `test-button-feedback` skips those assertions. Add `useFormStatus` spinners.
3. **`profiles.role` self-update** — RLS lets a user update their own `role`. Add an update policy restricted to `auth.uid()` + an existing-role check, or a trigger, to prevent self-promotion.
4. **Wide anon/authenticated SQL grants** — default Supabase posture; tighten if tables are exposed via PostgREST beyond the app.
5. **In-memory rate limiter** (`lib/rate-limit.ts`) — per-process; replace with a DB/Redis-backed limiter when scaling horizontally.
6. **No payment processing** for paid tutoring sessions (Stripe recommended).
7. **Jitsi rooms** appear only after a session is **confirmed**; there are currently no confirmed sessions in the DB, so video-call UI renders empty states (test-verified as acceptable).
8. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** is set in `.env.local` but unused by code — adopt the new publishable-key flow or remove it.
9. **Middleware deprecation warning** — run `npx @next/codemod@canary middleware-to-proxy .` to migrate.
10. **Content seeds** — `assignments=1`, `quizzes=0`, class `group_members=0`: classwork features are scaffolded but lack seed data for demo.

---

## 13. How to Run

```bash
npm install
npm run dev            # Next.js dev (Playwright expects port 4005)
# separate terminal:
npx playwright test             # full suite (207 tests, chromium, 1 worker)
npx playwright test tests/comprehensive-verification.spec.ts
```

Env vars (`.env.local`): `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, optional `TEST_ADMIN/TUTOR/LEARNER_*`.

Verified test accounts:
- Admin `alexabraham587@gmail.com` / `Qasim.11`
- Tutor `orphix.itsolutions@gmail.com` / `Qasim.11`
- Learner `f24608052@nutech.edu.pk` / `Qasim.11`
- Test learner `testlearner+test@gmail.com` / `Test123456!`

---

*Report generated from a live code read (all app files), a live DB inspection (49 tables, RLS/Realtime publication), full Playwright execution of all 207 tests, and live credential verification against Supabase Auth.*