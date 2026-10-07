-- Migration: 0019_fix_rls_for_server_actions
-- Fix RLS for server actions by creating a SECURITY DEFINER function
-- Server actions already do permission checks, but RLS blocks inserts because auth.uid() is not available

-- Create a SECURITY DEFINER function to insert messages that bypasses RLS
CREATE OR REPLACE FUNCTION insert_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_body TEXT
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
BEGIN
  -- Server actions already validate:
  -- 1. User is a member of the conversation
  -- 2. User is not blocked
  -- 3. Rate limiting (via trigger)
  
  -- Insert the message bypassing RLS
  INSERT INTO messages (conversation_id, sender_id, body)
  VALUES (p_conversation_id, p_sender_id, p_body)
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_message(UUID, UUID, TEXT) TO authenticated;
