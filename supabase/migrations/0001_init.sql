-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Helper function for admin check
create or replace function auth_is_admin() returns boolean as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql stable;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  nickname text,
  role text default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('member','owner')),
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

-- Challenges
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  week_index int not null unique,
  title text not null,
  description text not null,
  start_date date not null,
  end_date date not null,
  base_points int not null,
  bonus_rules text,
  stretch_rules text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending_ai','auto_approved','needs_review','approved','rejected','resubmitted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ai_verdict text,
  ai_confidence numeric,
  ai_reasons jsonb,
  points_awarded int,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz
);

create table if not exists public.submission_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

-- Ledger
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete cascade,
  points int not null,
  reason text,
  created_at timestamptz default now()
);

-- Audit
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);

-- Leaderboard helper function
create or replace function public.public_leaderboard()
returns table (user_id uuid, display_name text, points int, team_name text) as $$
  select p.id as user_id, coalesce(p.nickname, p.display_name) as display_name, coalesce(sum(l.points),0) as points, t.name as team_name
  from profiles p
  left join points_ledger l on l.user_id = p.id
  left join team_members tm on tm.user_id = p.id
  left join teams t on tm.team_id = t.id
  group by p.id, display_name, t.name
  order by points desc
  limit 100;
$$ language sql stable;

-- Storage bucket
insert into storage.buckets (id, name, public) values ('submission-proofs', 'submission-proofs', false)
  on conflict (id) do nothing;

-- RLS enable
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_images enable row level security;
alter table public.points_ledger enable row level security;
alter table public.admin_audit enable row level security;

-- Profiles policies
create policy "profiles select self" on public.profiles for select using (auth.uid() = id);
create policy "profiles insert self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update self" on public.profiles for update using (auth.uid() = id);

-- Teams policies
create policy "teams read all" on public.teams for select using (true);
create policy "teams create" on public.teams for insert with check (auth.role() = 'authenticated');
create policy "teams update owner" on public.teams for update using (auth.uid() = created_by or auth_is_admin());

-- Team members policies
create policy "team members read self" on public.team_members for select using (auth.uid() = user_id or auth_is_admin());
create policy "team members manage self" on public.team_members for insert with check (auth.uid() = user_id);
create policy "team members delete owner" on public.team_members for delete using (auth.uid() = user_id or auth_is_admin());

-- Challenges policies
create policy "challenges read" on public.challenges for select using (true);
create policy "challenges admin write" on public.challenges for all using (auth_is_admin());

-- Submissions policies
create policy "submissions read own" on public.submissions for select using (auth.uid() = user_id or auth_is_admin());
create policy "submissions insert self" on public.submissions for insert with check (auth.uid() = user_id);
create policy "submissions update self" on public.submissions for update using (auth.uid() = user_id or auth_is_admin());

-- Submission images policies
create policy "submission images read own" on public.submission_images for select using (
  exists(select 1 from public.submissions s where s.id = submission_id and (s.user_id = auth.uid() or auth_is_admin()))
);
create policy "submission images insert own" on public.submission_images for insert with check (
  exists(select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid())
);

-- Points ledger policies
create policy "ledger read own" on public.points_ledger for select using (auth.uid() = user_id or auth_is_admin());
create policy "ledger insert service" on public.points_ledger for insert with check (auth.role() = 'service_role');

-- Admin audit policies
create policy "audit read admin" on public.admin_audit for select using (auth_is_admin());
create policy "audit write service" on public.admin_audit for insert with check (auth.role() = 'service_role');

-- Storage policies for private proofs
create policy "proofs owner read" on storage.objects for select using (
  bucket_id = 'submission-proofs' and (auth.uid()::text = split_part(name, '/', 1) or auth_is_admin())
);
create policy "proofs owner upload" on storage.objects for insert with check (
  bucket_id = 'submission-proofs' and auth.uid()::text = split_part(name, '/', 1)
);
create policy "proofs owner update" on storage.objects for update using (
  bucket_id = 'submission-proofs' and auth.uid()::text = split_part(name, '/', 1)
);

