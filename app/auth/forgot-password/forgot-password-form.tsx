"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { forgotPassword, type ForgotPasswordState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ForgotPasswordState, FormData>(
    forgotPassword,
    {},
  );

  if (state.sent) {
    return (
      <div className="flex flex-col gap-[16px] w-full max-w-[400px]">
        <div className="rounded-[10px] border border-brand-line bg-brand-muted px-[16px] py-[16px]">
          <h2 className="text-[17px] font-[700] text-brand-ink mb-[6px]">Check your email</h2>
          <p className="text-[14px] text-brand-slate leading-[1.5]">
            If an account exists for that email, we sent a password reset link.
            Click the link in the email to set a new password.
          </p>
        </div>
        <a
          href="/auth/login"
          className="text-center w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
        >
          Back to sign in
        </a>
      </div>
    );
  }

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
      {state.error && (
        <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-[12px] py-[8px]">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-[14px] text-brand-slate text-center">
        Remember your password?{" "}
        <a href="/auth/login" className="text-brand-blue-600 font-[600] hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
