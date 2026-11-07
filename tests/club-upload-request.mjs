import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync('club-network.js','utf8');
const request=code.slice(code.indexOf('async function clubNetworkRequest('),code.indexOf('function clubNetworkPayloadValid('));
const publish=code.slice(code.indexOf('async function clubNetworkPublish('),code.indexOf('function clubNetworkSamePayload('));
let timeout,call,remembered;
const row={id:'remote',owner_id:'coach',source_id:'document',revision:2};
const ctx=vm.createContext({Blob,Date,JSON,
 clubNetworkReady:true,clubNetworkGeneration:0,clubNetworkBase:'https://test.supabase.co',
 clubNetworkConfig:{publishableKey:'public'},clubNetworkSession:{user:{id:'coach'},access_token:'test',expires_at:Date.now()/1000+3600},
 AbortSignal:{timeout:ms=>{timeout=ms;return undefined;}},
 fetch:async(url,options)=>{call={url,options};return {ok:true,status:200,text:async()=>JSON.stringify(row)};},
 clubNetworkBound:()=>true,clubNetworkPayloadValid:()=>true,
 clubNetworkRememberVersion:(...args)=>remembered=args,
 clubNetworkError:(msg,status,code)=>Object.assign(new Error(msg),{status,code})
});
vm.runInContext(request+publish,ctx);
const source={kind:'training',id:'document',title:'Séance',payload:{diagram:'x'.repeat(6*1024*1024)}};
const result=await ctx.clubNetworkPublish(source,{id:'remote',revision:1});
assert.equal(timeout,90000);
const url=new URL(call.url);assert.equal(url.pathname,'/rest/v1/rpc/club_publish_document');
assert.equal(url.searchParams.get('select'),'id,owner_id,kind,source_id,revision,updated_at');
const sent=JSON.parse(call.options.body);assert.deepEqual(sent.p_payload,source.payload);
assert.equal(sent.p_expected_revision,1);assert.equal(sent.p_expected_id,'remote');
assert.equal(result.revision,2);assert.deepEqual(Array.from(remembered),['training','document',2,'remote']);
await ctx.clubNetworkRequest('/rest/v1/club_members?select=user_id');assert.equal(timeout,20000);
ctx.fetch=async()=>({ok:false,status:409,text:async()=>JSON.stringify({code:'40001'})});
await assert.rejects(ctx.clubNetworkPublish(source,{id:'remote',revision:1}),e=>e.code==='40001');
assert.equal(remembered[2],2,'A failed write never confirms a new revision');
console.log('PASS large upload timeout, compact response selection, unchanged payload and revision checks, short read timeout');
