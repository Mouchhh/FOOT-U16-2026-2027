-- Base PostgreSQL temporaire vide uniquement. Ne jamais exécuter en production.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as
 $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
\ir ../supabase/club.sql
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','coach@example.test');
insert into public.club_members values('00000000-0000-4000-8000-000000000001','Coach réel',true);
insert into public.club_documents(owner_id,kind,source_id,title,payload) values
 ('00000000-0000-4000-8000-000000000001','composition','real','Privé','{"clubReference":true,"category":"U17"}');
\ir ../supabase/club-accounts.sql
\ir ../supabase/club-presence.sql
\ir ../supabase/club-references.sql
\ir ../supabase/club-canva-review.sql
\ir ../supabase/club-canva-review.sql
create temp table reviewer_invite as select * from public.club_authorize_canva_reviewer('review@example.test');
insert into auth.users(id,email,raw_user_meta_data)
 select '00000000-0000-4000-8000-000000000002',invited_email,
 jsonb_build_object('club_activation_code',activation_code,'first_name','Test','last_name','Canva') from reviewer_invite;
insert into public.club_presence(user_id,session_id) select user_id,gen_random_uuid() from public.club_members;
-- The actor stays isolated even if their email or user-editable metadata change.
update auth.users set email='changed@example.test',raw_user_meta_data='{"admin":true,"review_only":false}'
 where id='00000000-0000-4000-8000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$begin
 if not public.club_is_member() or not public.club_is_test_account() then raise exception 'Reviewer membership missing';end if;
 if (select count(*) from public.club_documents)<>0 then raise exception 'Real documents exposed';end if;
 if (select count(*) from public.club_members)<>1 then raise exception 'Real members exposed';end if;
 if (select count(*) from public.club_connected_coaches())<>1 then raise exception 'Real presence exposed';end if;
 if (select count(*) from public.club_educator_activity())<>1 then raise exception 'Real activity exposed';end if;
 if public.club_reference_overview()->'references'<>'[]'::jsonb then raise exception 'Real references exposed';end if;
 begin perform public.club_review_reference(gen_random_uuid(),1,true);raise exception 'Review RPC allowed';exception when insufficient_privilege then null;end;
 begin perform * from public.club_test_accounts;raise exception 'Classification readable';exception when insufficient_privilege then null;end;
 begin perform * from public.club_authorize_canva_reviewer('escape@example.test');raise exception 'Admin function allowed';exception when insufficient_privilege then null;end;
 perform public.club_publish_document('composition','demo','Démonstration','{}',0);
 if (select count(*) from public.club_documents)<>1 then raise exception 'Own document missing';end if;
 if exists(select 1 from public.club_documents where title='Privé') then raise exception 'Foreign document visible';end if;
 begin perform public.club_remove_document('00000000-0000-4000-8000-000000000099',1);raise exception 'Foreign removal allowed';exception when serialization_failure then null;end;
end $$;
-- Ordinary educators retain their original access and are not reclassified.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$begin
 if public.club_is_test_account() then raise exception 'Normal coach restricted';end if;
 if (select count(*) from public.club_documents)<>2 then raise exception 'Normal document access changed';end if;
 if (select count(*) from public.club_members)<>2 then raise exception 'Normal member access changed';end if;
 if (select count(*) from public.club_educator_activity())<>2 then raise exception 'Normal RPC changed';end if;
 if jsonb_array_length(public.club_reference_overview()->'references')<>1 then raise exception 'Normal references missing';end if;
end $$;
reset role;
-- Refuse to reclassify an existing account, and preserve all real documents.
do $$begin
 begin perform * from public.club_authorize_canva_reviewer('coach@example.test');raise exception 'Existing account converted';exception when raise_exception then
  if sqlerrm='Existing account converted' then raise;end if;
 end;
 if not exists(select 1 from public.club_documents where title='Privé') then raise exception 'Real document deleted';end if;
end $$;
update public.club_invitations set active=false where email='review@example.test';
-- Email changes do not match the invitation trigger: deactivate by UUID as well.
update public.club_members set active=false where user_id='00000000-0000-4000-8000-000000000002';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$begin
 if (select count(*) from public.club_documents)<>0 then raise exception 'Inactive account reads';end if;
 begin perform public.club_publish_document('composition','new','Denied','{}',0);raise exception 'Inactive account writes';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: isolated reviewer, own documents, protected metadata and RPCs, normal coach access, idempotent migration, preserved data and revocation';
