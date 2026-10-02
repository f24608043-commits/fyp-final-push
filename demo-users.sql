-- Demo Users for Testing
-- Run these queries in Supabase SQL Editor to verify and set roles for existing users

-- ============================================
-- VERIFY EXISTING USERS AND THEIR ROLES
-- ============================================

-- Check all users and their roles
SELECT 
  u.id,
  u.email,
  p.role,
  p.display_name,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ============================================
-- UPDATE ROLES FOR SPECIFIC USERS
-- ============================================

-- 1. Set Admin role for alexabraham587@gmail.com
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'alexabraham587@gmail.com'
  LIMIT 1
);

-- 2. Set Tutor role for orphix.itsolutions@gmail.com
UPDATE profiles
SET role = 'tutor'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'orphix.itsolutions@gmail.com'
  LIMIT 1
);

-- 3. Set Learner role for ahmerkhan5330@gmail.com
UPDATE profiles
SET role = 'learner'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'ahmerkhan5330@gmail.com'
  LIMIT 1
);

-- ============================================
-- VERIFY THE UPDATES
-- ============================================

-- Verify the specific users have correct roles
SELECT 
  u.email,
  p.role,
  p.display_name
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email IN (
  'alexabraham587@gmail.com',
  'orphix.itsolutions@gmail.com',
  'ahmerkhan5330@gmail.com'
);
