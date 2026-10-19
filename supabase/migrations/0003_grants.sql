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
