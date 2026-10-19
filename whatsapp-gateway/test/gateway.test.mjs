import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {reactionSnapshot,reactionStatus,validateEvent} from '../attendance.mjs';
import {createGateway,authorize} from '../server.mjs';
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002',origin='https://club.example';
const members=[{id:'person-1',name:'Enzo',aliases:['lid-1']},{id:'person-2',name:'Hugo'},{id:'person-3',name:'Coach',isMe:true},{id:'person-4',name:'Sans réponse'}];
test('thumbs, skin tones, no answer, removal, duplicates and private identifiers',()=>{
 for(const emoji of ['👍','👍🏻','👍🏼','👍🏽','👍🏾','👍🏿'])assert.equal(reactionStatus(emoji),'present');
 for(const emoji of ['👎','👎🏻','👎🏽','👎🏿'])assert.equal(reactionStatus(emoji),'absent');
 for(const emoji of ['', '❤️', '🤔','👍👎'])assert.equal(reactionStatus(emoji),'uncertain');
 const reactions=[{senderId:'lid-1',emoji:'👍🏽',timestamp:100},{senderId:'person-2',emoji:'👎',timestamp:100},{senderId:'outside',emoji:'👍',timestamp:100}];
 const first=reactionSnapshot(members,reactions,'salt');assert.deepEqual(first.responses.map(r=>r.status),['present','absent','uncertain','uncertain']);assert.equal(first.unmatched,1);assert.equal(first.responses[2].isMe,true);assert.ok(!JSON.stringify(first).includes('person-'));
 const removed=reactionSnapshot(members,[],'salt');assert.equal(removed.responses[0].status,'uncertain');assert.equal(removed.responses[0].senderKey,first.responses[0].senderKey);
 const changed=reactionSnapshot(members,[...reactions,{senderId:'person-1',emoji:'👎',timestamp:200}],'salt');assert.equal(changed.responses[0].status,'absent');
 const conflict=reactionSnapshot(members,[{senderId:'person-1',emoji:'👍',timestamp:100},{senderId:'person-1',emoji:'👎',timestamp:100}],'salt');assert.equal(conflict.responses[0].status,'uncertain');
 assert.notEqual(reactionSnapshot(members,reactions,'other-owner').responses[0].senderKey,first.responses[0].senderKey);
 assert.throws(()=>validateEvent({sessionId:'../file',title:'Séance',startsAt:new Date().toISOString(),messageId:'m'}));
});
test('Supabase authenticates the token then checks the active membership',async()=>{
 const calls=[],config={supabaseUrl:'https://club.supabase.co',publishableKey:'public'};
 const fake=async(url,options)=>{calls.push({url,headers:options.headers});return Response.json(calls.length===1?{id:A}:[{user_id:A}]);};
 assert.equal(await authorize('access-token',config,fake),A);assert.equal(calls.length,2);assert.ok(calls[1].url.includes('active=eq.true'));assert.equal(calls[0].headers.Authorization,'Bearer access-token');
 await assert.rejects(authorize('',config,fake),e=>e.status===401);
 let n=0;await assert.rejects(authorize('token',config,async()=>Response.json(++n===1?{id:A}:[])),e=>e.status===403);
});
test('HTTP: coach isolation, exact group and announcement, live replacement, revoked access and deletion',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'club-wa-test-'));let blocked=false,currentReactions=[{senderId:'person-1',emoji:'👍',timestamp:100}];const calls=[];
 const auth=async token=>{if(blocked||!['a','b'].includes(token))throw Object.assign(Error('Accès refusé.'),{status:403});return token==='a'?A:B;};
 const app=createGateway({directory,origins:[origin],maxSessions:4},{auth,adapterFactory:async(owner,{onState})=>({
  async start(){onState({state:'ready'});},async groups(){return [{id:'group-'+owner,name:'Équipe '+owner.slice(-1)}];},
  async announcements(group){calls.push(['announcements',owner,group]);return [{id:'message-'+owner,text:'Mardi entraînement 18h',time:Date.now()/1000}];},
  async reactions(group,message){calls.push(['reactions',owner,group,message]);if(group!=='group-'+owner||message!=='message-'+owner)throw Error('Hors groupe');return {members,reactions:currentReactions,message:{id:message,text:'Annonce',time:Date.now()/1000}};},
  async stop(){calls.push(['stop',owner]);},async close(){}
 })});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.server.address().port;
 async function request(route,token='a',method='GET',body,requestOrigin=origin){const res=await fetch(base+route,{method,headers:{Origin:requestOrigin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:res.status,value:await res.json(),headers:res.headers};}
 try{
  assert.equal((await request('/api/status','','GET')).status,403);assert.equal((await request('/api/status','a','GET',null,'https://evil.example')).status,403);
  assert.equal((await request('/api/connect','a','POST')).value.state,'ready');
  assert.equal((await request('/api/group','a','POST',{id:'group-'+B})).status,403);
  await request('/api/group','a','POST',{id:'group-'+A});
  assert.equal((await request('/api/announcements')).value.messages.length,1);
  const event={sessionId:'training-1',title:'Séance',startsAt:new Date(Date.now()+86400000).toISOString(),messageId:'message-'+A};
  assert.equal((await request('/api/event','a','POST',{...event,messageId:'message-'+B})).status,400);
  const first=await request('/api/event','a','POST',event);assert.equal(first.value.event.responses[0].status,'present');assert.equal(first.headers.get('cache-control'),'no-store');
  assert.equal((await request('/api/status?sessionId=training-1','b')).value.event,null);
  currentReactions=[];const next=await request('/api/status?sessionId=training-1');assert.equal(next.value.event.responses[0].status,'uncertain');
  assert.equal((await request('/api/status?sessionId=another')).value.event,null);
  currentReactions=[{senderId:'person-1',emoji:'👎🏾',timestamp:200}];assert.equal((await request('/api/status?sessionId=training-1')).value.event.responses[0].status,'absent');
  blocked=true;assert.equal((await request('/api/status?sessionId=training-1')).status,403);blocked=false;
  await request('/api/disconnect','a','DELETE');assert.equal((await request('/api/status?sessionId=training-1')).value.event,null);assert.equal(fs.existsSync(app.store.file(A)),false);
  assert.ok(calls.every(c=>c[0]!=='send'));assert.ok(calls.filter(c=>c[0]==='reactions').every(c=>c[2]==='group-'+c[1]));
 }finally{await app.close();fs.rmSync(directory,{recursive:true,force:true});}
});
