"use client";

import { useState } from "react";
import { uploadCV } from "./actions";
import Link from "next/link";

export default function CVUploadPage() {
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await uploadCV({}, formData);

    // uploadCV either redirects on success or returns { error }
    if (result && "error" in result) {
      setError(result.error!);
      setPending(false);
    }
    // If it redirected we never get here
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px] flex items-start gap-[10px]">
          <span className="text-red-500 text-[18px] shrink-0 mt-[1px]">
            ⚠
          </span>
          <p className="text-[14px] text-red-700 leading-[1.5]">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="bg-brand-white rounded-[20px] border border-brand-line p-[40px] max-sm:p-[24px] space-y-[24px]"
      >
        <div className="space-y-[6px]">
          <label
            htmlFor="file"
            className="block text-[14px] font-[600] text-brand-ink"
          >
            Select your CV (PDF)
          </label>
          <input
            id="file"
            type="file"
            name="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileName(file ? file.name : "");
            }}
            disabled={pending}
            className="block w-full text-[14px] text-brand-slate file:mr-[16px] file:py-[10px] file:px-[20px] file:rounded-[8px] file:border-0 file:text-[14px] file:font-[600] file:bg-brand-blue-50 file:text-brand-blue-600 hover:file:bg-brand-blue-100 file:cursor-pointer file:transition-colors"
          />
          {fileName && (
            <p className="text-[13px] text-brand-blue-600 font-[500]">
              Selected: {fileName}
            </p>
          )}
        </div>

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
