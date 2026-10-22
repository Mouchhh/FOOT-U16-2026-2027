-- Uniquement sur une base temporaire vide. Ne jamais exécuter sur le club.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as
 $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
\ir ../supabase/club.sql
\ir ../supabase/club-references.sql
insert into auth.users values
 ('00000000-0000-4000-8000-000000000001','lead@example.test'),
 ('00000000-0000-4000-8000-000000000002','coach@example.test'),
 ('00000000-0000-4000-8000-000000000003','outside@example.test');
insert into public.club_members(user_id,display_name) values
 ('00000000-0000-4000-8000-000000000001','Responsable'),
 ('00000000-0000-4000-8000-000000000002','Éducateur');
insert into public.club_sport_leads values('00000000-0000-4000-8000-000000000001');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
select public.club_publish_document('training','exercise','Séance','{"clubReference":true,"clubApproval":"forged"}',0);
do $$declare doc public.club_documents;v jsonb;begin
 select * into doc from public.club_documents where source_id='exercise';
 begin perform public.club_review_reference(doc.id,doc.revision,true);raise exception 'Ordinary educator approved';exception when insufficient_privilege then null;end;
 begin insert into public.club_sport_leads values(auth.uid());raise exception 'Self promotion accepted';exception when insufficient_privilege then null;end;
 begin insert into public.club_document_reviews values(doc.id,doc.revision,auth.uid(),now());raise exception 'Forged approval accepted';exception when insufficient_privilege then null;end;
 v:=public.club_reference_overview();
 if (v->>'can_review')::boolean or v->'references'->0->>'reviewer_id' is not null then raise exception 'False approval or role';end if;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$declare doc public.club_documents;v jsonb;begin
 select * into doc from public.club_documents where source_id='exercise';
 perform public.club_review_reference(doc.id,1,true);
 v:=public.club_reference_overview();
 if not (v->>'can_review')::boolean or v->'references'->0->>'reviewer_id' is distinct from auth.uid()::text then raise exception 'Lead approval missing';end if;
 -- Lead can endorse but cannot modify another educator's original.
 begin perform public.club_publish_document('training','exercise','Overwrite','{}',1,doc.id);raise exception 'Lead overwrote source';exception when serialization_failure then null;end;
end $$;
reset role;
-- Idempotent migration must retain the decision and designated responsible.
\ir ../supabase/club-references.sql
\ir ../supabase/club-references.sql
do $$begin if (select count(*) from public.club_document_reviews)<>1 or (select count(*) from public.club_sport_leads)<>1 then raise exception 'Migration erased decisions';end if;end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$declare doc public.club_documents;v jsonb;begin
 select * into doc from public.club_documents where source_id='exercise';
 perform public.club_publish_document('training','exercise','Edited','{"clubReference":true}',1,doc.id);
 v:=public.club_reference_overview();
 if v->'references'->0->>'reviewer_id' is not null then raise exception 'New revision kept old approval';end if;
 -- Payload flag alone cannot validate the copy.
 perform public.club_publish_document('training','copy','Copy','{"clubApproval":"validated"}',0);
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$declare doc public.club_documents;v jsonb;begin
 select * into doc from public.club_documents where source_id='exercise';
 begin perform public.club_review_reference(doc.id,1,true);raise exception 'Stale review accepted';exception when serialization_failure then null;end;
 perform public.club_review_reference(doc.id,2,true);
 perform public.club_review_reference(doc.id,2,false);
 v:=public.club_reference_overview();if v->'references'->0->>'reviewer_id' is not null then raise exception 'Withdraw did not apply';end if;
 perform public.club_review_reference(doc.id,2,true);
 select * into doc from public.club_documents where source_id='copy';
 begin perform public.club_review_reference(doc.id,1,true);raise exception 'Unproposed document approved';exception when invalid_parameter_value then null;end;
end $$;
reset role;
delete from public.club_sport_leads;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$begin if public.club_reference_overview()->'references'->0->>'reviewer_id' is not null then raise exception 'Former lead still validates';end if;end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$begin
 if (public.club_reference_overview()->>'can_review')::boolean then raise exception 'Former lead kept privilege';end if;
 begin perform public.club_review_reference(gen_random_uuid(),1,true);raise exception 'Former lead approves';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.club_sport_leads values('00000000-0000-4000-8000-000000000001');
update public.club_members set active=false where display_name='Responsable';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$begin if public.club_reference_overview()->'references'->0->>'reviewer_id' is not null then raise exception 'Revoked reviewer still validates';end if;end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$begin
 begin perform public.club_reference_overview();raise exception 'Inactive member reads';exception when insufficient_privilege then null;end;
 begin perform public.club_review_reference(gen_random_uuid(),1,true);raise exception 'Inactive lead approves';exception when insufficient_privilege then null;end;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$begin begin perform public.club_reference_overview();raise exception 'Outsider reads';exception when insufficient_privilege then null;end;end $$;
reset role;
set role anon;
do $$begin
 begin perform public.club_reference_overview();raise exception 'Anon reads';exception when insufficient_privilege then null;end;
 begin perform public.club_review_reference(gen_random_uuid(),1,true);raise exception 'Anon approves';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: roles, RLS, false payload, original ownership, revision checks, withdrawal, reinstall, inactive and anonymous access' as result;
