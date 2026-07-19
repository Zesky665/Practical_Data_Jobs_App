# Practical_Data_Jobs_App — Development Plan

Scope of this document: **authentication only.** All other features (jobs,
resumes, matching, employer flows, admin moderation, roles, etc.) are
explicitly out of scope for now and will get their own plan sections when we
get to them.

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
Supabase Auth gives us email/password and Discord OAuth without us rolling our
own.

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
- Discord OAuth sign-up/sign-in.
- Password reset (forgot-password → email link → update-password).
- Session management (SSR-safe, refreshed in middleware).
- Middleware route gate (public vs. auth-required).
- A minimal `profiles` table (id + created_at) so every signed-up user has a
  row and the `handle_new_user` trigger pattern is in place. This is the
  extension point for future attributes (display name, role, etc.).
- Test harness + a CI workflow.

**Out of scope (do not build yet):** roles, jobs, resumes, matching, employer
self-serve posting, admin moderation queue, link checking, embeddings, any UI
beyond what auth strictly needs (a home page placeholder, a profile page
placeholder, login/signup forms, OAuth callback handler).

**Definition of done for this plan:**
- A new visitor can sign up with email/password, log in, log out.
- A new visitor can sign up/log in with Discord.
- A logged-out user hitting `/profile` is redirected to `/auth/login`.
- A logged-in user can reset their password via email.
- `profiles` exists and every confirmed sign-up produces a row.
- `npm run check` is green and CI runs it on every push/PR.

---

## 2. Milestones

Three milestones. Each one ends green (`npm run check` + `npm test` passing)
and is one or more commits.

### M1 — Scaffolding + profiles table + landing page port
### M2 — Email/password auth
### M3 — Discord OAuth + password reset + CI

Phases inside each milestone are sized so one phase ≈ one commit. Don't start
the next phase until the previous one is green and committed.

## 2a. Build status

