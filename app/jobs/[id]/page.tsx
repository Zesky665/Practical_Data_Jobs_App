import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function JobDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, title, description, status, employer_id, created_at, updated_at",
    )
    .eq("id", id)
    .single();

  if (!job) {
    return notFound();
  }

  // Check if viewer is the owner
  const { data: auth } = await supabase.auth.getUser();
  const isOwner = auth.user?.id === job.employer_id;

  // Non-owners can only see public jobs
  if (!isOwner && job.status !== "public") {
    return notFound();
  }

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
            {isOwner ? (
              <Link
                href="/app"
                className="text-[14px] text-brand-blue-600 hover:underline"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/jobs"
                className="text-[14px] text-brand-slate hover:text-brand-ink transition-colors"
              >
                ← All jobs
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-[72rem] mx-auto px-[24px] py-[48px]">
        {/* Owner controls */}
        {isOwner && (
          <div className="flex items-center gap-[12px] mb-[24px] flex-wrap">
            <Link
              href={`/app/jobs/${job.id}/edit`}
              className="px-[16px] py-[8px] rounded-[8px] bg-brand-blue-50 text-brand-blue-600 text-[13px] font-[600] no-underline hover:bg-brand-blue-100 transition-colors duration-200"
            >
              Edit job
            </Link>
            {job.status && (
              <span className="px-[10px] py-[4px] rounded-[6px] bg-brand-muted border border-brand-line text-brand-slate text-[12px] font-[600] capitalize">
                {job.status}
              </span>
            )}
          </div>
        )}

        {/* Job card */}
        <div className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px]">
          <div className="mb-[24px]">
            <h1 className="text-[28px] font-[700] text-brand-ink mb-[8px]">
              {job.title}
            </h1>
            <div className="flex items-center gap-[12px] text-[14px] text-brand-slate flex-wrap">
              <span>
                Posted{" "}
                {new Date(job.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {job.updated_at !== job.created_at && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated{" "}
                    {new Date(job.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-slate max-w-none">
            <h2 className="text-[18px] font-[600] text-brand-ink mb-[12px]">
              Description
            </h2>
            <div className="text-[15px] text-brand-ink-soft leading-[1.7] whitespace-pre-wrap">
              {job.description}
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-[24px]">
          <Link
            href="/jobs"
            className="text-[14px] text-brand-blue-600 hover:underline"
          >
            ← Back to all jobs
          </Link>
        </div>
      </main>
    </div>
  );
}
