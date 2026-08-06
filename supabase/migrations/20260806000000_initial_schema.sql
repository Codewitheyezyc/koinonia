-- ========================================================
-- KOINONIA DATABASE SCHEMA & ROW-LEVEL SECURITY (RLS)
-- Document 9 Blueprint Implementation - Phase 1 Migration
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  time_zone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for auto-profile creation on Auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- 2. FELLOWSHIPS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fellowships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 3. FELLOWSHIP MEMBERS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fellowship_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fellowship_id UUID NOT NULL REFERENCES public.fellowships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('host', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_fellowship_membership UNIQUE (fellowship_id, user_id)
);

-- Security Definer helper to check membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_fellowship_member(_user_id UUID, _fellowship_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.fellowship_members
    WHERE user_id = _user_id AND fellowship_id = _fellowship_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Definer helper to check if channel belongs to user's fellowship
CREATE OR REPLACE FUNCTION public.is_channel_member(_user_id UUID, _channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.channels c
    JOIN public.fellowship_members fm ON fm.fellowship_id = c.fellowship_id
    WHERE c.id = _channel_id AND fm.user_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------
-- 4. CHANNELS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fellowship_id UUID NOT NULL REFERENCES public.fellowships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('chat', 'prayer_board', 'notes')) DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create default channels when a Fellowship is created
CREATE OR REPLACE FUNCTION public.handle_new_fellowship()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert creator as Host member
  INSERT INTO public.fellowship_members (fellowship_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'host')
  ON CONFLICT (fellowship_id, user_id) DO NOTHING;

  -- Create 3 default fellowship channels
  INSERT INTO public.channels (fellowship_id, name, type) VALUES
    (NEW.id, 'general-chat', 'chat'),
    (NEW.id, 'prayer-requests', 'prayer_board'),
    (NEW.id, 'bible-study-notes', 'notes');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fellowship_created ON public.fellowships;
CREATE TRIGGER on_fellowship_created
  AFTER INSERT ON public.fellowships
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_fellowship();

-- --------------------------------------------------------
-- 5. MESSAGES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 6. PRAYER REQUESTS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fellowship_id UUID NOT NULL REFERENCES public.fellowships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'answered')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 7. INTERCESSIONS TABLE ("I Prayed For This")
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intercessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_intercession UNIQUE (prayer_request_id, user_id)
);

-- ========================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fellowships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fellowship_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intercessions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------------
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- --------------------------------------------------------
-- FELLOWSHIPS POLICIES
-- --------------------------------------------------------
CREATE POLICY "Users can view fellowships they belong to or public ones"
  ON public.fellowships FOR SELECT
  TO authenticated
  USING (
    is_private = FALSE OR
    public.is_fellowship_member(auth.uid(), id)
  );

CREATE POLICY "Authenticated users can create fellowships"
  ON public.fellowships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Fellowship hosts can update fellowship details"
  ON public.fellowships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fellowship_members
      WHERE fellowship_id = id AND user_id = auth.uid() AND role = 'host'
    )
  );

-- --------------------------------------------------------
-- FELLOWSHIP MEMBERS POLICIES
-- --------------------------------------------------------
CREATE POLICY "Members can view list of fellowship members"
  ON public.fellowship_members FOR SELECT
  TO authenticated
  USING (public.is_fellowship_member(auth.uid(), fellowship_id));

CREATE POLICY "Authenticated users can join fellowships via invite"
  ON public.fellowship_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts can remove members or update roles"
  ON public.fellowship_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fellowship_members
      WHERE fellowship_id = fellowship_members.fellowship_id
        AND user_id = auth.uid() AND role = 'host'
    ) OR auth.uid() = user_id -- Members can leave
  );

-- --------------------------------------------------------
-- CHANNELS POLICIES
-- --------------------------------------------------------
CREATE POLICY "Members can view channels in their fellowship"
  ON public.channels FOR SELECT
  TO authenticated
  USING (public.is_fellowship_member(auth.uid(), fellowship_id));

CREATE POLICY "Hosts can create channels in their fellowship"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fellowship_members
      WHERE fellowship_id = channels.fellowship_id
        AND user_id = auth.uid() AND role = 'host'
    )
  );

-- --------------------------------------------------------
-- MESSAGES POLICIES
-- --------------------------------------------------------
CREATE POLICY "Members can view messages in their channel"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_channel_member(auth.uid(), channel_id));

CREATE POLICY "Members can post messages in their channel"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_channel_member(auth.uid(), channel_id)
  );

-- --------------------------------------------------------
-- PRAYER REQUESTS POLICIES
-- --------------------------------------------------------
CREATE POLICY "Members can view prayer requests in their fellowship"
  ON public.prayer_requests FOR SELECT
  TO authenticated
  USING (public.is_fellowship_member(auth.uid(), fellowship_id));

CREATE POLICY "Members can post prayer requests in their fellowship"
  ON public.prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_fellowship_member(auth.uid(), fellowship_id)
  );

CREATE POLICY "Authors or hosts can update prayer request status"
  ON public.prayer_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.fellowship_members
      WHERE fellowship_id = prayer_requests.fellowship_id
        AND user_id = auth.uid() AND role = 'host'
    )
  );

-- --------------------------------------------------------
-- INTERCESSIONS POLICIES
-- --------------------------------------------------------
CREATE POLICY "Members can view intercessions on fellowship prayer requests"
  ON public.intercessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prayer_requests pr
      WHERE pr.id = prayer_request_id AND public.is_fellowship_member(auth.uid(), pr.fellowship_id)
    )
  );

CREATE POLICY "Members can log intercession on prayer requests"
  ON public.intercessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.prayer_requests pr
      WHERE pr.id = prayer_request_id AND public.is_fellowship_member(auth.uid(), pr.fellowship_id)
    )
  );
