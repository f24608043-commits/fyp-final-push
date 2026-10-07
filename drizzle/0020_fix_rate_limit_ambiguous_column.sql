-- Migration: 0020_fix_rate_limit_ambiguous_column
-- Fix ambiguous column reference in check_message_rate_limit function

-- Drop and recreate the rate limiting function with proper column prefixes
DROP FUNCTION IF EXISTS check_message_rate_limit(UUID) CASCADE;

CREATE OR REPLACE FUNCTION check_message_rate_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_minute TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
BEGIN
  current_minute := date_trunc('minute', NOW());
  
  -- Get or create rate limit entry with proper table prefixes
  INSERT INTO message_rate_limits (user_id, minute_start, message_count)
  VALUES (check_message_rate_limit.user_id, current_minute, 1)
  ON CONFLICT (user_id, minute_start)
  DO UPDATE SET message_count = message_rate_limits.message_count + 1
  RETURNING message_count INTO current_count;
  
  -- If count is 1, it was a new entry, so allow
  IF current_count = 1 THEN
    RETURN TRUE;
  END IF;
  
  -- If count exceeds 30, reject
  IF current_count > 30 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
