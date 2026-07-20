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

-- Storage bucket for raw CV files (PDFs).
-- Path convention: {userId}/{uuid}.pdf — first segment is the owner's UUID.
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage: users can only access files under their own user-id prefix.
CREATE POLICY "cvs_storage: owner access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
