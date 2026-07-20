"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Updates the password for the currently-signed-in user (the one that clicked
 * the reset link). Supabase's reset-password flow sets a recovery session, so
 * `getUser()` returns the user and `updateUser({ password })` works.
 *
 * PLAN.md §0 convention #3: never discard a Supabase `error`.
 * PLAN.md §0 convention #5: server auth checks use `getUser()`, not `getSession()`.
 */
export type UpdatePasswordState = { error?: string };

export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 12) {
    return { error: "Password must be at least 12 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();

  // Verify the user actually has a valid session (should be set by the magic
  // link from the reset email).
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      error:
        "Your reset link has expired or is invalid. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Surface the actual Supabase message (e.g. "New password should be
    // different from the old password") instead of a generic fallback.
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return redirect("/app");
}
