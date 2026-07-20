import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

/**
 * Public job listing page. Shows all published jobs, newest first.
 * No auth required — this is the public-facing job board.
 */
export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      company,
      description,
      created_at,
      employer:profiles (
        display_name
      )
    `,
    )
    .eq("status", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-brand-muted">
      {/* Header */}
      <div className="bg-brand-white border-b border-brand-line">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[16px] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-[10px] no-underline text-brand-ink"
          >
            <span
              className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-brand-white font-[800] text-[16px]"
              style={{
                background:
                  "linear-gradient(135deg,var(--brand-blue-600) 0%,var(--brand-cyan-500) 100%)",
              }}
            >
              P
            </span>
            <span className="font-[700] text-[16px]">Practical Data Jobs</span>
          </Link>
          <div className="flex items-center gap-[16px]">
            <Link
              href="/auth/login"
              className="text-[14px] text-brand-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[72rem] mx-auto px-[24px] py-[48px]">
        <div className="mb-[32px]">
          <h1 className="text-[32px] font-[700] text-brand-ink mb-[8px]">
            Open positions
          </h1>
          <p className="text-[15px] text-brand-slate">
            Browse data roles from the Practical Data community.
          </p>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="space-y-[16px]">
            {jobs.map((job) => {
              const employerName =
                (job.employer as unknown as { display_name: string | null }[])
                  ?.[0]?.display_name ?? "Anonymous employer";

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block bg-brand-white rounded-[16px] border border-brand-line p-[28px] no-underline hover:border-brand-blue-200 hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-[16px] max-sm:flex-col">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-[18px] font-[700] text-brand-ink mb-[4px]">
                        {job.title}
                      </h2>
                      <p className="text-[13px] text-brand-slate mb-[2px]">
                        {job.company}
                      </p>
                      <p className="text-[13px] text-brand-slate mb-[8px]">
                        {employerName}
                      </p>
                      <p className="text-[14px] text-brand-ink-soft leading-[1.5] line-clamp-2">
                        {job.description.slice(0, 300)}
                        {job.description.length > 300 ? "…" : ""}
                      </p>
                    </div>
                    <span className="text-[12px] text-brand-slate-2 shrink-0 whitespace-nowrap">
                      {new Date(job.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-brand-white rounded-[20px] border border-brand-line p-[64px] text-center">
            <p className="text-[16px] text-brand-slate mb-[8px]">
              No open positions yet.
            </p>
            <p className="text-[14px] text-brand-slate-2">
              Check back soon for new data roles from the community.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
