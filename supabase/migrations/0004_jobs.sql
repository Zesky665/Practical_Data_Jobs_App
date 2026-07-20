-- Practical_Data_Jobs_App — M6: jobs table
-- Job postings with Voyage AI embeddings for semantic search.
-- Gated by profiles.can_post_jobs (checked in the Server Action, not RLS).
--
-- Note: the remote DB may have a different CHECK constraint on status.
-- The app does not hardcode status values; it relies on the DB's constraint
-- and displays whatever status value the DB returns.

CREATE TABLE public.jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  company     text NOT NULL,
  description text NOT NULL,
  embedding   extensions.vector(1024),
  status      text NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.jobs IS
  'Job postings. Only users with can_post_jobs=true can create (enforced in app code).';

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Owner can do anything with their own jobs.
CREATE POLICY "jobs: owner CRUD" ON public.jobs
  FOR ALL USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Anyone can read open jobs.
CREATE POLICY "jobs: public read open" ON public.jobs
  FOR SELECT USING (status = 'open');

-- Grant table access to Supabase roles (not automatic in local dev).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated, service_role, anon;
