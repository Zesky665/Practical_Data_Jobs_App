import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

/**
 * Profile page — M4.B.
 *
 * Reads the authenticated user's profile row and displays it. Falls back
 * gracefully if the profile row is missing (shouldn't happen thanks to the
 * handle_new_user trigger, but we handle it anyway).
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    // Should never happen — proxy.ts gates /app/*. Safety redirect.
    return (
      <div className="bg-brand-white rounded-[20px] border border-brand-line p-[48px] text-center">
        <p className="text-brand-slate">Loading your account…</p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const email = user.email ?? "unknown";
  const displayName =
    profile?.display_name ?? email.split("@")[0] ?? "there";
  const bio = profile?.bio;
  const canPostJobs = profile?.can_post_jobs ?? false;

  return (
    <div className="space-y-[32px]">
      {/* Page heading */}
      <div>
        <h1 className="text-[28px] font-[700] text-brand-ink mb-[4px]">
          Your profile
        </h1>
        <p className="text-[15px] text-brand-slate">
          Manage your CV, view matches, and track your applications.
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px]">
        <div className="flex items-start gap-[24px] max-sm:flex-col">
          {/* Avatar placeholder */}
          <div
            className="w-[72px] h-[72px] rounded-[16px] flex items-center justify-center text-brand-white font-[700] text-[28px] shrink-0"
            style={{
              background:
                "linear-gradient(135deg,var(--brand-blue-600) 0%,var(--brand-cyan-500) 100%)",
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col gap-[8px] flex-1">
            <div className="flex items-center gap-[12px] flex-wrap">
              <h2 className="text-[22px] font-[700] text-brand-ink">
                {displayName}
              </h2>
              {canPostJobs && (
                <span className="px-[10px] py-[3px] rounded-[6px] bg-brand-cyan-50 border border-brand-cyan-100 text-brand-cyan-600 text-[12px] font-[600]">
                  Employer
                </span>
              )}
            </div>
            <p className="text-[15px] text-brand-slate">{email}</p>
            {bio ? (
              <p className="text-[15px] text-brand-ink-soft leading-[1.6] mt-[4px]">
                {bio}
              </p>
            ) : (
              <p className="text-[14px] text-brand-slate-2 italic mt-[4px]">
                No bio yet. Add one to tell employers about yourself.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[16px]">
        <Link
          href="/app/profile/cv/upload"
          className="bg-brand-white rounded-[16px] border border-brand-line p-[28px] no-underline hover:border-brand-blue-200 hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] transition-all duration-200"
        >
          <div className="flex items-center gap-[12px]">
            <span className="w-[44px] h-[44px] rounded-[12px] bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </span>
            <div>
              <span className="block text-[16px] font-[600] text-brand-ink">
                Upload CV
              </span>
              <span className="block text-[13px] text-brand-slate mt-[2px]">
                Upload your CV to get matched with jobs
              </span>
            </div>
          </div>
        </Link>

        {canPostJobs && (
          <Link
            href="/app/jobs/new"
            className="bg-brand-white rounded-[16px] border border-brand-line p-[28px] no-underline hover:border-brand-cyan-200 hover:shadow-[0_4px_16px_rgba(6,182,212,0.08)] transition-all duration-200"
          >
            <div className="flex items-center gap-[12px]">
              <span className="w-[44px] h-[44px] rounded-[12px] bg-brand-cyan-50 text-brand-cyan-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                </svg>
              </span>
              <div>
                <span className="block text-[16px] font-[600] text-brand-ink">
                  Post a job
                </span>
                <span className="block text-[13px] text-brand-slate mt-[2px]">
                  Create a new job listing
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link
          href="/app"
          className="text-[14px] text-brand-blue-600 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
