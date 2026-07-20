-- Practical_Data_Jobs_App — M6b: fix jobs status model
--
-- The remote DB was set up with 'open'/'closed' statuses + an admin-only
-- trigger. This migration re-aligns the DB with the app's intended model:
--   draft    — job is being prepared, not visible publicly
--   public   — job is live on the board
--   closed   — job is no longer accepting applications
--
-- Run this on the remote Supabase (Dashboard → SQL Editor).

-- 1. Drop the admin-only publish trigger (find and drop any trigger on jobs)
DO $$
DECLARE
  trig record;
BEGIN
  FOR trig IN
    SELECT trigger_name FROM information_schema.triggers
    WHERE event_object_table = 'jobs' AND event_object_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.jobs', trig.trigger_name);
  END LOOP;
END $$;

-- 2. Drop the old CHECK constraint (name might differ)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check CASCADE;

-- 3. Add the correct CHECK constraint
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('draft', 'public', 'closed'));

-- 4. Update the default
ALTER TABLE public.jobs ALTER COLUMN status SET DEFAULT 'draft';

-- 5. Migrate existing rows: 'open' → 'public'
UPDATE public.jobs SET status = 'public' WHERE status = 'open';

-- 6. Recreate the public-read RLS policy
DROP POLICY IF EXISTS "jobs: public read published" ON public.jobs;
DROP POLICY IF EXISTS "jobs: public read open" ON public.jobs;
DROP POLICY IF EXISTS "jobs: public read public" ON public.jobs;
CREATE POLICY "jobs: public read public" ON public.jobs
  FOR SELECT USING (status = 'public');

-- 7. Update search function
CREATE OR REPLACE FUNCTION public.match_jobs_for_cv(
  query_embedding extensions.vector(1024), match_limit int DEFAULT 10
) RETURNS TABLE (id uuid, similarity float) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT jobs.id, 1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM public.jobs WHERE jobs.embedding IS NOT NULL AND jobs.status = 'public'
  ORDER BY jobs.embedding <=> query_embedding LIMIT match_limit;
END; $$;
