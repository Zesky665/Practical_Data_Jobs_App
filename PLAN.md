# Practical_Data_Jobs_App — Development Plan

Scope of this document: **authentication** (complete) + **CV upload, jobs, and
semantic search** (current). All other features (resumes with richer metadata,
employer self-serve onboarding, admin moderation, Discord OAuth) are deferred.

This plan follows the vibe-coding-for-larger-projects discipline used on the
sister project `PDC_Job_Board`: a context file the AI reads every session,
small atomic changes, a real verification gate, machine-checkable invariants,
and one source of truth per concept.

---

## 0. Project context (read this every session)

**What this is.** A standalone job board for the Practical Data Community
(PDC), a 3000+ member Discord of data scientists/engineers. This repo
(`Practical_Data_Jobs_App`) is a fresh start; an earlier iteration lives at
`../PDC_Job_Board` and is referenced for hard-won lessons, not for code reuse.

**Stack decision (locked).**
- Next.js 16 (App Router, Turbopack) — the entire app.
- Supabase (Postgres + Auth) — local stack during dev, Supabase Cloud on deploy.
- TypeScript everywhere; strict mode.
- Hosted (later): Vercel + Supabase Cloud. Not deployed yet.

**Why this stack.** Same rationale as PDC_Job_Board: consolidates DB + auth +
(matching later) into one platform so there's no second service to operate.
Supabase Auth gives us email/password out of the box; Discord OAuth is also
available (deferred — see §8 Backlog).

**Conventions (these have bitten us before — keep them).**
1. **The verification gate is `npm run check`** (lint + `next build`), not
   `tsc`/`next dev`. A non-zero exit is a blocker; don't claim a task is done
   until `npm run check` is green. `next build` has caught prerender failures
   that `tsc` + `next dev` + manual testing all passed.
2. **`"use server"` files export only async functions.** Shared types/helpers
   live in plain modules, never in an actions file.
3. **Never discard a Supabase `error`.** A `<form action={fn}>` has no return
   channel — an unhandled error makes a failure look like success. Void actions
   must use `failTo(path, message)` and redirect with `?error=…`; actions driven
   by `useActionState` return `{ error }`.
4. **Server-side session reads go through `@supabase/ssr` helpers** in
   `lib/supabase/server.ts`, never a hand-rolled cookie read. Client-side goes
   through `lib/supabase/client.ts`. Middleware lives in `middleware.ts` and
   refreshes the session; it must NOT do business logic or DB writes.
5. **Server-side auth checks use `getUser()`, not `getSession()`.** `getSession()`
   reads the JWT from the cookie without verifying it — fine for client UX, unsafe
   for server-side gating. `getUser()` re-validates with the Supabase Auth server
   every call. Use `getUser()` anywhere a route or Server Action decides
   authorized-vs-unauthorized; `getSession()` is reserved for non-security client hints.
6. **Tests hit a real local Supabase.** Run `supabase start` before `npm test`.
   Voyage/external calls are stubbed; the DB is real so RLS/triggers/grants
   actually exercise.
7. **One commit = one intent.** Each commit compiles, passes the gate, and does
   exactly one thing. Commit after every green gate; don't accumulate a
   multi-feature pile.
8. **Small, scoped prompts.** Each AI session tackles one milestone phase at a
   time (e.g. "Phase A1: email/password signup"). Reject scope creep mid-task.

**Repo layout (target — build it as we go).**
```
Practical_Data_Jobs_App/
  README.md
  PLAN.md               # this file — keep current
  .env.example          # all required env vars (no secrets)
  .gitignore
  package.json
  next.config.ts
  tsconfig.json
  middleware.ts         # session refresh + public/private route gate
  app/
    layout.tsx          # root layout — <html>/<body>/globals only; NO session reads
    page.tsx            # public landing; CTA adapts to auth status (Sign in vs Go to app)
    globals.css
    auth/               # public auth flows — NOT under /app (must be reachable logged-out)
      login/page.tsx
      sign-up/page.tsx
      callback/route.ts # OAuth callback
      error/page.tsx
      forgot-password/page.tsx
      update-password/page.tsx
    app/                # gated subtree — middleware protects this whole branch
      layout.tsx        # shared app chrome (header w/ logout); reads getUser() once for children
      page.tsx          # app home / dashboard placeholder
      profile/page.tsx  # profile placeholder (was /profile)
  components/
    site-header.tsx     # nav (inside <Suspense>)
    auth-button.tsx     # login/logout
    login-form.tsx
    sign-up-form.tsx
    page-error.tsx      # renders ?error=... from redirect
  lib/
    action-errors.ts    # failTo(), FormState helpers
    supabase/
      server.ts         # createClient() for Server Components / Route Handlers
      client.ts         # createClient() for Client Components
      middleware.ts     # createClient() for middleware (cookies-only)
  supabase/
    config.toml
    migrations/
      0001_init_profiles.sql
    seed.sql
  tests/
    helpers.ts          # supabase admin client + per-test user helpers
    auth.test.ts        # signup, login, logout, session validity
```

