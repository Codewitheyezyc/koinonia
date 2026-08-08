-- ========================================================
-- KOINONIA: Message Deletion (Delete for Everyone / Delete for Me)
-- ========================================================

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
