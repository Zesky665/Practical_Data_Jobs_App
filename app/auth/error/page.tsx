import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_code?: string; error_description?: string }>;
}) {
  const { error, error_description } = await searchParams;
  const message = error_description ?? error ?? "Something went wrong.";

  return (
    <div className="min-h-screen bg-brand-muted flex flex-col items-center justify-center px-[24px]">
      <div className="w-full max-w-[440px] bg-brand-white rounded-[20px] border border-brand-line shadow-sm p-[40px] max-sm:p-[24px] text-center">
        <h1 className="text-[24px] font-[700] text-brand-ink mb-[8px]">Authentication problem</h1>
        <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-[12px] py-[10px] mb-[20px]">
          {message}
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-brand-white rounded-[10px] px-[20px] py-[12px] font-[600] text-[15px] transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
