-- Add timestamp for when challenges go live
alter table public.challenges
  add column if not exists start_at timestamptz;

-- Backfill existing rows using the previous start_date value
update public.challenges
set start_at = start_date::timestamptz
where start_at is null;

-- Ensure all challenges have a go-live timestamp
alter table public.challenges
  alter column start_at set not null;
