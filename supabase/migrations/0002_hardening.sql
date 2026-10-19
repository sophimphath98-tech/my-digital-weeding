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
