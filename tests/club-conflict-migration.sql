-- Run only in the disposable database initialized by club-network-access.sql.
\set ON_ERROR_STOP on
create schema club_review_internal;
create function club_review_internal.club_review_reference(uuid,integer,boolean)
returns void language plpgsql security definer set search_path='' as $$
begin raise exception 'Test version conflict' using errcode='40001';end $$;
revoke all on function club_review_internal.club_review_reference(uuid,integer,boolean) from public;
-- Emulate the deployed old business-error code.
do $$declare fn record;begin
 for fn in select pg_get_functiondef(oid) as definition from pg_proc
 where oid in ('public.club_publish_document(text,text,text,jsonb,integer,uuid)'::regprocedure,
 'public.club_remove_document(uuid,integer)'::regprocedure)
 loop execute replace(fn.definition,'''PT409''','''40001''');end loop;
end $$;
create temporary table before_functions as
 select oid,proowner,proacl from pg_proc where proname in ('club_publish_document','club_remove_document','club_review_reference');
create temporary table before_documents as select * from public.club_documents;
\ir ../supabase/club-conflict-sqlstate-fix.sql
\ir ../supabase/club-conflict-sqlstate-fix.sql
reset role;
do $$begin
 if exists(select 1 from before_functions b join pg_proc p on b.oid=p.oid where b.proowner<>p.proowner or b.proacl is distinct from p.proacl) then raise exception 'ACL or owner changed';end if;
 if exists(select 1 from before_functions b join pg_proc p on b.oid=p.oid where position('40001' in p.prosrc)>0 or position('PT409' in p.prosrc)=0) then raise exception 'Code not migrated';end if;
 if exists((select * from before_documents except select * from public.club_documents) union all (select * from public.club_documents except select * from before_documents)) then raise exception 'Documents changed';end if;
 begin perform club_review_internal.club_review_reference(null,1,true);raise exception 'Missing conflict';exception when sqlstate 'PT409' then null;end;
end $$;
select 'PASS migration idempotence, internal functions, unchanged documents, owners and ACLs';
