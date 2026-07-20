"use client";

import { useActionState } from "react";
import { createJob, type CreateJobState } from "./actions";
import Link from "next/link";

export default function NewJobPage() {
  const [state, formAction, pending] = useActionState<CreateJobState, FormData>(
    createJob,
    {},
  );

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

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px] flex items-start gap-[10px]">
          <span className="text-red-500 text-[18px] shrink-0 mt-[1px]">⚠</span>
          <p className="text-[14px] text-red-700 leading-[1.5]">
            {state.error}
          </p>
        </div>
      )}

      <form
        action={formAction}
        className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px] space-y-[24px]"
      >
        {/* Title */}
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
            placeholder="e.g. Senior Data Engineer"
            className="w-full px-[16px] py-[12px] rounded-[10px] border border-brand-line text-[15px] text-brand-ink placeholder:text-brand-slate-2 focus:outline-none focus:border-brand-blue-300 focus:ring-2 focus:ring-brand-blue-100 transition-all duration-200"
          />
          <p className="text-[12px] text-brand-slate-2">Maximum 200 characters</p>
        </div>

        {/* Description */}
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
            placeholder="Describe the role, responsibilities, requirements, and any other relevant details…"
            className="w-full px-[16px] py-[12px] rounded-[10px] border border-brand-line text-[15px] text-brand-ink placeholder:text-brand-slate-2 focus:outline-none focus:border-brand-blue-300 focus:ring-2 focus:ring-brand-blue-100 transition-all duration-200 resize-y"
          />
          <p className="text-[12px] text-brand-slate-2">
            Maximum 50,000 characters. The description will be analyzed for
            semantic matching with CVs.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-[12px] pt-[8px]">
          <button
            type="submit"
            disabled={pending}
            className="px-[28px] py-[12px] rounded-[10px] bg-brand-blue-600 text-brand-white text-[15px] font-[600] hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {pending ? "Creating…" : "Create job (draft)"}
          </button>
          <Link
            href="/app"
            className="text-[14px] text-brand-blue-600 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </form>

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
