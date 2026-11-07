import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync('club-network.js','utf8');
const messages=code.slice(code.indexOf('function clubNetworkMessage('),code.indexOf('async function clubNetworkRequest('));
const setter=code.slice(code.indexOf('coachStorageSet=function(key,value){'),code.indexOf('function clubNetworkResume('));
const cases=[
 [new DOMException('No room','QuotaExceededError'),'quota de stockage du navigateur'],
 [new DOMException('Blocked','SecurityError'),'refuse le stockage'],
 [Object.assign(new Error('invalid'),{code:'document_invalid'}),'document à partager est introuvable ou invalide'],
 [Object.assign(new Error('changed'),{code:'local_library_conflict'}),'autre fenêtre'],
 [new TypeError('HiddenSecret private@example.test'),'local-302 / TypeError']
];
for(const [error,expected] of cases){
 let status;
 const ctx=vm.createContext({
  clubNetworkBound:()=>false,coachTeamEncodeLibrary:(_,value)=>value,
  clubNetworkOriginalStorageSet:()=>{throw error;},clubSaveLocalErrors:new Set(),
  clubSaveStatus:(state,detail)=>{status={state,detail};}
 });
 vm.runInContext(messages+setter,ctx);
 assert.throws(()=>ctx.coachStorageSet('vestiaire-saves','[]'),e=>e===error);
 assert.equal(status.state,'error');assert.ok(status.detail.includes(expected),status.detail);
 assert.equal(ctx.clubSaveLocalErrors.has('vestiaire-saves'),true);
 assert.ok(!status.detail.includes('HiddenSecret')&&!status.detail.includes('private@example.test'));
 if(error.name!=='QuotaExceededError')assert.ok(!status.detail.includes('quota de stockage'));
}
console.log('PASS quota, blocked storage, document validation, cross-tab conflict and unknown errors are distinguished safely');
