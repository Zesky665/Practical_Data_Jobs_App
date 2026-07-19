"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type SignInState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-[16px] w-full max-w-[400px]">
      <input type="hidden" name="next" value={next ?? "/app"} />
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="email" className="text-[14px] font-[600] text-brand-ink">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-[10px] border border-brand-line px-[14px] py-[10px] text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      </div>
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="password" className="text-[14px] font-[600] text-brand-ink">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-[10px] border border-brand-line px-[14px] py-[10px] text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      </div>
      {state.error && (
        <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-[12px] py-[8px]">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-[14px] text-brand-slate text-center">
        No account?{" "}
        <a href="/auth/sign-up" className="text-brand-blue-600 font-[600] hover:underline">
          Sign up
        </a>
      </p>
    </form>
  );
}
