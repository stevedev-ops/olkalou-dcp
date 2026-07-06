-- Add role indicator for administrative access
alter table public.dcp_members
  add column if not exists is_admin boolean not null default false;

-- Grant at least one existing record admin access if needed:
-- update public.dcp_members set is_admin = true where id = 1;
