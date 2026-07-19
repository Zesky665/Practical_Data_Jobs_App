import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";

/**
 * Gated app subtree layout. Reads getUser() ONCE here so child pages don't
 * re-call it. Wrapped in <Suspense> because dynamic (auth/cookie) data inside
 * a layout child crashes the route under Next 16 + Turbopack — see PDC_Job_Board
 * for the same gotcha (PLAN.md §0 convention #1).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? "you";

  return (
    <div className="min-h-screen bg-brand-muted">
      <div className="sticky top-0 z-50 bg-brand-white border-b border-brand-line">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[14px] flex items-center justify-between">
          <a href="/app" className="flex items-center gap-[10px] no-underline text-brand-ink">
            <span
              className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-brand-white font-[800] text-[16px]"
              style={{ background: "linear-gradient(135deg,var(--brand-blue-600) 0%,var(--brand-cyan-500) 100%)" }}
            >
              P
            </span>
            <span className="font-[700] text-[16px]">Practical Data Jobs</span>
          </a>
          <div className="flex items-center gap-[20px]">
            <span className="text-[13px] text-brand-slate hidden sm:inline">{email}</span>
            <AuthButton email={email} />
          </div>
        </div>
      </div>
      <main className="max-w-[72rem] mx-auto px-[24px] py-[40px]">{children}</main>
    </div>
  );
}
