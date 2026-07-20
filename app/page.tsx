import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Public landing page. Ported from Practical_Data_Jobs_Site
 * (src/pages/index.astro) — a Meno/Astro marketing page. Converted to a Next.js
 * Server Component so the CTA can adapt to auth status server-side (no client
 * flash).
 *
 * Structural difference vs the source: the Astro page embeds the <header> with
 * a "Sign in" button. Here the header CTA + the hero/footer CTAs swap based on
 * whether the visitor is signed in:
 *   - signed out → "Sign in" / "Create your profile" / "Browse all jobs"
 *   - signed in  → "Go to app" (same destination, /app)
 *
 * The rest of the page (features grid, categories, how-it-works, CTA band,
 * footer) is static content — identical regardless of auth status.
 *
 * SVGs are inlined directly in JSX (no Meno <Embed> wrapper needed).
 */

// --- icons (inlined verbatim from the Astro source; stroke=currentColor) ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
const PinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
);
const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" /><path d="M19 13l1 2.5L22.5 17 20 18l-1 2.5L18 18l-2.5-1 2.5-1z" /></svg>
);
const TrendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 14 3-3 3 3 5-6" /></svg>
);
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a2 2 0 0 0 3.4 0" /></svg>
);
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
);
const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18 22 12 16 6" /><path d="M8 6 2 12 8 18" /></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);
const BriefcaseIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
);

type Feature = { title: string; body: string; icon: React.ReactNode; tint: "blue" | "cyan" };
const features: Feature[] = [
  { title: "AI matching engine", body: "We read your skills, stack, and seniority signals, then rank roles by genuine fit — not keyword stuffing. No more scrolling past jobs you'd never take.", icon: <SparkleIcon />, tint: "blue" },
  { title: "ML market insights", body: "Live salary bands, demand trends, and emerging skill premiums for every data discipline, so you negotiate from a position of facts.", icon: <TrendIcon />, tint: "cyan" },
  { title: "Smart alerts", body: "Tell us the kind of role you're waiting for. The moment a high-fit job drops, you hear about it — before the rush of applications lands.", icon: <BellIcon />, tint: "blue" },
  { title: "Verified employers", body: "Every listing is vetted for real budgets and real teams. We filter out ghost jobs and inflated postings so your applications count.", icon: <ShieldIcon />, tint: "cyan" },
  { title: "Stack-aware filters", body: "Filter by the tools that actually matter — Python, SQL, Spark, dbt, PyTorch, Kubernetes — and find teams that share your way of working.", icon: <CodeIcon />, tint: "blue" },
  { title: "Private by default", body: "Your profile is invisible to employers until you choose to apply. Explore the market quietly, on your own terms, with no pressure.", icon: <UserIcon />, tint: "cyan" },
];

