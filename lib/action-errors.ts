import { redirect } from "next/navigation";

/**
 * Surface a failure from a `void` form action (a plain <form action={fn}> with
 * no return channel).
 *
 * Discarding a Supabase `error` in such an action makes a failure look exactly
 * like success (PLAN.md §0 convention #3). Void actions must call this to
 * redirect back with ?error=…, which the page renders via <PageError>.
 *
 * Returns `never` — redirect() throws NEXT_REDIRECT. Never call this inside a
 * `try` whose `catch` would swallow that signal.
 */
export function failTo(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
