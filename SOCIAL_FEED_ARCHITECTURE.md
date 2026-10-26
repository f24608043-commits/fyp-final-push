# Social Feed Architecture Report
## LinkedIn-Style Feed System

---

## Overview

The social feed system (`/feed`) is designed to function similarly to LinkedIn, allowing users to share updates, engage with content through likes and comments, and see posts from their friends and learning groups. The feed implements infinite scrolling for a seamless browsing experience.

---

## Core Components

### 1. Feed Page (`app/feed/page.tsx`)
**Purpose:** Main entry point for the social feed

**Features:**
- **Stitch-frame style header** with mascot and motivational quote
- **Feed statistics dashboard** showing:
  - User's total posts
  - Friend count with link to find more friends
  - Current feed post count
- **Post Composer** for creating new posts
- **Feed List** with infinite scroll
- **Empty state** with call-to-action to add friends

**Data Flow:**
1. Server component fetches user authentication
2. Queries database for user stats (posts, friends)
3. Fetches initial feed data via `getFeed()` action
4. Renders feed with initial 20 posts

---

### 2. Post Composer (`app/feed/PostComposer.tsx`)
**Purpose:** Allow users to create new posts

**Features:**
- **5 Post Types:**
  - General (default) - Share updates
  - Achievement - Celebrate milestones
  - Resource - Share learning materials
  - Milestone - Mark progress
  - Question - Ask for help
- **Text input** with 3000 character limit
- **Media upload** support (images/videos, max 10MB)
- **Hashtag parsing** - Automatically detects #hashtags
- **Real-time character counter**

**Data Flow:**
1. User selects post type
2. User enters content (text + optional media)
3. On submit:
   - Validates input
   - Creates FormData with body, postType, media
   - Calls `createPost()` server action
   - Uploads media to Supabase Storage if present
   - Inserts post into database
   - Parses hashtags and stores them
   - Page reloads to show new post

**Server Action:** `createPost(formData)` in `app/feed/actions.ts`

---

### 3. Feed List (`app/feed/FeedList.tsx` & `FeedListClient.tsx`)
**Purpose:** Display posts with infinite scrolling

**Architecture:**
- **Server Component (`FeedList.tsx`):**
  - Fetches initial 20 posts via `getFeed(undefined, 20)`
  - Passes data to client component

- **Client Component (`FeedListClient.tsx`):**
  - Manages post state
  - Implements infinite scroll using Intersection Observer
  - Handles post interactions (delete, like, comment)
  - Loads more posts when user scrolls to bottom

**Infinite Scroll Implementation:**
```typescript
// Intersection Observer detects when user reaches bottom
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadMore(); // Fetch next page
    }
  },
  { threshold: 0.1 }
);
```

**Pagination:**
- Cursor-based pagination for efficiency
- Each page returns 20 posts
- `nextCursor` indicates if more posts exist
- Shows loading spinner during fetch
- Shows "You're all caught up!" when no more posts

---

### 4. Post Card (`app/feed/PostCard.tsx`)
**Purpose:** Display individual posts with engagement options

**Features:**
- **Author info:** Avatar, display name, post type badge
- **Post content:** Text with hashtag highlighting, media display
- **Engagement actions:**
  - Like button with count (filled heart when liked)
  - Comment button with count
- **Delete button** (only for own posts)
- **Comments section:**
  - Expandable comment list
  - Comment input with 1000 character limit
  - Real-time comment count updates

**Post Types & Visual Treatment:**
- **General:** Default styling
- **Achievement:** Purple/tertiary color with trophy icon
- **Resource:** Blue/primary color with book icon
- **Milestone:** Green/success color with flag icon
- **Question:** Orange/warning color with help icon

**Data Flow:**
1. Receives post data as props
2. Manages local state for:
   - Comments list
   - Comment input
   - Loading states
3. On like:
   - Calls API endpoint via fetch
   - Updates local like count and status
   - No page reload needed
4. On comment:
   - Calls API endpoint via fetch
   - Adds comment to local state
   - Updates comment count
5. On delete:
   - Calls API endpoint via fetch
   - Triggers parent to remove post from list

---

## Database Schema

