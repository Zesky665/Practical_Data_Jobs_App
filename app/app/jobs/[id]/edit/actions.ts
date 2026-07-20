"use server";

import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/voyage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UpdateJobState = {
  error?: string;
  fieldErrors?: {
    title?: string;
    company?: string;
    description?: string;
  };
};

/**
 * Update a job posting. Owner only. Re-embeds description if it changed.
 */
export async function updateJob(
  _prevState: UpdateJobState,
  formData: FormData,
): Promise<UpdateJobState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return { error: "You must be signed in." };
  }

  const id = formData.get("job_id") as string;
  const title = (formData.get("title") as string)?.trim() ?? "";
  const company = (formData.get("company") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";

  // Field-level validation
  const fieldErrors: UpdateJobState["fieldErrors"] = {};

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

  // Fetch existing job to check ownership and detect description changes
  const { data: existing } = await supabase
    .from("jobs")
    .select("id, employer_id, description")
    .eq("id", id)
    .single();

  if (!existing) {
    return { error: "Job not found." };
  }

  if (existing.employer_id !== user.id) {
    return { error: "You can only edit your own job postings." };
  }

  // Re-embed if description changed
  let embedding: number[] | undefined;
  if (description !== existing.description) {
    try {
      const result = await embedText(description);
      embedding = result.vector;
    } catch (err) {
      console.error("[updateJob] Voyage embedding failed:", err);
      return {
        error: "Failed to re-analyze the job description. Please try again.",
      };
    }
  }

  const updateData: Record<string, unknown> = {
    title,
    company,
    description,
    updated_at: new Date().toISOString(),
  };
  if (embedding) {
    updateData.embedding = embedding as unknown as string;
  }

  const { error: updateError } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", id)
    .eq("employer_id", user.id);

  if (updateError) {
    console.error("[updateJob] DB update failed:", updateError);
    return { error: "Failed to update the job posting. Please try again." };
  }

  revalidatePath(`/jobs/${id}`);
  revalidatePath(`/app/jobs/${id}/edit`);
  redirect(`/jobs/${id}`);
}

/**
 * Change a job's status. Owner only.
 */
export async function updateJobStatus(
  _prevState: UpdateJobState,
  formData: FormData,
): Promise<UpdateJobState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return { error: "You must be signed in." };
  }

  const id = formData.get("job_id") as string;
  const status = formData.get("status") as string;

  if (!status) {
    return { error: "No status provided." };
  }

  const { error: updateError } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("employer_id", user.id);

  if (updateError) {
    console.error("[updateJobStatus] DB update failed:", updateError);
    return { error: "Failed to update the job status. Please try again." };
  }

  revalidatePath(`/jobs/${id}`);
  revalidatePath(`/app/jobs/${id}/edit`);
  redirect(`/jobs/${id}`);
}
