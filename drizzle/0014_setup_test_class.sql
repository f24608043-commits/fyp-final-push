-- Setup Test Class for Development
-- Run this in Supabase SQL Editor after signing up with f24608052@nutech.edu.pk

-- First, find the user ID by email (you may need to check this in the auth.users table)
-- Replace 'YOUR_USER_ID' below with the actual UUID from auth.users

-- Create a test group
INSERT INTO public.groups (id, tutor_id, name, description, subject, grade_level, group_code, privacy, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID', -- Replace with actual user UUID
  'Test Class',
  'A test class for development and testing',
  'General',
  'All Levels',
  'TEST01',
  'private',
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Get the group ID and add user as member
-- This will add the user to the class they just created
DO $$
DECLARE
  user_id uuid := 'YOUR_USER_ID'; -- Replace with actual user UUID
  group_id uuid;
BEGIN
  SELECT id INTO group_id FROM public.groups WHERE group_code = 'TEST01' LIMIT 1;
  
  IF group_id IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id, role, joined_at)
    VALUES (group_id, user_id, 'student', now())
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Added user % to group %', user_id, group_id;
  END IF;
END $$;

-- Verify the setup
SELECT g.id, g.name, g.group_code, g.tutor_id 
FROM public.groups g 
WHERE g.group_code = 'TEST01';
