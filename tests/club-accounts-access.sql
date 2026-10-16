-- PostgreSQL temporaire VIDE uniquement. Inclut les tests du schéma existant.
\set ON_ERROR_STOP on
\ir club-network-access.sql
alter table auth.users add column raw_user_meta_data jsonb default '{}'::jsonb;
\ir ../supabase/club-accounts.sql
\ir ../supabase/club-accounts.sql
create temp table test_invitation as select * from public.club_authorize_educator('new@example.test','Nouveau Coach');
do $$begin
 if not public.club_registration_ready() then raise exception 'Registration readiness missing';end if;
 begin insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000004','outside-new@example.test');raise exception 'Unapproved signup allowed';exception when insufficient_privilege then null;end;
 begin insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000004','new@example.test');raise exception 'Email-only impersonation allowed';exception when insufficient_privilege then null;end;
 begin insert into auth.users(id,email,raw_user_meta_data) values('00000000-0000-4000-8000-000000000004','new@example.test','{"club_activation_code":"wrong-code","role":"admin"}');raise exception 'Wrong code allowed';exception when insufficient_privilege then null;end;
end $$;
insert into auth.users(id,email,raw_user_meta_data)
 select '00000000-0000-4000-8000-000000000004','new@example.test',jsonb_build_object('club_activation_code',activation_code,'display_name','Forged name') from test_invitation;
do $$begin
 if not exists(select 1 from public.club_members where user_id='00000000-0000-4000-8000-000000000004' and active and display_name='Nouveau Coach') then raise exception 'Approved member missing';end if;
 if exists(select 1 from auth.users where raw_user_meta_data ? 'club_activation_code') then raise exception 'Plaintext invitation code persisted';end if;
 if exists(select 1 from public.club_invitations where email='new@example.test' and activation_code_hash is not null) then raise exception 'Invitation not consumed';end if;
 begin insert into auth.users(id,email,raw_user_meta_data) select '00000000-0000-4000-8000-000000000005','new@example.test',jsonb_build_object('club_activation_code',activation_code) from test_invitation;raise exception 'Consumed code reusable';exception when insufficient_privilege then null;end;
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000004';
do $$begin
 if not public.club_is_member() then raise exception 'Approved account cannot access';end if;
 begin perform * from public.club_invitations;raise exception 'Invitations exposed';exception when insufficient_privilege then null;end;
 begin perform * from public.club_authorize_educator('attack@example.test','Attack');raise exception 'Coach can authorize accounts';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.club_invitations set active=false where email='new@example.test';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000004';
do $$begin
 if public.club_is_member() then raise exception 'Revoked invitation retains access';end if;
 if (select count(*) from public.club_documents)<>0 then raise exception 'Revoked invitation reads documents';end if;
end $$;
reset role;
set role anon;
do $$begin
 if not public.club_registration_ready() then raise exception 'Anonymous readiness broken';end if;
 begin perform * from public.club_invitations;raise exception 'Anonymous invitation listing';exception when insufficient_privilege then null;end;
 begin perform * from public.club_authorize_educator('attack@example.test','Attack');raise exception 'Anonymous authorization';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: approved address + one-time code, blocked impersonation, server-controlled name, private invitations, revocation and migration rerun' as result;
