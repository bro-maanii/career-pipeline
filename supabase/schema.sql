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


-- Extended workbook workspace
-- Run this once in Supabase SQL Editor to upgrade an existing Career Pipeline.
-- New projects can run schema.sql, which includes this upgrade at the end.
begin;
alter table public.applications add column if not exists screening text;
alter table public.applications add column if not exists interview text;
alter table public.applications add column if not exists result text;
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('Saved','Applied','Contacted','Replied','Screening','Interview','Offer','Rejected','Ghosted','Withdrawn'));

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  added_on date, person text not null check (length(trim(person)) > 0),
  role text, company text, company_type text, linkedin_url text, why_targeted text,
  messaged boolean not null default false, messaged_on date, reply text,
  followup1_on date, followup2_on date,
  status text not null default 'Not Contacted' check (status in ('Not Contacted','Messaged','Replied','Interested','No Reply','Not Relevant','Closed')),
  message_draft text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  scheduled_on date not null, company text not null check (length(trim(company)) > 0), role text,
  stage text not null default 'Technical' check (stage in ('Screening','Technical','Managerial','Final','HR')),
  interviewer text, questions text, answer text, mistake text, correct_answer text, next_action text,
  result text not null default 'Pending' check (result in ('Pending','Passed','Failed','Offer')),
  created_at timestamptz not null default now()
);
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  activity_on date not null,
  applications integer check (applications between 0 and 1000000),
  direct_outreach integer check (direct_outreach between 0 and 1000000),
  followups integer check (followups between 0 and 1000000),
  network_actions integer check (network_actions between 0 and 1000000),
  replies integer check (replies between 0 and 1000000),
  screenings integer check (screenings between 0 and 1000000),
  interviews integer check (interviews between 0 and 1000000),
  rejections integer check (rejections between 0 and 1000000),
  offers integer check (offers between 0 and 1000000),
  notes text, created_at timestamptz not null default now(), unique(user_id, activity_on)
);
create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  daily_targets jsonb not null default '{"applications":10,"direct_outreach":10,"followups":5,"network_actions":5}'::jsonb,
  check (jsonb_typeof(daily_targets) = 'object'
    and daily_targets ?& array['applications','direct_outreach','followups','network_actions']
    and jsonb_typeof(daily_targets->'applications') = 'number'
    and jsonb_typeof(daily_targets->'direct_outreach') = 'number'
    and jsonb_typeof(daily_targets->'followups') = 'number'
    and jsonb_typeof(daily_targets->'network_actions') = 'number'
    and (daily_targets->>'applications')::integer between 0 and 1000000
    and (daily_targets->>'direct_outreach')::integer between 0 and 1000000
    and (daily_targets->>'followups')::integer between 0 and 1000000
    and (daily_targets->>'network_actions')::integer between 0 and 1000000)
);
create index if not exists contacts_user_idx on public.contacts(user_id, created_at desc);
create index if not exists interviews_user_date_idx on public.interviews(user_id, scheduled_on);
create index if not exists interviews_application_idx on public.interviews(application_id);

alter table public.contacts enable row level security;
alter table public.interviews enable row level security;
alter table public.daily_logs enable row level security;
alter table public.settings enable row level security;
drop policy if exists "Own contacts only" on public.contacts;
create policy "Own contacts only" on public.contacts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Own interviews only" on public.interviews;
create policy "Own interviews only" on public.interviews for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (application_id is null or exists (
    select 1 from public.applications app where app.id = application_id and app.user_id = (select auth.uid())
  )));
drop policy if exists "Own daily logs only" on public.daily_logs;
create policy "Own daily logs only" on public.daily_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Own settings only" on public.settings;
create policy "Own settings only" on public.settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.contacts, public.interviews, public.daily_logs, public.settings from anon;
grant select, insert, update, delete on public.contacts, public.interviews, public.daily_logs, public.settings to authenticated;

-- One RPC transaction prevents a failed sheet from leaving a partial import.
-- SECURITY INVOKER preserves RLS. Owner IDs and record IDs from JSON are ignored.
create or replace function public.import_tracker_bundle(payload jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in before importing.'; end if;
  insert into public.applications (applied_on, company, role, location, work_type, source, job_url, applied,
    contact_name, contact_role, contact_linkedin, connection_sent_on, messaged, messaged_on, followup1_on,
    followup2_on, status, response, screening, interview, result, salary, why_applied, notes)
  select applied_on, company, role, location, work_type, source, job_url, applied,
    contact_name, contact_role, contact_linkedin, connection_sent_on, messaged, messaged_on, followup1_on,
    followup2_on, status, response, screening, interview, result, salary, why_applied, notes
  from jsonb_populate_recordset(null::public.applications, coalesce(payload->'applications', '[]'::jsonb));
  insert into public.contacts (added_on, person, role, company, company_type, linkedin_url, why_targeted,
    messaged, messaged_on, reply, followup1_on, followup2_on, status, message_draft, notes)
  select added_on, person, role, company, company_type, linkedin_url, why_targeted,
    messaged, messaged_on, reply, followup1_on, followup2_on, status, message_draft, notes
  from jsonb_populate_recordset(null::public.contacts, coalesce(payload->'contacts', '[]'::jsonb));
  insert into public.interviews (application_id, scheduled_on, company, role, stage, interviewer, questions,
    answer, mistake, correct_answer, next_action, result)
  select application_id, scheduled_on, company, role, stage, interviewer, questions,
    answer, mistake, correct_answer, next_action, result
  from jsonb_populate_recordset(null::public.interviews, coalesce(payload->'interviews', '[]'::jsonb));
  insert into public.daily_logs (activity_on, applications, direct_outreach, followups, network_actions,
    replies, screenings, interviews, rejections, offers, notes)
  select activity_on, applications, direct_outreach, followups, network_actions,
    replies, screenings, interviews, rejections, offers, notes
  from jsonb_populate_recordset(null::public.daily_logs, coalesce(payload->'daily_logs', '[]'::jsonb))
  on conflict (user_id, activity_on) do update set applications = excluded.applications,
    direct_outreach = excluded.direct_outreach, followups = excluded.followups,
    network_actions = excluded.network_actions, replies = excluded.replies,
    screenings = excluded.screenings, interviews = excluded.interviews,
    rejections = excluded.rejections, offers = excluded.offers, notes = excluded.notes;
  if payload ? 'daily_targets' then
    insert into public.settings (user_id, daily_targets) values (auth.uid(), payload->'daily_targets')
    on conflict (user_id) do update set daily_targets = excluded.daily_targets;
  end if;
end;
$$;
revoke all on function public.import_tracker_bundle(jsonb) from public, anon;
grant execute on function public.import_tracker_bundle(jsonb) to authenticated;
commit;
