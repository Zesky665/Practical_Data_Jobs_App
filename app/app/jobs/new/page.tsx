import { createJob } from "./actions";
import { JobForm } from "@/components/job-form";
import Link from "next/link";

export default function NewJobPage() {
  return (
    <div className="space-y-[32px]">
      <div>
        <h1 className="text-[28px] font-[700] text-brand-ink mb-[4px]">
          Post a new job
        </h1>
        <p className="text-[15px] text-brand-slate">
          Create a job listing. It will start as a draft — you can publish it
          when ready.
        </p>
      </div>

      <JobForm
        action={createJob}
        submitLabel="Create job (draft)"
        submitPendingLabel="Creating…"
        cancelHref="/app"
      />

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
