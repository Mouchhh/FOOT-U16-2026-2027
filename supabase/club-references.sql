-- Après club.sql. Réexécutable ; ne supprime ni comptes ni documents.
begin;
create table if not exists public.club_sport_leads (
 user_id uuid primary key references public.club_members(user_id) on delete cascade
);
-- Les anciennes désignations restent conservées mais sans droit global implicite.
alter table public.club_sport_leads add column if not exists pole text not null default 'unassigned';
alter table public.club_sport_leads drop constraint if exists club_sport_leads_pole_check;
alter table public.club_sport_leads add constraint club_sport_leads_pole_check
 check(pole in ('seniors','jeunes','unassigned'));
alter table public.club_sport_leads drop constraint if exists club_sport_leads_pkey;
alter table public.club_sport_leads add primary key(user_id,pole);
alter table public.club_sport_leads enable row level security;
revoke all on public.club_sport_leads from public,anon,authenticated;
create table if not exists public.club_document_reviews (
 document_id uuid primary key references public.club_documents(id) on delete cascade,
 revision integer not null check(revision>0),
 reviewer_id uuid not null references public.club_members(user_id) on delete cascade,
 reviewed_at timestamptz not null default now()
);
-- Les anciennes validations non sectorisées doivent être relues.
alter table public.club_document_reviews add column if not exists pole text;
alter table public.club_document_reviews enable row level security;
revoke all on public.club_document_reviews from public,anon,authenticated;

-- La catégorie de la fiche est la seule source de secteur. Aucun champ JSON de droit
-- ni nom d'équipe ni nom du coach ne peut attribuer un pouvoir de validation.
create or replace function public.club_document_pole(p_kind text,p_payload jsonb) returns text
language sql immutable set search_path='' as $$
 with category as (
  select lower(translate(trim(case when p_kind='report' then p_payload->'info'->>'category'
    when p_kind in ('training','composition') then p_payload->>'category' end),'éèêëÉÈÊË','eeeeEEEE')) as value
 )
 select case
  when value ~ '^u([6-9]|1[0-9]|20)([[:space:]]*/[[:space:]]*u([6-9]|1[0-9]|20))*([[:space:]]+(f|m|feminines?|masculins?|mixte|r[1-3]|d[1-9]|national|regional|district))*$' then 'jeunes'
  when value ~ '^seniors?([[:space:]]+([a-d]|[1-9]|f|m|feminines?|masculins?|mixte|r[1-3]|d[1-9]|national|regional|district))*$' then 'seniors'
  else null end from category;
$$;
revoke all on function public.club_document_pole(text,jsonb) from public,anon,authenticated;

-- Les métadonnées de validation sont indépendantes du JSON modifiable par l'auteur.
create or replace function public.club_reference_overview() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.club_is_member() then
  raise exception 'Accès réservé aux éducateurs autorisés' using errcode='42501';
 end if;
 return jsonb_build_object(
  'scope_version',2,
  'can_review',exists(select 1 from public.club_sport_leads where user_id=auth.uid() and pole in ('seniors','jeunes')),
  'poles',coalesce((select jsonb_agg(pole order by pole) from public.club_sport_leads where user_id=auth.uid() and pole in ('seniors','jeunes')),'[]'::jsonb),
  'references',coalesce((select jsonb_agg(jsonb_build_object(
   'document_id',d.id,'revision',d.revision,'reviewer_id',r.reviewer_id,'reviewed_at',r.reviewed_at,
   'pole',public.club_document_pole(d.kind,d.payload),
   'can_review',exists(select 1 from public.club_sport_leads l where l.user_id=auth.uid() and l.pole=public.club_document_pole(d.kind,d.payload))
  )) from public.club_documents d
  left join public.club_document_reviews r on r.document_id=d.id and r.revision=d.revision
   and r.pole=public.club_document_pole(d.kind,d.payload)
   and exists(select 1 from public.club_sport_leads l join public.club_members m on m.user_id=l.user_id
              where l.user_id=r.reviewer_id and l.pole=r.pole and m.active)
  where d.payload->'clubReference'='true'::jsonb),'[]'::jsonb)
 );
end $$;
create or replace function public.club_review_reference(p_document_id uuid,p_expected_revision integer,p_approve boolean) returns void
language plpgsql security definer set search_path='' as $$
declare doc public.club_documents; doc_pole text;
begin
 if not public.club_is_member() or not exists(select 1 from public.club_sport_leads where user_id=auth.uid() and pole in ('seniors','jeunes')) then
  raise exception 'Validation réservée au responsable sportif désigné' using errcode='42501';
 end if;
 if p_approve is null then raise exception 'Décision manquante' using errcode='22023';end if;
 select * into doc from public.club_documents where id=p_document_id for update;
 if not found or doc.revision is distinct from p_expected_revision then
  raise exception 'Le document a changé : consultez sa nouvelle version' using errcode='40001';
 end if;
 doc_pole:=public.club_document_pole(doc.kind,doc.payload);
 if doc_pole is null then
  raise exception 'Catégorie à préciser : choisissez Seniors ou une catégorie U6 à U20' using errcode='22023';
 end if;
 if not exists(select 1 from public.club_sport_leads where user_id=auth.uid() and pole=doc_pole) then
  raise exception 'Ce document relève d’un autre pôle sportif' using errcode='42501';
 end if;
 if p_approve then
  if doc.payload->'clubReference' is distinct from 'true'::jsonb then
   raise exception 'Ce document ne figure pas dans les repères proposés' using errcode='22023';
  end if;
  insert into public.club_document_reviews(document_id,revision,reviewer_id,reviewed_at,pole)
   values(doc.id,doc.revision,auth.uid(),now(),doc_pole)
   on conflict(document_id) do update set revision=excluded.revision,reviewer_id=excluded.reviewer_id,reviewed_at=excluded.reviewed_at,pole=excluded.pole;
 else
  delete from public.club_document_reviews where document_id=doc.id;
 end if;
end $$;
revoke all on function public.club_reference_overview() from public,anon;
revoke all on function public.club_review_reference(uuid,integer,boolean) from public,anon;
grant execute on function public.club_reference_overview() to authenticated;
grant execute on function public.club_review_reference(uuid,integer,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
