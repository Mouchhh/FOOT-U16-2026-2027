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

-- These SECURITY DEFINER RPCs bypass RLS, so they need their own safeguards.
-- Optional migrations may not yet be installed. Known signatures only; fail
-- closed if their implementation cannot be recognised. Re-running is safe.
do $migration$
declare sig text; definition text; body text; replacement text;
begin
 foreach sig in array array[
  'public.club_connected_coaches()',
  'public.club_educator_activity()',
  'public.club_reference_overview()',
  'public.club_review_reference(uuid,integer,boolean)'
 ] loop
  if to_regprocedure(sig) is null then continue; end if;
  select pg_get_functiondef(to_regprocedure(sig)),prosrc into definition,body
   from pg_proc where oid=to_regprocedure(sig);
  if position('-- canva-test-isolation' in body)>0 then continue; end if;
  if position('club_connected_coaches' in sig)>0 or position('club_educator_activity' in sig)>0 then
   if position('where m.active' in body)=0 then
    raise exception 'RPC non reconnue : %. Installation annulée.',sig;
   end if;
   replacement:=replace(body,'where m.active','where m.active and (not public.club_is_test_account() or m.user_id=auth.uid()) /* canva-test-isolation */');
   -- Use the same marker as the other patches to ensure idempotence.
   replacement:=E'-- canva-test-isolation\n'||replacement;
  else
   if position(E'begin\n' in body)=0 then
    raise exception 'RPC non reconnue : %. Installation annulée.',sig;
   end if;
   if position('club_reference_overview' in sig)>0 then
    replacement:=replace(body,E'begin\n',E'begin\n -- canva-test-isolation\n if public.club_is_test_account() then return jsonb_build_object(\'scope_version\',2,\'can_review\',false,\'poles\',\'[]\'::jsonb,\'references\',\'[]\'::jsonb); end if;\n');
   else
    replacement:=replace(body,E'begin\n',E'begin\n -- canva-test-isolation\n if public.club_is_test_account() then raise exception \'Validation indisponible pour un compte de test\' using errcode=\'42501\'; end if;\n');
   end if;
  end if;
  execute replace(definition,body,replacement);
 end loop;
end $migration$;

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
