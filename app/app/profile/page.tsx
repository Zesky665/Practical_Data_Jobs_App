import { createClient } from "@/lib/supabase/server";
import { searchJobsForCV } from "@/lib/search";
import Link from "next/link";

/**
 * Profile page — M4.B + M5.D.
 *
 * Reads the authenticated user's profile row and uploaded CVs.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
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

  // Fetch uploaded CVs
  const { data: cvs } = await supabase
    .from("cvs")
    .select("id, original_filename, raw_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Search for matching jobs using the most recent CV
  let matchingJobs: {
    id: string;
    title: string;
    employerName: string;
    similarity: number;
  }[] = [];
  if (cvs && cvs.length > 0) {
    try {
      const results = await searchJobsForCV(cvs[0].id, 5);
      if (results.length > 0) {
        // Fetch job details using the user's RLS-scoped client
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, employer_id, employer:profiles!jobs_employer_id_fkey(display_name)")
          .in("id", results.map((r) => r.id));

        if (jobs) {
          const simMap = new Map(results.map((r) => [r.id, r.similarity]));
          matchingJobs = jobs.map((j) => ({
            id: j.id,
            title: j.title,
            employerName:
              (j.employer as unknown as { display_name: string | null }[])?.[0]
                ?.display_name ?? "Anonymous employer",
            similarity: simMap.get(j.id) ?? 0,
          }));
          // Sort by similarity descending
          matchingJobs.sort((a, b) => b.similarity - a.similarity);
        }
      }
    } catch (err) {
      console.error("[ProfilePage] Search failed:", err);
      // Non-fatal — profile still renders without matches
    }
  }

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

      {/* Uploaded CVs */}
      <div className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px]">
        <div className="flex items-center justify-between mb-[20px]">
          <h2 className="text-[18px] font-[700] text-brand-ink">
            Your CVs
          </h2>
          <Link
            href="/app/profile/cv/upload"
            className="px-[16px] py-[8px] rounded-[8px] bg-brand-blue-600 text-brand-white text-[13px] font-[600] no-underline hover:bg-brand-blue-700 transition-colors duration-200"
          >
            Upload new CV
          </Link>
        </div>

        {cvs && cvs.length > 0 ? (
          <div className="space-y-[12px]">
            {cvs.map((cv) => (
              <details
                key={cv.id}
                className="border border-brand-line rounded-[12px] group"
              >
                <summary className="flex items-center justify-between px-[20px] py-[16px] cursor-pointer hover:bg-brand-muted transition-colors duration-200">
                  <div className="flex items-center gap-[12px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand-blue-600"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div>
                      <span className="block text-[14px] font-[600] text-brand-ink">
                        {cv.original_filename}
                      </span>
                      <span className="block text-[12px] text-brand-slate mt-[1px]">
                        Uploaded{" "}
                        {new Date(cv.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-slate-2 group-open:rotate-180 transition-transform duration-200"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className="px-[20px] pb-[20px] border-t border-brand-line">
                  <pre className="text-[13px] text-brand-ink-soft leading-[1.6] whitespace-pre-wrap font-sans mt-[16px] max-h-[300px] overflow-y-auto bg-brand-muted rounded-[8px] p-[16px]">
                    {cv.raw_text.slice(0, 5000)}
                    {cv.raw_text.length > 5000 && (
                      <span className="text-brand-slate-2 italic">
                        {"\n\n… (text truncated — full CV available in the uploaded file)"}
                      </span>
                    )}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="text-center py-[32px]">
            <p className="text-[14px] text-brand-slate-2">
              No CVs uploaded yet. Upload one to get matched with jobs.
            </p>
            <Link
              href="/app/profile/cv/upload"
              className="inline-block mt-[12px] text-[14px] text-brand-blue-600 font-[600] hover:underline"
            >
              Upload your first CV →
            </Link>
          </div>
        )}
      </div>

      {/* Matching jobs */}
      {matchingJobs.length > 0 && (
        <div className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px]">
          <h2 className="text-[18px] font-[700] text-brand-ink mb-[20px]">
            Matching jobs
          </h2>
          <p className="text-[13px] text-brand-slate mb-[20px]">
            Based on your most recent CV. Higher percentages mean a stronger
            match.
          </p>
          <div className="space-y-[10px]">
            {matchingJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between px-[20px] py-[14px] rounded-[12px] border border-brand-line no-underline hover:border-brand-blue-200 hover:bg-brand-blue-50/50 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <span className="block text-[14px] font-[600] text-brand-ink">
                    {job.title}
                  </span>
                  <span className="block text-[12px] text-brand-slate mt-[2px]">
                    {job.employerName}
                  </span>
                </div>
                <span
                  className={`ml-[16px] text-[13px] font-[700] shrink-0 ${
                    job.similarity >= 0.7
                      ? "text-green-600"
                      : job.similarity >= 0.5
                        ? "text-brand-blue-600"
                        : "text-brand-slate"
                  }`}
                >
                  {Math.round(job.similarity * 100)}% match
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
