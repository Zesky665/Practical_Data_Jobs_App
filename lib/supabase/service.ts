import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — server-only.
 *
 * Bypasses RLS entirely. Use ONLY for privileged operations that need to
 * read/write across users:
 *   - Storage file uploads (storage.objects policies don't cover all upload
 *     paths cleanly with the user's JWT).
 *   - Semantic search queries (pgvector index scan across all CVs/jobs).
 *
 * NEVER expose this client to the browser. NEVER use it where the user's
 * own client (lib/supabase/server.ts) would suffice — always default to
 * the least-privilege client first.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from process.env (already documented in
 * .env.example for test use).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null; // not configured — caller should fall back to user client
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
