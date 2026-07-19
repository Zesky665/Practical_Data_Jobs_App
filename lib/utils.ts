/**
 * Shared helpers. Kept out of any "use server" file — those export only async
 * functions (PLAN.md §0 convention #2).
 */

// Trivial env-var presence check. Used by proxy.ts and the auth-button to
// degrade gracefully when the Supabase env vars aren't set yet (e.g. fresh
// clone before `supabase start`). Remove once the project is always-wired.
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
