# Social Feed RLS Testing Procedure

## Overview

This document outlines the procedure for testing Row Level Security (RLS) policies for the social feed feature. The RLS policies ensure that users can only see posts from:
1. Their own posts
2. Posts from friends (accepted friendships)
3. Posts from users in shared groups

## Prerequisites

1. Database migration must be applied:
   ```bash
   supabase db push
   ```

2. Test accounts must exist:
   - User A (learner)
   - User B (learner, friend of User A)
   - User C (learner, NOT friend of User A)
   - User D (tutor)

## Test Scenarios

### Scenario 1: User Can See Own Posts

**Steps:**
1. Login as User A
2. Navigate to `/feed`
3. Create a post: "My test post"
4. Verify the post appears in the feed

**Expected Result:** ✅ Post is visible to User A

---

### Scenario 2: Friend Can See Friend's Posts

**Setup:**
1. Ensure User A and User B are friends (friendship status = 'accepted')

**Steps:**
1. Login as User A
2. Create a post: "Hello friends!"
3. Logout
4. Login as User B
5. Navigate to `/feed`

**Expected Result:** ✅ User B can see User A's post

---

### Scenario 3: Non-Friend Cannot See Friends-Only Posts

**Setup:**
1. Ensure User A and User C are NOT friends (no friendship record or status != 'accepted')

**Steps:**
1. Login as User A
2. Create a post: "Private message"
3. Logout
4. Login as User C
5. Navigate to `/feed`

**Expected Result:** ✅ User C CANNOT see User A's post

---

### Scenario 4: Group Members Can See Each Other's Posts

**Setup:**
1. Create a group with ID: group-123
2. Add User A to group-123
3. Add User B to group-123

**Steps:**
1. Login as User A
2. Create a post: "Group announcement"
3. Logout
4. Login as User B
5. Navigate to `/feed`

**Expected Result:** ✅ User B can see User A's post (because they share a group)

---

### Scenario 5: Non-Group Member Cannot See Group Posts

**Setup:**
1. User A is in group-123
2. User C is NOT in group-123

**Steps:**
1. Login as User A
2. Create a post: "Group only content"
3. Logout
4. Login as User C
5. Navigate to `/feed`

**Expected Result:** ✅ User C CANNOT see User A's post

---

### Scenario 6: User Can Only Delete Own Posts

**Steps:**
1. Login as User A
2. Create a post: "Deletable post"
3. Logout
4. Login as User B
5. Navigate to `/feed`
6. Attempt to find delete button on User A's post

**Expected Result:** ✅ Delete button is NOT visible for User B on User A's post

---

### Scenario 7: User Can Only Delete Own Comments

**Steps:**
1. Login as User A
2. Create a post: "Comment test"
3. Add a comment: "My comment"
4. Logout
5. Login as User B
6. Navigate to `/feed`
7. Open comments on User A's post
8. Attempt to find delete button on User A's comment

**Expected Result:** ✅ Delete button is NOT visible for User B on User A's comment

---

### Scenario 8: Likes Follow Post Visibility

**Setup:**
1. User A creates a post
2. User B is NOT friends with User A

**Steps:**
1. Login as User A
2. Create a post: "Like test"
3. Logout
4. Login as User B
5. Attempt to like the post (should not be visible)

**Expected Result:** ✅ User B cannot see or like User A's post

---

## Manual Testing with SQL Queries

### Check if RLS is enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'post_likes', 'post_comments', 'post_hashtags');
```

Expected: All should show `rowsecurity = true`

---

### Test RLS Policy: Users can read own posts

```sql
-- Set auth context to User A
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-a-id';

-- Should return User A's posts
SELECT * FROM posts WHERE author_id = 'user-a-id';

-- Should NOT return User B's posts
SELECT * FROM posts WHERE author_id = 'user-b-id';
```

---

### Test RLS Policy: Users can read friends' posts

```sql
-- Set auth context to User A
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-a-id';

-- Should return posts from friends
SELECT p.* 
FROM posts p
JOIN friendships f ON (
  (f.user_id_1 = 'user-a-id' AND f.user_id_2 = p.author_id)
  OR (f.user_id_2 = 'user-a-id' AND f.user_id_1 = p.author_id)
)
WHERE f.status = 'accepted';
```

---

### Test RLS Policy: Users can read group posts

```sql
-- Set auth context to User A
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-a-id';

-- Should return posts from group members
SELECT p.*
FROM posts p
WHERE p.author_id IN (
  SELECT gm2.user_id
  FROM group_members gm1
  JOIN group_members gm2 ON gm1.group_id = gm2.group_id
  WHERE gm1.user_id = 'user-a-id' AND gm2.user_id != 'user-a-id'
);
```

---

## Automated Testing

The Playwright test file `tests/social-feed.spec.ts` includes an automated test for RLS:

```typescript
test('non-friend cannot see friends-only post (RLS)', async ({ page, context }) => {
  // User 1 creates a post
  // User 2 (not friends) tries to view feed
  // Verify post is NOT visible
});
```

Run with:
```bash
npx playwright test tests/social-feed.spec.ts
```

---

## Verification Checklist

Before marking RLS as complete, verify:

- [ ] Migration applied successfully
- [ ] RLS enabled on all social feed tables
- [ ] Users can see own posts
- [ ] Friends can see each other's posts
- [ ] Non-friends cannot see friends-only posts
- [ ] Group members can see each other's posts
- [ ] Non-group members cannot see group posts
- [ ] Users can only delete own posts
- [ ] Users can only delete own comments
- [ ] Likes/comments follow post visibility
- [ ] Playwright RLS test passes

---

## Troubleshooting

### Issue: User can see posts they shouldn't

**Solution:** Check RLS policies are correctly defined and enabled:
```sql
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

### Issue: User cannot see their own posts

**Solution:** Check the "Users can read own posts" policy exists and is correct:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'posts' 
AND policyname = 'Users can read own posts';
```

### Issue: Group posts not visible

**Solution:** Verify group_members table has correct data and the group posts policy logic is correct.

---

## Security Notes

1. RLS policies are enforced at the database level
2. Server actions also perform authorization checks (NFR5 rule)
3. Both layers provide defense in depth
4. Never rely solely on frontend authorization
