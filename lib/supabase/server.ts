import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Reads + writes auth cookies so the session survives SSR.
 *
 * Don't put this in a global — with Fluid compute each request needs its own
 * client. Always call createClient() inside the function that uses it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component (read-only context). Safe to
            // ignore — proxy.ts refreshes the session on every navigation.
          }
        },
      },
    },
  );
}
