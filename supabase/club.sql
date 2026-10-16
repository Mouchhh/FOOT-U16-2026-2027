-- Un projet Supabase dédié au club. À exécuter dans le SQL Editor, une seule fois.
-- Les utilisateurs sont invités dans Authentication avant leur inscription dans club_members.
begin;
create table public.club_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 1 and 70),
 active boolean not null default true
);
alter table public.club_members enable row level security;

create function public.club_is_member() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.club_members where user_id = auth.uid() and active); $$;
revoke all on function public.club_is_member() from public, anon;
grant execute on function public.club_is_member() to authenticated;
create policy members_read on public.club_members for select to authenticated
 using ((select public.club_is_member()));
revoke all on public.club_members from public, anon, authenticated;
grant select on public.club_members to authenticated;

create table public.club_documents (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references public.club_members(user_id) on delete cascade,
 kind text not null check (kind in ('training','report','composition')),
 source_id text not null check (length(source_id) between 1 and 100),
 title text not null check (length(trim(title)) between 1 and 150),
 payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 8388608),
 revision integer not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 unique(owner_id,kind,source_id)
);
create index club_documents_recent on public.club_documents(updated_at desc,id);
alter table public.club_documents enable row level security;
create policy documents_read on public.club_documents for select to authenticated
 using ((select public.club_is_member()));
create policy documents_insert on public.club_documents for insert to authenticated
 with check ((select public.club_is_member()) and owner_id = (select auth.uid()));
create policy documents_update on public.club_documents for update to authenticated
 using ((select public.club_is_member()) and owner_id = (select auth.uid()))
 with check ((select public.club_is_member()) and owner_id = (select auth.uid()));
create policy documents_delete on public.club_documents for delete to authenticated
 using ((select public.club_is_member()) and owner_id = (select auth.uid()));
-- Écriture uniquement par RPC : protège également les versions contre les mises à jour concurrentes.
revoke all on public.club_documents from public, anon, authenticated;
grant select on public.club_documents to authenticated;

create function public.club_publish_document(
 p_kind text,p_source_id text,p_title text,p_payload jsonb,p_expected_revision integer,p_expected_id uuid default null
) returns public.club_documents
language plpgsql security definer set search_path = '' as $$
declare result public.club_documents; actor uuid := auth.uid();
begin
 if actor is null or not public.club_is_member() then
  raise exception 'Accès réservé aux éducateurs autorisés' using errcode = '42501';
 end if;
 if p_expected_revision = 0 then
  insert into public.club_documents(owner_id,kind,source_id,title,payload)
   values(actor,p_kind,p_source_id,p_title,p_payload)
   on conflict(owner_id,kind,source_id) do nothing returning * into result;
 elsif p_expected_revision > 0 then
  update public.club_documents set title=p_title,payload=p_payload,revision=revision+1,updated_at=now()
   where owner_id=actor and kind=p_kind and source_id=p_source_id and revision=p_expected_revision and id=p_expected_id
   returning * into result;
 end if;
 if result.id is null then
  raise exception 'Version modifiée : récupérer la version partagée avant de réessayer' using errcode = '40001';
 end if;
 return result;
end; $$;
revoke all on function public.club_publish_document(text,text,text,jsonb,integer,uuid) from public,anon;
grant execute on function public.club_publish_document(text,text,text,jsonb,integer,uuid) to authenticated;

create function public.club_remove_document(p_id uuid,p_expected_revision integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.club_is_member() then
  raise exception 'Accès réservé aux éducateurs autorisés' using errcode = '42501';
 end if;
 delete from public.club_documents where id=p_id and owner_id=auth.uid() and revision=p_expected_revision;
 if not found then
  raise exception 'Version modifiée ou document non autorisé' using errcode = '40001';
 end if;
end; $$;
revoke all on function public.club_remove_document(uuid,integer) from public,anon;
grant execute on function public.club_remove_document(uuid,integer) to authenticated;
commit;
