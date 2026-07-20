-- Practical Data Jobs App — Cloud database setup
-- Run this in Supabase Dashboard → SQL Editor (https://supabase.com/dashboard/project/tdkzxdvuhxpdbppwzbif)

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
CREATE POLICY IF NOT EXISTS "cvs: owner CRUD" ON public.cvs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text NOT NULL,
  embedding   extensions.vector(1024),
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "jobs: owner CRUD" ON public.jobs
  FOR ALL USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
CREATE POLICY IF NOT EXISTS "jobs: public read published" ON public.jobs
  FOR SELECT USING (status = 'published');

-- 5. Search functions
CREATE OR REPLACE FUNCTION public.match_jobs_for_cv(
  query_embedding extensions.vector(1024), match_limit int DEFAULT 10
) RETURNS TABLE (id uuid, similarity float) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT jobs.id, 1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM public.jobs WHERE jobs.embedding IS NOT NULL AND jobs.status = 'published'
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
CREATE POLICY IF NOT EXISTS "cvs: owner folder access"
ON storage.objects
FOR ALL
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs TO authenticated, service_role, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated, service_role, anon;
