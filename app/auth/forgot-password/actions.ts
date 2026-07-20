"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Sends a password-reset email to the given address. Supabase handles the email
 * delivery; the link points to <origin>/auth/update-password.
 *
 * PLAN.md §0 convention #3: never discard a Supabase `error`.
 * Returns { error?, sent? } for useActionState.
 */
export type ForgotPasswordState = { error?: string; sent?: boolean };

export async function forgotPassword(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();

  // Relative path — Supabase resolves this against the configured Site URL.
  // An absolute URL risks a mismatch with the allowed redirect URLs list in
  // the Supabase dashboard, causing a fallback to /?error=... instead.
  const redirectTo = "/auth/update-password";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: "We couldn't send the reset email. Please try again." };
  }

  return { sent: true };
}
