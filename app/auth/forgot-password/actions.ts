"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

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

  // Build the redirect URL from the incoming request's origin.
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;
  const redirectTo = `${origin}/auth/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: "We couldn't send the reset email. Please try again." };
  }

  return { sent: true };
}
