-- ============================================================
-- FIX: Robust handle_new_user trigger
-- Run this in Supabase SQL Editor to fix the 500 signup error
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Build a clean username from metadata or email
  base_username := COALESCE(
    NULLIF(TRIM(regexp_replace(LOWER(NEW.raw_user_meta_data->>'username'), '[^a-z0-9_]', '', 'g')), ''),
    NULLIF(TRIM(regexp_replace(LOWER(SPLIT_PART(NEW.email, '@', 1)), '[^a-z0-9_]', '', 'g')), ''),
    'user'
  );

  -- Clamp to 20 chars
  base_username := LEFT(base_username, 20);
  final_username := base_username;

  -- Resolve username conflicts
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := LEFT(base_username, 18) || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')), '')
  );

  RETURN NEW;

EXCEPTION
  WHEN unique_violation THEN
    -- Absolute fallback: timestamp-based username
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      NEW.id,
      'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
      NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
      NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')), '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Never block user creation — log and continue
    RAISE LOG 'handle_new_user error for %: % (%)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
