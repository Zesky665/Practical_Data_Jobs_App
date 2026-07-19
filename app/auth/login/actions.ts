"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Email/password sign-in. Redirects to ?next=… on success (defaults to /app),
 * returns { error } on failure. See sign-up/actions.ts for the typing note on
 * returning redirect().
 */
export type SignInState = { error?: string };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app") || "/app";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  // Only allow relative next-URLs (avoid open redirect).
  return redirect(next.startsWith("/") ? next : "/app");
}

/**
 * Sign-out. Server Action the auth-button calls; redirects to public home.
 */
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return redirect("/");
}
