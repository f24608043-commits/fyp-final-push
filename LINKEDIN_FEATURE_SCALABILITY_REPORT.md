# LinkedIn-Style Achievement & Social Feed Feature
## Scalability Report and Implementation Plan

**Document Version:** 1.0  
**Date:** October 22, 2026  
**Project:** LEGO Digital Learning Platform  
**Author:** Abu Bakar

---

## Executive Summary

This report outlines the design and implementation strategy for a LinkedIn-style social feed and achievement posting feature for the LEGO Digital Learning Platform. The feature will enable both tutors and learners to share achievements, posts, and professional updates, fostering a community-driven learning environment.

---

## 1. Feature Overview

### 1.1 Core Capabilities

**For Tutors:**
- Post teaching achievements (certifications, courses completed, awards)
- Share learning resources and articles
- Announce new courses or workshops
- Showcase student success stories
- Build professional network with other tutors

**For Learners:**
- Share learning milestones (course completions, badges earned)
- Post project showcases and portfolios
- Ask questions and seek guidance
- Connect with peers and mentors
- Discover learning opportunities

**Feed System:**
- Personalized feed based on connections and interests
- Trending posts from the broader community
- Real-time updates via WebSocket/Supabase Realtime
- Like, comment, and share functionality
- Rich media support (images, videos, documents)

---

## 2. Database Schema Design

### 2.1 New Tables Required

```sql
-- Posts Table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type VARCHAR(50) NOT NULL, -- 'achievement', 'resource', 'question', 'update'
  media_urls TEXT[], -- Array of image/video URLs
  visibility VARCHAR(20) DEFAULT 'connections', -- 'public', 'connections', 'private'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_posts_user_id (user_id),
  INDEX idx_posts_created_at (created_at DESC),
  INDEX idx_posts_visibility (visibility)
);

-- Post Likes Table
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  INDEX idx_post_likes_post_id (post_id),
  INDEX idx_post_likes_user_id (user_id)
);

-- Post Comments Table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_post_comments_post_id (post_id),
  INDEX idx_post_comments_parent_id (parent_comment_id)
);

-- Connections/Follows Table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  INDEX idx_connections_follower (follower_id),
  INDEX idx_connections_following (following_id),
  INDEX idx_connections_status (status)
);

-- Achievements Table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achievement_type VARCHAR(50) NOT NULL, -- 'course_completion', 'certification', 'award', 'milestone'
  badge_url TEXT,
  issued_date DATE,
  issuer VARCHAR(255),
  verification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_achievements_user_id (user_id),
  INDEX idx_achievements_type (achievement_type)
);

-- Post Hashtags Table
CREATE TABLE post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_post_hashtags_tag (tag),
  INDEX idx_post_hashtags_post_id (post_id)
);

-- Feed Algorithm Cache (Optional for performance)
CREATE TABLE feed_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_feed_cache_user_score (user_id, score DESC)
);
```

### 2.2 Schema Integration with Existing Tables

The new tables will integrate with existing schema:
- `profiles` table for user information
- `tutor_profiles` for tutor-specific achievements
- `badges` table for gamification integration
- `groups` for sharing posts within learning groups

---

## 3. Feed Algorithm Design

### 3.1 Personalized Feed Ranking

The feed will use a multi-factor scoring algorithm:

```javascript
Feed Score = (Time Decay × 0.3) + 
             (Connection Strength × 0.25) + 
             (Engagement Score × 0.25) + 
             (Content Relevance × 0.15) + 
             (User Interests × 0.05)
```

**Factors:**

1. **Time Decay (30%)**
   - Recent posts get higher scores
   - Exponential decay over time
   - Boost for trending posts

2. **Connection Strength (25%)**
   - Direct connections: 1.0x multiplier
   - Second-degree connections: 0.5x multiplier
   - Same group members: 0.7x multiplier
   - Interaction history: +0.1 per interaction

3. **Engagement Score (25%)**
   - Likes: +1 point each
   - Comments: +3 points each
   - Shares: +5 points each
   - Views: +0.01 points each

4. **Content Relevance (15%)**
   - Post type matching user preferences
   - Hashtag matching user interests
   - Subject/topic alignment

