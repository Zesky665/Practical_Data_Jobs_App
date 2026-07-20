"use server";

import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/voyage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateJobState = {
  error?: string;
  fieldErrors?: {
    title?: string;
    company?: string;
    description?: string;
  };
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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("can_post_jobs")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[createJob] Profile lookup failed:", profileError);
    return {
      error:
        "Could not verify your account. Please try again or contact support.",
    };
  }

  if (!profile?.can_post_jobs) {
    return {
      error:
        "You don't have permission to post jobs. Contact an admin to enable job posting on your account.",
    };
  }

  // Validate fields
  const title = (formData.get("title") as string)?.trim() ?? "";
  const company = (formData.get("company") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";

  const fieldErrors: CreateJobState["fieldErrors"] = {};

  if (!title) {
    fieldErrors.title = "Job title is required.";
  } else if (title.length > 200) {
    fieldErrors.title = "Job title must be at most 200 characters.";
  }

  if (!company) {
    fieldErrors.company = "Company name is required.";
  } else if (company.length > 200) {
    fieldErrors.company = "Company name must be at most 200 characters.";
  }

  if (!description) {
    fieldErrors.description = "Job description is required.";
  } else if (description.length > 50000) {
    fieldErrors.description =
      "Job description must be at most 50,000 characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
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
  const now = new Date().toISOString();
  const { data: job, error: insertError } = await supabase
    .from("jobs")
    .insert({
      employer_id: user.id,
      title,
      company,
      description,
      embedding: embedding as unknown as string,
      status: "draft",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertError || !job) {
    console.error("[createJob] DB insert failed:", insertError);
    return { error: "Failed to create the job posting. Please try again." };
  }

  revalidatePath("/app/jobs");
  redirect(`/jobs/${job.id}?created=1`);
}
