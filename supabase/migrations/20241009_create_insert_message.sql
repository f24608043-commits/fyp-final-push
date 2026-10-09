-- Migration: create insert_message function for messages
-- This function inserts a message and returns its id. It uses SECURITY DEFINER to bypass RLS for server actions.

CREATE OR REPLACE FUNCTION public.insert_message(conversation_id uuid, sender_id uuid, body text)
RETURNS uuid AS $$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO public.messages (id, conversation_id, sender_id, body, created_at)
    VALUES (gen_random_uuid(), conversation_id, sender_id, body, now())
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the anon role (or whichever role the server uses)
GRANT EXECUTE ON FUNCTION public.insert_message(uuid, uuid, text) TO anon;
