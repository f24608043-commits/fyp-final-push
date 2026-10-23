# Social Feed Implementation Status & Troubleshooting

## What We Built

We implemented a **LinkedIn-style social feed MVP** for the LEGO Digital Learning Platform with the following components:

### 1. Database Schema (`supabase/migrations/20241023_add_social_feed.sql`)
- **posts table**: Stores user posts with body, media URLs, post type (general/achievement/resource/milestone/question), and badge references
- **post_likes table**: Tracks likes with composite key on (post_id, user_id) to prevent duplicate likes
- **post_comments table**: Supports threaded comments via parent_comment_id
- **post_hashtags table**: Enables hashtag discovery and search
- **RLS Policies**: Enforces visibility rules - users can only see posts from themselves, friends, or shared groups

### 2. Server Actions (`app/feed/actions.ts`)
- `createPost`: Parses hashtags from post body, uploads media to Supabase Storage, inserts post and hashtags
- `deletePost`: Soft deletes posts (author only)
- `toggleLike`: Inserts or deletes like, returns updated count
- `addComment`: Adds comments with threading support
- `deleteComment`: Deletes comments (author only)
- `getFeed`: Fetches posts with cursor-based pagination, respects friend/group visibility
- `getPostComments`: Fetches comments with cursor-based pagination

### 3. UI Components
- **Feed Page** (`/feed`): Main feed with post composer and infinite scroll
- **PostComposer**: Post type selector, character limit (3000), media upload (10MB max)
- **FeedList**: Infinite scroll with intersection observer for cursor-based pagination
- **PostCard**: Displays posts with author info, media, likes, comments, hashtags, delete button

### 4. Navigation
- Added Feed to learner sidebar (between Classes and Tutoring)
- Added Feed to learner bottom bar (between Classes and Tutoring)
- Added Feed to tutor sidebar (between Dashboard and History)
- Added Feed to tutor bottom bar (between Dashboard and Learners)

### 5. Realtime Integration (`lib/realtime.ts`)
- `subscribeToPostEngagement`: Subscribes to live updates on post_likes and post_comments
- Integrated in PostCard to update like counts and comments in real-time

### 6. Testing
- **Functional tests** (`tests/social-feed.spec.ts`): 12 Playwright tests covering post creation, likes, comments, deletion, RLS, pagination, hashtags
- **Screenshot tests** (`tests/screenshot-social-feed.spec.ts`): 8 tests for 390px and 1440px viewports
- **RLS documentation** (`SOCIAL_FEED_RLS_TESTING.md`): Manual testing procedures for security verification

---

## Current Status

### ✅ Completed (Code Level)
- Database schema and migration file created
- Server actions implemented with authorization checks
- UI components built with modern design
- Navigation added for both learner and tutor roles
- Realtime subscription function implemented
- Playwright tests written
- Setup guide created

### ⏳ Pending (Setup Required)
- **Database migration not applied** - Tables don't exist in Supabase yet
- **Storage bucket not created** - `post-media` bucket doesn't exist
- **Storage policies not configured** - Can't upload/download media
- **Realtime not enabled** - Live updates won't work
- **Test credentials not updated** - Tests are skipped
- **Environment variables not verified** - Supabase connection may fail

---

## Why It's Not Working

The feature is **not working because the database setup hasn't been completed**. Here's the breakdown:

### Issue 1: Database Migration Not Applied
**Problem:** The SQL migration file exists locally but hasn't been pushed to your Supabase project.

**Impact:** 
- Tables (`posts`, `post_likes`, `post_comments`, `post_hashtags`) don't exist
- Server actions will fail with "relation does not exist" errors
- RLS policies don't exist
- No data can be stored

**Solution:** Run `supabase db push` to apply the migration.

---

### Issue 2: Storage Bucket Not Created
**Problem:** The `post-media` bucket for storing images/videos doesn't exist in Supabase Storage.

**Impact:**
- Media upload will fail with "bucket not found" error
- Posts with images/videos cannot be created
- Only text-only posts will work

**Solution:** Create bucket via Dashboard or CLI:
```bash
supabase storage create-bucket post-media
supabase storage update-bucket post-media --public
```

---

### Issue 3: Storage Policies Not Configured
**Problem:** Even if bucket exists, RLS policies prevent access.

**Impact:**
- Authenticated users cannot upload files
- Public users cannot view images
- Delete operations fail

**Solution:** Create 3 policies via Supabase Dashboard → Storage → post-media → Policies:
1. Public Read Access (SELECT for anon, authenticated)
2. Authenticated Upload (INSERT for authenticated)
3. Authenticated Delete Own Files (DELETE for authenticated)

---

### Issue 4: Realtime Not Enabled
**Problem:** Realtime subscriptions won't work if tables aren't added to the publication.

**Impact:**
- Like counts won't update live
- Comments won't appear in real-time
- Users need to refresh to see updates

**Solution:** Run in SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
```

---

### Issue 5: Environment Variables May Be Missing
**Problem:** `.env.local` may not have correct Supabase credentials.

**Impact:**
- App cannot connect to Supabase
- All API calls fail
- Authentication fails

**Solution:** Verify `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## What Needs To Be Done Now

### Step 1: Apply Database Migration
```bash
supabase db push
```

### Step 2: Create Storage Bucket
```bash
supabase storage create-bucket post-media
supabase storage update-bucket post-media --public
```

### Step 3: Configure Storage Policies (via Dashboard)
1. Go to Supabase Dashboard → Storage → post-media → Policies
2. Create "Public Read Access" policy (SELECT for anon, authenticated)
3. Create "Authenticated Upload" policy (INSERT for authenticated)
4. Create "Authenticated Delete Own Files" policy (DELETE for authenticated)

### Step 4: Enable Realtime
Run in Supabase Dashboard → SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
```

### Step 5: Verify Environment Variables
Check `.env.local` has correct Supabase credentials.

### Step 6: Update Test Credentials
Edit `tests/social-feed.spec.ts` and `tests/screenshot-social-feed.spec.ts` with actual email/password.

### Step 7: Remove Test Skips
Remove `test.skip(true, ...)` from both test files.

### Step 8: Run Development Server
```bash
npm run dev
```

### Step 9: Test Manually
1. Navigate to http://localhost:3000/feed
2. Create a post
3. Like the post
4. Add a comment
5. Verify everything works

### Step 10: Run Automated Tests
```bash
npx playwright test tests/social-feed.spec.ts
npx playwright test tests/screenshot-social-feed.spec.ts
```

---

## Summary

**What we built:** A complete social feed feature with database schema, server actions, UI components, navigation, realtime integration, and tests.

**Why it's not working:** The infrastructure (database tables, storage bucket, policies, realtime) hasn't been set up in Supabase yet. The code is complete and ready, but the backend resources need to be provisioned.

**What to do now:** Follow Steps 1-10 above to complete the setup. Once the database migration is applied and storage is configured, the feature will work immediately.
