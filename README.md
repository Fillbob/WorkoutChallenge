# Workout Challenge 2026

A production-ready Next.js app for the Jan 1–Mar 31, 2026 workout challenge. It uses Supabase (Postgres, Auth, Storage) for data and Vercel for deployment. Proof photos stay private with RLS and signed URLs, while the public site exposes only aggregate stats and display names.

## Stack
- Next.js (App Router) + TypeScript
- TailwindCSS
- Supabase (Auth, Postgres, Storage)
- OpenAI Responses API for AI validation with structured outputs
- Deployed to Vercel + Supabase

## Features
- Public landing with current week, leaderboard, points distribution, and weekly status
- Google sign-in with Supabase Auth
- Profile management (nickname, team join/create)
- Weekly challenges (admin CRUD)
- Proof uploads (1–5 images) stored privately
- AI validation endpoint that enforces structured JSON output and auto-approval logic
- Admin review queue and audit log foundation

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Environment variables** – copy `.env.example` to `.env.local` and fill in values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `APP_ADMIN_EMAILS` – comma-separated allowlist for admin UI access
3. **Supabase setup**
   - Create a new Supabase project.
   - Run the SQL migration:
     ```bash
     supabase db push --file supabase/migrations/0001_init.sql
     ```
   - Confirm the private storage bucket exists: `submission-proofs` (created by the migration) and is not public.
4. **Local development**
   ```bash
   npm run dev
   ```
   The app runs at http://localhost:3000.
5. **Testing & linting**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

## Deployment
- **Vercel**: add all env vars above. Set `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` as server-only.
- **Supabase**: apply migrations and ensure RLS policies are enabled (included in migration). The storage policies restrict access to proof images to the uploader and admins only.

## AI validation
- Endpoint: `POST /api/validate-submission` with `{ submissionId }`
- Fetches challenge context + signed URLs, calls OpenAI Responses API with a strict JSON Schema:
  ```json
  {
    "verdict": "pass" | "fail" | "needs_review",
    "confidence": 0-1,
    "reasons": ["..."],
    "extracted_signals": ["..."]
  }
  ```
- Confident passes auto-approve and award points; confident fails reject; all other cases go to the admin queue.

## Security & privacy
- Proof images live in a private bucket with RLS policies; access uses signed URLs.
- Public endpoints return aggregates only; leaderboard uses display names/nicknames.
- Admin actions and auto-approvals are written to `admin_audit`.

## Database schema
See `supabase/migrations/0001_init.sql` for full DDL, RLS, bucket policies, and the `public_leaderboard` helper.