5. **User Interests (5%)**
   - Based on user's learning subjects
   - Based on user's role (tutor/learner)
   - Based on past engagement patterns

### 3.2 Feed Generation Strategies

**Strategy A: Real-time Generation (Initial)**
- Query posts from connections on demand
- Apply scoring algorithm
- Limit to top 50 posts
- Suitable for MVP with <10k users

**Strategy B: Cached Feed (Scale-up)**
- Pre-compute feeds every 5 minutes
- Store in `feed_cache` table
- Serve from cache with real-time updates
- Suitable for 10k-100k users

**Strategy C: Distributed Feed (Large Scale)**
- Use Redis for feed caching
- Implement fan-out on write pattern
- Background workers for feed generation
- Suitable for 100k+ users

---

## 4. User Roles and Permissions

### 4.1 Tutor-Specific Features

**Posting Capabilities:**
- Post teaching achievements and certifications
- Share course materials and resources
- Announce new classes or workshops
- Highlight student success stories
- Post industry insights and articles

**Visibility Options:**
- Public: Visible to all platform users
- Connections: Visible to connected users only
- Group: Visible to specific learning groups
- Private: Visible only to self (portfolio)

**Achievement Types:**
- Course completion certificates
- Teaching awards
- Published research/papers
- Speaking engagements
- Workshop facilitation

### 4.2 Learner-Specific Features

**Posting Capabilities:**
- Share learning milestones
- Post project showcases
- Ask questions and seek help
- Share study resources
- Connect with peers

**Visibility Options:**
- Public: Visible to all platform users
- Connections: Visible to connected users only
- Group: Visible to specific learning groups
- Private: Visible only to self (portfolio)

**Achievement Types:**
- Course completion
- Badge earned
- Project completion
- Certification obtained
- Skill milestone

### 4.3 Common Features

**Interaction:**
- Like posts
- Comment on posts
- Share posts
- Save/bookmark posts
- Report inappropriate content

**Connection System:**
- Send connection requests
- Accept/reject requests
- View mutual connections
- Follow without connecting (one-way)

---

## 5. Technical Architecture

### 5.1 Frontend Components

```
/app
  /feed
    /page.tsx                    # Main feed page
    /[postId]/page.tsx           # Single post detail
    /create/page.tsx             # Create new post
    /bookmarks/page.tsx          # Saved posts
  /profile
    /[userId]/page.tsx           # User profile with posts
    /[userId]/achievements/page.tsx  # User achievements
  /connections
    /page.tsx                    # Connections list
    /requests/page.tsx           # Pending requests
  /notifications
    /page.tsx                    # Social notifications
```

### 5.2 Backend API Routes

```
/app/api
  /posts
    /route.ts                    # GET feed, POST create post
    /[postId]/route.ts           # GET, UPDATE, DELETE post
    /[postId]/like/route.ts      # POST like/unlike
    /[postId]/comments/route.ts  # GET, POST comments
  /connections
    /route.ts                    # GET connections, POST request
    /[userId]/accept/route.ts    # Accept connection
    /[userId]/reject/route.ts    # Reject connection
  /achievements
    /route.ts                    # GET, POST achievements
    /[achievementId]/route.ts    # UPDATE, DELETE
  /feed
    /trending/route.ts           # GET trending posts
    /for-you/route.ts            # GET personalized feed
```

### 5.3 Real-time Updates

**Supabase Realtime Integration:**
- Subscribe to posts table for new posts
- Subscribe to post_likes for like updates
- Subscribe to post_comments for new comments
- Subscribe to connections for new connections

**WebSocket Events:**
```javascript
// Client-side subscription
supabase
  .channel('feed-updates')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
    // Update feed with new post
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (payload) => {
    // Update like count
  })
  .subscribe()
```

### 5.4 Media Storage

**Supabase Storage Integration:**
- Bucket: `social-media`
- Folder structure: `posts/{postId}/media/`
- Supported formats: JPG, PNG, GIF, MP4, PDF
- Size limit: 10MB per file
- CDN integration for fast delivery

---

## 6. Scalability Considerations

### 6.1 Database Optimization

