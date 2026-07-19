"use client";

import { signOut } from "@/app/auth/login/actions";

/**
 * Header logout widget. Server-rendered with the right label by the parent
 * (we know auth status there via getUser()), but the click is a Client Component
 * calling the signOut Server Action.
 */
export function AuthButton({ email }: { email: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-[14px] text-brand-slate-2 hover:text-brand-white transition-colors"
        title={`Signed in as ${email}`}
      >
        Sign out
      </button>
    </form>
  );
}
