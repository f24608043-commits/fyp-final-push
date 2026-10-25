# Social Feed Testing Report - Server Action Error

## Error Details

**Error Message:**
```
Failed to find Server Action "40b12df6dcc074f5771c5c123efcd88643c122a564". 
This request might be from an older or newer deployment.
```

**When It Occurs:**
- After logging in as learner, tutor, or admin
- When navigating to `/feed`
- When the feed page tries to call `getFeed` server action

**Root Cause:**
The server action fails because the database tables (`posts`, `post_likes`, `post_comments`, `post_hashtags`) do not exist in Supabase. The migration file exists locally but hasn't been applied to the database.

---

## Test Results by Role

### Test 1: Learner Login

**Steps:**
1. Navigate to `/sign-in`
2. Enter learner email and password
3. Click sign in
4. Redirect to `/path`
5. Click "Feed" in navigation
6. Navigate to `/feed`

**Expected Behavior:**
- Feed page loads
- Post composer displays
- Empty state shows "No posts yet" or existing posts display

**Actual Behavior:**
- Runtime Error: "Failed to find Server Action"
- Feed page fails to load
- Error occurs when `getFeed` action tries to query non-existent `posts` table

**Status:** ❌ FAIL

---

### Test 2: Tutor Login

**Steps:**
1. Navigate to `/sign-in`
2. Enter tutor email and password
3. Click sign in
4. Redirect to `/tutoring/dashboard`
5. Click "Feed" in navigation
6. Navigate to `/feed`

**Expected Behavior:**
- Feed page loads
- Post composer displays
- Empty state shows "No posts yet" or existing posts display

**Actual Behavior:**
- Runtime Error: "Failed to find Server Action"
- Feed page fails to load
- Error occurs when `getFeed` action tries to query non-existent `posts` table

**Status:** ❌ FAIL

---

### Test 3: Admin Login

**Steps:**
1. Navigate to `/sign-in`
2. Enter admin email and password
3. Click sign in
4. Redirect to `/admin`
5. Click "Feed" in navigation (if available)
6. Navigate to `/feed`

**Expected Behavior:**
- Feed page loads
- Post composer displays
- Empty state shows "No posts yet" or existing posts display

**Actual Behavior:**
- Runtime Error: "Failed to find Server Action"
- Feed page fails to load
- Error occurs when `getFeed` action tries to query non-existent `posts` table

**Status:** ❌ FAIL

---

## Verification Queries

### Check if Tables Exist

Run in Supabase Dashboard → SQL Editor:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'post%';
```

**Current Expected Result:**
```
(0 rows)
```

**Required Result (after migration):**
```
tablename
-----------
post_likes
post_comments
post_hashtags
posts
```

---

### Check if Storage Bucket Exists

```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'post-media';
```

**Current Expected Result:**
```
(0 rows)
```

**Required Result (after setup):**
```
id | name      | public
----+-----------+--------
xxx | post-media | true
```

---

## Complete Fix Steps

### Phase 1: Database Migration

#### Step 1.1: Apply Migration
```bash
# From project root
supabase db push
```

**What this does:**
- Executes `supabase/migrations/20241023_add_social_feed.sql`
- Creates 4 tables: posts, post_likes, post_comments, post_hashtags
- Creates RLS policies for security
- Creates indexes for performance

**Verify:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'post%';
```

Should return 4 rows.

---

### Phase 2: Storage Setup

#### Step 2.1: Create Storage Bucket
```bash
supabase storage create-bucket post-media
supabase storage update-bucket post-media --public
```

**What this does:**
- Creates `post-media` bucket for images/videos
- Makes bucket public so images can be displayed

**Verify:**
```sql
SELECT id, name, public FROM storage.buckets WHERE name = 'post-media';
```

Should return 1 row with `public = true`.

---

#### Step 2.2: Configure Storage Policies (via Dashboard)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** → **post-media** → **Policies**
4. Create these 3 policies:

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

---

### Phase 3: Realtime Setup

#### Step 3.1: Enable Realtime
Run in Supabase Dashboard → SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
```

**What this does:**
- Enables real-time subscriptions for likes
- Enables real-time subscriptions for comments
- Allows live updates without page refresh

**Verify:**
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('post_likes', 'post_comments');
```

Should return 2 rows.

---

### Phase 4: Restart Development Server

#### Step 4.1: Stop Current Server
Press `Ctrl+C` in the terminal running `npm run dev`

#### Step 4.2: Start Server Again
```bash
npm run dev
```

**Why:** Next.js needs to reload after database schema changes to properly register server actions.

---

### Phase 5: Re-Test

#### Test 1: Learner
1. Login as learner
2. Navigate to `/feed`
3. **Expected:** Feed loads successfully
4. Create a test post
5. **Expected:** Post appears in feed

#### Test 2: Tutor
1. Login as tutor
2. Navigate to `/feed`
3. **Expected:** Feed loads successfully
4. Create a test post
5. **Expected:** Post appears in feed

#### Test 3: Admin
1. Login as admin
2. Navigate to `/feed`
3. **Expected:** Feed loads successfully
4. Create a test post
5. **Expected:** Post appears in feed

---

## Summary

**Current Status:** ❌ NOT WORKING

**Reason:** Database migration not applied - tables don't exist in Supabase

**Impact:** All roles (learner, tutor, admin) cannot access the feed page

**Fix Required:** 
1. Apply database migration (`supabase db push`)
2. Create storage bucket (`post-media`)
3. Configure storage policies (via Dashboard)
4. Enable realtime (SQL queries)
5. Restart dev server
6. Re-test

**Estimated Time to Fix:** 10-15 minutes

---

## After Fix - Expected Behavior

Once the fix is complete:

✅ Learner can access `/feed` and create posts
✅ Tutor can access `/feed` and create posts
✅ Admin can access `/feed` and create posts
✅ Media upload works (images/videos)
✅ Likes and comments work
✅ Realtime updates work
✅ RLS policies enforce visibility rules