**Indexing Strategy:**
- Composite indexes on (user_id, created_at) for user feeds
- Indexes on visibility for public feed queries
- Full-text search index on post content
- GIN index on media_urls array

**Query Optimization:**
- Use prepared statements
- Implement pagination (cursor-based)
- Limit feed to 50 posts per load
- Cache frequently accessed data

### 6.2 Caching Strategy

**Redis Caching:**
- Cache user feeds for 5 minutes
- Cache trending posts for 15 minutes
- Cache user profiles for 1 hour
- Cache post engagement metrics

**CDN Caching:**
- Cache media files
- Cache static assets
- Implement cache invalidation on updates

### 6.3 Horizontal Scaling

**Database Sharding:**
- Shard by user_id for user-specific data
- Shard by post_id for post-specific data
- Use read replicas for feed queries

**Load Balancing:**
- Distribute API requests across multiple servers
- Implement rate limiting per user
- Use queue system for background tasks

### 6.4 Performance Targets

- Feed load time: <500ms
- Post creation: <200ms
- Like/comment: <100ms
- Real-time updates: <50ms latency
- Support 10k concurrent users

---

## 7. Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)

**Week 1: Database & Backend**
- Create database tables
- Implement basic CRUD API for posts
- Implement like/comment functionality
- Set up Supabase Realtime subscriptions

**Week 2: Frontend - Feed**
- Build main feed page
- Implement post creation form
- Add media upload functionality
- Implement basic feed algorithm

**Week 3: Connections**
- Implement connection request system
- Build connections list page
- Add connection-based feed filtering
- Implement follow functionality

**Week 4: Testing & Polish**
- End-to-end testing
- Performance optimization
- UI/UX improvements
- Bug fixes

### Phase 2: Enhanced Features (Weeks 5-8)

**Week 5: Achievements**
- Implement achievements table
- Build achievement posting UI
- Add achievement badges
- Integrate with existing badges system

**Week 6: Advanced Feed**
- Implement personalized feed algorithm
- Add trending posts section
- Implement hashtag system
- Add search functionality

**Week 7: Notifications**
- Implement social notifications
- Add notification preferences
- Build notification center
- Email notification integration

**Week 8: Groups Integration**
- Add group posting capability
- Implement group feeds
- Add group-specific achievements
- Group member interactions

### Phase 3: Scale & Optimize (Weeks 9-12)

**Week 9: Performance**
- Implement Redis caching
- Optimize database queries
- Add database indexes
- Implement query result caching

**Week 10: Real-time**
- Enhance WebSocket implementation
- Add typing indicators
- Implement read receipts
- Real-time engagement updates

**Week 11: Analytics**
- Implement post analytics
- Track engagement metrics
- Build admin dashboard
- A/B testing framework

**Week 12: Launch Preparation**
- Load testing
- Security audit
- Documentation
- User acceptance testing

---

## 8. Security Considerations

### 8.1 Content Moderation

- Implement profanity filter
- Add spam detection
- Manual moderation queue
- Report system for users
- Auto-hide flagged content

### 8.2 Privacy Controls

- Granular visibility settings
- Data export functionality
- Account deletion with data cleanup
- GDPR compliance
- Privacy policy updates

### 8.3 Rate Limiting

- Post creation: 10 posts/hour
- Comment creation: 50 comments/hour
- Connection requests: 20 requests/hour
- Like actions: 100 likes/hour

### 8.4 Authentication

- All API endpoints require authentication
- Session-based auth for web
- Token-based auth for mobile
- CSRF protection
- XSS prevention

---

## 9. Monitoring & Analytics

### 9.1 Key Metrics to Track

**Engagement Metrics:**
- Daily active users
- Posts per user per day
- Average engagement rate (likes/comments per post)
- Time spent on feed
- Scroll depth

**Growth Metrics:**
- New user signups
- New connections per day
- Posts created per day
- Achievement shares per day

**Performance Metrics:**
- Feed load time (p50, p95, p99)
- API response times
- Database query times
- Cache hit rate
- Error rates

### 9.2 Monitoring Tools

- Supabase Dashboard for database monitoring
- Vercel Analytics for frontend performance
- Custom logging for business metrics
- Error tracking (Sentry)
- Uptime monitoring

