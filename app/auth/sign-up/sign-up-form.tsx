"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signUp, type SignUpState } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState<SignUpState, FormData>(signUp, {});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Only flag once the user has started typing in confirm — no point yelling
  // before they've entered anything. Empty confirm = neutral.
  const showMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const showMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Submit lights up only when both fields are filled, match, and meet length.
  // Server still re-validates (defense in depth) — never trust the client alone.
  const canSubmit =
    password.length >= 12 &&
    confirmPassword.length >= 12 &&
    password === confirmPassword;

  // Success with no session → email confirmation required. Show the notice
  // instead of the form (state resets on reload, which is fine for this screen).
  if (state.email) {
    return (
      <div className="flex flex-col gap-[16px] w-full max-w-[400px]">
        <div className="rounded-[10px] border border-brand-line bg-brand-muted px-[16px] py-[16px]">
          <h2 className="text-[17px] font-[700] text-brand-ink mb-[6px]">Check your email</h2>
          <p className="text-[14px] text-brand-slate leading-[1.5]">
            We sent a confirmation link to{" "}
            <span className="font-[600] text-brand-ink">{state.email}</span>. Click
            the link in that email to activate your account, then sign in.
          </p>
        </div>
        <a
          href="/auth/login"
          className="text-center w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
        >
          Continue to sign in
        </a>
      </div>
    );
  }

  // Confirm-field border/ring track the live match state.
  const confirmBorder = showMismatch
    ? "border-red-400 focus:ring-red-400"
    : showMatch
      ? "border-green-500 focus:ring-green-500"
      : "border-brand-line focus:ring-brand-blue-500";

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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[10px] border border-brand-line px-[14px] py-[10px] text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
        <span className="text-[13px] text-brand-slate">At least 12 characters.</span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="confirmPassword" className="text-[14px] font-[600] text-brand-ink">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={showMismatch}
          className={`rounded-[10px] border px-[14px] py-[10px] text-[15px] focus:outline-none focus:ring-2 ${confirmBorder}`}
        />
        {showMismatch && (
          <span className="text-[13px] text-red-600">Passwords don&apos;t match.</span>
        )}
        {showMatch && (
          <span className="text-[13px] text-green-600">Passwords match.</span>
        )}
      </div>
      {state.error && (
        <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-[12px] py-[8px]">
          {state.error}
        </p>
      )}
      <SubmitButton disabled={!canSubmit} />
      <p className="text-[14px] text-brand-slate text-center">
        Already have an account?{" "}
        <a href="/auth/login" className="text-brand-blue-600 font-[600] hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
