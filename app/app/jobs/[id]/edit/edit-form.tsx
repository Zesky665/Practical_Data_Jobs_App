"use client";

import { useActionState } from "react";
import { updateJob, updateJobStatus, type UpdateJobState } from "./actions";
import { JobForm } from "@/components/job-form";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  company: string;
  description: string;
  status: string;
  employer_id: string;
};

export function EditJobForm({ job }: { job: Job }) {
  const [statusState, statusAction, statusPending] = useActionState<
    UpdateJobState,
    FormData
  >(updateJobStatus, {});

  return (
    <div className="space-y-[32px]">
      <div>
        <h1 className="text-[28px] font-[700] text-brand-ink mb-[4px]">
          Edit job
        </h1>
        <p className="text-[15px] text-brand-slate">
          Update the job details. Changes to the description will trigger
          re-analysis for matching.
        </p>
      </div>

      {statusState.error && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px] flex items-start gap-[10px]">
          <span className="text-red-500 text-[18px] shrink-0 mt-[1px]">
            ⚠
          </span>
          <p className="text-[14px] text-red-700 leading-[1.5]">
            {statusState.error}
          </p>
        </div>
      )}

      {/* Edit form — uses shared JobForm (renders its own errors) */}
      <JobForm
        action={updateJob}
        defaultTitle={job.title}
        defaultCompany={job.company}
        defaultDescription={job.description}
        hiddenFields={{ job_id: job.id }}
        submitLabel="Save changes"
        submitPendingLabel="Saving…"
        cancelHref={`/jobs/${job.id}`}
      />

      {/* Status management */}
      <form
        action={statusAction}
        className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px] space-y-[20px]"
      >
        <input type="hidden" name="job_id" value={job.id} />

        <h2 className="text-[18px] font-[700] text-brand-ink">Status</h2>

        <div className="flex items-center gap-[12px] flex-wrap">
          <input type="hidden" name="status" id="status-input" />

          {/* Current status */}
          <span className="px-[20px] py-[10px] rounded-[8px] text-[14px] font-[600] border bg-brand-muted border-brand-line text-brand-slate capitalize cursor-default">
            Current: {job.status}
          </span>

          {/* Open */}
          <button
            type="submit"
            name="status"
            value="open"
            disabled={statusPending || job.status === "open"}
            className={`px-[20px] py-[10px] rounded-[8px] text-[14px] font-[600] border transition-colors duration-200 ${
              job.status === "open"
                ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 disabled:opacity-50"
            }`}
          >
            {job.status === "open" ? "← Open" : "Open"}
          </button>

          {/* Closed */}
          <button
            type="submit"
            name="status"
            value="closed"
            disabled={statusPending || job.status === "closed"}
            className={`px-[20px] py-[10px] rounded-[8px] text-[14px] font-[600] border transition-colors duration-200 ${
              job.status === "closed"
                ? "bg-red-50 border-red-200 text-red-700 cursor-default"
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 disabled:opacity-50"
            }`}
          >
            {job.status === "closed" ? "← Closed" : "Close"}
          </button>
        </div>
      </form>

      <div>
        <Link
          href={`/jobs/${job.id}`}
          className="text-[14px] text-brand-blue-600 hover:underline"
        >
          ← Back to job
        </Link>
      </div>
    </div>
  );
}
