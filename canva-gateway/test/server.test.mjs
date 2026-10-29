import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createCanvaGateway,Vault,authorize,runtimeConfig} from '../server.mjs';
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002',origin='https://club.example';
const key='a'.repeat(64);
test('Render free configuration uses supplied HTTPS origin and temporary storage without a disk',()=>{
 const env={RENDER_EXTERNAL_URL:'https://vestiaire-canva.onrender.com',CANVA_CLIENT_ID:'test',CANVA_CLIENT_SECRET:'test-secret',TOKEN_ENCRYPTION_KEY:key,SUPABASE_URL:'https://club.example',SUPABASE_PUBLISHABLE_KEY:'public',ALLOWED_ORIGINS:origin};
 const config=runtimeConfig(env);assert.equal(config.publicURL,env.RENDER_EXTERNAL_URL);assert.equal(config.directory,'/tmp/vestiaire-canva');
 const custom=runtimeConfig({...env,PUBLIC_URL:'https://canva.club.example',DATA_DIR:'/custom'});assert.equal(custom.publicURL,'https://canva.club.example');assert.equal(custom.directory,'/custom');
 assert.throws(()=>runtimeConfig({...env,CANVA_CLIENT_SECRET:''}),/CANVA_CLIENT_SECRET/);
 assert.throws(()=>runtimeConfig({...env,RENDER_EXTERNAL_URL:''}),/PUBLIC_URL/);
});
test('encrypted vault: persistence, no cleartext, tamper and cross-owner protection',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'canva-vault-'));
 try{
  const vault=new Vault(directory,key),value={tokens:{access:'PRIVATE_ACCESS',refresh:'PRIVATE_REFRESH'},jobs:[]};vault.write(A,value);
  const raw=fs.readFileSync(vault.file(A),'utf8');assert.ok(!raw.includes('PRIVATE'));assert.deepEqual(new Vault(directory,key).read(A),value);
  assert.equal(fs.statSync(vault.file(A)).mode&0o777,0o600);
  fs.copyFileSync(vault.file(A),vault.file(B));assert.throws(()=>vault.read(B));
  assert.throws(()=>new Vault(directory,'bad'));assert.throws(()=>vault.file('../escape'));
  vault.remove(A);assert.equal(vault.read(A),null);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('club authentication checks actual user and active membership',async()=>{
 const config={supabaseUrl:'https://club.supabase.co',publishableKey:'public'};let calls=0;
 const valid=async()=>Response.json(++calls===1?{id:A}:[{user_id:A}]);
 assert.equal(await authorize('club-token',config,valid),A);
 await assert.rejects(authorize('',config,valid),e=>e.status===401);
 calls=0;await assert.rejects(authorize('revoked',config,async()=>Response.json(++calls===1?{id:A}:[])),e=>e.status===403);
});
test('OAuth PKCE, browser binding, consent refusal, persistence, refresh rotation, isolated imports and revocation',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'canva-api-'));let time=Date.now(),refreshes=0,imports=0,blocked=false;
 const requests=[],auth=async token=>{if(blocked||!['a','b'].includes(token))throw Object.assign(Error('Accès refusé.'),{status:403});return token==='a'?A:B;};
 const fetcher=async(url,options)=>{
  requests.push({url,options});
  if(url.endsWith('/oauth/token')){
   const params=new URLSearchParams(options.body);
   assert.ok(options.headers.Authorization.startsWith('Basic '));
   if(params.get('grant_type')==='refresh_token'){assert.equal(params.get('refresh_token'),refreshes?'refresh-rotated':'refresh-original');refreshes++;}
   else{assert.equal(params.get('code'),'test-code');assert.ok(params.get('code_verifier').length>=43);}
   return Response.json({access_token:'access-'+refreshes,refresh_token:refreshes?'refresh-rotated':'refresh-original',expires_in:3600});
  }
  if(url.endsWith('/oauth/revoke'))return new Response(null,{status:200});
  if(url.endsWith('/imports')){
   assert.equal(options.headers['Content-Type'],'application/octet-stream');
   const meta=JSON.parse(options.headers['Import-Metadata']);assert.equal(Buffer.from(meta.title_base64,'base64').toString(),'Causerie exacte éà ⚽');
   imports++;return Response.json({job:{id:'job-'+imports,status:'in_progress'}});
  }
  if(url.includes('/imports/job-'))return Response.json({job:{id:url.split('/').at(-1),status:'success',result:{designs:[{id:'design-a',urls:{edit_url:'https://www.canva.com/design/test/edit'}}]}}});
  throw Error('Unexpected destination');
 };
 const config={publicURL:'http://127.0.0.1:3001',development:true,clientId:'client',clientSecret:'private-secret',encryptionKey:key,directory,origins:[origin]};
 const app=createCanvaGateway(config,{fetcher,auth,now:()=>time});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.server.address().port;
 async function api(route,{owner='a',method='GET',headers={},body}={}){return fetch(base+route,{method,headers:{Origin:origin,Authorization:'Bearer '+owner,...headers},body,redirect:'manual'});}
 async function start(owner='a',returnURL=''){
  const response=await fetch(base+'/oauth/start',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({credential:owner,return_url:returnURL}),redirect:'manual'});assert.equal(response.status,302);
  return {cookie:response.headers.get('set-cookie').split(';')[0],location:new URL(response.headers.get('location'))};
 }
 const callback=(state,cookie,extra='code=test-code')=>fetch(base+'/oauth/callback?state='+state+'&'+extra,{headers:cookie?{Cookie:cookie}:{},redirect:'manual'});
 try{
  assert.equal((await (await api('/api/status')).json()).connected,false);
  assert.equal((await api('/api/status',{owner:''})).status,403);
  assert.equal((await fetch(base+'/api/status',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(base+'/oauth/start?ticket=forged',{redirect:'manual'})).status,404);
  assert.equal((await fetch(base+'/oauth/start',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({credential:'a'}),redirect:'manual'})).status,403);
  for(const returnURL of ['https://evil.example/canva-return.html','https://club.example/other-page','https://club.example/canva-return.html?redirect=evil']){
   assert.equal((await fetch(base+'/oauth/start',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({credential:'a',return_url:returnURL}),redirect:'manual'})).status,400);
  }
  const denied=await start();assert.equal((await callback(denied.location.searchParams.get('state'),denied.cookie,'error=access_denied')).status,400);
  assert.equal(app.vault.read(A),null);
  const pending=await start('a','https://club.example/site/canva-return.html'),state=pending.location.searchParams.get('state');
  assert.equal(pending.location.origin,'https://www.canva.com');assert.equal(pending.location.searchParams.get('code_challenge_method'),'S256');
  assert.equal(pending.location.searchParams.get('scope'),'design:content:write');
  assert.equal((await callback(state,null)).status,400);assert.equal(app.vault.read(A),null);
  const returned=await callback(state,pending.cookie);assert.equal(returned.status,303);assert.equal(returned.headers.get('location'),'https://club.example/site/canva-return.html');assert.equal((await callback(state,pending.cookie)).status,400);
  const verifier=new URLSearchParams(requests.find(r=>r.url.endsWith('/oauth/token')).options.body).get('code_verifier');
  const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(verifier).digest('base64url'),pending.location.searchParams.get('code_challenge'));
  assert.equal((await (await api('/api/status')).json()).connected,true);
  assert.equal((await (await api('/api/status',{owner:'b'})).json()).connected,false);
  const headers={'Content-Type':'application/vnd.openxmlformats-officedocument.presentationml.presentation','X-Design-Title':Buffer.from('Causerie exacte éà ⚽').toString('base64')};
  time+=3600000;
  const job=await (await api('/api/imports',{method:'POST',headers,body:Buffer.from([80,75,3,4,1,2,3])})).json();assert.equal(job.id,'job-1');assert.equal(refreshes,1);assert.equal(app.vault.read(A).tokens.refresh,'refresh-rotated');
  const complete=await (await api('/api/imports/job-1')).json();assert.equal(complete.status,'success');assert.equal(complete.designs[0].edit_url,'https://www.canva.com/design/test/edit');
  time+=3600000;
  const concurrent=await Promise.all([api('/api/imports/job-1'),api('/api/imports/job-1')]);
  assert.ok(concurrent.every(response=>response.status===200));assert.equal(refreshes,2,'Only one refresh for two simultaneous requests');
  const other=await start('b');await callback(other.location.searchParams.get('state'),other.cookie);
  assert.equal((await api('/api/imports/job-1',{owner:'b'})).status,404);
  assert.equal((await api('/api/imports',{method:'POST',headers,body:Buffer.from('not a zip')})).status,400);
  blocked=true;assert.equal((await api('/api/status')).status,403);blocked=false;
  const disconnect=await (await api('/api/connection',{method:'DELETE'})).json();assert.equal(disconnect.revoked,true);assert.equal(app.vault.read(A),null);
  assert.equal((await api('/api/imports/job-1')).status,409);
  assert.ok(requests.every(r=>r.url.startsWith('https://api.canva.com/rest/v1/')));
 }finally{await new Promise(resolve=>app.server.close(resolve));fs.rmSync(directory,{recursive:true,force:true});}
});
test('invalid refresh grants, foreign edit URLs and failed revocation do not expose tokens or false success',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'canva-errors-'));let behavior='expired';
 const config={publicURL:'http://127.0.0.1:3001',development:true,clientId:'client',clientSecret:'secret',encryptionKey:key,directory,origins:[origin]};
 const app=createCanvaGateway(config,{auth:async()=>A,fetcher:async url=>{
  if(url.endsWith('/oauth/token'))return Response.json({error:'invalid_grant'},{status:400});
  if(url.endsWith('/oauth/revoke'))return Response.json({error:'temporary'},{status:503});
  return Response.json({job:{id:'job-bad',status:'success',result:{designs:[{id:'bad',urls:{edit_url:'https://evil.example/design'}}]}}});
 }});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.server.address().port;
 const record=()=>({tokens:{access:'secret-access',refresh:'secret-refresh',expires:behavior==='expired'?1:Date.now()+3600000},jobs:[{id:'job-bad',until:Date.now()+3600000}]});
 try{
  app.vault.write(A,record());let response=await fetch(base+'/api/imports/job-bad',{headers:{Origin:origin,Authorization:'Bearer a'}});
  assert.equal(response.status,409);assert.equal(app.vault.read(A),null);assert.ok(!(await response.text()).includes('secret-'));
  behavior='foreign-link';app.vault.write(A,record());response=await fetch(base+'/api/imports/job-bad',{headers:{Origin:origin,Authorization:'Bearer a'}});assert.equal(response.status,502);
  response=await fetch(base+'/api/connection',{method:'DELETE',headers:{Origin:origin,Authorization:'Bearer a'}});
  assert.equal((await response.json()).revoked,false);assert.equal(app.vault.read(A),null);
  assert.throws(()=>createCanvaGateway({...config,publicURL:'http://public.example',development:false}));
 }finally{await new Promise(resolve=>app.server.close(resolve));fs.rmSync(directory,{recursive:true,force:true});}
});
