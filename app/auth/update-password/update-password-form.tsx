"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword, type UpdatePasswordState } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
    >
      {pending ? "Updating…" : "Set new password"}
    </button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState<UpdatePasswordState, FormData>(
    updatePassword,
    {},
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const showMatch = confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    password.length >= 12 &&
    confirmPassword.length >= 12 &&
    password === confirmPassword;

  const confirmBorder = showMismatch
    ? "border-red-400 focus:ring-red-400"
    : showMatch
      ? "border-green-500 focus:ring-green-500"
      : "border-brand-line focus:ring-brand-blue-500";

  return (
    <form
      action={formAction}
      className="flex flex-col gap-[16px] w-full max-w-[400px]"
    >
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="password" className="text-[14px] font-[600] text-brand-ink">
          New password
        </label>
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
        <span className="text-[13px] text-brand-slate">
          At least 12 characters.
        </span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="confirmPassword" className="text-[14px] font-[600] text-brand-ink">
          Confirm new password
        </label>
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
          <span className="text-[13px] text-red-600">
            Passwords don&apos;t match.
          </span>
        )}
        {showMatch && (
          <span className="text-[13px] text-green-600">
            Passwords match.
          </span>
        )}
      </div>
      {state.error && (
        <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-[12px] py-[8px]">
          {state.error}
        </p>
      )}
      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}
