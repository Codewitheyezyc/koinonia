-- ========================================================
-- KOINONIA: Message Replies & Quotes Migration
-- Adds reply_to_id and reply_snippet to messages table
-- ========================================================

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_snippet JSONB DEFAULT NULL;
