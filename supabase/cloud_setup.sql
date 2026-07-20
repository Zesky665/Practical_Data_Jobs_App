-- Practical Data Jobs App — Cloud database setup
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Vector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_post_jobs boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text;

-- 3. CVs table
CREATE TABLE IF NOT EXISTS public.cvs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path         text NOT NULL,
  original_filename text NOT NULL,
  raw_text          text NOT NULL,
  embedding         extensions.vector(1024),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cvs: owner CRUD" ON public.cvs;
CREATE POLICY "cvs: owner CRUD" ON public.cvs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Jobs table (existing table might be stale from old migrations)
CREATE TABLE IF NOT EXISTS public.jobs (
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

-- If the table already exists and has a different status CHECK constraint,
-- this ALTER is a no-op. The app does not hardcode valid statuses.
ALTER TABLE public.jobs ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.jobs ALTER COLUMN status SET DEFAULT 'draft';

-- Fix columns if the table existed from an old schema
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS employer_id uuid;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS embedding extensions.vector(1024);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs: owner CRUD" ON public.jobs;
CREATE POLICY "jobs: owner CRUD" ON public.jobs
  FOR ALL USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
DROP POLICY IF EXISTS "jobs: public read published" ON public.jobs;
CREATE POLICY "jobs: public read open" ON public.jobs
  FOR SELECT USING (status = 'open');

-- 5. Search functions
CREATE OR REPLACE FUNCTION public.match_jobs_for_cv(
  query_embedding extensions.vector(1024), match_limit int DEFAULT 10
) RETURNS TABLE (id uuid, similarity float) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT jobs.id, 1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM public.jobs WHERE jobs.embedding IS NOT NULL AND jobs.status = 'open'
  ORDER BY jobs.embedding <=> query_embedding LIMIT match_limit;
END; $$;

CREATE OR REPLACE FUNCTION public.match_cvs_for_job(
  query_embedding extensions.vector(1024), match_limit int DEFAULT 10
) RETURNS TABLE (id uuid, similarity float) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT cvs.id, 1 - (cvs.embedding <=> query_embedding) AS similarity
  FROM public.cvs WHERE cvs.embedding IS NOT NULL
  ORDER BY cvs.embedding <=> query_embedding LIMIT match_limit;
END; $$;

-- 6. Storage RLS for cvs bucket
DROP POLICY IF EXISTS "cvs: owner folder access" ON storage.objects;
CREATE POLICY "cvs: owner folder access"
ON storage.objects
FOR ALL
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs TO authenticated, service_role, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated, service_role, anon;
