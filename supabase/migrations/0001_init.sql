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
