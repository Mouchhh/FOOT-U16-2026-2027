-- À exécuter sur une base PostgreSQL temporaire VIDE, jamais en production.
\set ON_ERROR_STOP on
\ir club-network-access.sql
alter table auth.users add column if not exists last_sign_in_at timestamptz;
\ir ../supabase/club-presence.sql
\ir ../supabase/club-presence.sql
update public.club_members set active=true where display_name='Coach B';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.club_presence_ping('10000000-0000-4000-8000-000000000001');
select public.club_presence_ping('10000000-0000-4000-8000-000000000002');
do $$begin
 if (select count(*) from public.club_connected_coaches())<>1 then raise exception 'Duplicate coach for two sessions';end if;
 begin perform * from public.club_presence;raise exception 'Raw sessions readable';exception when insufficient_privilege then null;end;
 begin update public.club_presence set last_seen=clock_timestamp()+interval '1 year';raise exception 'Client can forge timestamp';exception when insufficient_privilege then null;end;
 begin insert into public.club_presence(user_id,session_id) values('00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004');raise exception 'Forged presence allowed';exception when insufficient_privilege then null;end;
 begin perform public.club_presence_ping(null);raise exception 'Null session allowed';exception when not_null_violation then null;end;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
select public.club_presence_ping('10000000-0000-4000-8000-000000000003');
do $$begin
 if (select count(*) from public.club_connected_coaches())<>2 then raise exception 'Missing second coach';end if;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.club_presence_ping('10000000-0000-4000-8000-000000000001',false);
do $$begin
 if not exists(select 1 from public.club_connected_coaches() where display_name='Coach A') then raise exception 'Logging out one session removed other session';end if;
end $$;
select public.club_presence_ping('10000000-0000-4000-8000-000000000002',false);
do $$begin
 if exists(select 1 from public.club_connected_coaches() where display_name='Coach A') then raise exception 'All logged-out sessions still online';end if;
end $$;
reset role;
update public.club_presence set last_seen=clock_timestamp()-interval '2 minutes' where user_id='00000000-0000-4000-8000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$begin
 if (select count(*) from public.club_connected_coaches())<>0 then raise exception 'Stale presence still online';end if;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$begin
 begin perform public.club_presence_ping('10000000-0000-4000-8000-000000000004');raise exception 'Outsider can heartbeat';exception when insufficient_privilege then null;end;
 begin perform * from public.club_connected_coaches();raise exception 'Outsider can list presence';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.club_members set active=false where display_name='Coach A';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$begin
 begin perform public.club_presence_ping('10000000-0000-4000-8000-000000000004');raise exception 'Revoked heartbeat';exception when insufficient_privilege then null;end;
 begin perform * from public.club_connected_coaches();raise exception 'Revoked listing';exception when insufficient_privilege then null;end;
 begin perform * from public.club_educator_activity();raise exception 'Revoked activity';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.club_members set active=true where display_name='Coach A';
update auth.users set last_sign_in_at='2026-10-15 18:30:00+00' where id='00000000-0000-4000-8000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$begin
 if (select count(*) from public.club_educator_activity())<>2 then raise exception 'Activity missing approved educators';end if;
 if not exists(select 1 from public.club_educator_activity() where display_name='Coach B' and last_login='2026-10-15 18:30:00+00' and not is_online) then raise exception 'Wrong last login or stale online status';end if;
 begin perform * from auth.users;raise exception 'Raw authentication data exposed';exception when insufficient_privilege then null;end;
end $$;
select public.club_presence_ping('10000000-0000-4000-8000-000000000005');
do $$begin
 if not exists(select 1 from public.club_educator_activity() where display_name='Coach A' and is_online) then raise exception 'Missing online educator';end if;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$begin
 begin perform * from public.club_educator_activity();raise exception 'Outsider activity';exception when insufficient_privilege then null;end;
end $$;
set role anon;
do $$begin
 begin perform public.club_presence_ping('10000000-0000-4000-8000-000000000004');raise exception 'Anonymous heartbeat';exception when insufficient_privilege then null;end;
 begin perform * from public.club_connected_coaches();raise exception 'Anonymous listing';exception when insufficient_privilege then null;end;
 begin perform * from public.club_educator_activity();raise exception 'Anonymous activity';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: authenticated presence, deduplication, multiple sessions, logout, expiry, private sessions, server timestamps, real last sign-in, all approved educators and denied unauthorized access' as result;
