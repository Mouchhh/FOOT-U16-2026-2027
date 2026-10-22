-- Base temporaire VIDE uniquement ; aucun appel au projet réel.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as
 $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','restore@example.test');
\ir ../supabase/club.sql
insert into public.club_members(user_id,display_name) values('00000000-0000-4000-8000-000000000001','Coach restauration');
\ir ../supabase/club-accounts.sql
\ir ../supabase/club-references.sql
insert into public.club_sport_leads values('00000000-0000-4000-8000-000000000001','jeunes');
insert into public.club_documents(id,owner_id,kind,source_id,title,payload,revision) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','training','restore','Séance test','{"category":"U17","clubReference":true,"photo":"data:image/png;base64,cGhvdG8=","blocks":[{"title":"Pressing"}]}',7);
insert into public.club_document_reviews(document_id,revision,reviewer_id,pole) values
 ('10000000-0000-4000-8000-000000000001',7,'00000000-0000-4000-8000-000000000001','jeunes');
create temp table saved_members as table public.club_members;
create temp table saved_invitations as table public.club_invitations;
create temp table saved_documents as table public.club_documents;
create temp table saved_leads as table public.club_sport_leads;
create temp table saved_reviews as table public.club_document_reviews;
-- Simule une cible préparée vide. Jamais de TRUNCATE dans le script administrateur.
truncate public.club_document_reviews,public.club_sport_leads,public.club_documents,public.club_members,public.club_invitations cascade;
begin;
insert into public.club_members select * from saved_members;
insert into public.club_invitations select * from saved_invitations;
insert into public.club_documents select * from saved_documents;
insert into public.club_sport_leads select * from saved_leads;
insert into public.club_document_reviews select * from saved_reviews;
commit;
do $$begin
 if exists((table public.club_documents except table saved_documents) union all
 (table saved_documents except table public.club_documents)) then raise exception 'Payload, photo, owner or revision changed';end if;
 if not exists(select 1 from public.club_document_reviews where revision=7 and pole='jeunes') then raise exception 'Review missing';end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$begin
 if (select count(*) from public.club_documents)<>1 then raise exception 'Restored member cannot read';end if;
 begin update public.club_documents set title='Forged';raise exception 'Direct write allowed after restore';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- Un compte Auth absent fait échouer les insertions et annule le lot.
truncate public.club_document_reviews,public.club_sport_leads,public.club_documents,public.club_members,public.club_invitations cascade;
delete from auth.users;
do $$begin
 begin
  insert into public.club_invitations select * from saved_invitations;
  insert into public.club_members select * from saved_members;
  raise exception 'Missing Auth UUID accepted';
 exception when foreign_key_violation then null;
 end;
 if exists(select 1 from public.club_invitations) or exists(select 1 from public.club_members) then raise exception 'Partial restore retained';end if;
end $$;
select 'PASS temporary restore: payload/photo/revision/owner and pole reviews preserved, RLS retained, missing Auth rolls back' as result;
