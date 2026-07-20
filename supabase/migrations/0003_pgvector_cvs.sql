-- Practical_Data_Jobs_App — M5: pgvector extension + cvs table
-- Stores uploaded CVs with their Voyage AI embeddings for semantic search.

-- pgvector extension (bundled with Supabase; just needs enabling).
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- cvs: one user can have multiple CV versions over time.
CREATE TABLE public.cvs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path         text NOT NULL,
  original_filename text NOT NULL,
  raw_text          text NOT NULL,
  embedding         extensions.vector(1024),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cvs IS
  'Uploaded CVs. One user can have multiple CV versions.';

-- RLS: only the owner can read/write their own CVs.
-- Search queries bypass RLS via service-role client (lib/supabase/service.ts).
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cvs: owner CRUD" ON public.cvs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant table access to Supabase roles (not automatic in local dev).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs TO authenticated, service_role, anon;

