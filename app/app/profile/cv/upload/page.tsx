"use client";

import { useActionState, useRef, useState } from "react";
import { uploadCV, type UploadCVState } from "./actions";
import Link from "next/link";

export default function CVUploadPage() {
  const [state, formAction, pending] = useActionState<UploadCVState, FormData>(
    uploadCV,
    {},
  );
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
  };

  return (
    <div className="space-y-[32px]">
      <div>
        <h1 className="text-[28px] font-[700] text-brand-ink mb-[4px]">
          Upload your CV
        </h1>
        <p className="text-[15px] text-brand-slate">
          Upload a PDF of your CV. We&apos;ll extract the text and use it to
          match you with relevant jobs.
        </p>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px] flex items-start gap-[10px]">
          <span className="text-red-500 text-[18px] shrink-0 mt-[1px]">
            ⚠
          </span>
          <p className="text-[14px] text-red-700 leading-[1.5]">
            {state.error}
          </p>
        </div>
      )}

      <form
        action={formAction}
        className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px] space-y-[24px]"
      >
        {/* Drop zone — labels the hidden file input */}
        <label
          className={`block border-2 border-dashed rounded-[14px] p-[48px] text-center cursor-pointer transition-colors duration-200 ${
            fileName
              ? "border-brand-blue-300 bg-brand-blue-50"
              : "border-brand-line bg-brand-muted hover:border-brand-blue-200 hover:bg-brand-blue-50/50"
          }`}
        >
          {fileName ? (
            <div className="flex flex-col items-center gap-[8px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-brand-blue-600"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="text-[15px] font-[600] text-brand-ink">
                {fileName}
              </span>
              <span className="text-[13px] text-brand-slate">
                PDF selected — click Upload to continue
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-[10px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-brand-slate-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[15px] font-[600] text-brand-ink">
                Click to browse or drop your PDF here
              </span>
              <span className="text-[13px] text-brand-slate">
                PDF files only, up to 10 MB
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={pending}
            className="sr-only"
          />
        </label>

        {/* Guidelines */}
        <div className="bg-brand-muted rounded-[12px] p-[20px] space-y-[8px]">
          <h3 className="text-[14px] font-[700] text-brand-ink">
            Tips for best results
          </h3>
          <ul className="text-[13px] text-brand-slate space-y-[4px] list-disc list-inside">
            <li>Use a text-based PDF (not a scanned image).</li>
            <li>Make sure your skills and experience are clearly described.</li>
            <li>
              The text you upload is private and only used for job matching.
            </li>
          </ul>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-[12px]">
          <button
            type="submit"
            disabled={pending || !fileName}
            className="px-[28px] py-[12px] rounded-[10px] bg-brand-blue-600 text-brand-white text-[15px] font-[600] hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {pending ? "Uploading…" : "Upload CV"}
          </button>
          <Link
            href="/app/profile"
            className="text-[14px] text-brand-blue-600 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div>
        <Link
          href="/app/profile"
          className="text-[14px] text-brand-blue-600 hover:underline"
        >
          ← Back to profile
        </Link>
      </div>
    </div>
  );
}
