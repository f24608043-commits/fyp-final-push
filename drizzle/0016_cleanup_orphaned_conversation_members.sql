-- Migration: 0016_cleanup_orphaned_conversation_members
-- Clean up conversation members that reference non-existent profiles

-- First, check for orphaned conversation members
SELECT cm.conversation_id, cm.user_id 
FROM conversation_members cm
LEFT JOIN profiles p ON cm.user_id = p.id
WHERE p.id IS NULL;

-- Delete orphaned conversation members
DELETE FROM conversation_members
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Also check for conversations with no members and delete them
DELETE FROM conversations
WHERE id NOT IN (SELECT DISTINCT conversation_id FROM conversation_members);