---

## 1. Scope of THIS plan

**In scope:** user identity and access only.
- Email/password sign-up, sign-in, sign-out.
- Password reset (forgot-password → email link → update-password).
- Session management (SSR-safe, refreshed in middleware).
- Middleware route gate (public vs. auth-required).
- A minimal `profiles` table (id + created_at) so every signed-up user has a
  row and the `handle_new_user` trigger pattern is in place. This is the
  extension point for future attributes (display name, role, etc.).
- Test harness + a CI workflow.

**Out of scope (do not build yet):** roles, jobs, resumes, matching, employer
self-serve posting, admin moderation queue, link checking, embeddings, Discord
OAuth (deferred — see §8 Backlog), any UI beyond what auth strictly needs (a
home page placeholder, a profile page placeholder, login/signup forms).

**Definition of done for this plan:**
- A new visitor can sign up with email/password, log in, log out.
- A logged-out user hitting `/profile` is redirected to `/auth/login`.
- A logged-in user can reset their password via email.
- `profiles` exists and every confirmed sign-up produces a row.
- Every new sign-up receives a confirmation/welcome email via Lettermint
  (sender domain `practicaldatajobs.com`).
- `npm run check` is green and CI runs it on every push/PR.

---

## 2. Milestones

Three milestones. Each one ends green (`npm run check` + `npm test` passing)
and is one or more commits.

### M1 — Scaffolding + profiles table + landing page port
### M2 — Email/password auth
### M2.D — Sign-up confirmation email via Lettermint (rolls into M2)
### M3 — Password reset + CI

Phases inside each milestone are sized so one phase ≈ one commit. Don't start
the next phase until the previous one is green and committed.

## 2a. Build status

