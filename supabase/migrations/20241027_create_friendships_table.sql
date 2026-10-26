-- Migration: Create friendships table
-- This migration creates the friendships table and related tables for friend streaks

-- Create friendship_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create friend_streaks table
CREATE TABLE IF NOT EXISTS friend_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id UUID NOT NULL UNIQUE REFERENCES friendships(id) ON DELETE CASCADE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_shared_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create daily_activity_log table for tracking friend streaks
CREATE TABLE IF NOT EXISTS daily_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friend_streaks_friendship ON friend_streaks(friendship_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_log_user ON daily_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_log_date ON daily_activity_log(activity_date);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
-- Users can view friendships they are part of
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Users can insert friendships where they are the requester
CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Users can update friendships they are part of
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Users can delete friendships they are part of
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- RLS Policies for friend_streaks
-- Users can view streaks for their friendships
CREATE POLICY "Users can view friend streaks"
  ON friend_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE friendships.id = friend_streaks.friendship_id
      AND (friendships.requester_id = auth.uid() OR friendships.addressee_id = auth.uid())
    )
  );

-- RLS Policies for daily_activity_log
-- Users can view their own activity
CREATE POLICY "Users can view own activity"
  ON daily_activity_log FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity"
  ON daily_activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own activity
CREATE POLICY "Users can update own activity"
  ON daily_activity_log FOR UPDATE
  USING (user_id = auth.uid());
