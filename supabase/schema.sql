-- Paste this entire file into the Supabase SQL Editor and run it once.
-- Safe to run again. Default templates are added for existing and future users.
begin;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  applied_on date,
  company text not null check (length(trim(company)) > 0),
  role text,
  location text,
  work_type text,
  source text,
  job_url text,
  applied boolean not null default true,
  contact_name text,
  contact_role text,
  contact_linkedin text,
  connection_sent_on date,
  messaged boolean not null default false,
  messaged_on date,
  followup1_on date,
  followup2_on date,
  status text not null default 'Applied'
    check (status in ('Applied', 'Replied', 'Screening', 'Interview', 'Offer', 'Rejected', 'Ghosted')),
  response text,
  salary text,
  why_applied text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('first_message', 'followup1', 'followup2')),
  title text not null check (length(trim(title)) > 0),
  body text not null check (length(trim(body)) > 0)
);

create index if not exists applications_user_created_idx on public.applications(user_id, created_at desc);
create index if not exists templates_user_idx on public.templates(user_id);

alter table public.applications enable row level security;
alter table public.templates enable row level security;

drop policy if exists "Own applications only" on public.applications;
create policy "Own applications only" on public.applications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Own templates only" on public.templates;
create policy "Own templates only" on public.templates
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.applications, public.templates from anon;
grant select, insert, update, delete on public.applications, public.templates to authenticated;

-- The trigger needs elevated rights only to seed these fixed, owner-bound rows.
create or replace function public.seed_job_templates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.templates (user_id, kind, title, body) values
  (new.id, 'first_message', 'A friendly introduction',
   'Hi {name}, I recently applied for the {role} role at {company}. I’m a full-stack developer working with React and Next.js, and I’d love to learn more about the opportunity. Is there an update on my application? Thanks for your time!'),
  (new.id, 'followup1', 'A quick follow-up',
   'Hi {name}, I’m following up on my application for {role} at {company}. I’m still interested and would be happy to share examples of my React and Next.js work. Do you have any updates on next steps? Thank you!'),
  (new.id, 'followup2', 'One more check-in',
   'Hi {name}, one last check-in about the {role} position at {company}. I’d welcome the chance to contribute as a full-stack React and Next.js developer. If the role has been filled, I’d appreciate a quick update. Thanks again for your time!');
  return new;
end;
$$;

revoke all on function public.seed_job_templates() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_job_templates on auth.users;
create trigger on_auth_user_created_job_templates
  after insert on auth.users
  for each row execute function public.seed_job_templates();

-- Also supports creating your manual Auth user before running this script.
insert into public.templates (user_id, kind, title, body)
select users.id, defaults.kind, defaults.title, defaults.body
from auth.users as users
cross join (values
  ('first_message', 'A friendly introduction', 'Hi {name}, I recently applied for the {role} role at {company}. I’m a full-stack developer working with React and Next.js, and I’d love to learn more about the opportunity. Is there an update on my application? Thanks for your time!'),
  ('followup1', 'A quick follow-up', 'Hi {name}, I’m following up on my application for {role} at {company}. I’m still interested and would be happy to share examples of my React and Next.js work. Do you have any updates on next steps? Thank you!'),
  ('followup2', 'One more check-in', 'Hi {name}, one last check-in about the {role} position at {company}. I’d welcome the chance to contribute as a full-stack React and Next.js developer. If the role has been filled, I’d appreciate a quick update. Thanks again for your time!')
) as defaults(kind, title, body)
where not exists (
  select 1 from public.templates existing
  where existing.user_id = users.id and existing.kind = defaults.kind
);

commit;
