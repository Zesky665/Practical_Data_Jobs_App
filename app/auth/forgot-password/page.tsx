import { ForgotPasswordForm } from "./forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
        <h1 className="text-[24px] font-[700] text-brand-ink mb-[8px]">Reset your password</h1>
        <p className="text-[15px] text-brand-slate mb-[24px]">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
