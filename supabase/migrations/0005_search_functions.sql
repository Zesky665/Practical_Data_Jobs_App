-- Practical_Data_Jobs_App — M7: pgvector search functions
-- These are called via supabase.rpc() from lib/search.ts.

-- Find published jobs matching a CV embedding.
CREATE OR REPLACE FUNCTION public.match_jobs_for_cv(
  query_embedding extensions.vector(1024),
  match_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jobs.id,
    1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM public.jobs
  WHERE
    jobs.embedding IS NOT NULL
    AND jobs.status = 'published'
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

-- Find CVs matching a job embedding.
CREATE OR REPLACE FUNCTION public.match_cvs_for_job(
  query_embedding extensions.vector(1024),
  match_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cvs.id,
    1 - (cvs.embedding <=> query_embedding) AS similarity
  FROM public.cvs
  WHERE cvs.embedding IS NOT NULL
  ORDER BY cvs.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;
