// Pass the locally generated installer using MANAGER_INSTALL_SQL. Target emails are anonymized here.
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
await db.exec(await readFile(new URL('../supabase/club.sql',import.meta.url),'utf8'));
const aliases=new Map();let installer=await readFile(process.env.MANAGER_INSTALL_SQL,'utf8');installer=installer.replace(/[a-z0-9._%+-]+@gmail\.com/g,email=>{if(!aliases.has(email))aliases.set(email,`director${aliases.size+1}@example.test`);return aliases.get(email);});assert.equal(aliases.size,3);
const ids=Array.from({length:4},(_,i)=>'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
async function member(i,active=true){await db.query('insert into auth.users values($1,$2)',[ids[i],`director${i+1}@example.test`]);await db.query('insert into public.club_members(user_id,display_name,active) values($1,$2,$3)',[ids[i],'Compte test '+i,active]);}
await member(0);await member(1);
await assert.rejects(db.exec(installer),e=>e.message.includes('Compte absent'));await db.exec('rollback');assert.equal((await db.query("select to_regclass('public.club_management_access') as t")).rows[0].t,null);
await member(2,false);await assert.rejects(db.exec(installer),e=>e.message.includes('Compte absent'));await db.exec('rollback');assert.equal((await db.query('select active from public.club_members where user_id=$1',[ids[2]])).rows[0].active,false);
await db.query('update public.club_members set active=true where user_id=$1',[ids[2]]);await member(3);await db.exec(installer);
const result=await db.query('select role,categories from public.club_management_access');assert.equal(result.rows.length,3);assert(result.rows.every(r=>r.role==='director'&&r.categories.length===0));
await db.query("insert into public.club_management_access values($1,'pole','{U17}')",[ids[3]]);await db.exec(installer);assert.equal((await db.query('select role from public.club_management_access where user_id=$1',[ids[3]])).rows[0].role,'pole');assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,4);
await db.close();console.log('PASS installer: missing account rolls back, inactive remains inactive, three explicit directors, rerunnable and existing roles preserved.');
