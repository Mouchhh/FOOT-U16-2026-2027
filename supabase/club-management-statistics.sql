-- Additive migration after club-management.sql. Read-only, same assigned scope.
begin;
create or replace function public.club_management_statistics() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare access jsonb; result jsonb;
begin
 access:=public.club_management_access_info();
 if not (access->>'allowed')::boolean then raise exception 'Accès Responsable non autorisé' using errcode='42501';end if;
 with visible as (
  select d.* from public.club_documents d
  where d.kind in ('training','report') and public.club_management_can_read(d.kind,d.payload)
 ), recent as (select * from visible order by updated_at desc,id limit 500)
 select jsonb_build_object('generated_at',now(),'total_documents',(select count(*) from visible),
 'truncated',(select count(*)>500 from visible),'documents',coalesce((select jsonb_agg(
  jsonb_build_object('id',r.id,'owner_id',r.owner_id,'kind',r.kind,'source_id',r.source_id,'title',r.title,
  'category',public.club_management_category(r.kind,r.payload),'updated_at',r.updated_at,
  'stats',jsonb_build_object(
   'id',coalesce(r.payload->>'id',r.source_id),
   'teamContext',jsonb_build_object('id',r.payload#>>'{teamContext,id}','team',r.payload#>>'{teamContext,team}'),
   'team',r.payload->>'team','date',r.payload->>'date','time',r.payload->>'time',
   'duration',r.payload->'duration','libraryOnly',r.payload->'libraryOnly','themes',r.payload->'themes',
   'attendance',case when r.kind='training' then jsonb_build_object(
    'version',r.payload#>'{attendance,version}','date',r.payload#>>'{attendance,date}',
    'time',r.payload#>>'{attendance,time}','validatedAt',r.payload#>>'{attendance,validatedAt}',
    'rows',coalesce((select jsonb_agg(jsonb_build_object('id',a->>'id','squadPlayerId',a->>'squadPlayerId',
      'name',left(a->>'name',100),'included',a->'included','status',a->>'status'))
      from jsonb_array_elements(case when jsonb_typeof(r.payload#>'{attendance,rows}')='array'
       then r.payload#>'{attendance,rows}' else '[]'::jsonb end) a),'[]'::jsonb)) else null end,
   'eventType',r.payload->>'eventType','agendaSourceKey',r.payload->>'agendaSourceKey','statsEventId',r.payload->>'statsEventId',
   'info',jsonb_build_object('category',r.payload#>>'{info,category}','date',r.payload#>>'{info,date}',
    'time',r.payload#>>'{info,time}','opponent',left(r.payload#>>'{info,opponent}',150),
    'goalsFor',r.payload#>>'{info,goalsFor}','goalsAgainst',r.payload#>>'{info,goalsAgainst}',
    'duration',r.payload#>>'{info,duration}'),
   'ratings',case when r.kind='report' then (select jsonb_object_agg(k,jsonb_build_object('score',r.payload#>>array['ratings',k,'score']))
    from unnest(array['project','defence','attack','physical','cohesion','attitude','emotions']) k) else null end,
   'players',case when r.kind='report' then coalesce((select jsonb_agg(jsonb_build_object(
    'id',a->>'id','squadPlayerId',a->>'squadPlayerId','name',left(a->>'name',100),'minutes',a->>'minutes',
    'goals',a->>'goals','assists',a->>'assists','yellowCards',a->>'yellowCards','redCards',a->>'redCards'))
    from jsonb_array_elements(case when jsonb_typeof(r.payload->'players')='array'
     then r.payload->'players' else '[]'::jsonb end) a),'[]'::jsonb) else null end
  )) order by r.updated_at desc,r.id) from recent r),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.club_management_statistics() from public,anon;
grant execute on function public.club_management_statistics() to authenticated;
commit;
