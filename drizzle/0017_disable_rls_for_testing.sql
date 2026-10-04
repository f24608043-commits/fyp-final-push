-- Migration: 0017_disable_rls_for_testing
-- Disable RLS on messaging tables for testing purposes
-- WARNING: This is for testing only - re-enable RLS after testing

-- Disable RLS on messaging tables
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports DISABLE ROW LEVEL SECURITY;
