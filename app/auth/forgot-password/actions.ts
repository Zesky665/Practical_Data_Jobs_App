"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * Sends a password-reset email to the given address. Supabase handles the email
 * delivery; the link points to <origin>/auth/update-password.
 *
 * The redirectTo MUST be an absolute URL. A relative path doesn't work because
 * Supabase embeds it in the email verification link, and the browser resolves
 * relative URLs against Supabase's domain, not ours.
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

  // Construct absolute origin from request headers. On Vercel:
  //   x-forwarded-proto = https
  //   host = practical-data-jobs-app.vercel.app
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
