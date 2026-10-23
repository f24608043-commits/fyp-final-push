# Social Feed Setup Guide

This guide provides step-by-step instructions to set up the social feed feature with database, storage, and API configuration.

---

## Prerequisites

- Supabase project created and configured
- Supabase CLI installed (`npm install -g supabase`)
- Node.js and npm installed
- Git repository cloned

---

## Step 1: Environment Variables

Create or update `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Get these from: https://supabase.com/dashboard/project/_/settings/api
```

**Where to find these values:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Apply Database Migration

Run the migration to create social feed tables and RLS policies:

```bash
# From project root
supabase db push
```

This executes `supabase/migrations/20241023_add_social_feed.sql` which creates:
- `posts` table
- `post_likes` table
- `post_comments` table
- `post_hashtags` table
- RLS policies for all tables
- Indexes for performance

**Verify migration:**
```bash
supabase db remote commit
```

---

## Step 3: Create Supabase Storage Bucket

### Option A: Via Supabase CLI

```bash
# Create the bucket
supabase storage create-bucket post-media

# Make it public (so images can be displayed)
supabase storage update-bucket post-media --public
```

### Option B: Via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Storage
4. Click "New bucket"
5. Name it: `post-media`
6. Make it public: ✅
7. Click "Create bucket"

**Bucket configuration:**
- Bucket name: `post-media`
- Public: Yes (required for displaying images)
- File size limit: 10MB (enforced in code)
- Allowed MIME types: `image/*`, `video/*`

---

## Step 4: Configure Storage Policies (RLS for Storage)

**Important:** The `storage.objects` table is owned by Supabase's storage system and cannot be modified via SQL editor. Use the Supabase Dashboard UI instead.

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Storage**
4. Click on the **post-media** bucket
5. Click **Policies** tab
6. Create the following policies:

**Policy 1: Public Read Access**
- Name: `Public Read Access`
- Allowed operations: `SELECT`
- Target roles: `anon`, `authenticated`
- USING expression: `bucket_id = 'post-media'`

**Policy 2: Authenticated Upload**
- Name: `Authenticated Upload`
- Allowed operations: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `bucket_id = 'post-media'`

**Policy 3: Authenticated Delete Own Files**
- Name: `Authenticated Delete Own Files`
- Allowed operations: `DELETE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'post-media'`

**Note:** For MVP simplicity, we're allowing all authenticated users to upload/delete to this bucket. For production, you can add more granular permissions using the `auth.uid()` check in a migration file instead of the Dashboard UI.

### Option B: Via Supabase CLI (Alternative)

```bash
# Create a migration file for storage policies
supabase migration new storage_policies

# Add the policies to the migration file
# Then apply
supabase db push
```

---

## Step 5: Enable Realtime for Social Feed Tables

Run these SQL queries in Supabase Dashboard → SQL Editor:

### 5.1 Enable Realtime on posts table

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
```

**Note:** We only enable realtime on `post_likes` and `post_comments` for engagement updates. The feed itself is refreshed via pagination, not realtime.

---

## Step 6: Verify Setup

### 6.1 Check Tables Exist

Run in Supabase Dashboard → SQL Editor:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'post%';
```

Expected output:
```
tablename
-----------
post_likes
post_comments
post_hashtags
posts
```

### 6.2 Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'post%';
```

Expected: All should show `rowsecurity = true`

### 6.3 Check Storage Bucket Exists

Run in Supabase Dashboard → SQL Editor:

```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'post-media';
```

Expected: Should return one row with `public = true`

### 6.4 Check Realtime is Enabled

```sql
SELECT * 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('post_likes', 'post_comments');
```

Expected: Should return 2 rows

---

## Step 7: Update Test Credentials

Edit `tests/social-feed.spec.ts`:

```typescript
const LEARNER_EMAIL = 'your-actual-learner-email@example.com';
const LEARNER_PASSWORD = 'your-actual-password';
const TUTOR_EMAIL = 'your-actual-tutor-email@example.com';
const TUTOR_PASSWORD = 'your-actual-password';
```

Edit `tests/screenshot-social-feed.spec.ts` with the same credentials.

---

## Step 8: Remove Test Skips

In both test files, remove the `test.skip` line in `beforeEach`:

**Before:**
```typescript
test.beforeEach(async ({ page }) => {
  test.skip(true, 'Database migration not yet applied - run: supabase db push');
});
```

**After:**
```typescript
test.beforeEach(async ({ page }) => {
  // Migration applied - tests can run
});
```

---

## Step 9: Run Development Server

```bash
npm run dev
```

Navigate to:
- http://localhost:3000/feed

---

## Step 10: Test the Feature

### Manual Testing

1. **Create a post:**
   - Login as learner
   - Go to `/feed`
   - Type in post composer: "Hello world #test"
   - Click "Post"
   - Verify post appears

2. **Like a post:**
   - Click the like button
   - Verify count increases and icon fills

3. **Add a comment:**
   - Click comment button
   - Type comment: "Great post!"
   - Click "Post"
   - Verify comment appears

4. **Test media upload:**
   - Click "Add media"
   - Select an image
   - Create post
   - Verify image displays

5. **Test post types:**
   - Select "Celebrate achievement"
   - Create post
   - Verify badge styling

### Automated Testing

```bash
# Run functional tests
npx playwright test tests/social-feed.spec.ts

