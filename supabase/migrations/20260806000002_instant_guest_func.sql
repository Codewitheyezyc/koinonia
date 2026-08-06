-- ========================================================
-- KOINONIA PATCH: Instant Guest User Generator (Zero Email / Zero Domain)
-- Creates pre-confirmed guest user directly in auth.users
-- so guests can join instantly without magic link, emails, or password prompts
-- ========================================================

CREATE OR REPLACE FUNCTION public.create_instant_guest(p_display_name TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT;
  v_password TEXT;
  v_encrypted_pw TEXT;
  v_clean_name TEXT;
BEGIN
  v_clean_name := trim(p_display_name);
  IF v_clean_name = '' THEN
    v_clean_name := 'Guest Believer';
  END IF;

  v_email := 'guest_' || replace(v_user_id::text, '-', '') || '@guest.koinonia';
  v_password := 'Guest#' || replace(gen_random_uuid()::text, '-', '');
  v_encrypted_pw := extensions.crypt(v_password, extensions.gen_salt('bf'));

  -- Insert pre-confirmed user directly into auth.users (omitting generated confirmed_at column)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_anonymous
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', v_clean_name || ' (Guest)', 'is_guest', true),
    NOW(),
    NOW(),
    false
  );

  -- Ensure profile exists
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (v_user_id, v_clean_name || ' (Guest)', NULL)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  RETURN jsonb_build_object(
    'email', v_email,
    'password', v_password,
    'user_id', v_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_instant_guest(TEXT) TO anon, authenticated, service_role;
