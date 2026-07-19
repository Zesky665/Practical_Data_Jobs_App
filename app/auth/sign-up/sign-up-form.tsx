"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUp, type SignUpState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState<SignUpState, FormData>(signUp, {});

  return (
    <form action={formAction} className="flex flex-col gap-[16px] w-full max-w-[400px]">
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
          autoComplete="new-password"
          required
          minLength={12}
          className="rounded-[10px] border border-brand-line px-[14px] py-[10px] text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
        <span className="text-[13px] text-brand-slate">At least 12 characters.</span>
      </div>
      {state.error && (
        <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-[12px] py-[8px]">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-[14px] text-brand-slate text-center">
        Already have an account?{" "}
        <a href="/auth/login" className="text-brand-blue-600 font-[600] hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