# Run screenshot tests
npx playwright test tests/screenshot-social-feed.spec.ts

# Run with UI
npx playwright test tests/social-feed.spec.ts --ui
```

---

## Step 11: Test RLS (Security)

Follow the scenarios in `SOCIAL_FEED_RLS_TESTING.md`:

1. User can see own posts ✅
2. Friend can see friend's posts ✅
3. Non-friend cannot see friends-only posts ✅
4. Group members can see group posts ✅
5. Non-group members cannot see group posts ✅
6. User can only delete own posts ✅
7. User can only delete own comments ✅

---

## API Endpoints Used

The social feed uses these Supabase APIs automatically via the client:

### 1. Database API (Postgres)
- **Base URL:** `https://your-project.supabase.co`
- **Endpoint:** `/rest/v1/*`
- **Authentication:** Bearer token (anon key or user JWT)

**Tables accessed:**
- `GET /rest/v1/posts` - fetch feed
- `POST /rest/v1/posts` - create post
- `DELETE /rest/v1/posts` - delete post
- `GET /rest/v1/post_likes` - fetch likes
- `POST /rest/v1/post_likes` - add like
- `DELETE /rest/v1/post_likes` - remove like
- `GET /rest/v1/post_comments` - fetch comments
- `POST /rest/v1/post_comments` - add comment
- `DELETE /rest/v1/post_comments` - delete comment
- `GET /rest/v1/post_hashtags` - fetch hashtags
- `POST /rest/v1/post_hashtags` - add hashtags

### 2. Storage API
- **Base URL:** `https://your-project.supabase.co`
- **Endpoint:** `/storage/v1/*`
- **Authentication:** Bearer token (user JWT)

**Operations:**
- `POST /storage/v1/object/post-media/{userId}/{postId}/{filename}` - upload media
- `GET /storage/v1/object/public/post-media/{userId}/{postId}/{filename}` - download media
- `DELETE /storage/v1/object/post-media/{userId}/{postId}/{filename}` - delete media

### 3. Realtime API
- **Base URL:** `wss://your-project.supabase.co/realtime/v1`
- **Authentication:** JWT token
- **Channels:** `post-engagement-{postId}`

**Events:**
- `postgres_changes` on `post_likes` (INSERT, DELETE)
- `postgres_changes` on `post_comments` (INSERT, DELETE)

---

## File Upload Path Structure

Media files are stored in Supabase Storage with this path structure:

```
post-media/
├── {userId}/
│   ├── {postId}/
│   │   ├── image1.jpg
│   │   ├── image2.png
│   │   └── video1.mp4
```

**Example:**
```
post-media/user-abc-123/post-xyz-789/photo.jpg
```

This structure:
- Organizes files by user
- Groups files by post
- Allows easy cleanup when deleting posts

---

## Troubleshooting

### Issue: "Bucket not found" error

**Solution:** Create the bucket:
```bash
supabase storage create-bucket post-media
supabase storage update-bucket post-media --public
```

### Issue: "Permission denied" on file upload

**Solution:** Check storage RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

Ensure the upload policy exists and is correct.

### Issue: Posts not appearing in feed

**Solution:** Check RLS policies on posts table:
```sql
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

Ensure visibility policies exist.

### Issue: Realtime not working

**Solution:** Verify realtime is enabled:
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('post_likes', 'post_comments');
```

### Issue: Images not displaying

**Solution:** Ensure bucket is public:
```sql
SELECT name, public FROM storage.buckets WHERE name = 'post-media';
```

If `public = false`, run:
```sql
UPDATE storage.buckets SET public = true WHERE name = 'post-media';
```

---

## Summary Checklist

- [ ] Environment variables configured (.env.local)
- [ ] Database migration applied (`supabase db push`)
- [ ] Storage bucket created (`post-media`)
- [ ] Storage bucket made public
- [ ] Storage RLS policies applied
- [ ] Realtime enabled for post_likes and post_comments
- [ ] Test credentials updated
- [ ] Test skips removed
- [ ] Development server running
- [ ] Manual testing completed
- [ ] Automated tests passing
- [ ] RLS testing completed
- [ ] Screenshots captured

---

## Next Steps After Setup

1. **Create test data:** Use the UI to create sample posts with different types
2. **Test with real users:** Have multiple users test friend/group visibility
3. **Monitor performance:** Check query performance with Supabase Dashboard
4. **Review logs:** Check for any errors in browser console or server logs
5. **Deploy to production:** Follow your deployment process

---

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Review browser console errors
3. Verify environment variables
4. Check migration status: `supabase db remote commit`
5. Review this guide's troubleshooting section
