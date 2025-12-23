# Workout Challenge 2026

A production-ready Next.js app for the Jan 1–Mar 31, 2026 workout challenge. It uses Supabase (Postgres, Auth, Storage) for data and Vercel for deployment. Participants self-report completions while the public site exposes only aggregate stats and display names.

## Stack
- Next.js (App Router) + TypeScript
- TailwindCSS
- Supabase (Auth, Postgres, Storage)
- Deployed to Vercel + Supabase

## Features
- Public landing with current week, leaderboard, points distribution, and weekly status
- Google sign-in with Supabase Auth
- Profile management (nickname, team join/create)
- Weekly challenges (admin CRUD)
- Self-reported completions (no media uploads)
- Admin oversight for totals and audit log foundation

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Environment variables** – copy `.env.example` to `.env.local` and fill in values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_ADMIN_EMAILS` – comma-separated allowlist for admin UI access
3. **Supabase setup**
   - Create a new Supabase project.
   - Run the SQL migration:
     ```bash
     supabase db push --file supabase/migrations/0001_init.sql
     ```
   - Confirm the Supabase project is ready for RLS-enabled tables.
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
- **Vercel**: add all env vars above. Set `SUPABASE_SERVICE_ROLE_KEY` as server-only.
- **Supabase**: apply migrations and ensure RLS policies are enabled (included in migration).

## Security & privacy
- Public endpoints return aggregates only; leaderboard uses display names/nicknames.
- Admin actions are written to `admin_audit`.

## Database schema
See `supabase/migrations/0001_init.sql` for full DDL, RLS, and the `public_leaderboard` helper.
