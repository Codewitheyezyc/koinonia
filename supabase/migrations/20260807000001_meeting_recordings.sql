-- ========================================================
-- KOINONIA: Meeting Recordings Migration
-- Stores recorded live meeting archives with local download capabilities
-- ========================================================

CREATE TABLE IF NOT EXISTS public.meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fellowship_id UUID NOT NULL REFERENCES public.fellowships(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recordings of their fellowships"
  ON public.meeting_recordings FOR SELECT
  TO authenticated
  USING (
    public.is_fellowship_member(auth.uid(), fellowship_id)
  );

CREATE POLICY "Fellowship members can insert recordings"
  ON public.meeting_recordings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_fellowship_member(auth.uid(), fellowship_id)
  );

CREATE POLICY "Hosts can delete recordings"
  ON public.meeting_recordings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fellowship_members
      WHERE fellowship_id = meeting_recordings.fellowship_id
        AND user_id = auth.uid()
        AND role = 'host'
    )
  );

-- Enable real-time for meeting recordings
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_recordings;
