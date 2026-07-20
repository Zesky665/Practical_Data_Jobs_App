# Practical Data Jobs App

Job board for the Practical Data Community — CV uploads, job postings, and AI-powered semantic matching.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** (Auth, Postgres, pgvector, Storage)
- **Voyage AI** (text embeddings, voyage-3 model)
- **Tailwind CSS** (brand design system)
- **TypeScript** (strict mode)

## Local development

```sh
# 1. Install deps
npm install

# 2. Start Supabase (Docker required)
supabase start

# 3. Apply migrations
supabase db reset

# 4. Create storage bucket (one-time)
node scripts/setup-storage.mjs

# 5. Set env vars
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and VOYAGE_API_KEY

# 6. Run dev server
npm run dev
```

## Production deploy

1. Push to GitHub — Vercel auto-deploys from `main`
2. Set env vars in Vercel: `VOYAGE_API_KEY`
3. Create the `cvs` storage bucket on Supabase Cloud:
   ```sh
   SUPABASE_SERVICE_ROLE_KEY=<cloud-key> \
   NEXT_PUBLIC_SUPABASE_URL=<cloud-url> \
   node scripts/setup-storage.mjs
   ```
   Or via Supabase Dashboard → Storage → New bucket → name "cvs", uncheck public
4. Run migrations on Supabase Cloud: `supabase db push`

## Verification

```sh
npm run check   # lint + typecheck + test + build
```
