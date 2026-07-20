import { Suspense } from "react";
import { UpdatePasswordPageInner } from "./update-password-page-inner";

/**
 * Server wrapper — Suspense boundary required because the inner component
 * uses useSearchParams(), which triggers a client-side bailout.
 */
export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-muted flex flex-col items-center justify-center px-[24px]">
          <div className="w-full max-w-[440px] bg-brand-white rounded-[20px] border border-brand-line shadow-sm p-[40px] max-sm:p-[24px]">
            <p className="text-[15px] text-brand-slate">Verifying your reset link…</p>
          </div>
        </div>
      }
    >
      <UpdatePasswordPageInner />
    </Suspense>
  );
}
