-- Migration à exécuter APRÈS club.sql. Réexécutable, sans suppression des comptes/documents.
-- Autorise l'inscription uniquement des adresses préalablement approuvées par le club.
begin;
create table if not exists public.club_invitations (
 email text primary key check (email=lower(trim(email)) and length(email) between 3 and 254 and position('@' in email)>1),
 display_name text not null check (length(trim(display_name)) between 1 and 70),
 active boolean not null default true,
 activation_code_hash text check (activation_code_hash is null or activation_code_hash ~ '^[0-9a-f]{64}$')
);
alter table public.club_invitations enable row level security;
revoke all on public.club_invitations from public,anon,authenticated;
-- Reprendre les autorisations existantes, sans réactiver une invitation déjà désactivée.
insert into public.club_invitations(email,display_name,active)
 select lower(trim(u.email)),m.display_name,m.active
 from public.club_members m join auth.users u on u.id=m.user_id
 where u.email is not null
 on conflict(email) do nothing;

create or replace function public.club_guard_registration() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.email is null or not exists(
  select 1 from public.club_invitations i where i.email=lower(trim(new.email)) and i.active
   and i.activation_code_hash=encode(sha256(convert_to(coalesce(new.raw_user_meta_data->>'club_activation_code',''),'UTF8')),'hex')
 ) then
  raise exception 'Inscription réservée aux adresses autorisées par le club' using errcode='42501';
 end if;
 new.raw_user_meta_data:=coalesce(new.raw_user_meta_data,'{}'::jsonb)-'club_activation_code';
 return new;
end; $$;
revoke all on function public.club_guard_registration() from public,anon,authenticated;
drop trigger if exists club_registration_guard on auth.users;
create trigger club_registration_guard before insert on auth.users
 for each row execute function public.club_guard_registration();

create or replace function public.club_register_member() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.club_members(user_id,display_name,active)
 select new.id,i.display_name,true from public.club_invitations i
 where i.email=lower(trim(new.email)) and i.active
 on conflict(user_id) do nothing;
 update public.club_invitations set activation_code_hash=null where email=lower(trim(new.email));
 return new;
end; $$;
revoke all on function public.club_register_member() from public,anon,authenticated;
drop trigger if exists club_registration_member on auth.users;
create trigger club_registration_member after insert on auth.users
 for each row execute function public.club_register_member();

-- Retirer l'autorisation ferme aussi l'accès des comptes déjà créés.
create or replace function public.club_invitation_changed() returns trigger
language plpgsql security definer set search_path='' as $$
declare target_email text;
begin
 target_email:=case when tg_op='DELETE' then old.email else new.email end;
 if tg_op='UPDATE' and old.email<>new.email then
  update public.club_members set active=false where user_id in(select id from auth.users where lower(trim(email))=old.email);
 end if;
 update public.club_members set active=case when tg_op='DELETE' then false else new.active end
 where user_id in(select id from auth.users where lower(trim(email))=target_email);
 if tg_op='DELETE' then return old;end if;
 return new;
end; $$;
revoke all on function public.club_invitation_changed() from public,anon,authenticated;
drop trigger if exists club_invitation_access on public.club_invitations;
create trigger club_invitation_access after update or delete on public.club_invitations
 for each row execute function public.club_invitation_changed();
-- Cette fonction d'administration ne peut pas être appelée depuis le site.
create or replace function public.club_authorize_educator(p_email text,p_name text)
 returns table(invited_email text,activation_code text)
language plpgsql security definer set search_path='' as $$
declare code text:=replace(gen_random_uuid()::text,'-','');normalized text:=lower(trim(p_email));
begin
 insert into public.club_invitations(email,display_name,active,activation_code_hash)
 values(normalized,trim(p_name),true,encode(sha256(convert_to(code,'UTF8')),'hex'))
 on conflict(email) do update set display_name=excluded.display_name,active=true,activation_code_hash=excluded.activation_code_hash;
 return query select normalized,code;
end; $$;
revoke all on function public.club_authorize_educator(text,text) from public,anon,authenticated;

-- Ne révèle aucune adresse : permet à la page de vérifier que le filtre d'inscription est installé.
create or replace function public.club_registration_ready() returns boolean
language sql stable security definer set search_path='' as $$
 select count(*)=2 from pg_catalog.pg_trigger t
 where t.tgrelid='auth.users'::regclass and t.tgname in ('club_registration_guard','club_registration_member') and t.tgenabled<>'D';
$$;
revoke all on function public.club_registration_ready() from public;
grant execute on function public.club_registration_ready() to anon,authenticated;
notify pgrst,'reload schema';
commit;
