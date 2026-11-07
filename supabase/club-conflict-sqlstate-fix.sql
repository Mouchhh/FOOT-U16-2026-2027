-- Correct existing installations without changing document contents, ACLs or owners.
-- 40001 means a retryable transaction failure, not a document version conflict.
-- PT409 lets PostgREST return an immediate HTTP 409 instead.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';
do $repair$
declare fn record; patched text;
begin
 for fn in
  select p.oid, pg_get_functiondef(p.oid) as definition
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','club_review_internal')
    and p.proname in ('club_publish_document','club_remove_document','club_review_reference')
    and p.prokind='f'
 loop
  patched := replace(fn.definition, '''40001''', '''PT409''');
  if patched <> fn.definition then execute patched; end if;
 end loop;
end $repair$;
notify pgrst, 'reload schema';
commit;