### Posts Table
```sql
posts (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  body TEXT (max 3000 chars),
  media_urls TEXT[],
  post_type ENUM (general, achievement, resource, milestone, question),
  reference_badge_id UUID REFERENCES user_badges(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Post Likes Table
```sql
post_likes (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP,
  UNIQUE(post_id, user_id)
)
```

### Post Comments Table
```sql
post_comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT (max 1000 chars),
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Post Hashtags Table
```sql
post_hashtags (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  UNIQUE(post_id, hashtag)
)
```

---

## Server Actions (`app/feed/actions.ts`)

### 1. createPost(formData)
**Purpose:** Create a new post

**Process:**
1. Authenticate user
2. Extract body, postType, media from FormData
3. Upload media to Supabase Storage if present
4. Insert post into database
5. Parse hashtags from body (#tag format)
6. Insert hashtags into post_hashtags table
7. Return success

**Validation:**
- Body must be 1-3000 characters
- Media must be < 10MB
- User must be authenticated

---

### 2. getFeed(cursor, limit)
**Purpose:** Fetch feed posts with pagination

**Process:**
1. Authenticate user
2. Get friend IDs from friendships table (accepted status)
3. Get group member IDs from group_members table
4. Query posts where:
   - Author is user OR
   - Author is friend OR
   - Author is in same group
5. Order by created_at DESC
6. Apply cursor-based pagination
7. Fetch like counts and user's like status
8. Fetch comment counts
9. Fetch hashtags
10. Return posts with nextCursor

**Security:**
- Only shows posts from friends and groups
- Respects RLS policies
- Excludes deleted posts

---

### 3. toggleLike(postId)
**Purpose:** Like/unlike a post

**Process:**
1. Authenticate user
2. Check if user already liked the post
3. If liked: delete from post_likes
4. If not liked: insert into post_likes
5. Return new like count and status

**Optimization:**
- Uses upsert for atomic operation
- No page reload needed

---

### 4. addComment(postId, body)
**Purpose:** Add a comment to a post

**Process:**
1. Authenticate user
2. Validate body (1-1000 characters)
3. Insert comment into post_comments
4. Return comment with author info

**Features:**
- Supports nested comments (via parent_comment_id)
- Real-time comment count updates

---

### 5. deleteComment(commentId)
**Purpose:** Delete a comment

**Process:**
1. Authenticate user
2. Verify user owns the comment
3. Delete comment from database
4. Return success

---

### 6. deletePost(postId)
**Purpose:** Delete a post

**Process:**
1. Authenticate user
2. Verify user owns the post
3. Mark post as deleted (soft delete)
4. Return success

**Note:** Soft delete allows recovery if needed

---

## Row Level Security (RLS) Policies

### Posts Table
```sql
-- Users can read own posts
CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT
  USING (author_id = auth.uid());

-- Users can read friends' posts
CREATE POLICY "Users can read friends posts"
  ON posts FOR SELECT
  USING (
    author_id IN (
      SELECT addressee_id FROM friendships
      WHERE requester_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT requester_id FROM friendships
      WHERE addressee_id = auth.uid() AND status = 'accepted'
    )
  );

-- Users can insert own posts
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Users can update own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (author_id = auth.uid());

-- Users can delete own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (author_id = auth.uid());
```

### Post Likes
- Users can read likes on visible posts
- Users can insert/delete their own likes

### Post Comments
- Users can read comments on visible posts
- Users can insert their own comments
- Users can delete their own comments

---

## Integration with Other App Features

### 1. Friends System
**Connection:** Feed shows posts from friends only

**How it works:**
- `getFeed()` queries friendships table
- Only shows posts where author is in accepted friendship
- Friend request notifications appear in feed context

**Flow:**
```
User sends friend request → Friend accepts → Both users see each other's posts in feed
```

---

### 2. Notifications System
**Connection:** Feed actions trigger notifications

**Notifications sent:**
- When someone likes your post
- When someone comments on your post
- When someone replies to your comment

**Implementation:**
- Server actions call notification functions
- Notifications appear in notification center
- Real-time updates via Supabase Realtime

---

### 3. Badges System
**Connection:** Achievement posts can reference badges

**How it works:**
- User selects "Achievement" post type
- Can optionally link to a badge they earned
- Badge displayed with post
- Encourages sharing accomplishments

---

### 4. Groups System
**Connection:** Feed shows posts from group members

**How it works:**
- `getFeed()` queries group_members table
- Shows posts from users in same learning groups
- Enables group-based content sharing

---

### 5. Profile System
**Connection:** Feed displays user profiles

**How it works:**
- Each post shows author's avatar and display name
- Clicking author navigates to their profile
- Profile shows user's posts, stats, badges

---

## Data Flow Diagram

```
User Action → Client Component → Server Action → Database → Response → UI Update

Example: Like a Post
1. User clicks like button
2. PostCard calls fetch('/feed/actions') with action=toggleLike
3. Server action checks authentication
4. Server queries post_likes table
5. Server inserts/deletes like record
6. Server returns new like count and status
7. PostCard updates local state
8. UI shows updated like count and filled heart
```

---

## Performance Optimizations

### 1. Cursor-Based Pagination
- Efficient for large datasets
- No OFFSET, uses WHERE id > cursor
- Consistent ordering

### 2. Selective Querying
- Only fetches needed fields
- Joins for related data in single query
- Limits results (20 per page)

### 3. Indexes
```sql
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
```

### 4. Caching
- Next.js server component caching
- Revalidation on data changes
- Optimistic UI updates

---

## User Experience Features

### 1. Infinite Scroll
- Seamless content loading
- No pagination buttons
- Loading indicator
- "All caught up" message

### 2. Optimistic Updates
- Like/comment updates immediately
- No waiting for server response
- Rollback on error

### 3. Real-time Engagement
- Like counts update instantly
- Comments appear immediately
- No page reloads

### 4. Responsive Design
- Mobile-friendly layout
- Touch-friendly buttons
- Adaptive media sizing

### 5. Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

---

## Security Considerations

### 1. Authentication
- All server actions check auth
- Supabase auth integration
- Protected routes

### 2. Authorization
- RLS policies on all tables
- User can only modify own content
- Friend-based visibility

### 3. Input Validation
- Character limits enforced
- File size limits
- SQL injection prevention (Drizzle ORM)
- XSS prevention (React escaping)

### 4. Rate Limiting
- Post creation limits
- Comment limits
- Friend request limits

---

## Future Enhancements

### Potential Features:
1. **Post editing** - Allow users to edit their posts
2. **Post sharing** - Share posts to other platforms
3. **Post bookmarking** - Save posts for later
4. **Hashtag pages** - Browse posts by hashtag
5. **Post analytics** - View engagement stats
6. **Rich text editor** - Better formatting options
7. **Polls** - Add polls to posts
8. **Mentions** - @mention other users
9. **GIF support** - Integrate GIF libraries
10. **Video embedding** - YouTube, Vimeo integration

---

## Testing

### Playwright Tests (`tests/social-feed.spec.ts`)
- Feed page loads and displays empty state
- User can create a post
- User can like a post
- User can comment on a post
- User can delete their own post
- Non-friend cannot see friends-only posts (RLS)
- Pagination loads second page via cursor
- Hashtag parsing works with multiple tags
- Achievement post type has distinct visual treatment
- Post type selector works correctly
- Character limit enforced on post body
- Comment character limit enforced

### Manual Testing Checklist
- [ ] Create post with text only
- [ ] Create post with media
- [ ] Create post with hashtags
- [ ] Test each post type
- [ ] Like/unlike post
- [ ] Add comment
- [ ] Delete comment
- [ ] Delete post
- [ ] Test infinite scroll
- [ ] Test empty state
- [ ] Test with no friends
- [ ] Test with friends
- [ ] Test on mobile

---

## Summary

The social feed system provides a LinkedIn-like experience with:
- **Posting** - Share updates, achievements, resources, milestones, questions
- **Engagement** - Like and comment on posts
- **Discovery** - See posts from friends and learning groups
- **Performance** - Infinite scroll with cursor-based pagination
- **Security** - RLS policies and authentication
- **Integration** - Connected to friends, notifications, badges, groups, profiles

The system is built with Next.js server components, Drizzle ORM, and Supabase for a modern, scalable architecture.
