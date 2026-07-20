import Link from "next/link";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-brand-muted">
      <main className="max-w-[72rem] mx-auto px-[24px] py-[48px]">
        <p>Job ID: {id}</p>
        <Link href="/jobs" className="text-brand-blue-600 hover:underline">
          ← Back to all jobs
        </Link>
      </main>
    </div>
  );
}