| Phase | Status | Notes |
|-------|--------|-------|
| M1.A Skeleton | ✅ Done | Next 16, TS strict, Tailwind 3, Supabase SSR |
| M1.B profiles table | ✅ Done | Minimal stub (id + created_at) + handle_new_user trigger |
| M1.C Supabase clients | ✅ Done | server/client/proxy (proxy.ts, Next 16 naming) |
| M1.D Landing page port | ✅ Done | Ported from ../Practical_Data_Jobs_Site; adaptive CTA |
| M2.A Sign-up | ✅ Done | Email/password, email confirmation off (dev) |
| M2.B Sign-in + sign-out | ✅ Done | useActionState forms, auth-button header widget |
| M2.C Route gate + /app | ✅ Done | proxy.ts gates /app/*, /app placeholder page |
| M3.A Discord OAuth | ⬜ Deferred | |
| M3.B Password reset | ⬜ Deferred | |
| M3.C Test harness + CI | ⬜ Deferred | |

---

## 3. M1 — Scaffolding + profiles table

Goal: a runnable Next.js app against local Supabase, a minimal typed `profiles`
table, and a passing (minimal) test setup. No auth UI yet.

### 3.1 Phase A — Project skeleton
- [ ] `package.json` with Next 16, React 19, TypeScript strict, Supabase SSR
      (`@supabase/supabase-js`, `@supabase/ssr`), Vitest, Tailwind (optional).
- [ ] `next.config.ts`, `tsconfig.json` (strict, `@/*` → `./*`).
- [ ] `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (used
      only in tests + trusted server code later). Real `.env.local` is gitignored.
- [ ] `supabase/config.toml` (default local stack is fine to start).
- [ ] `app/layout.tsx`, `app/page.tsx` (placeholder home), `app/globals.css`.
- [ ] **Verify:** `npm install && npm run dev` serves `http://localhost:3000`;
      `npm run check` is green.

### 3.2 Phase B — `profiles` table (minimal)
- [ ] Migration `0001_init_profiles.sql`:
      - `profiles(id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now())`.
      - Row comment: "Stub. Future attributes (display name, role, etc.) land
        here as later migrations."
- [ ] Trigger: on `auth.users` insert, create a matching `profiles` row. Use the
      standard Supabase `handle_new_user` pattern. This is the extension point
      for adding attributes in a future milestone.
- [ ] RLS on `profiles`: user reads own row; user updates own row (when we add
      user-editable columns later, the policy will narrow further). Enable RLS
      now so it's the default from day one — never leave a table RLS-off.
- [ ] `tests/auth.test.ts` first test: a freshly signed-up user has a
      `profiles` row.
- [ ] **Verify:** `supabase db reset` is clean; `npm test` passes; `npm run check` green.

### 3.3 Phase C — Supabase client wiring
- [ ] `lib/supabase/server.ts` — `createClient()` returning a Server-Component
      / Route-Handler client (reads cookies, writes refreshed session). Exposes
      a `getUser()` wrapper helpers can call.
- [ ] `lib/supabase/client.ts` — `createClient()` for Client Components.
- [ ] `lib/supabase/middleware.ts` — `createClient()` for middleware
      (cookies-only, no `getUser` call here — that goes in
      `lib/supabase/server.ts`, per convention #5).
- [ ] **Verify:** no behavior change yet; just type-checks and builds.

**M1 exit gate:** app boots, `profiles` exists, one passing test. Commit. No
auth flows yet.

---

## 4. M2 — Email/password auth

Goal: the core auth loop works end-to-end with email/password.

### 4.1 Phase A — Sign-up
- [ ] `app/auth/sign-up/page.tsx` + `components/sign-up-form.tsx` (Client
      Component using `useActionState`).
- [ ] Server Action `signUp`: calls
      `supabase.auth.signUp({ email, password })`, checks `error`, returns
      `{ error }` on failure.
- [ ] Server-side validation: email shape, password ≥ 12 chars
      (enforced in the action; the form also validates for UX).
- [ ] Email confirmation flow: Supabase's confirmation redirect →
      `/auth/callback` → `/profile`.
- [ ] **Verify:** sign up with a fresh email; confirm; land on `/profile` with
      a `profiles` row created by the trigger. `npm run check` green.

### 4.2 Phase B — Sign-in + sign-out
- [ ] `app/auth/login/page.tsx` + `components/login-form.tsx`.
- [ ] Server Action `signIn` → `supabase.auth.signInWithPassword(...)`.
- [ ] Sign-out: client-side `supabase.auth.signOut()` then
      `router.push('/auth/login')`. Wrap in try/catch; on failure, surface to
      the user (don't swallow).
- [ ] `components/auth-button.tsx` in the header: shows Login when logged out,
      Logout when logged in.
- [ ] **Verify:** sign-up → sign-out → sign-in round trip works; session
      persists across reload; `npm run check` green.

### 4.3 Phase C — Route gate (middleware)
- [ ] `middleware.ts`:
      - Refreshes the session via `@supabase/ssr` `updateSession`.
      - Public routes: `/`, `/auth/*`. Everything else requires a session.
      - On unauthorized → redirect to `/auth/login?next=<original>`.
- [ ] `app/profile/page.tsx` (placeholder; reads session via
      `lib/supabase/server.ts` `getUser()` — **not** `getSession()`, per
      convention #5 — greets the user by email).
- [ ] **Verify:** logged-out `/profile` redirects to login; logged-in loads.
      **Read convention #1 about `<Suspense>` in layout children before touching
      the header — awaiting session data directly in a layout child crashes the
      route in Next 16 + Turbopack.** `npm run check` green.

**M2 exit gate:** full email/password auth loop. Commit.

---

## 5. M3 — Discord OAuth + password reset + CI

Goal: complete the auth story so Discord members can use their existing
identity, anyone can recover from a forgotten password, and the gate runs in CI.

### 5.1 Phase A — Discord OAuth
- [ ] Repo-root `.env` (gitignored) with `DISCORD_CLIENT_ID`,
      `DISCORD_CLIENT_SECRET`. `.env.example` documents the keys.
- [ ] Enable Discord provider in Supabase config (locally via `config.toml` or
      dashboard; on deploy via dashboard + prod creds).
- [ ] `app/auth/callback/route.ts`: exchanges the code for a session, handles
      errors (Supabase returns `error_description`), redirects to `next` param
      or `/profile`.
- [ ] Login + signup pages get a "Continue with Discord" button that hits
      `supabase.auth.signInWithOAuth({ provider: 'discord', options: {
      redirectTo: <origin>/auth/callback })`.
- [ ] **Verify:** local OAuth round trip with a Discord dev app; new user gets
      a `profiles` row via the trigger. `npm run check` green.

### 5.2 Phase B — Password reset
- [ ] `app/auth/forgot-password/page.tsx`: email field →
      `supabase.auth.resetPasswordForEmail(email, { redirectTo:
      <origin>/auth/update-password })`.
- [ ] `app/auth/update-password/page.tsx`: new password field →
      `supabase.auth.updateUser({ password })`.
- [ ] Error handling per convention #3: forgot-password and update-password are
      `useActionState` actions returning `{ error }`.
- [ ] **Verify:** full forgot → email → click → update → logged-in flow works.
      `npm run check` green.

### 5.3 Phase C — Test harness + CI
- [ ] `tests/helpers.ts`: service-role admin client (for setup/assertions +
      `auth.admin.createUser` in tests — `createUser` requires service role),
      per-test user create/delete helper, `asUser(token)` client.
- [ ] `tests/auth.test.ts` extended:
      - sign-up → `profiles` row exists
      - login → session valid
      - logout → session invalidated
      - logged-out hit on a protected route → no session cookie (middleware
        gate asserted via a real request)
      - OAuth callback rejects a bad/missing code (assert on the error path)
- [ ] `.github/workflows/ci.yml`: Node 22 (Supabase-JS needs a global
      `WebSocket`, missing in Node 20 — learned the hard way on PDC_Job_Board),
      `supabase start`, `npm ci`, `npm run check`, `npm test`.
- [ ] **Verify:** CI is green on push; `npm run check` green locally.

**M3 exit gate:** auth complete. The next plan will pick up with roles and/or
the jobs schema, both of which depend on having authenticated users.

---

## 6. Best-practice checklist (apply to every phase)

From the vibe-coding discipline this project follows. Tick these off before
declaring any phase done.

- [ ] **Read PLAN.md §0 first** (conventions + repo layout).
- [ ] **One phase = one commit.** Don't accumulate changes across phases.
- [ ] **`npm run check` green.** Not `tsc`, not `next dev`. The full gate.
- [ ] **`npm test` green** (needs `supabase start`).
- [ ] **No `error` discarded.** Every Supabase call is checked.
- [ ] **Server auth checks use `getUser()`, not `getSession()`.** (convention #5)
- [ ] **Types come from the source of truth.** After M1, run
      `supabase gen types typescript --local > lib/supabase/database.types.ts`
      and import `Database` into clients; no `as SomeRow` casts for `profiles`.
- [ ] **RLS on every table from day one.** Never leave a table RLS-off, even if
      the policy is "owner-only" for now.
- [ ] **Update PLAN.md if a convention changes.** This file is the source of
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