| Phase | Status | Notes |
|-------|--------|-------|
| **Auth (M1–M3)** | | |
| M1.A Skeleton | ✅ Done | Next 16, TS strict, Tailwind 3, Supabase SSR |
| M1.B profiles table | ✅ Done | Minimal stub (id + created_at) + handle_new_user trigger |
| M1.C Supabase clients | ✅ Done | server/client/proxy (proxy.ts, Next 16 naming) |
| M1.D Landing page port | ✅ Done | Ported from ../Practical_Data_Jobs_Site; adaptive CTA |
| M2.A Sign-up | ✅ Done | Email/password, email confirmation off (dev) |
| M2.B Sign-in + sign-out | ✅ Done | useActionState forms, auth-button header widget |
| M2.C Route gate + /app | ✅ Done | proxy.ts gates /app/*, /app placeholder page |
| M2.D Sign-up confirmation email (Lettermint) | ✅ Done | practicaldatajobs.com domain; token in `.env.local` as `LETTERMINT_API_TOKEN` |
| M3.A Password reset | ✅ Done | |
| M3.B Test harness + CI | ✅ Done  | |
| **CV + Jobs + Search (M4–M7)** | | |
| M4 Profiles extension | ✅ Done | can_post_jobs, display_name, bio, profile page |
| M5 CV upload + embedding | ✅ Done | PDF upload, text extraction, Voyage embed, pgvector |
| M6 Job postings + embedding | ✅ Done | CRUD for can_post_jobs users, Voyage embed |
| M7 Semantic search | ✅ Done | Bidirectional: jobs→CVs and CVs→jobs via pgvector |

---

## 3. M1 — Scaffolding + profiles table

Goal: a runnable Next.js app against local Supabase, a minimal typed `profiles`
table, and a passing (minimal) test setup. No auth UI yet.

### 3.1 Phase A — Project skeleton
- [x] `package.json` with Next 16, React 19, TypeScript strict, Supabase SSR
      (`@supabase/supabase-js`, `@supabase/ssr`), Vitest, Tailwind (optional).
- [x] `next.config.ts`, `tsconfig.json` (strict, `@/*` → `./*`).
- [x] `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (used
      only in tests + trusted server code later). Real `.env.local` is gitignored.
- [x] `supabase/config.toml` (default local stack is fine to start).
- [x] `app/layout.tsx`, `app/page.tsx` (placeholder home), `app/globals.css`.
- [x] **Verify:** `npm install && npm run dev` serves `http://localhost:3000`;
      `npm run check` is green.

### 3.2 Phase B — `profiles` table (minimal)
- [x] Migration `0001_init_profiles.sql`:
      - `profiles(id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now())`.
      - Row comment: "Stub. Future attributes (display name, role, etc.) land
        here as later migrations."
- [x] Trigger: on `auth.users` insert, create a matching `profiles` row. Use the
      standard Supabase `handle_new_user` pattern. This is the extension point
      for adding attributes in a future milestone.
- [x] RLS on `profiles`: user reads own row; user updates own row (when we add
      user-editable columns later, the policy will narrow further). Enable RLS
      now so it's the default from day one — never leave a table RLS-off.
- [x] `tests/auth.test.ts` first test: a freshly signed-up user has a
      `profiles` row.
- [x] **Verify:** `supabase db reset` is clean; `npm test` passes; `npm run check` green.

### 3.3 Phase C — Supabase client wiring
- [x] `lib/supabase/server.ts` — `createClient()` returning a Server-Component
      / Route-Handler client (reads cookies, writes refreshed session). Exposes
      a `getUser()` wrapper helpers can call.
- [x] `lib/supabase/client.ts` — `createClient()` for Client Components.
- [x] `lib/supabase/middleware.ts` — `createClient()` for middleware
      (cookies-only, no `getUser` call here — that goes in
      `lib/supabase/server.ts`, per convention #5).
      _(Actual: `lib/supabase/proxy.ts` + `proxy.ts` — Next 16 renamed
      middleware.ts → proxy.ts; same role.)_
- [x] **Verify:** no behavior change yet; just type-checks and builds.

**M1 exit gate:** app boots, `profiles` exists, one passing test. Commit. No
auth flows yet.

---

## 4. M2 — Email/password auth

Goal: the core auth loop works end-to-end with email/password.

### 4.1 Phase A — Sign-up
- [x] `app/auth/sign-up/page.tsx` + `app/auth/sign-up/sign-up-form.tsx` (Client
      Component using `useActionState`).
      _(Actual: form lives in `sign-up-form.tsx` under `app/auth/sign-up/`.)_
- [x] Server Action `signUp`: calls
      `supabase.auth.signUp({ email, password })`, checks `error`, returns
      `{ error }` on failure.
- [x] Server-side validation: email shape, password ≥ 12 chars
      (enforced in the action; the form also validates for UX).
- [x] Email confirmation flow: Supabase's confirmation redirect →
      `/auth/callback` → `/profile`.
      _(Actual: confirmation redirects to /app; no /profile route exists yet.)_
- [x] **Verify:** sign up with a fresh email; confirm; land on `/profile` with
      a `profiles` row created by the trigger. `npm run check` green.

### 4.2 Phase B — Sign-in + sign-out
- [x] `app/auth/login/page.tsx` + `app/auth/login/login-form.tsx`.
      _(Actual: form lives in `login-form.tsx` under `app/auth/login/`.)_
- [x] Server Action `signIn` → `supabase.auth.signInWithPassword(...)`.
- [x] Sign-out: client-side `supabase.auth.signOut()` then
      `router.push('/auth/login')`. Wrap in try/catch; on failure, surface to
      the user (don't swallow).
- [x] `components/auth-button.tsx` in the header: shows Login when logged out,
      Logout when logged in.
- [x] **Verify:** sign-up → sign-out → sign-in round trip works; session
      persists across reload; `npm run check` green.

### 4.3 Phase C — Route gate (middleware)
- [x] `middleware.ts`:
      - Refreshes the session via `@supabase/ssr` `updateSession`.
      - Public routes: `/`, `/auth/*`. Everything else requires a session.
      - On unauthorized → redirect to `/auth/login?next=<original>`.
      _(Actual: Next 16 renamed this to `proxy.ts` + `lib/supabase/proxy.ts`.
      Gate model uses allowlist: only `/app/*` is gated; everything else is
      public by default.)_
- [x] `app/profile/page.tsx` (placeholder; reads session via
      `lib/supabase/server.ts` `getUser()` — **not** `getSession()`, per
      convention #5 — greets the user by email).
      _(Actual: app home page is `app/app/page.tsx`; app chrome + user email
      are in `app/app/layout.tsx`.)_
- [x] **Verify:** logged-out `/profile` redirects to login; logged-in loads.
      **Read convention #1 about `<Suspense>` in layout children before touching
      the header — awaiting session data directly in a layout child crashes the
      route in Next 16 + Turbopack.** `npm run check` green.

**M2 exit gate:** full email/password auth loop. Commit.

---

## 4.4 Phase D — Sign-up confirmation email via Lettermint

Goal: the moment a user successfully signs up, they receive a branded
confirmation/welcome email from `practicaldatajobs.com`. We use Lettermint as
the transactional mailer (Supabase Auth's built-in confirmation email stays
OFF — see note below — so we control copy, branding, and sender domain
ourselves).

**Note on the "email confirmation off (dev)" status (§2a, M2.A):** that line
refers to Supabase Auth's *own* email-verification flow. It stays off. The
Lettermint email here is a one-way *notification* ("you signed up, here's
what's next"), not a token-verified confirmation link. If we later want a real
verified-link flow, that becomes a separate task (wire Supabase's confirmation
redirect to a Lettermint-sent magic link) — out of scope here.

**Secrets handling (per §0 conventions — secrets never in committed files):**
- `.env.local` (gitignored): `LETTERMINT_API_TOKEN=lm_…` — the real token.
- `.env.example` (committed): documents the var name + a placeholder; never
  the live token. PLAN.md references the var *name*, never the value.

- [x] `lib/email/lettermint.ts` — thin server-only wrapper around the Lettermint
      HTTP API. Reads `LETTERMINT_API_TOKEN` from `process.env` (server-side
      only; never prefixed `NEXT_PUBLIC_`). Exposes
      `sendConfirmationEmail({ to, name? })`. Hard-fails loudly on a non-2xx
      Lettermint response (per convention #3: never swallow an error — a
      silent email failure would make a broken signup look successful).
      _(Actual: wired as Supabase Auth SMTP provider instead of a custom HTTP
      wrapper — Lettermint is configured as the SMTP relay in Supabase, so
      confirmation emails flow through Supabase's built-in mechanism. The
      `scripts/_test-lettermint-smtp.py` script tests the SMTP path directly.)_
- [x] Sender: `practicaldatajobs.com` domain (must be configured/verified on
      the Lettermint side). From-address something like
      `welcome@practicaldatajobs.com` — confirm the exact address when wiring.
- [x] Wire into the `signUp` Server Action (M2.A): after a successful
      `supabase.auth.signUp` (no error, user row created), call
      `sendConfirmationEmail({ to: email })`. Decide and document failure
      mode: recommendation is to *not* block signup on email failure (the
      user is created), but to log loudly and surface a soft warning. Rationale:
      email delivery is flakier than DB writes; we don't want a transient
      Lettermint outage to corrupt the auth state. Revisit if we add retries.
      _(Actual: no explicit call needed — Supabase Auth sends the confirmation
      email automatically via the configured Lettermint SMTP. The signUp action
      already handles the 500 case when SMTP fails with a user-friendly message.)_
- [x] Email body: short, branded, plain-text-friendly. Welcome line + "you can
      now log in" + link to `/auth/login`. No sensitive tokens in the body.
- [x] Update `.env.example` with `LETTERMINT_API_TOKEN=` (empty placeholder)
      and a comment pointing to this plan section.
- [x] **Verify:** sign up with a fresh email; a confirmation email arrives
      from `practicaldatajobs.com`; signup still succeeds if Lettermint is
      unreachable (graceful degradation). `npm run check` green.

**M2.D exit gate:** every new signup fires a Lettermint email; failures are
logged, not silent. Commit.

---

## 5. M3 — Password reset + CI

Goal: complete the auth story so anyone can recover from a forgotten password,
and the gate runs in CI.

### 5.1 Phase A — Password reset
- [x] `app/auth/forgot-password/page.tsx`: email field →
      `supabase.auth.resetPasswordForEmail(email, { redirectTo:
      <origin>/auth/update-password })`.
- [x] `app/auth/update-password/page.tsx`: new password field →
      `supabase.auth.updateUser({ password })`.
- [x] Error handling per convention #3: forgot-password and update-password are
      `useActionState` actions returning `{ error }`.
- [x] **Verify:** full forgot → email → click → update → logged-in flow works.
      `npm run check` green.

### 5.2 Phase B — Test harness + CI
- [x] `tests/helpers.ts`: service-role admin client (for setup/assertions +
      `auth.admin.createUser` in tests — `createUser` requires service role),
      per-test user create/delete helper, `asUser(token)` client.
      _(Actual: tests are colocated in `__tests__/` dirs next to the code they
      test. All Supabase calls are mocked via vitest — no real DB needed for
      the test suite. A `tests/setup.ts` provides jsdom matchers.)_
- [x] `tests/auth.test.ts` extended:
      - sign-up → `profiles` row exists
      - login → session valid
      - logout → session invalidated
      - logged-out hit on a protected route → no session cookie (middleware
        gate asserted via a real request)
      _(Actual: split across `app/auth/__tests__/sign-up-actions.test.ts`,
      `app/auth/__tests__/sign-in-actions.test.ts`,
      `app/auth/__tests__/forgot-password-actions.test.ts`,
      `app/auth/__tests__/update-password-actions.test.ts`,
      `components/__tests__/auth-button.test.tsx`, and
      `lib/__tests__/`. All server actions are tested with mocked Supabase
      clients; no end-to-end HTTP requests.)_
- [x] `.github/workflows/ci.yml`: Node 22 (Supabase-JS needs a global
      `WebSocket`, missing in Node 20 — learned the hard way on PDC_Job_Board),
      `supabase start`, `npm ci`, `npm run check`, `npm test`.
- [ ] **Verify:** CI is green on push; `npm run check` green locally.

**M3 exit gate:** auth complete. The next plan will pick up with roles and/or
the jobs schema, both of which depend on having authenticated users.

---

## 6. Best-practice checklist (apply to every phase)

From the vibe-coding discipline this project follows. Tick these off before
declaring any phase done.

- [x] **Read PLAN.md §0 first** (conventions + repo layout).
- [x] **One phase = one commit.** Don't accumulate changes across phases.
- [x] **`npm run check` green.** Not `tsc`, not `next dev`. The full gate.
- [x] **`npm test` green** (needs `supabase start`).
- [x] **No `error` discarded.** Every Supabase call is checked.
- [x] **Server auth checks use `getUser()`, not `getSession()`.** (convention #5)
- [ ] **Types come from the source of truth.** After M1, run
      `supabase gen types typescript --local > lib/supabase/database.types.ts`
      and import `Database` into clients; no `as SomeRow` casts for `profiles`.
- [x] **RLS on every table from day one.** Never leave a table RLS-off, even if
      the policy is "owner-only" for now.
- [x] **Update PLAN.md if a convention changes.** This file is the source of
      truth for future sessions; staleness = future bugs.

---

## 7. Glossary / pointers

- **PDC_Job_Board** (`../PDC_Job_Board`): sister project. Reference for
  lessons; not for code reuse. Its `CLAUDE.md` documents the operational
  discipline we are re-applying here (the `npm run check` gate, the
  `<Suspense>` gotcha, the Node-22-in-CI note).
- **Supabase local stack:** `supabase start` from repo root → Postgres on
  `:54322`, Studio on `:54323`.
- **`handle_new_user` trigger:** the canonical Supabase pattern for creating a
  `profiles` row when `auth.users` gains a row. Use it verbatim.
- **`@supabase/ssr` vs the old `supabase-js` auth helpers:** use `@supabase/ssr`
  for any server context. The older `@supabase/auth-helpers-*` packages are
  deprecated.
- **`getUser()` vs `getSession()`:** Supabase docs recommend `getUser()` for any
  server-side gating because it re-validates the JWT server-side; `getSession()`
  trusts the cookie and is unsafe for authorization decisions.

---

## 8. Backlog

Deferred work, not part of the current plan's milestones. Captured here so a
future session can pick it up without re-deriving the design.

### Discord OAuth (was M3.A)
Deferred to avoid introducing OAuth complexity before the core auth story
(email/password, password reset, CI) is solid. PDC members already have Discord
accounts, so this is the natural primary login once it's worth the complexity.

Design notes (carried over from the original M3.A):
- Repo-root `.env` (gitignored) with `DISCORD_CLIENT_ID`,
  `DISCORD_CLIENT_SECRET`. `.env.example` documents the keys.
- Enable Discord provider in Supabase config (locally via `config.toml` or
  dashboard; on deploy via dashboard + prod creds).
- `app/auth/callback/route.ts`: exchanges the code for a session, handles
  errors (Supabase returns `error_description`), redirects to `next` param
  or `/profile`.
- Login + signup pages get a "Continue with Discord" button that hits
  `supabase.auth.signInWithOAuth({ provider: 'discord', options: {
  redirectTo: <origin>/auth/callback })`.
- **Verify:** local OAuth round trip with a Discord dev app; new user gets a
  `profiles` row via the trigger. `npm run check` green.
- Add a test to the M3 harness: OAuth callback rejects a bad/missing code
  (assert on the error path).

---

## 9. Next leg: CV upload + Jobs + Semantic Search

Scope of THIS plan: CV upload with PDF parsing, Voyage AI embeddings,
Supabase pgvector storage, job postings (gated by `can_post_jobs`), and
bidirectional semantic search (jobs → CVs and CVs → jobs).

### 9.1 Design decisions (locked)

**Roles.** No separate role table. Every user is a Candidate by default.
A boolean `can_post_jobs` on `profiles` grants job-posting privileges.
The flag is set directly in Supabase (dashboard or SQL) — no self-serve
UI, no admin screen. One user can be both candidate (has a CV, appears
in searches) and employer (posts jobs).

**CV parsing.** Start with PDF only via the `pdf-parse` npm package
(server-side). DOCX, plain text, and other formats are deferred.
Server Action receives the uploaded file, extracts text from the PDF
buffer, stores the raw file in Supabase Storage, and persists metadata
+ embedding in the `cvs` table.

**Embedding.** Voyage AI `voyage-3` model (1024-dim). Called via `fetch`
against the Voyage REST API (`https://api.voyageai.com/v1/embeddings`).
No Voyage SDK dependency — the API is a single POST endpoint. Both CV
text and job descriptions use the same model so similarity queries are
comparable. `input_type` is `"document"` for both (CVs and job descriptions
are both long-form text, not queries).

**Vector storage.** Supabase pgvector (enabled via `CREATE EXTENSION` in a
migration). Cosine distance (`<=>`) for similarity. Search queries run
server-side with the service-role client (bypasses RLS), return scored
IDs, then the caller fetches the rows it's authorized to see with its
own RLS-scoped client. This is the standard pattern: search index is
privileged, row access is per-user.

**Search directions.** Both:
- Employer view: given a job ID, find top-N CVs by cosine similarity.
- Candidate view: given a CV ID, find top-N published jobs by similarity.

**Deploy.** Both local dev (`supabase start`) and Vercel + Supabase Cloud.
Voyage API key goes in `.env.local` (local) and Vercel env vars (prod).
pgvector is available on all Supabase Cloud plans.

### 9.2 Definition of done for this plan

- A user can upload a PDF CV → text extracted → embedded via Voyage → stored.
- A user with `can_post_jobs` can create, edit, and close a job posting.
- Job descriptions are embedded at create/update time.
- A job detail page shows top matching candidates (by similarity score).
- A profile/CV page shows top matching jobs.
- Public job listing page (paginated, public-status only).
- `npm run check` is green locally; CI passes on push.
- Works on both local dev and Vercel deploy.

### 9.3 Data model

```sql
-- Migration 0002: profiles extension
ALTER TABLE public.profiles
  ADD COLUMN can_post_jobs boolean NOT NULL DEFAULT false,
  ADD COLUMN display_name text,
  ADD COLUMN bio text;

COMMENT ON COLUMN public.profiles.can_post_jobs IS
  'Grants job-posting privileges. Set manually in Supabase dashboard.';
COMMENT ON COLUMN public.profiles.display_name IS
  'User-visible name, defaults to email prefix if not set.';
COMMENT ON COLUMN public.profiles.bio IS
  'Short user bio / tagline.';

-- Migration 0003: pgvector + cvs table
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE public.cvs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path         text NOT NULL,
  original_filename text NOT NULL,
  raw_text          text NOT NULL,
  embedding         extensions.vector(1024),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cvs IS
  'Uploaded CVs. One user can have multiple CV versions.';

ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cvs: owner CRUD" ON public.cvs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Migration 0004: jobs table
CREATE TABLE public.jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  company     text NOT NULL,
  description text NOT NULL,
  embedding   extensions.vector(1024),
  status      text NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'public', 'closed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.jobs IS
  'Job postings. Statuses: draft (private), public (live on board), closed (archived).';

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs: owner CRUD" ON public.jobs
  FOR ALL USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "jobs: public read public" ON public.jobs
  FOR SELECT USING (status = 'public');

-- Migration 0006: fix status model on remote DBs that were set up with
-- the old open/closed model + admin trigger. Drops the trigger, updates
-- the CHECK constraint, migrates 'open' rows to 'public'.
```

### 9.4 Milestones

#### M4 — Profiles extension + profile page

Goal: extend the profiles table and give users a profile page where they
can see (and later edit) their info.

**M4.A — Migration**
- Migration `0002_extend_profiles.sql`: add `can_post_jobs`, `display_name`,
  `bio` columns as above.
- Update seed.sql if needed (no-op for now).
- **Verify:** `supabase db reset` is clean; the migration applies without error.

**M4.B — Profile page**
- `app/app/profile/page.tsx`: reads the user's profile row via
  `createClient()` + `getUser()` → `profiles` join.
- Shows email, display_name (fallback to email prefix), bio (fallback to
  placeholder), and can_post_jobs badge.
- Simple UI: card layout matching the existing design system
  (Tailwind + brand tokens from globals.css).
- **Verify:** logged-in user visits `/app/profile` and sees their profile.
  `npm run check` green.

**M4 exit gate:** profiles table extended, profile page renders. Commit.

---

#### M5 — CV upload + Voyage embedding

Goal: a user uploads a PDF CV, the server extracts text, embeds it via
Voyage, and stores both the file and the vector.

**M5.A — Enable pgvector + CVs table**
- Migration `0003_pgvector_cvs.sql`: `CREATE EXTENSION vector` + `cvs` table
  as in §9.3.
- Enable `storage.vector` in `supabase/config.toml` (line 64: flip to `true`).
- **Verify:** `supabase db reset` clean. Extension exists (`SELECT * FROM
  pg_extension WHERE extname = 'vector'`).

**M5.B — Voyage API wrapper**
- `lib/voyage.ts`: server-only module.
  - `embedText(text: string): Promise<number[]>` — calls Voyage API, returns
    the embedding vector.
  - Reads `VOYAGE_API_KEY` from `process.env`.
  - Hard-fails on non-2xx (per convention #3: never swallow an error).
  - Truncates input to Voyage's token limit (32K tokens for voyage-3).
    No chunking in the first pass — single PDFs should fit.
- `.env.example`: add `VOYAGE_API_KEY=` with a comment.
- **Verify:** a manual test (or unit test with mocked fetch) confirms the
  wrapper shape. `npm run typecheck` green.

**M5.C — CV upload flow**
- `app/app/profile/cv/upload/page.tsx` + upload form component.
- Client-side: file input (accept=".pdf"), shows selected filename and size.
  Max file size: 10 MB (enforced client-side for UX, server-side for security).
- Server Action `uploadCV(formData: FormData)`: 
  1. Validate file exists, is PDF, ≤10 MB.
  2. Extract text via `pdf-parse` (runs server-side on the Buffer).
  3. Upload the raw PDF to Supabase Storage bucket `cvs` at path
     `{userId}/{uuid}.pdf`.
  4. Call `embedText(rawText)` → embedding vector.
  5. INSERT into `cvs` table.
  6. Return `{ error }` or redirect to profile.
- Storage bucket `cvs`: create in migration or via dashboard. RLS: owner-only
  read/write.
- **Verify:** upload a test PDF; confirm row appears in `cvs` table; file
  exists in Storage. `npm run check` green.

**M5.D — CV display on profile**
- Profile page shows the user's CV(s): filename, upload date, a "View text"
  expandable section showing `raw_text`.
- If no CV uploaded yet, show an upload CTA.
- **Verify:** profile page shows uploaded CV. `npm run check` green.

**M5 exit gate:** full upload → extract → embed → store pipeline works.
Commit.

---

#### M6 — Job postings + embedding

Goal: users with `can_post_jobs=true` can create, edit, and manage job
postings. Job descriptions are embedded for search.

**M6.A — Jobs table**
- Migration `0004_jobs.sql`: `jobs` table as in §9.3.
- **Verify:** `supabase db reset` clean.

**M6.B — Create job flow**
- `app/app/jobs/new/page.tsx` + create-job form.
- Gated server-side: action checks `can_post_jobs` on the current user's
  profile; returns error if false.
- Server Action `createJob(formData)`:
  1. Validate title (non-empty, ≤200 chars), description (non-empty, ≤50K chars).
  2. Call `embedText(description)`.
  3. INSERT into `jobs` with `status = 'draft'`.
  4. Redirect to job detail page.
- **Verify:** user with flag creates a job; user without flag gets error.
  `npm run check` green.

**M6.C — Job listing + detail pages**
- `app/jobs/page.tsx` (public): lists published jobs, paginated. Each card
  shows title, employer display_name, posted date. No embedding needed here
  — just a standard SELECT.
- `app/jobs/[id]/page.tsx` (public): job detail. Shows title, employer, full
  description, posted/updated dates. If the viewer is the owner, show edit
  and status-change controls.
- **Verify:** published jobs appear on listing; draft jobs do not. Owner sees
  edit controls. `npm run check` green.

**M6.D — Edit + status management**
- Edit form at `app/app/jobs/[id]/edit/page.tsx` (gated: owner only).
- Server Action `updateJob(id, formData)`: updates title, description,
  re-embeds description if it changed, updates `updated_at`.
- Server Action `updateJobStatus(id, status)`: changes status (draft →
  published, published → closed). Owner only.
- **Verify:** full CRUD cycle works. Re-embedding on description change is
  correct. `npm run check` green.

**M6 exit gate:** job postings are fully functional. Commit.

---

#### M7 — Semantic search

Goal: given a CV, find matching jobs. Given a job, find matching candidates.
Server-side similarity queries via pgvector.

**M7.A — Search helper**
- `lib/search.ts`: server-only module.
  - `searchJobsForCV(cvId: string, limit?: number): Promise<ScoredJob[]>`:
    fetches the CV embedding, runs cosine similarity against published jobs,
    returns scored results. Uses service-role client (bypasses RLS on the
    vector index, then the caller fetches rows with its own client).
  - `searchCVsForJob(jobId: string, limit?: number): Promise<ScoredCV[]>`:
    same approach reversed.
  - Query pattern (pgvector cosine similarity):
    ```sql
    SELECT id, 1 - (embedding <=> $1) AS similarity
    FROM cvs  -- or jobs
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1
    LIMIT $2;
    ```
  - Returns scored IDs only (no raw text, no personal data) — the caller
    joins with its own RLS-scoped queries.

**M7.B — Search UI on CV/profile page**
- CV detail / profile page: below the CV info, show "Matching Jobs" section.
  Calls `searchJobsForCV` server-side, renders a list of job cards (title,
  employer, similarity score as percentage).
- If no CV uploaded, show "Upload a CV to see matching jobs" CTA.
- **Verify:** upload a CV, see matching jobs listed with scores. `npm run
  check` green.

**M7.C — Search UI on job detail page**
- Job detail page (for the owner): below the description, show "Matching
  Candidates" section. Calls `searchCVsForJob` server-side.
- Shows similarity scores. Does NOT show candidate emails or raw CV text —
  only a de-identified card (display_name or "Candidate #{n}", similarity%).
- **Verify:** job owner sees matching candidates. Non-owner does not see this
  section. `npm run check` green.

**M7 exit gate:** bidirectional search works end-to-end. Commit.

---

### 9.5 Env vars needed

| Variable | Where | Notes |
|----------|-------|-------|
| `VOYAGE_API_KEY` | `.env.local` + Vercel | Voyage AI API key |

Update `.env.example` with `VOYAGE_API_KEY=` placeholder.

### 9.6 New dependencies

| Package | Purpose |
|---------|---------|
| `pdf2json` | Extract text from PDF files (server-side, no worker) |

### 9.7 New files (target)

```
lib/
  voyage.ts             # embedText() — Voyage AI REST API wrapper
  search.ts             # searchJobsForCV(), searchCVsForJob() — pgvector queries
  supabase/
    service.ts          # createServiceClient() — service-role client for search
app/
  jobs/
    page.tsx            # public job listing (published only)
    [id]/
      page.tsx          # public job detail + matching candidates (owner only)
  app/
    profile/
      page.tsx          # profile page (extended from current placeholder)
      cv/
        upload/
          page.tsx      # CV upload form
          actions.ts    # uploadCV server action
    jobs/
      new/
        page.tsx        # create job form
        actions.ts      # createJob server action
      [id]/
        edit/
          page.tsx      # edit job form
          actions.ts    # updateJob, updateJobStatus server actions
supabase/
  migrations/
    0002_extend_profiles.sql
    0003_pgvector_cvs.sql
    0004_jobs.sql
```

### 9.8 Order of operations

M4 → M5 → M6 → M7. Each milestone depends on the previous one:
- M6 (jobs) needs M4 (can_post_jobs flag) for gating.
- M7 (search) needs both M5 (CV embeddings) and M6 (job embeddings) to
  have vectors to search against.

Within each milestone, phases run sequentially (A → B → C → D). Follow the
existing discipline: one phase ≈ one commit, `npm run check` green before
moving on.
