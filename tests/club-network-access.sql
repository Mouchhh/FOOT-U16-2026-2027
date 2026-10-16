-- Test sur une base PostgreSQL temporaire VIDE uniquement, jamais sur le projet du club.
\set ON_ERROR_STOP on
do $$begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin;end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as
 $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
\if :{?partial_install}
create table public.club_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 1 and 70),
 active boolean not null default true
);
\endif
\ir ../supabase/club.sql
insert into auth.users values
 ('00000000-0000-4000-8000-000000000001','a@example.test'),
 ('00000000-0000-4000-8000-000000000002','b@example.test'),
 ('00000000-0000-4000-8000-000000000003','outside@example.test');
insert into public.club_members(user_id,display_name) values
 ('00000000-0000-4000-8000-000000000001','Coach A'),
 ('00000000-0000-4000-8000-000000000002','Coach B');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.club_publish_document('training','session-a','Séance A','{"value":1}',0);
do $$ begin
 if (select count(*) from public.club_documents)<>1 then raise exception 'Own document missing'; end if;
 begin perform public.club_publish_document('training','session-a','Overwrite','{}',0);raise exception 'Conflict not blocked';exception when serialization_failure then null;end;
 begin update public.club_members set active=false;raise exception 'Membership writable';exception when insufficient_privilege then null;end;
 begin update public.club_documents set payload='{}';raise exception 'Direct update permitted';exception when insufficient_privilege then null;end;
 begin insert into public.club_documents(kind,source_id,title,payload) values('report','x','x','{}');raise exception 'Direct insert permitted';exception when insufficient_privilege then null;end;
 begin delete from public.club_documents;raise exception 'Direct delete permitted';exception when insufficient_privilege then null;end;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$ declare other public.club_documents;begin
 select * into other from public.club_documents limit 1;
 if other.title<>'Séance A' then raise exception 'Colleague read failed';end if;
 begin perform public.club_remove_document(other.id,other.revision);raise exception 'Colleague delete permitted';exception when serialization_failure then null;end;
 begin perform public.club_publish_document('training','session-a','Attack','{}',other.revision,other.id);raise exception 'Colleague update permitted';exception when serialization_failure then null;end;
end $$;
select public.club_publish_document('report','rapport-b','Rapport B','{}',0);
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$ begin
 if (select count(*) from public.club_documents)<>0 then raise exception 'Outsider can read documents';end if;
 if (select count(*) from public.club_members)<>0 then raise exception 'Outsider can read membership';end if;
 begin perform public.club_publish_document('training','x','Attack','{}',0);raise exception 'Outsider can publish';exception when insufficient_privilege then null;end;
end $$;
set role anon;
do $$ begin
 begin perform * from public.club_documents;raise exception 'Anonymous read permitted';exception when insufficient_privilege then null;end;
 begin perform public.club_publish_document('training','x','Attack','{}',0);raise exception 'Anonymous RPC permitted';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.club_members set active=false where display_name='Coach B';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$ begin
 if (select count(*) from public.club_documents)<>0 then raise exception 'Revoked member can read';end if;
 begin perform public.club_publish_document('report','rapport-b','Attack','{}',0);raise exception 'Revoked member can publish';exception when insufficient_privilege then null;end;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$ declare original public.club_documents;changed public.club_documents; recreated public.club_documents;begin
 select * into original from public.club_documents where source_id='session-a';
 select * into changed from public.club_publish_document('training','session-a','Séance actualisée','{"value":2}',original.revision,original.id);
 if changed.revision<>2 then raise exception 'Revision not incremented';end if;
 begin perform public.club_publish_document('training','session-a','Stale','{}',original.revision,original.id);raise exception 'Stale write permitted';exception when serialization_failure then null;end;
 begin perform public.club_remove_document(changed.id,original.revision);raise exception 'Stale deletion permitted';exception when serialization_failure then null;end;
 perform public.club_remove_document(changed.id,changed.revision);
 select * into recreated from public.club_publish_document('training','session-a','Recreated','{}',0);
 begin perform public.club_publish_document('training','session-a','Old device','{}',original.revision,original.id);raise exception 'ABA write permitted';exception when serialization_failure then null;end;
 begin perform public.club_publish_document('unsupported','invalid','Invalid','{}',0);raise exception 'Invalid kind accepted';exception when check_violation then null;end;
 begin perform public.club_publish_document('training','invalid','Invalid','[]',0);raise exception 'Invalid payload accepted';exception when check_violation then null;end;
end $$;
reset role;
-- Réinstaller deux fois avec des données, sans altérer les membres ni les documents.
create temp table reinstall_snapshot as select
 (select jsonb_agg(to_jsonb(m) order by user_id) from public.club_members m) as members,
 (select jsonb_agg(to_jsonb(d) order by id) from public.club_documents d) as documents;
\ir ../supabase/club.sql
\ir ../supabase/club.sql
do $$begin
 if (select members from reinstall_snapshot) is distinct from (select jsonb_agg(to_jsonb(m) order by user_id) from public.club_members m) then raise exception 'Members altered on reinstall';end if;
 if (select documents from reinstall_snapshot) is distinct from (select jsonb_agg(to_jsonb(d) order by id) from public.club_documents d) then raise exception 'Documents altered on reinstall';end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$begin
 if (select count(*) from public.club_documents)<>0 then raise exception 'Reinstall exposed documents';end if;
 if (select count(*) from public.club_members)<>0 then raise exception 'Reinstall exposed members';end if;
 begin perform public.club_publish_document('training','x','Attack','{}',0);raise exception 'Reinstall exposed RPC';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: authorization, conflicts, partial installation and repeat installation preserving all rows' as result;
