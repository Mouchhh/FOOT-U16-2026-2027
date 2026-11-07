import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync('club-network.js','utf8');
const fn=code.slice(code.indexOf('async function clubNetworkAfterLogin('),code.indexOf('async function clubNetworkLogout('));
function harness(mode){
 const events=[];
 const ctx=vm.createContext({
  clubNetworkTimer:null,clearInterval:()=>{},setInterval:()=>1,
  clubNetworkStoreSession:()=>events.push('session'),
  clubNetworkLoadMember:async()=>{events.push('membership');if(mode==='denied')throw Object.assign(new Error('denied'),{status:403});return mode!=='rebinding';},
  clubNetworkBound:()=>mode==='allowed',showClubHome:()=>events.push('home'),
  clubNetworkSync:()=>{throw Error('Login must not await document sync');},
  clubNetworkQueueSync:()=>{events.push('sync');return new Promise(()=>{});},
  URL,location:{href:'https://club.test/index.html?auth=login'},history:{state:null,replaceState:()=>{}},
  document:{dispatchEvent:()=>events.push('ready')},CustomEvent:class{},
 });
 vm.runInContext(fn,ctx);return {ctx,events};
}
let {ctx,events}=harness('allowed');
await Promise.race([ctx.clubNetworkAfterLogin({}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Document transfer blocked login')),500))]);
assert.deepEqual(events,['session','membership','home','ready','sync']);
({ctx,events}=harness('denied'));await assert.rejects(ctx.clubNetworkAfterLogin({}),e=>e.status===403);assert.deepEqual(events,['session','membership']);
({ctx,events}=harness('rebinding'));await ctx.clubNetworkAfterLogin({});assert.deepEqual(events,['session','membership']);
console.log('PASS verified login opens before stalled sync; denied and rebinding accounts never open home');
