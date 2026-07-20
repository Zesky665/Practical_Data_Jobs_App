"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UpdatePasswordForm } from "./update-password-form";
import Link from "next/link";

/**
 * The password-reset email link lands here with auth tokens in the URL hash
 * fragment (not sent to the server). This wrapper creates a browser Supabase
 * client, which automatically exchanges the hash-fragment tokens for cookies
 * via the @supabase/ssr middleware. Once the exchange is complete (or fails),
 * we render the form so the Server Action can read the session from cookies.
 */
export default function UpdatePasswordPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // getUser() triggers the client-side PKCE/hash-fragment exchange. Once it
    // resolves, the session cookie is set and the server can read it.
    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (userError || !data.user) {
        setError(
          "Your reset link has expired or is invalid. Please request a new one.",
        );
      }
      setReady(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-brand-muted flex flex-col items-center justify-center px-[24px]">
      <div className="w-full max-w-[440px] bg-brand-white rounded-[20px] border border-brand-line shadow-sm p-[40px] max-sm:p-[24px]">
        <Link href="/" className="flex items-center gap-[10px] no-underline text-brand-ink mb-[28px]">
          <span
            className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-brand-white font-[800] text-[16px]"
            style={{ background: "linear-gradient(135deg,var(--brand-blue-600) 0%,var(--brand-cyan-500) 100%)" }}
          >
            P
          </span>
          <span className="font-[700] text-[16px]">Practical Data Jobs</span>
        </Link>

        {!ready && (
          <p className="text-[15px] text-brand-slate">Verifying your reset link…</p>
        )}

        {ready && error && (
          <div className="flex flex-col gap-[16px]">
            <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-[12px] py-[8px]">
              {error}
            </p>
            <a
              href="/auth/forgot-password"
              className="text-center w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
            >
              Request a new reset link
            </a>
          </div>
        )}

        {ready && !error && (
          <>
            <h1 className="text-[24px] font-[700] text-brand-ink mb-[8px]">Set a new password</h1>
            <p className="text-[15px] text-brand-slate mb-[24px]">
              Choose a new password for your account.
            </p>
            <UpdatePasswordForm />
          </>
        )}
      </div>
    </div>
  );
}
