import { createBrowserClient } from "@supabase/ssr";

/** Client-side Supabase browser client. Used in Client Components only. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
