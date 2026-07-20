import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase Auth callback — handles email confirmation and OAuth redirects.
 *
 * Supabase redirects here with ?code=... after the user clicks the
 * confirmation link. We exchange the code for a session and redirect
 * to the app dashboard.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/?error_description=${encodeURIComponent(error.message)}`,
          request.url,
        ),
      );
    }

    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // No code — redirect home
  return NextResponse.redirect(new URL("/", request.url));
}