type Category = { name: string; count: string; tint: "blue" | "cyan"; variant: string };
const categories: Category[] = [
  { name: "Data Engineering", count: "3,120 open roles", tint: "blue", variant: "bg-brand-blue-600" },
  { name: "Data Science", count: "2,640 open roles", tint: "cyan", variant: "bg-brand-cyan-500" },
  { name: "Machine Learning", count: "1,980 open roles", tint: "blue", variant: "bg-brand-blue-700" },
  { name: "Analytics & BI", count: "2,210 open roles", tint: "cyan", variant: "bg-brand-cyan-600" },
  { name: "MLOps & Platform", count: "1,470 open roles", tint: "blue", variant: "bg-brand-blue-600" },
  { name: "Data Leadership", count: "980 open roles", tint: "cyan", variant: "bg-brand-cyan-500" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_code?: string; error_description?: string; code?: string; type?: string }>;
}) {
  // Handle auth error callbacks from Supabase (e.g., expired reset-password
  // links, OAuth failures). Supabase redirects to the Site URL with ?error=…
  // when a flow fails, so we surface it here rather than silently ignoring it.
  const sp = await searchParams;
  const authError = sp.error_description ?? sp.error;

  // Fallback for password reset: if Supabase redirects here with a PKCE code
  // (the redirectTo URL wasn't honored — see forgot-password/actions.ts).
  // Only redirect if the path includes a recovery indication.
  if (sp.code && sp.type !== "signup") {
    return redirect("/auth/update-password");
  }

  // Handle signup confirmation: if the callback route wasn't deployed yet,
  // Supabase may redirect here with a code from email confirmation.
  if (sp.code && sp.type === "signup") {
    return redirect("/app");
  }

  // Server-side auth check. Use getUser() (PLAN.md §0 convention #5) —
  // getSession() trusts the cookie without re-validation. Fall back to logged-out
  // when env vars aren't configured yet (fresh clone before `supabase start`).
  let signedIn = false;
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = !!data.user;
  }

  const headerCta = signedIn ? (
    <a href="/app" className="px-[18px] py-[10px] rounded-[10px] bg-brand-blue-600 text-brand-white text-[15px] font-[600] no-underline hover:bg-brand-blue-700 transition-colors duration-200">Go to app</a>
  ) : (
    <a href="/auth/login" className="px-[18px] py-[10px] rounded-[10px] bg-brand-blue-600 text-brand-white text-[15px] font-[600] no-underline hover:bg-brand-blue-700 transition-colors duration-200">Sign in</a>
  );

  // The two big CTA buttons in the gradient band. Both go to the right place
  // depending on auth: signed-in users go straight to the app; signed-out users
  // go to signup / login.
  const ctaPrimaryHref = signedIn ? "/app" : "/auth/sign-up";
  const ctaPrimaryLabel = signedIn ? "Open your app" : "Create your profile";
  const ctaSecondaryHref = signedIn ? "/app" : "/auth/login";
  const ctaSecondaryLabel = signedIn ? "Go to app" : "Browse all jobs";

  return (
    <div className="bg-brand-white text-brand-ink font-sans">
      {/* --- header --- */}
      <div className="sticky top-0 z-50 bg-brand-white border-b border-brand-line">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[16px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-[10px] no-underline text-brand-ink">
            <span className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-brand-white font-[800] text-[18px]" style={{ background: "linear-gradient(135deg,var(--brand-blue-600) 0%,var(--brand-cyan-500) 100%)" }}>P</span>
            <span className="font-[700] text-[18px] max-sm:hidden">Practical Data Jobs</span>
          </Link>
          <div className="flex items-center gap-[28px]">
            <a href="#features" className="text-[15px] text-brand-ink-soft no-underline hover:text-[#2563eb] transition-colors duration-200 max-sm:hidden">Features</a>
            <a href="#categories" className="text-[15px] text-brand-ink-soft no-underline hover:text-[#2563eb] transition-colors duration-200 max-sm:hidden">Categories</a>
            <a href="#how" className="text-[15px] text-brand-ink-soft no-underline hover:text-[#2563eb] transition-colors duration-200 max-sm:hidden">How it works</a>
            {headerCta}
          </div>
        </div>
      </div>

      {/* Auth error banner — surfaced when Supabase redirects here with ?error=… */}
      {authError && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-[72rem] mx-auto px-[24px] py-[16px] flex items-start gap-[12px]">
            <span className="text-red-500 text-[18px] shrink-0 mt-[1px]">⚠</span>
            <div className="flex flex-col gap-[8px] flex-1">
              <p className="text-[15px] text-red-800 font-[600]">
                Authentication problem
              </p>
              <p className="text-[14px] text-red-700 leading-[1.5]">
                {authError === "Email link is invalid or has expired"
                  ? "Your reset link has expired or is invalid. Please request a new one below."
                  : authError}
              </p>
              <a
                href="/auth/forgot-password"
                className="text-[14px] text-brand-blue-600 font-[600] hover:underline self-start"
              >
                Request a new reset link →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* --- hero --- */}
      <section className="bg-gradient-to-b from-brand-white to-brand-blue-50">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[96px] flex flex-col items-center text-center max-sm:py-[64px]">
          <span className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-[999px] bg-brand-cyan-50 border border-brand-cyan-100 text-brand-cyan-600 text-[13px] font-[600] mb-[24px]">
            <span className="w-[7px] h-[7px] rounded-[999px] bg-brand-cyan-500" />
            AI-matched roles, updated hourly
          </span>
          <h1 className="text-[56px] leading-[1.05] tracking-[-0.02em] font-[800] max-w-[20ch] text-center max-sm:text-[38px]">
            Where talent meets{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,var(--brand-blue-600) 0%,var(--brand-cyan-500) 100%)" }}>
              data
            </span>
          </h1>
          <p className="text-[19px] leading-[1.6] text-brand-slate mt-[20px] max-w-[58ch] max-sm:text-[17px]">
            Practical Data Jobs is the AI and ML-powered jobs board built for data professionals. Tell us your skills — we surface the roles you&apos;re actually suited for, not the ones that shout the loudest.
          </p>
          <div className="bg-brand-white rounded-[14px] shadow-[0_10px_40px_rgba(37,99,235,0.12)] border border-brand-line flex items-stretch p-[6px] mt-[36px] w-full max-w-[640px] max-sm:flex-col max-sm:gap-[6px]">
            <div className="flex items-center gap-[10px] flex-1 px-[14px] py-[12px] text-brand-slate-2">
              <SearchIcon />
              <span className="text-[15px]">Job title, skill, or company</span>
            </div>
            <div className="w-[1px] bg-brand-line max-sm:hidden" />
            <div className="flex items-center gap-[10px] flex-1 px-[14px] py-[12px] text-brand-slate-2 max-sm:border-t max-sm:border-brand-line">
              <PinIcon />
              <span className="text-[15px]">Remote, anywhere</span>
            </div>
            <a href={signedIn ? "/app" : "/auth/login"} className="bg-brand-blue-600 hover:bg-brand-blue-700 text-brand-white rounded-[10px] px-[24px] py-[12px] font-[600] text-[15px] no-underline transition-colors duration-200 flex items-center max-sm:w-full max-sm:justify-center">
              Search jobs
            </a>
          </div>
          <div className="flex items-center gap-[28px] mt-[28px] max-sm:gap-[16px] max-sm:flex-wrap max-sm:justify-center">
            <span className="text-[14px] text-brand-slate">Popular:</span>
            {["Data Engineer", "ML Engineer", "Data Scientist", "Analytics Lead"].map((label) => (
              <a key={label} href={signedIn ? "/app" : "/auth/login"} className="text-[14px] text-brand-blue-600 no-underline font-[500] hover:underline">{label}</a>
            ))}
          </div>
        </div>
      </section>

      {/* --- stats --- */}
      <section className="bg-brand-white border-b border-brand-line">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[48px] grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-[32px]">
          {[
            { n: "12,400+", l: "Open data roles", c: "text-brand-blue-600" },
            { n: "850+", l: "Hiring companies", c: "text-brand-cyan-500" },
            { n: "96%", l: "Match precision", c: "text-brand-blue-600" },
            { n: "3.2x", l: "Faster interviews", c: "text-brand-cyan-500" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center text-center">
              <span className={`text-[40px] font-[800] leading-[1] ${s.c}`}>{s.n}</span>
              <span className="text-[15px] text-brand-slate mt-[8px]">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- features --- */}
      <section id="features" className="bg-brand-muted">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[96px] max-sm:py-[64px]">
          <div className="flex flex-col items-center text-center mb-[56px]">
            <span className="text-[13px] font-[700] tracking-[0.1em] text-brand-cyan-600 uppercase mb-[12px]">Why Practical Data Jobs</span>
            <h2 className="text-[40px] leading-[1.1] tracking-[-0.02em] font-[700] max-w-[20ch] max-sm:text-[30px]">Hiring intelligence, built for data careers</h2>
            <p className="text-[18px] leading-[1.6] text-brand-slate mt-[16px] max-w-[60ch]">Every feature is tuned for the realities of data work — stack-aware matching, salary signal, and less noise.</p>
          </div>
          <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-[24px]">
            {features.map((f) => (
              <div key={f.title} className="bg-brand-white rounded-[16px] border border-brand-line p-[28px] flex flex-col gap-[14px]">
                <span className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center ${f.tint === "blue" ? "bg-brand-blue-50 text-brand-blue-600" : "bg-brand-cyan-50 text-brand-cyan-600"}`}>
                  {f.icon}
                </span>
                <h3 className="text-[20px] font-[700] text-brand-ink">{f.title}</h3>
                <p className="text-[15px] leading-[1.6] text-brand-slate">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- categories --- */}
      <section id="categories" className="bg-brand-white">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[96px] max-sm:py-[64px]">
          <div className="flex flex-col items-center text-center mb-[56px]">
            <span className="text-[13px] font-[700] tracking-[0.1em] text-brand-cyan-600 uppercase mb-[12px]">Explore by discipline</span>
            <h2 className="text-[40px] leading-[1.1] tracking-[-0.02em] font-[700] max-w-[20ch] max-sm:text-[30px]">Every data role, one focused board</h2>
            <p className="text-[18px] leading-[1.6] text-brand-slate mt-[16px] max-w-[60ch]">From pipelines to production models — find the niche where your work does its best.</p>
          </div>
          <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-[20px]">
            {categories.map((c) => (
              <a key={c.name} href={signedIn ? "/app" : "/auth/login"} className={`rounded-[16px] p-[24px] flex items-center gap-[16px] no-underline transition-colors duration-200 ${c.tint === "blue" ? "bg-brand-blue-50 hover:bg-brand-blue-100" : "bg-brand-cyan-50 hover:bg-brand-cyan-100"}`}>
                <span className={`w-[44px] h-[44px] rounded-[12px] ${c.variant} text-brand-white flex items-center justify-center shrink-0`}>
                  <BriefcaseIcon />
                </span>
                <span className="flex flex-col">
                  <span className="text-[17px] font-[700] text-brand-ink">{c.name}</span>
                  <span className="text-[14px] text-brand-slate">{c.count}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* --- how it works --- */}
      <section id="how" className="bg-brand-muted">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[96px] max-sm:py-[64px]">
          <div className="flex flex-col items-center text-center mb-[56px]">
            <span className="text-[13px] font-[700] tracking-[0.1em] text-brand-cyan-600 uppercase mb-[12px]">How it works</span>
            <h2 className="text-[40px] leading-[1.1] tracking-[-0.02em] font-[700] max-w-[20ch] max-sm:text-[30px]">From profile to offer in three steps</h2>
          </div>
          <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-[24px]">
            {[
              { n: "1", c: "bg-brand-blue-600", h: "Build your signal profile", b: "Add your stack, projects, and the kind of work you want. Our model turns it into a fit signal employers never see until you apply." },
              { n: "2", c: "bg-brand-cyan-500", h: "Get matched, not spammed", b: "Each role is scored for genuine fit. You see a ranked shortlist with salary band, team, and why it suits you — and nothing else." },
              { n: "3", c: "bg-brand-blue-700", h: "Apply on your terms", b: "One click sends a tailored application. Track every conversation in one place and stay invisible to employers until you're ready." },
            ].map((s) => (
              <div key={s.n} className="flex flex-col gap-[16px]">
                <span className={`w-[44px] h-[44px] rounded-[12px] ${s.c} text-brand-white flex items-center justify-center text-[18px] font-[800]`}>{s.n}</span>
                <h3 className="text-[22px] font-[700] text-brand-ink">{s.h}</h3>
                <p className="text-[15px] leading-[1.6] text-brand-slate">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA band --- */}
      <section id="cta" className="bg-brand-white">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[96px] max-sm:py-[64px]">
          <div className="rounded-[28px] px-[64px] py-[72px] flex flex-col items-center text-center max-sm:px-[28px] max-sm:py-[48px]" style={{ background: "linear-gradient(135deg,var(--brand-blue-700) 0%,var(--brand-blue-600) 45%,var(--brand-cyan-500) 100%)" }}>
            <h2 className="text-[44px] leading-[1.1] tracking-[-0.02em] font-[800] text-brand-white max-w-[18ch] max-sm:text-[30px]">Find the data role you were built for</h2>
            <p className="text-[19px] leading-[1.6] text-brand-blue-50 mt-[16px] max-w-[52ch] max-sm:text-[16px]">Join thousands of data professionals letting AI cut through the noise. Your first matched shortlist is ready in minutes.</p>
            <div className="flex items-center gap-[16px] mt-[36px] max-sm:flex-col max-sm:w-full">
              <a href={ctaPrimaryHref} className="bg-brand-white text-brand-blue-700 rounded-[12px] px-[32px] py-[14px] text-[16px] font-[700] no-underline hover:bg-brand-blue-50 transition-colors duration-200 max-sm:w-full">{ctaPrimaryLabel}</a>
              <a href={ctaSecondaryHref} className="text-brand-white rounded-[12px] px-[32px] py-[14px] text-[16px] font-[700] no-underline border border-white/40 hover:bg-white/10 transition-colors duration-200 max-sm:w-full">{ctaSecondaryLabel}</a>
            </div>
          </div>
        </div>
      </section>

      {/* --- footer --- */}
      <div className="bg-brand-ink text-brand-slate-2">
        <div className="max-w-[72rem] mx-auto px-[24px] py-[64px] grid grid-cols-5 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-[40px]">
          <div className="flex flex-col gap-[12px] max-lg:col-span-2 max-sm:col-span-1">
            <div className="flex items-center gap-[10px]">
              <span className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-brand-white font-[800] text-[16px]" style={{ background: "linear-gradient(135deg,var(--brand-blue-600) 0%,var(--brand-cyan-500) 100%)" }}>P</span>
              <span className="font-[700] text-[17px] text-brand-white">Practical Data Jobs</span>
            </div>
            <p className="text-[14px] leading-[1.6] max-w-[34ch]">The AI and ML-powered jobs board for data professionals. Less noise, better matches.</p>
          </div>
          {[
            { h: "For candidates", items: ["Browse jobs", "Create profile", "Salary insights"] },
            { h: "For employers", items: ["Post a role", "Pricing", "Talent search"] },
            { h: "Company", items: ["About", "Blog", "Contact"] },
            { h: "Legal", items: ["Privacy", "Terms", "Cookies"] },
          ].map((col) => (
            <div key={col.h} className="flex flex-col gap-[12px]">
              <span className="text-[13px] font-[700] uppercase tracking-[0.08em] text-brand-white">{col.h}</span>
              {col.items.map((item) => (
                <a key={item} href="#" className="text-[14px] text-brand-slate-2 no-underline hover:text-brand-white transition-colors duration-200">{item}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.08]">
          <div className="max-w-[72rem] mx-auto px-[24px] py-[24px] flex items-center justify-between max-sm:flex-col max-sm:gap-[12px]">
            <span className="text-[13px] text-brand-slate-2">© 2026 Practical Data Jobs. All rights reserved.</span>
            <span className="text-[13px] text-brand-slate-2">Built for data professionals, by data professionals.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
