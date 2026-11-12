// Run with PGLITE_MODULE pointing to @electric-sql/pglite/dist/index.js if external.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
await db.exec(await readFile(new URL('../supabase/club.sql',import.meta.url),'utf8'));
const migration=await readFile(new URL('../supabase/club-management.sql',import.meta.url),'utf8');await db.exec(migration);
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004'];
for(const [i,id] of ids.entries()){await db.query('insert into auth.users values($1,$2)',[id,'coach'+i+'@example.test']);await db.query('insert into public.club_members(user_id,display_name) values($1,$2)',[id,'Coach '+i]);}
await db.query(`insert into public.club_management_access values($1,'director','{}'),($2,'pole','{U17}'),($3,'director','{}')`,[ids[0],ids[1],ids[3]]);
const docs=[];
for(const [kind,payload] of [['training',{category:'U17'}],['training',{category:'SENIORS'}],['report',{category:'U17',info:{category:'SENIORS'}}],['composition',{category:'U17 / SENIORS'}],['training',{}],['training',{teamContext:{category:'U17'}}]]){
 const r=await db.query(`insert into public.club_documents(owner_id,kind,source_id,title,payload) values($1,$2,$3,'Test',$4) returning id`,[ids[2],kind,'doc-'+docs.length,JSON.stringify(payload)]);docs.push(r.rows[0].id);
}
async function as(id,fn){await db.exec('set role authenticated');await db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[id]);try{return await fn();}finally{await db.exec('reset role');}}
const overview=()=>db.query('select public.club_management_overview() as value').then(r=>r.rows[0].value);
await as(ids[0],async()=>{const v=await overview();assert.equal(v.documents.length,6);assert.equal(v.educators.length,4);assert.equal(v.access.role,'director');assert.equal(v.documents[0].payload,undefined);});
await as(ids[1],async()=>{const v=await overview();assert.equal(v.documents.length,2);assert.equal(v.educators.length,1);assert(v.documents.every(d=>d.category==='U17'));await assert.rejects(db.query('select public.club_management_document($1)',[docs[1]]),e=>e.code==='42501');const doc=await db.query('select public.club_management_document($1) as value',[docs[0]]);assert.equal(doc.rows[0].value.payload.category,'U17');await assert.rejects(db.exec(`insert into public.club_management_access values('${ids[2]}','director','{}')`),e=>e.code==='42501');await assert.rejects(db.exec('select * from public.club_management_access'),e=>e.code==='42501');});
await as(ids[2],async()=>{assert.equal((await db.query('select public.club_management_access_info() as v')).rows[0].v.allowed,false);await assert.rejects(overview(),e=>e.code==='42501');await assert.rejects(db.query('select public.club_management_document($1)',[docs[0]]),e=>e.code==='42501');});
await db.query('update public.club_members set active=false where user_id=$1',[ids[3]]);await as(ids[3],async()=>{await assert.rejects(overview(),e=>e.code==='42501');});
await db.exec('set role anon');await assert.rejects(overview(),e=>e.code==='42501');await db.exec('reset role');
await db.exec(migration);assert.equal((await db.query('select count(*)::int as n from public.club_management_access')).rows[0].n,3);
await db.close();console.log('PASS: director, pole, educator, inactive, anon, read-only grants, document scope, report category, idempotence.');
