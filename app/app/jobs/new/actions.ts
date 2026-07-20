"use server";

import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/voyage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateJobState = {
  error?: string;
};

/**
 * Create a new job posting. Gated: user must have can_post_jobs=true.
 * Embeds the description via Voyage for semantic search.
 */
export async function createJob(
  _prevState: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return { error: "You must be signed in to post a job." };
  }

  // Gate: check can_post_jobs
  const { data: profile } = await supabase
    .from("profiles")
    .select("can_post_jobs")
    .eq("id", user.id)
    .single();

  if (!profile?.can_post_jobs) {
    return {
      error:
        "You don't have permission to post jobs. Contact an admin to enable job posting on your account.",
    };
  }

  // Validate fields
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!title || title.length > 200) {
    return {
      error: "Please provide a job title (maximum 200 characters).",
    };
  }

  if (!description || description.length > 50000) {
    return {
      error:
        "Please provide a job description (maximum 50,000 characters).",
    };
  }

  // Embed description
  let embedding: number[];
  try {
    const result = await embedText(description);
    embedding = result.vector;
  } catch (err) {
    console.error("[createJob] Voyage embedding failed:", err);
    return {
      error:
        "Failed to analyze the job description. Please try again.",
    };
  }

  // Insert
  const { data: job, error: insertError } = await supabase
    .from("jobs")
    .insert({
      employer_id: user.id,
      title,
      description,
      embedding: embedding as unknown as string,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !job) {
    console.error("[createJob] DB insert failed:", insertError);
    return { error: "Failed to create the job posting. Please try again." };
  }

  revalidatePath("/app/jobs");
  redirect(`/jobs/${job.id}`);
}
