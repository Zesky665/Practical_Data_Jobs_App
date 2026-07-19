import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every matched request and enforces
 * the public-vs-gated route split. Called from proxy.ts (Next 16's middleware
 * replacement).
 *
 * Gate model: ONLY /app/* requires a session. Public subtree is / and /auth/*.
 * Auth pages live at /auth/* (NOT /app/auth/*) because they must be reachable
 * while logged out — don't move them under /app.
 *
 * With Fluid compute, don't put this client in a global — always create a new
 * one per request.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims(). A simple
  // mistake here causes random logouts.
  //
  // IMPORTANT: removing getClaims() with SSR + Supabase clients causes users
  // to be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  // Allowlist-style: only /app/* is gated. Everything else (/, /auth/*, and
  // future public pages like /about) is open by default.
  const isGated = pathname === "/app" || pathname.startsWith("/app/");

  if (!user && isGated) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // MUST return supabaseResponse as-is. If you build a new response, you must
  // copy over the cookies or the browser and server go out of sync and the
  // session terminates prematurely.
  return supabaseResponse;
}
