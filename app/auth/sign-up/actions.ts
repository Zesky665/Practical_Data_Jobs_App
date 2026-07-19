"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Email/password sign-up. Returns { error } on failure (consumed by
 * useActionState in the sign-up form). On success the user is logged in
 * immediately (email confirmation is OFF in local dev — see config.toml).
 *
 * PLAN.md §0 convention #3: never discard a Supabase `error`.
 *
 * Typing: useActionState wants (prev, formData) => Promise<State>. redirect()
 * throws NEXT_REDIRECT (returns `never`), so the success path is `never` and
 * the error/validation paths return the state — both are assignable to the
 * declared Promise<SignUpState>. The trailing redirect() therefore satisfies
 * "function must return something on all paths".
 */
export type SignUpState = { error?: string };

export async function signUp(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 12) {
    return { error: "Password must be at least 12 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return redirect("/app"); // redirect() returns `never` — fine as the success return
}
