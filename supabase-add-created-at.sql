-- Add created_at timestamp to dcp_members if missing
alter table public.dcp_members
  add column if not exists created_at timestamptz not null default now();

-- Optionally set a value for old rows if needed:
-- update public.dcp_members set created_at = now() where created_at is null;
