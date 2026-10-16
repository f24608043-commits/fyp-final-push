-- Add session_requests and tutor_sessions tables to realtime publication for live status updates
-- This allows tutors and learners to see session status changes (pending, accepted, declined) in real-time

ALTER PUBLICATION supabase_realtime ADD TABLE session_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tutor_sessions;
