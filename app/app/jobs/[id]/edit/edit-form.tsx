"use client";

import { useActionState } from "react";
import { updateJob, updateJobStatus, type UpdateJobState } from "./actions";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  description: string;
  status: string;
  employer_id: string;
};

export function EditJobForm({ job }: { job: Job }) {
  const [editState, editAction, editPending] = useActionState<
    UpdateJobState,
    FormData
  >(updateJob, {});

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

      {(editState.error ?? statusState.error) && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px] flex items-start gap-[10px]">
          <span className="text-red-500 text-[18px] shrink-0 mt-[1px]">
            ⚠
          </span>
          <p className="text-[14px] text-red-700 leading-[1.5]">
            {editState.error ?? statusState.error}
          </p>
        </div>
      )}

      {/* Edit form */}
      <form
        action={editAction}
        className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px] space-y-[24px]"
      >
        <input type="hidden" name="job_id" value={job.id} />

        <div className="space-y-[6px]">
          <label
            htmlFor="title"
            className="block text-[14px] font-[600] text-brand-ink"
          >
            Job title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={job.title}
            className="w-full px-[16px] py-[12px] rounded-[10px] border border-brand-line text-[15px] text-brand-ink focus:outline-none focus:border-brand-blue-300 focus:ring-2 focus:ring-brand-blue-100 transition-all duration-200"
          />
        </div>

        <div className="space-y-[6px]">
          <label
            htmlFor="description"
            className="block text-[14px] font-[600] text-brand-ink"
          >
            Job description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={10}
            maxLength={50000}
            defaultValue={job.description}
            className="w-full px-[16px] py-[12px] rounded-[10px] border border-brand-line text-[15px] text-brand-ink focus:outline-none focus:border-brand-blue-300 focus:ring-2 focus:ring-brand-blue-100 transition-all duration-200 resize-y"
          />
        </div>

        <div className="flex items-center gap-[12px] pt-[8px]">
          <button
            type="submit"
            disabled={editPending}
            className="px-[28px] py-[12px] rounded-[10px] bg-brand-blue-600 text-brand-white text-[15px] font-[600] hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {editPending ? "Saving…" : "Save changes"}
          </button>
          <Link
            href={`/jobs/${job.id}`}
            className="text-[14px] text-brand-blue-600 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Status management */}
      <form
        action={statusAction}
        className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px] space-y-[20px]"
      >
        <input type="hidden" name="job_id" value={job.id} />

        <h2 className="text-[18px] font-[700] text-brand-ink">Status</h2>

        <div className="flex items-center gap-[12px] flex-wrap">
          <input type="hidden" name="status" id="status-input" />

          {/* Draft */}
          <button
            type="submit"
            name="status"
            value="draft"
            disabled={statusPending || job.status === "draft"}
            className={`px-[20px] py-[10px] rounded-[8px] text-[14px] font-[600] border transition-colors duration-200 ${
              job.status === "draft"
                ? "bg-yellow-50 border-yellow-200 text-yellow-700 cursor-default"
                : "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 disabled:opacity-50"
            }`}
          >
            {job.status === "draft" ? "← Draft" : "Set draft"}
          </button>

          {/* Publish */}
          <button
            type="submit"
            name="status"
            value="published"
            disabled={statusPending || job.status === "published"}
            className={`px-[20px] py-[10px] rounded-[8px] text-[14px] font-[600] border transition-colors duration-200 ${
              job.status === "published"
                ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 disabled:opacity-50"
            }`}
          >
            {job.status === "published" ? "← Published" : "Publish"}
          </button>

          {/* Close */}
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
