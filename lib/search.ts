import { createServiceClient } from "@/lib/supabase/service";

/**
 * Search helpers using pgvector cosine similarity.
 *
 * These run with the service-role client to bypass RLS on the vector index.
 * They return only scored IDs — callers fetch the actual rows with their
 * own RLS-scoped client, so row-level access is preserved.
 */

export interface ScoredResult {
  id: string;
  similarity: number;
}

/**
 * Find jobs that match a given CV, ranked by cosine similarity.
 * Only returns published jobs.
 */
export async function searchJobsForCV(
  cvId: string,
  limit = 10,
): Promise<ScoredResult[]> {
  const serviceClient = createServiceClient();

  // Fetch the CV embedding
  const { data: cv } = await serviceClient
    .from("cvs")
    .select("embedding")
    .eq("id", cvId)
    .single();

  if (!cv?.embedding) {
    return [];
  }

  // Cosine similarity search against published jobs
  // pgvector <=> operator is cosine distance; 1 - distance = similarity
  const { data, error } = await serviceClient.rpc("match_jobs_for_cv", {
    query_embedding: cv.embedding,
    match_limit: limit,
  });

  if (error) {
    console.error("[searchJobsForCV] RPC error:", error);
    return [];
  }

  return (data as { id: string; similarity: number }[] | null) ?? [];
}

/**
 * Find CVs that match a given job, ranked by cosine similarity.
 */
export async function searchCVsForJob(
  jobId: string,
  limit = 10,
): Promise<ScoredResult[]> {
  const serviceClient = createServiceClient();

  // Fetch the job embedding
  const { data: job } = await serviceClient
    .from("jobs")
    .select("embedding")
    .eq("id", jobId)
    .single();

  if (!job?.embedding) {
    return [];
  }

  // Cosine similarity search against all CVs
  const { data, error } = await serviceClient.rpc("match_cvs_for_job", {
    query_embedding: job.embedding,
    match_limit: limit,
  });

  if (error) {
    console.error("[searchCVsForJob] RPC error:", error);
    return [];
  }

  return (data as { id: string; similarity: number }[] | null) ?? [];
}
