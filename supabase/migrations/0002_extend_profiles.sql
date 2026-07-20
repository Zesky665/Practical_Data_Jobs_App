-- Practical_Data_Jobs_App — M4: profiles extension
-- Add user-facing columns and the can_post_jobs flag.
-- can_post_jobs is set manually in Supabase dashboard/SQL — no self-serve UI.

ALTER TABLE public.profiles
  ADD COLUMN can_post_jobs boolean NOT NULL DEFAULT false,
  ADD COLUMN display_name text,
  ADD COLUMN bio text;

COMMENT ON COLUMN public.profiles.can_post_jobs IS
  'Grants job-posting privileges. Set manually in Supabase dashboard.';
COMMENT ON COLUMN public.profiles.display_name IS
  'User-visible name, defaults to email prefix if not set.';
COMMENT ON COLUMN public.profiles.bio IS
  'Short user bio / tagline.';
