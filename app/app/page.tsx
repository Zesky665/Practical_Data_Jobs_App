import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

/**
 * /app placeholder — the auth gate's canary.
 *
 * If you can read this page, you're authenticated (proxy.ts redirected you to
 * /auth/login otherwise). When real app features land (jobs, profile, etc.)
 * this becomes the dashboard; for now it just confirms the session works end
 * to end: middleware gate → SSR session read → user identity available.
 */
export default async function AppHome() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? "friend";

  return (
    <div className="bg-brand-white rounded-[20px] border border-brand-line p-[48px] max-sm:p-[24px]">
      <h1 className="text-[28px] font-[700] text-brand-ink mb-[8px]">
        You&apos;re signed in.
      </h1>
      <p className="text-[16px] text-brand-slate">
        Authenticated as <span className="font-[600] text-brand-ink">{email}</span>. The app itself is coming in later milestones — for now this page exists to prove the auth gate works.
      </p>
      <div className="mt-[28px] flex flex-wrap gap-[12px]">
        <Link
          href="/"
          className="text-[14px] text-brand-blue-600 hover:underline"
        >
          ← Back to public site
        </Link>
      </div>
    </div>
  );
}
