-- ========================================================
-- KOINONIA: Voice Notes & Pinned Messages Migration
-- Adds audio_url, audio_duration_seconds, and is_pinned
-- ========================================================

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS audio_duration_seconds INTEGER DEFAULT NULL;
