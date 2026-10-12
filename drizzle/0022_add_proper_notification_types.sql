-- Add proper notification types
-- This migration adds the missing notification types that should exist
-- and fixes the mislabeling of lesson_completed

-- Add new notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'assignment_posted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'assignment_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'session_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'session_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'session_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'enrollment_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'enrollment_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'enrollment_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_graded';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'level_up';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_added';

-- Note: lesson_completed should only be used for actual lesson completion
-- badge_earned should only be used for badge achievements
-- streak_milestone should only be used for streak milestones
-- leaderboard_rank should only be used for leaderboard changes
