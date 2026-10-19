-- All migrations in one file, for pasting into the Supabase SQL Editor.
-- Generated from supabase/migrations/*.sql — safe to re-run.

-- ===== supabase/migrations/0001_init.sql
-- Teabkar Digital schema (single event)

create table if not exists public.event (
  id int primary key default 1 check (id = 1),
  groom text not null default '',
  bride text not null default '',
  event_date timestamptz,
  config jsonb not null default '{}'::jsonb,
  text_kh jsonb not null default '{}'::jsonb,
  text_en jsonb not null default '{}'::jsonb,
  sections jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_day (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  date date,
  sort int not null default 0
);

create table if not exists public.timeline_item (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.schedule_day(id) on delete cascade,
  time text not null default '',
  name text not null default '',
  sort int not null default 0
);
create index if not exists timeline_item_day_idx on public.timeline_item(day_id);

create table if not exists public.guest (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  phone text,
  group_tag text,
  lang text not null default 'kh' check (lang in ('kh', 'en')),
  note text,
  opened_at timestamptz,
  open_count int not null default 0,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'yes', 'no')),
  rsvp_count int not null default 0,
  rsvp_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wish (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guest(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 500),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists wish_guest_idx on public.wish(guest_id);

-- Atomic open counter
create or replace function public.track_guest_open(p_code text)
returns void language sql as $$
  update public.guest
     set open_count = open_count + 1,
         opened_at = coalesce(opened_at, now())
   where code = p_code;
$$;

-- RLS on, no public policies: only the service role (server) can access.
alter table public.event enable row level security;
alter table public.schedule_day enable row level security;
alter table public.timeline_item enable row level security;
alter table public.guest enable row level security;
alter table public.wish enable row level security;

-- Public storage bucket for images / music / QR codes (writes go through the server)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- ===== supabase/migrations/0002_hardening.sql
-- Atomic agenda save, wish limit, upload restrictions and login throttling.

-- Replaces the whole agenda in one transaction, so a failed insert can't leave it half-deleted.
-- p_days: [{ "title": text, "date": "YYYY-MM-DD" | null, "items": [{ "time": text, "name": text }] }]
create or replace function public.save_agenda(p_days jsonb)
returns void language plpgsql as $$
declare
  d jsonb;
  d_sort int := 0;
  new_id uuid;
begin
  delete from public.schedule_day where true;
  for d in select value from jsonb_array_elements(p_days) loop
    insert into public.schedule_day (title, date, sort)
    values (coalesce(d->>'title', ''), nullif(d->>'date', '')::date, d_sort)
    returning id into new_id;
    insert into public.timeline_item (day_id, time, name, sort)
    select new_id, coalesce(it->>'time', ''), coalesce(it->>'name', ''), (ord - 1)::int
      from jsonb_array_elements(coalesce(d->'items', '[]'::jsonb)) with ordinality as t(it, ord);
    d_sort := d_sort + 1;
  end loop;
end;
$$;

-- Enforce the per-guest wish limit in the database; the guest row lock serialises concurrent inserts.
create or replace function public.enforce_wish_limit()
returns trigger language plpgsql as $$
begin
  perform 1 from public.guest where id = new.guest_id for update;
  if (select count(*) from public.wish where guest_id = new.guest_id) >= 5 then
    raise exception 'wish_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists wish_limit on public.wish;
create trigger wish_limit before insert on public.wish
  for each row execute function public.enforce_wish_limit();

-- Failed admin logins, used to throttle password guessing.
create table if not exists public.login_attempt (
  id bigint generated always as identity primary key,
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempt_ip_at_idx on public.login_attempt (ip, at);
alter table public.login_attempt enable row level security;

-- Only the server (service role) calls these.
revoke execute on function public.save_agenda(jsonb) from public, anon, authenticated;
revoke execute on function public.track_guest_open(text) from public, anon, authenticated;

-- Uploads go straight from the browser to Storage via signed URLs, so let Storage enforce type and size.
update storage.buckets
   set file_size_limit = 15 * 1024 * 1024,
       allowed_mime_types = array[
         'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif',
         'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-m4a'
       ]
 where id = 'media';

-- ===== supabase/migrations/0003_grants.sql
-- Explicit Data API grants for the server (service_role).
-- Newer Supabase projects no longer expose new public tables/functions to API roles automatically,
-- which shows up as "permission denied for table ..." at runtime. anon/authenticated get nothing:
-- RLS stays on with no policies, and all access goes through the server.

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.track_guest_open(text) to service_role;
grant execute on function public.save_agenda(jsonb) to service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

revoke all on all tables in schema public from anon, authenticated;
