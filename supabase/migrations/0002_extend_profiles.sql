-- Practical_Data_Jobs_App — M4: profiles extension
-- Add user-facing columns and the can_post_jobs flag.
-- can_post_jobs is set manually in Supabase dashboard/SQL — no self-serve UI.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'can_post_jobs') THEN
    ALTER TABLE public.profiles ADD COLUMN can_post_jobs boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE public.profiles ADD COLUMN display_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio text;
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.can_post_jobs IS
  'Grants job-posting privileges. Set manually in Supabase dashboard.';
COMMENT ON COLUMN public.profiles.display_name IS
  'User-visible name, defaults to email prefix if not set.';
COMMENT ON COLUMN public.profiles.bio IS
  'Short user bio / tagline.';
