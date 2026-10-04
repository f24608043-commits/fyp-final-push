-- Migration: 0015_fix_direct_key_type
-- Fix direct_key column type from UUID to TEXT to support concatenated UUID strings

-- Drop the existing direct_key column and recreate as TEXT
ALTER TABLE conversations DROP COLUMN IF EXISTS direct_key;
ALTER TABLE conversations ADD COLUMN direct_key TEXT UNIQUE;

-- Recreate the index for direct_key
DROP INDEX IF EXISTS idx_conversations_direct_key;
CREATE INDEX idx_conversations_direct_key ON conversations(direct_key) WHERE direct_key IS NOT NULL;
