-- Base temporaire vide uniquement : migration depuis les droits globaux et tests des pôles.
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
-- Schéma précédent déjà installé chez le club.
create table public.club_sport_leads(user_id uuid primary key references public.club_members(user_id) on delete cascade);
create table public.club_document_reviews(
 document_id uuid primary key references public.club_documents(id) on delete cascade,
 revision integer not null,reviewer_id uuid not null references public.club_members(user_id),reviewed_at timestamptz not null default now()
);
insert into auth.users values
 ('00000000-0000-4000-8000-000000000001','youth@example.test'),
 ('00000000-0000-4000-8000-000000000002','educator@example.test'),
 ('00000000-0000-4000-8000-000000000003','senior@example.test');
insert into public.club_members(user_id,display_name) values
 ('00000000-0000-4000-8000-000000000001','Simon test'),
 ('00000000-0000-4000-8000-000000000002','Éducateur'),
 ('00000000-0000-4000-8000-000000000003','Julien test');
insert into public.club_sport_leads values('00000000-0000-4000-8000-000000000001');
insert into public.club_documents(owner_id,kind,source_id,title,payload) values
 ('00000000-0000-4000-8000-000000000002','training','young','Jeunes','{"category":"U17","clubReference":true}'),
 ('00000000-0000-4000-8000-000000000002','training','adult','Seniors','{"category":"Séniors A","clubReference":true}'),
 ('00000000-0000-4000-8000-000000000002','report','report','Bilan','{"category":"U17","info":{"category":"Seniors"},"clubReference":true}'),
 ('00000000-0000-4000-8000-000000000002','composition','comp','Compo','{"category":"U14/U15","clubReference":true}'),
 ('00000000-0000-4000-8000-000000000002','training','unknown','Catégorie absente','{"team":"Seniors","pole":"seniors","clubReference":true}'),
 ('00000000-0000-4000-8000-000000000002','training','ambiguous','Ambiguë','{"category":"U17 / Seniors","clubReference":true}');
insert into public.club_document_reviews(document_id,revision,reviewer_id)
 select id,1,'00000000-0000-4000-8000-000000000001' from public.club_documents where source_id='young';
\ir ../supabase/club-references.sql
-- Historical rows are kept, without silently granting either new sector.
do $$declare category text;begin
 foreach category in array array['U15 R2','U17 R2','U17 D1','U18 R2','U14 D1'] loop
  if public.club_document_pole('training',jsonb_build_object('category',category))<>'jeunes' then raise exception 'Coach category unsupported: %',category;end if;
 end loop;
 if not exists(select 1 from public.club_sport_leads where pole='unassigned') then raise exception 'Legacy assignment lost';end if;
 if (select count(*) from public.club_document_reviews)<>1 then raise exception 'History lost';end if;
 if public.club_document_pole('report','{"category":"U17","info":{"category":"Seniors"}}')<>'seniors' then raise exception 'Wrong report category';end if;
 if public.club_document_pole('training','{"category":"U19 Féminine"}')<>'jeunes' then raise exception 'Female category not recognised';end if;
 if public.club_document_pole('composition','{"category":"U20"}')<>'jeunes' then raise exception 'U20 not recognised';end if;
 if public.club_document_pole('training','{"category":"U17 / Seniors"}') is not null then raise exception 'Ambiguous category accepted';end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$declare d uuid;begin
 if (public.club_reference_overview()->>'can_review')::boolean then raise exception 'Global rights retained';end if;
 if exists(select 1 from jsonb_array_elements(public.club_reference_overview()->'references') r where r->>'reviewer_id' is not null) then raise exception 'Legacy endorsement still valid';end if;
 select id into d from public.club_documents where source_id='young';
 begin perform public.club_review_reference(d,1,true);raise exception 'Unassigned lead approves';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.club_sport_leads(user_id,pole) values
 ('00000000-0000-4000-8000-000000000001','jeunes'),
 ('00000000-0000-4000-8000-000000000003','seniors');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$declare d public.club_documents;r jsonb;begin
 for d in select * from public.club_documents loop
  if d.source_id in ('young','comp') then perform public.club_review_reference(d.id,1,true);
  elsif d.source_id in ('unknown','ambiguous') then
   begin perform public.club_review_reference(d.id,1,true);raise exception 'Unknown category approved';exception when invalid_parameter_value then null;end;
  else
   begin perform public.club_review_reference(d.id,1,true);raise exception 'Youth lead approved senior document';exception when insufficient_privilege then null;end;
  end if;
 end loop;
 for r in select value from jsonb_array_elements(public.club_reference_overview()->'references') loop
  if (r->>'can_review')::boolean is distinct from (r->>'pole'='jeunes' and r->>'pole' is not null) then raise exception 'Wrong per-document permission';end if;
 end loop;
 begin insert into public.club_sport_leads(user_id,pole) values(auth.uid(),'seniors');raise exception 'Self promotion';exception when insufficient_privilege then null;end;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$declare d public.club_documents;begin
 for d in select * from public.club_documents where source_id in ('young','comp') loop
  begin perform public.club_review_reference(d.id,1,false);raise exception 'Senior lead withdrew youth review';exception when insufficient_privilege then null;end;
 end loop;
 for d in select * from public.club_documents where source_id in ('adult','report') loop perform public.club_review_reference(d.id,1,true);end loop;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$declare d uuid;begin
 select id into d from public.club_documents where source_id='adult';
 begin perform public.club_review_reference(d,1,false);raise exception 'Youth lead withdrew senior review';exception when insufficient_privilege then null;end;
end $$;
reset role;
\ir ../supabase/club-references.sql
\ir ../supabase/club-references.sql
do $$begin
 if (select count(*) from public.club_document_reviews where pole is not null)<>4 then raise exception 'Reinstall erased scoped decisions';end if;
 if (select count(*) from public.club_sport_leads)<>3 then raise exception 'Reinstall erased assignments';end if;
end $$;
-- Category changes require a new endorsement by the newly relevant lead.
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$declare d uuid;begin
 select id into d from public.club_documents where source_id='young';
 perform public.club_publish_document('training','young','Now seniors','{"category":"Seniors","clubReference":true}',1,d);
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
do $$declare d uuid;begin
 select id into d from public.club_documents where source_id='young';
 begin perform public.club_review_reference(d,2,true);raise exception 'Old pole can approve changed category';exception when insufficient_privilege then null;end;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$declare d uuid;begin
 select id into d from public.club_documents where source_id='young';perform public.club_review_reference(d,2,true);
end $$;
reset role;
select 'PASS scoped validation: legacy upgrade, explicit roles, all document types, cross-pole approval/withdrawal denied, unknown/ambiguous rejected, category changes, reinstall and no self-promotion' as result;
