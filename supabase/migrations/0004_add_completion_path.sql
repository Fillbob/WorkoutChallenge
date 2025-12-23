-- Add optional completion path for challenge follow-up actions
alter table public.challenges
  add column if not exists completion_path text default '/dashboard';
