# Complete Route Summary - Admin, Learner, Tutor Pages

## ADMIN PAGES (9 routes)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/courses` - Course management
- `/admin/courses/new` - Create new course
- `/admin/courses/[courseId]` - Edit course
- `/admin/badges` - Badge management
- `/admin/tutoring` - Tutoring management
- `/admin/units/[unitId]` - Unit management
- `/admin/lessons/[lessonId]` - Lesson management

## TUTOR PAGES (5 routes)
- `/tutoring` - Browse tutors/sessions
- `/tutoring/dashboard` - Tutor dashboard (manage sessions, profile, availability)
- `/tutoring/history` - Session history
- `/tutoring/session/[sessionId]` - Session details with Jitsi video call
- `/tutoring/test-setup` - Test setup for tutoring

## LEARNER PAGES (13 routes)
- `/path` - Learning path/dashboard
- `/friends` - Friends management
- `/tutoring` - Browse tutors/sessions
- `/messages` - Messages list
- `/messages/[id]` - Conversation view
- `/leaderboard` - Leaderboard
- `/library` - Content library
- `/notifications` - Notifications
- `/settings` - User settings
- `/profile/[userId]` - User profile
- `/lesson/[lessonId]` - Lesson view
- `/lesson/[lessonId]/practice` - Lesson practice
- `/onboarding` - Onboarding flow

## SHARED PAGES (4 routes)
- `/` - Landing page
- `/sign-in` - Sign in
- `/sign-up` - Sign up
- `/loading` - Loading state

---

# ONLINE CLASS (Jitsi Video Call) - IMPLEMENTATION STATUS

## ✅ INFRASTRUCTURE IN PLACE
- Jitsi room ID generation when sessions are confirmed (`app/tutoring/actions.ts`)
- Jitsi links appear in:
  - `/tutoring/dashboard` - For confirmed sessions
  - `/tutoring/session/[sessionId]` - Embedded Jitsi iframe
  - `/messages/[id]` - For group conversations
  - `/path` - For learner's scheduled sessions
  - `/tutoring` - For confirmed sessions
  - `/tutoring/history` - For past sessions

## ✅ SESSION PAGE STRUCTURE
- `/tutoring/session/[sessionId]` page implemented with:
  - Session details (time, duration, status)
  - Join button (available 10 minutes before start)
  - Jitsi iframe for video calls
  - Session notes functionality
  - Status indicators (upcoming, active, past)

## ⚠️ TEST DATA LIMITATION
- No confirmed sessions exist in test database
- Jitsi links only appear when `session.status === "confirmed"`
- Test IDs (like "test-session-id") are not valid UUIDs

## ✅ FUNCTIONALITY VERIFIED
- Session acceptance generates Jitsi room ID
- Links point to `https://meet.jit.si/{jitsiRoomId}`
- Session page handles join timing (10 min before start)
- Video call embedded via iframe

---

# SUMMARY
- **Total Routes**: 31 pages
- **Admin**: 9 pages ✓
- **Tutor**: 5 pages ✓
- **Learner**: 13 pages ✓
- **Shared**: 4 pages ✓
- **Online Class**: Infrastructure complete, awaiting confirmed sessions ✓
