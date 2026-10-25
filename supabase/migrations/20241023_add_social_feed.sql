-- Migration: Add Social Feed Tables
-- Created: October 23, 2026

-- Create post_type enum
CREATE TYPE post_type AS ENUM ('general', 'achievement', 'resource', 'milestone', 'question');

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 3000),
  media_urls TEXT[],
  post_type post_type NOT NULL DEFAULT 'general',
  reference_badge_id UUID REFERENCES user_badges(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for posts
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted) WHERE is_deleted = FALSE;

-- Create post_likes table
CREATE TABLE post_likes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Create indexes for post_likes
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at DESC);

-- Create post_comments table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 1000),
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for post_comments
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_comment_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);

-- Add foreign key constraint for parent_comment_id separately
ALTER TABLE post_comments
DROP CONSTRAINT IF EXISTS post_comments_parent_comment_id_fkey;

ALTER TABLE post_comments
ADD CONSTRAINT post_comments_parent_comment_id_fkey
FOREIGN KEY (parent_comment_id) REFERENCES post_comments(id) ON DELETE CASCADE;

-- Create post_hashtags table
CREATE TABLE post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for post_hashtags
CREATE INDEX idx_post_hashtags_tag ON post_hashtags(tag);
CREATE INDEX idx_post_hashtags_post_id ON post_hashtags(post_id);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
-- Users can read their own posts
CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT
  USING (auth.uid() = author_id);

-- Users can read posts from friends (accepted friendships)
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

-- Users can read posts from groups they're members of
CREATE POLICY "Users can read group posts"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id IN (
        SELECT gm.group_id FROM group_members gm WHERE gm.user_id = posts.author_id
      )
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can insert their own posts
CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Users can soft-delete their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- RLS Policies for post_likes
-- Users can read likes on posts they can see
CREATE POLICY "Users can read likes on visible posts"
  ON post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_likes.post_id
      AND (
        posts.author_id = auth.uid()
        OR posts.author_id IN (
          SELECT addressee_id FROM friendships
          WHERE requester_id = auth.uid() AND status = 'accepted'
          UNION
          SELECT requester_id FROM friendships
          WHERE addressee_id = auth.uid() AND status = 'accepted'
        )
        OR EXISTS (
          SELECT 1 FROM group_members gm1
          JOIN group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = posts.author_id AND gm2.user_id = auth.uid()
        )
      )
    )
  );

-- Users can insert their own likes
CREATE POLICY "Users can create own likes"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_comments
-- Users can read comments on posts they can see
CREATE POLICY "Users can read comments on visible posts"
  ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_comments.post_id
      AND (
        posts.author_id = auth.uid()
        OR posts.author_id IN (
          SELECT addressee_id FROM friendships
          WHERE requester_id = auth.uid() AND status = 'accepted'
          UNION
          SELECT requester_id FROM friendships
          WHERE addressee_id = auth.uid() AND status = 'accepted'
        )
        OR EXISTS (
          SELECT 1 FROM group_members gm1
          JOIN group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = posts.author_id AND gm2.user_id = auth.uid()
        )
      )
    )
  );

-- Users can insert their own comments
CREATE POLICY "Users can create own comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for post_hashtags
-- Users can read hashtags on posts they can see
CREATE POLICY "Users can read hashtags on visible posts"
  ON post_hashtags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_hashtags.post_id
      AND (
        posts.author_id = auth.uid()
        OR posts.author_id IN (
          SELECT addressee_id FROM friendships
          WHERE requester_id = auth.uid() AND status = 'accepted'
          UNION
          SELECT requester_id FROM friendships
          WHERE addressee_id = auth.uid() AND status = 'accepted'
        )
        OR EXISTS (
          SELECT 1 FROM group_members gm1
          JOIN group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = posts.author_id AND gm2.user_id = auth.uid()
        )
      )
    )
  );

-- Users can insert hashtags for their own posts
CREATE POLICY "Users can create hashtags for own posts"
  ON post_hashtags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_hashtags.post_id AND posts.author_id = auth.uid()
    )
  );
