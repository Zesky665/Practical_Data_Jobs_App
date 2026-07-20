"use client";

import { useActionState, useState, useCallback } from "react";
import Link from "next/link";

  export type JobFormState = {
  error?: string;
  fieldErrors?: {
    title?: string;
    company?: string;
    description?: string;
  };
};

type Props = {
  action: (
    _prevState: JobFormState,
    formData: FormData,
  ) => Promise<JobFormState>;
  defaultTitle?: string;
  defaultCompany?: string;
  defaultDescription?: string;
  hiddenFields?: Record<string, string>;
  submitLabel: string;
  submitPendingLabel: string;
  cancelHref: string;
};

export function JobForm({
  action,
  defaultTitle = "",
  defaultCompany = "",
  defaultDescription = "",
  hiddenFields,
  submitLabel,
  submitPendingLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(
    action,
    {},
  );

  const [title, setTitle] = useState(defaultTitle);
  const [company, setCompany] = useState(defaultCompany);
  const [description, setDescription] = useState(defaultDescription);

  const titleRemaining = 200 - title.length;
  const descriptionRemaining = 50000 - description.length;

  const getTitleRing = useCallback(() => {
    if (state.fieldErrors?.title) return "ring-2 ring-red-200 border-red-300";
    if (titleRemaining < 0) return "ring-2 ring-red-200 border-red-300";
    if (titleRemaining <= 20 && title.length > 0)
      return "ring-2 ring-yellow-200 border-yellow-300";
    return "";
  }, [state.fieldErrors?.title, titleRemaining, title]);

  const getDescriptionRing = useCallback(() => {
    if (state.fieldErrors?.description)
      return "ring-2 ring-red-200 border-red-300";
    if (descriptionRemaining < 0)
      return "ring-2 ring-red-200 border-red-300";
    if (descriptionRemaining <= 200 && description.length > 0)
      return "ring-2 ring-yellow-200 border-yellow-300";
    return "";
  }, [state.fieldErrors?.description, descriptionRemaining, description]);

  return (
    <>
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
        {hiddenFields &&
          Object.entries(hiddenFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

        {/* Title */}
        <div className="space-y-[6px]">
          <div className="flex items-center justify-between">
            <label
              htmlFor="title"
              className="text-[14px] font-[600] text-brand-ink"
            >
              Job title
            </label>
            <span
              className={`text-[12px] font-[500] ${
                titleRemaining < 0
                  ? "text-red-500"
                  : titleRemaining <= 20
                    ? "text-yellow-600"
                    : "text-brand-slate-2"
              }`}
              aria-live="polite"
            >
              {titleRemaining} / 200
            </span>
          </div>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Data Engineer"
            className={`w-full px-[16px] py-[12px] rounded-[10px] border text-[15px] text-brand-ink placeholder:text-brand-slate-2 focus:outline-none focus:border-brand-blue-300 focus:ring-2 focus:ring-brand-blue-100 transition-all duration-200 ${getTitleRing()}`}
          />
          {state.fieldErrors?.title && (
            <p className="text-[12px] text-red-600 font-[500]" role="alert">
              {state.fieldErrors.title}
            </p>
          )}
        </div>

        {/* Company */}
        <div className="space-y-[6px]">
          <label
            htmlFor="company"
            className="text-[14px] font-[600] text-brand-ink"
          >
            Company name
          </label>
          <input
            id="company"
            name="company"
            type="text"
            required
            maxLength={200}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Practical Data Inc."
            className="w-full px-[16px] py-[12px] rounded-[10px] border border-brand-line text-[15px] text-brand-ink placeholder:text-brand-slate-2 focus:outline-none focus:border-brand-blue-300 focus:ring-2 focus:ring-brand-blue-100 transition-all duration-200"
          />
          {state.fieldErrors?.company && (
            <p className="text-[12px] text-red-600 font-[500]" role="alert">
              {state.fieldErrors.company}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-[6px]">
          <div className="flex items-center justify-between">
            <label
              htmlFor="description"
              className="text-[14px] font-[600] text-brand-ink"
            >
              Job description
            </label>
            <span
              className={`text-[12px] font-[500] ${
                descriptionRemaining < 0
                  ? "text-red-500"
                  : descriptionRemaining <= 200
                    ? "text-yellow-600"
                    : "text-brand-slate-2"
              }`}
              aria-live="polite"
            >
              {descriptionRemaining.toLocaleString()} / 50,000
            </span>
          </div>
          <textarea
            id="description"
            name="description"
            required
            rows={10}
            maxLength={50000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, requirements, and any other relevant details…"
            className={`w-full px-[16px] py-[12px] rounded-[10px] border text-[15px] text-brand-ink placeholder:text-brand-slate-2 focus:outline-none focus:border-brand-blue-300 focus:ring-2 focus:ring-brand-blue-100 transition-all duration-200 resize-y ${getDescriptionRing()}`}
          />
          {state.fieldErrors?.description && (
            <p className="text-[12px] text-red-600 font-[500]" role="alert">
              {state.fieldErrors.description}
            </p>
          )}
          <p className="text-[12px] text-brand-slate-2">
            The description will be analyzed for semantic matching with CVs.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-[12px] pt-[8px]">
          <button
            type="submit"
            disabled={pending}
            className="px-[28px] py-[12px] rounded-[10px] bg-brand-blue-600 text-brand-white text-[15px] font-[600] hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {pending ? submitPendingLabel : submitLabel}
          </button>
          <Link
            href={cancelHref}
            className="text-[14px] text-brand-blue-600 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
