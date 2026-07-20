import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, description, status, employer_id, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!job) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-brand-muted">
      <main className="max-w-[72rem] mx-auto px-[24px] py-[48px]">
        <h1>{job.title}</h1>
        <p>{job.description}</p>
        <Link href="/jobs" className="text-brand-blue-600 hover:underline">
          ← Back to all jobs
        </Link>
      </main>
    </div>
  );
}
