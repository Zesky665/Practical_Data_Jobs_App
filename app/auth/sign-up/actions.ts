"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Email/password sign-up. Returns { error } on failure (consumed by
 * useActionState in the sign-up form). On success the behavior depends on
 * Supabase's email-confirmation setting:
 *   - confirmation OFF (local dev): signUp returns a session → redirect to /app
 *   - confirmation ON  (cloud prod): signUp returns no session → return
 *     { email } so the form can show a "check your email" panel.
 *
 * PLAN.md §0 convention #3: never discard a Supabase `error`.
 *
 * Typing: useActionState wants (prev, formData) => Promise<State>. redirect()
 * throws NEXT_REDIRECT (returns `never`), so the success-with-session path is
 * `never` and the other paths return the state — both are assignable to the
 * declared Promise<SignUpState>.
 */
export type SignUpState = { error?: string; email?: string };

export async function signUp(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 12) {
    return { error: "Password must be at least 12 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    // Supabase's AuthRetryableFetchError surfaces a useless "{}" message when
    // the underlying failure is server-side (e.g. "Error sending confirmation
    // email" from a misconfigured custom SMTP). The real cause lives in the
    // response body, which the client discards. Map status 500 to something
    // actionable so the user isn't staring at "{}".
    let message = error.message;
    if (error.status === 500 || !message || message === "{}") {
      message =
        "We couldn't complete sign-up. If email confirmation is on, the " +
        "confirmation email may have failed to send — please try again in a " +
        "moment, or contact support if it persists.";
    }
    return { error: message };
  }

  // Session present → confirmation off → user is logged in, send to the app.
  if (data.session) {
    revalidatePath("/", "layout");
    return redirect("/app"); // redirect() returns `never` — fine as this branch's return
  }

  // No session → confirmation required → tell the user to check their email.
  return { email };
}
