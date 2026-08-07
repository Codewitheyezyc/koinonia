-- ========================================================
-- KOINONIA PATCH: Instant Pre-Confirmed Guest User Generator v2
-- Uses valid @gmail.com domain format + sets is_sso_user = false
-- Bypasses Supabase email server completely (0 emails sent, 0 rate limits)
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

  v_email := 'koinonia_guest_' || replace(v_user_id::text, '-', '') || '@gmail.com';
  v_password := 'Guest#' || replace(gen_random_uuid()::text, '-', '');
  v_encrypted_pw := extensions.crypt(v_password, extensions.gen_salt('bf', 10));

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
    is_anonymous,
    is_sso_user
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', v_clean_name || ' (Guest)', 'is_guest', true),
    NOW(),
    NOW(),
    false,
    false
  );

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
