// Runs the edge handler with mocked network; does not assert live FFF availability.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let handler,calls=[];
let code=fs.readFileSync('supabase/functions/fff-standings/index.ts','utf8').replace('body:unknown','body').replace('req:Request','req').replace('let url:URL','let url').replace('chunks:Uint8Array[]','chunks');
vm.runInNewContext(code,{Deno:{serve:fn=>handler=fn,env:{get:key=>key==='SUPABASE_URL'?'https://example.supabase.co':'public-key'}},Response,URL,TextDecoder,Uint8Array,AbortSignal,fetch:async(url,options)=>{calls.push({url,options});return String(url).includes('/auth/v1/user')?new Response('{}'):new Response('<table>official</table>')}});
const request=(sourceURL,auth=true)=>new Request('https://relay.example',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer user-session'}:{})},body:JSON.stringify({sourceURL})});
(async()=>{
 assert.equal((await handler(request('https://epreuves.fff.fr/competition/club/123/equipe/x/saison',false))).status,401);assert.equal(calls.length,0);
 for(const url of ['http://epreuves.fff.fr/competition/club/123','https://evil.example/competition/club/123','https://epreuves.fff.fr@evil.example/competition/club/123','https://epreuves.fff.fr/competition/club/123?redirect=secret','https://epreuves.fff.fr/auth']){calls=[];assert.equal((await handler(request(url))).status,400);assert.equal(calls.length,1);}
 calls=[];const result=await handler(request('https://epreuves.fff.fr/competition/club/123/equipe/x/saison'));assert.equal(result.status,200);assert.equal((await result.json()).html,'<table>official</table>');assert.equal(calls[1].options.redirect,'error');assert.equal(calls[1].options.headers.Authorization,undefined);assert.equal(result.headers.get('Cache-Control'),'no-store');console.log('PASS: relay auth, FFF allowlist, redirects disabled, credentials isolated, no cache');
})().catch(e=>{console.error(e);process.exit(1)});
