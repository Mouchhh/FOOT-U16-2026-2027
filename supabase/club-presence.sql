-- À exécuter après club.sql. Présence temporaire des éducateurs, sans toucher aux documents.
-- Script réexécutable ; chaque navigateur publie uniquement sa propre présence authentifiée.
begin;
create table if not exists public.club_presence (
 user_id uuid not null references public.club_members(user_id) on delete cascade,
 session_id uuid not null,
 last_seen timestamptz not null default clock_timestamp(),
 is_online boolean not null default true,
 primary key(user_id,session_id)
);
create index if not exists club_presence_recent on public.club_presence(last_seen);
alter table public.club_presence enable row level security;
revoke all on public.club_presence from public,anon,authenticated;
-- Pas d'accès direct aux sessions, même pour les éducateurs. Lecture agrégée par RPC seulement.
create or replace function public.club_presence_ping(p_session_id uuid,p_online boolean default true)
 returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.club_is_member() then
  raise exception 'Accès réservé aux éducateurs autorisés' using errcode='42501';
 end if;
 if p_online is null then raise exception 'Présence invalide' using errcode='22023';end if;
 insert into public.club_presence(user_id,session_id,last_seen,is_online)
 values(auth.uid(),p_session_id,clock_timestamp(),p_online)
 on conflict(user_id,session_id) do update set last_seen=clock_timestamp(),is_online=excluded.is_online;
 delete from public.club_presence where last_seen<clock_timestamp()-interval '1 day';
end; $$;
revoke all on function public.club_presence_ping(uuid,boolean) from public,anon;
grant execute on function public.club_presence_ping(uuid,boolean) to authenticated;

create or replace function public.club_connected_coaches()
 returns table(user_id uuid,display_name text,last_seen timestamptz)
 language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.club_is_member() then
  raise exception 'Accès réservé aux éducateurs autorisés' using errcode='42501';
 end if;
 return query select m.user_id,m.display_name,max(p.last_seen)
 from public.club_members m join public.club_presence p on p.user_id=m.user_id
 where m.active and p.is_online and p.last_seen>clock_timestamp()-interval '90 seconds'
 group by m.user_id,m.display_name order by m.display_name,m.user_id;
end; $$;
revoke all on function public.club_connected_coaches() from public,anon;
grant execute on function public.club_connected_coaches() to authenticated;
-- Dernière authentification réelle : aucune adresse ni donnée auth n'est exposée.
create or replace function public.club_educator_activity()
 returns table(user_id uuid,display_name text,last_login timestamptz,is_online boolean)
 language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.club_is_member() then
  raise exception 'Accès réservé aux éducateurs autorisés' using errcode='42501';
 end if;
 return query select m.user_id,m.display_name,u.last_sign_in_at,
 exists(select 1 from public.club_presence p where p.user_id=m.user_id and p.is_online and p.last_seen>clock_timestamp()-interval '90 seconds')
 from public.club_members m join auth.users u on u.id=m.user_id
 where m.active order by m.display_name,m.user_id;
end; $$;
revoke all on function public.club_educator_activity() from public,anon;
grant execute on function public.club_educator_activity() to authenticated;
notify pgrst,'reload schema';
commit;
