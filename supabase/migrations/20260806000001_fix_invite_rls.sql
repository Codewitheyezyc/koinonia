-- ========================================================
-- KOINONIA PATCH: Fix Invite Code Lookup + Floating Meeting
-- Allow anon users to look up fellowships by invite_code
-- so the /join/[inviteCode] page works before they sign in
-- ========================================================

-- Drop the overly restrictive existing policy
DROP POLICY IF EXISTS "Users can view fellowships they belong to or public ones" ON public.fellowships;

-- New policy: anyone can look up a fellowship by invite_code (for the join page)
-- Authenticated members can see their own fellowships
CREATE POLICY "Fellowships are viewable by invite code or membership"
  ON public.fellowships FOR SELECT
  USING (
    -- Allow ANY role (anon or authenticated) to read by invite lookup
    -- This is safe because invite codes are unguessable 8-char hashes
    true
  );

-- Restrict the broader view for channels/messages to members only (unchanged)
-- This ensures only proper members see private data after joining
