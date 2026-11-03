-- Accès de revue Canva : exécuter APRÈS club.sql et club-accounts.sql.
-- Aucun compte créé et aucune donnée supprimée par cette installation.
-- Les comptes ne deviennent isolés que via club_authorize_canva_reviewer().
begin;
create table if not exists public.club_test_accounts (
 email text primary key check (email=lower(trim(email))),
 user_id uuid unique references auth.users(id) on delete set null
);
alter table public.club_test_accounts enable row level security;
revoke all on public.club_test_accounts from public,anon,authenticated;

create or replace function public.club_is_test_account() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.club_test_accounts where user_id=auth.uid()); $$;
revoke all on function public.club_is_test_account() from public,anon;
grant execute on function public.club_is_test_account() to authenticated;

-- Classification au moment de l'inscription, depuis une liste réservée à l'admin.
-- Ne jamais utiliser les métadonnées modifiables par l'utilisateur pour ce rôle.
create or replace function public.club_attach_test_account() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.club_test_accounts t set user_id=new.user_id
 from auth.users u where u.id=new.user_id and t.email=lower(trim(u.email));
 return new;
end $$;
revoke all on function public.club_attach_test_account() from public,anon,authenticated;
drop trigger if exists club_attach_test_account on public.club_members;
create trigger club_attach_test_account after insert on public.club_members
 for each row execute function public.club_attach_test_account();

-- Restrictive policies also constrain any permissive policies already installed.
-- Existing active-member checks remain in force, as do owner-only write RPCs.
drop policy if exists canva_test_documents on public.club_documents;
create policy canva_test_documents on public.club_documents as restrictive
 for select to authenticated
 using (not (select public.club_is_test_account()) or owner_id=(select auth.uid()));
drop policy if exists canva_test_members on public.club_members;
create policy canva_test_members on public.club_members as restrictive
 for select to authenticated
 using (not (select public.club_is_test_account()) or user_id=(select auth.uid()));

-- SECURITY DEFINER RPCs bypass RLS. Preserve each existing implementation in
-- a private schema, and put a guarded wrapper at its existing public signature.
-- No parsing or rewriting of its SQL/PLpgSQL body (case/line endings independent).
create schema if not exists club_review_internal;
revoke all on schema club_review_internal from public,anon,authenticated;
do $migration$
declare sig text; definition text; original_body text; fn text; args text;
 result_type text; protected_body text; clone_definition text;
begin
 foreach sig in array array[
  'public.club_connected_coaches()',
  'public.club_educator_activity()',
  'public.club_reference_overview()',
  'public.club_review_reference(uuid,integer,boolean)'
 ] loop
  if to_regprocedure(sig) is null then continue; end if;
  select pg_get_functiondef(p.oid),p.prosrc,p.proname,
         pg_get_function_arguments(p.oid),pg_get_function_result(p.oid)
   into definition,original_body,fn,args,result_type
   from pg_proc p where p.oid=to_regprocedure(sig);
  if position('-- canva-review-wrapper-v2' in original_body)>0 then continue; end if;
  clone_definition:=regexp_replace(definition,
    '^CREATE OR REPLACE FUNCTION public\.'||fn||'\(',
    'CREATE OR REPLACE FUNCTION club_review_internal.'||fn||'(');
  if clone_definition=definition then
   raise exception 'Signature non reconnue : %. Installation annulée.',sig;
  end if;
  execute clone_definition;
  protected_body:=E'-- canva-review-wrapper-v2\nbegin\n if not public.club_is_member() then raise exception ''Accès réservé aux éducateurs autorisés'' using errcode=''42501''; end if;\n';
  if fn in ('club_connected_coaches','club_educator_activity') then
   protected_body:=protected_body||format(
     ' return query select entry.* from club_review_internal.%I() entry where not public.club_is_test_account() or entry.user_id=auth.uid();',fn);
  elsif fn='club_reference_overview' then
   if result_type not in ('json','jsonb') then
    raise exception 'Type de retour non pris en charge : %. Installation annulée.',result_type;
   end if;
   protected_body:=protected_body||format(
     ' if public.club_is_test_account() then return %L::%s; end if; return club_review_internal.%I();',
     '{"scope_version":2,"can_review":false,"poles":[],"references":[]}',result_type,fn);
  else
   if result_type<>'void' then
    raise exception 'Type de retour non pris en charge : %. Installation annulée.',result_type;
   end if;
   protected_body:=protected_body||format(
     ' if public.club_is_test_account() then raise exception %L using errcode=%L; end if; perform club_review_internal.%I($1,$2,$3); return;',
     'Validation indisponible pour un compte de test','42501',fn);
  end if;
  protected_body:=protected_body||E'\nend';
  execute format('create or replace function public.%I(%s) returns %s language plpgsql security definer set search_path='''' as %L',fn,args,result_type,protected_body);
  execute 'revoke all on function '||sig||' from public,anon';
  execute 'grant execute on function '||sig||' to authenticated';
 end loop;
end $migration$;
revoke all on all functions in schema club_review_internal from public,anon,authenticated;

-- Administration only: authorize a NEW dedicated email and return its private
-- one-time activation code. This never changes an existing user's permissions.
create or replace function public.club_authorize_canva_reviewer(p_email text)
 returns table(invited_email text,activation_code text)
 language plpgsql security definer set search_path='' as $$
declare normalized text:=lower(trim(p_email));
begin
 if exists(select 1 from auth.users where lower(trim(email))=normalized) then
  raise exception 'Cette adresse a déjà un compte. Utilisez une nouvelle adresse dédiée.';
 end if;
 insert into public.club_test_accounts(email) values(normalized)
 on conflict(email) do nothing;
 return query select * from public.club_authorize_educator(normalized,'Test Canva');
end $$;
revoke all on function public.club_authorize_canva_reviewer(text) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;

-- Résultat attendu après une installation complète (aucun secret).
select 'canva-review-v2' as installation,
 to_regprocedure('public.club_authorize_canva_reviewer(text)') as fonction;
