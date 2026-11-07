import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('club-network.js','utf8');
const flush=source.slice(source.indexOf('async function clubNetworkFlushPending(){'),source.indexOf('function clubNetworkQueueSync('));
let job,remote=[],failRead=true,writes=0;
const payload={id:'document',title:'Local preserved'};
const ctx=vm.createContext({URLSearchParams,
 clubNetworkGeneration:0,clubNetworkBound:()=>true,clubNetworkPendingJobs:()=>job?[structuredClone(job)]:[],
 clubNetworkPending:()=>job?structuredClone(job):null,clubNetworkPendingKey:()=> 'job',
 localStorage:{setItem:(key,value)=>job=JSON.parse(value),removeItem:()=>job=null},
 clubNetworkLibraryKey:()=> 'library',coachStorageGet:()=>JSON.stringify([payload]),
 clubNetworkPayloadId:(_,p)=>p.id,clubNetworkSource:(_,p)=>({payload:p}),
 clubNetworkPublish:async()=>{writes++;throw Object.assign(new Error('conflict'),{code:'PT409'});},
 clubNetworkRequest:async()=>{if(failRead)throw new Error('timeout');return remote;},
 clubNetworkSession:{user:{id:'coach'}},clubNetworkLibrary:()=>[payload],
 clubNetworkPayloadValid:()=>true,clubNetworkSamePayload:(a,b)=>JSON.stringify(a)===JSON.stringify(b),
 clubNetworkRememberVersion:()=>{},navigator:{},activeCoach:{id:'coach'},clubNetworkBase:'test'
});
vm.runInContext(flush,ctx);
const pending=()=>({kind:'training',id:'document',op:'save',stamp:'one',expected:{id:'remote',revision:1}});
job=pending();await assert.rejects(ctx.clubNetworkFlushPending(),/timeout/);
assert.equal(job.conflict,true);await ctx.clubNetworkFlushPending();assert.equal(writes,1,'A failed remote read must not repeat the refused write');
assert.equal(payload.title,'Local preserved');
job=pending();failRead=false;remote=[{id:'remote',revision:2,owner_id:'coach',kind:'training',source_id:'document',payload}];
await ctx.clubNetworkFlushPending();assert.equal(job,null,'An identical server copy still acknowledges a completed save');
job=pending();remote=[{...remote[0],payload:{id:'document',title:'Different remote'}}];
await ctx.clubNetworkFlushPending();assert.equal(job.conflict,true);const count=writes;await ctx.clubNetworkFlushPending();assert.equal(writes,count);
console.log('PASS conflicts survive read timeout, writes stop, identical copy acknowledged, differing copy preserved');