---

## 10. Cost Estimates

### 10.1 Infrastructure Costs (Monthly)

**Supabase (PostgreSQL + Storage + Realtime):**
- Free tier: Up to 500MB database, 1GB storage
- Pro tier ($25/month): 8GB database, 100GB storage
- Scale as needed

**Vercel (Hosting):**
- Hobby: Free
- Pro ($20/month): Enhanced performance
- Scale as needed

**Redis (if needed):**
- Redis Cloud: Free tier available
- Scale as needed

**Estimated Total:** $0-50/month for initial launch
**Scale-up:** $100-500/month for 10k-100k users

### 10.2 Development Effort

- **Frontend Development:** 80 hours
- **Backend Development:** 60 hours
- **Database Design:** 20 hours
- **Testing:** 40 hours
- **Documentation:** 10 hours
- **Total:** ~210 hours (5-6 weeks for 1 developer)

---

## 11. Success Criteria

### 11.1 User Adoption

- 70% of active users post at least once in first month
- Average 5 connections per user within 3 months
- 50% of users engage (like/comment) weekly
- 30% increase in time spent on platform

### 11.2 Engagement

- Average 3+ posts per active user per week
- 10+ likes/comments per post
- 20% of posts shared
- Achievement posts get 2x more engagement

### 11.3 Technical Performance

- 99.9% uptime
- <500ms feed load time
- <1% error rate
- Support 10k concurrent users

---

## 12. Conclusion

The LinkedIn-style social feed and achievement feature will significantly enhance the LEGO Digital Learning Platform by:

1. **Fostering Community:** Creating a connected learning ecosystem
2. **Motivating Learners:** Achievement sharing drives engagement
3. **Building Reputation:** Tutors can showcase expertise
4. **Increasing Retention:** Social features increase platform stickiness
5. **Enabling Discovery:** Users discover new learning opportunities

The proposed architecture is scalable, cost-effective, and can be implemented incrementally. Starting with an MVP and iterating based on user feedback will ensure the feature meets user needs while maintaining technical excellence.

---

## Appendix A: Sample API Responses

### A.1 Feed Response

```json
{
  "posts": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "url",
        "role": "tutor",
        "headline": "Mathematics Expert"
      },
      "content": "Just completed my Advanced Calculus certification!",
      "postType": "achievement",
      "mediaUrls": ["url1", "url2"],
      "likesCount": 42,
      "commentsCount": 8,
      "sharesCount": 3,
      "likedByMe": true,
      "createdAt": "2026-10-22T10:30:00Z",
      "achievement": {
        "title": "Advanced Calculus",
        "badgeUrl": "url",
        "issuer": "Coursera"
      }
    }
  ],
  "nextCursor": "uuid",
  "hasMore": true
}
```

### A.2 Create Post Request

```json
{
  "content": "Excited to share my new course on Linear Algebra!",
  "postType": "update",
  "mediaUrls": ["url"],
  "visibility": "connections",
  "hashtags": ["math", "linearalgebra", "newcourse"]
}
```

---

## Appendix B: Database Migration Script

```sql
-- Migration: Add social feed tables
BEGIN;

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type VARCHAR(50) NOT NULL CHECK (post_type IN ('achievement', 'resource', 'question', 'update')),
  media_urls TEXT[] DEFAULT '{}',
  visibility VARCHAR(20) DEFAULT 'connections' CHECK (visibility IN ('public', 'connections', 'private')),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  shares_count INTEGER DEFAULT 0 CHECK (shares_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);

-- Create post_likes table
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Create post_comments table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_comment_id);

-- Create connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_connections_follower ON connections(follower_id);
CREATE INDEX idx_connections_following ON connections(following_id);
CREATE INDEX idx_connections_status ON connections(status);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN ('course_completion', 'certification', 'award', 'milestone')),
  badge_url TEXT,
  issued_date DATE,
  issuer VARCHAR(255),
  verification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- Create post_hashtags table
CREATE TABLE post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_post_hashtags_tag ON post_hashtags(tag);
CREATE INDEX idx_post_hashtags_post_id ON post_hashtags(post_id);

COMMIT;
```

---

**End of Report**
