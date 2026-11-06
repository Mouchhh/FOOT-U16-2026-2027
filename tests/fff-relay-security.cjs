// Mocked edge tests: no claim of live access to FFF.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
let handler,calls=[],upstream=()=>new Response('<table>official</table>'),log=[];
const code=stripTypeScriptTypes(fs.readFileSync('supabase/functions/fff-standings/index.ts','utf8'));
vm.runInNewContext(code,{
 Deno:{serve:fn=>handler=fn,env:{get:key=>key==='SUPABASE_URL'?'https://example.supabase.co':'public-key'}},
 Response,URL,TextDecoder,Uint8Array,AbortSignal,Error,crypto:require('node:crypto').webcrypto,
 console:{error:(...a)=>log.push(a),info:(...a)=>log.push(a)},
 fetch:async(url,options)=>{calls.push({url,options});return String(url).includes('/auth/v1/user')?new Response('{}'):upstream(url,options)},
});
const good='https://epreuves.fff.fr/competition/club/123/equipe/x/saison';
const request=(sourceURL,auth=true)=>new Request('https://relay.example',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer user-session'}:{})},body:JSON.stringify({sourceURL})});
(async()=>{
 assert.equal((await handler(request(good,false))).status,401);assert.equal(calls.length,0);
 for(const url of ['http://epreuves.fff.fr/competition/club/123','https://evil.example/competition/club/123','https://epreuves.fff.fr@evil.example/competition/club/123','https://epreuves.fff.fr/competition/club/123?redirect=secret','https://epreuves.fff.fr/auth']){calls=[];assert.equal((await handler(request(url))).status,400);assert.equal(calls.length,1);}
 calls=[];let result=await handler(request(good));assert.equal(result.status,200);assert.equal((await result.json()).html,'<table>official</table>');assert.equal(calls[1].options.redirect,'manual');assert.equal(calls[1].options.headers.Authorization,undefined);assert.equal(result.headers.get('Cache-Control'),'no-store');
 upstream=()=>new Response('',{status:403});result=await handler(request(good));let body=await result.json();assert.equal(body.code,'fff_http_error');assert.equal(body.upstreamStatus,403);assert.equal(body.stage,'connexion_fff');assert.match(body.reference,/^[a-f0-9-]{36}$/);
 upstream=()=>{const error=Error('network');error.name='TimeoutError';throw error};result=await handler(request(good));assert.equal((await result.json()).code,'fff_timeout');
 upstream=url=>url===good?new Response(null,{status:302,headers:{Location:'/competition/club/123/equipe/x/saison/'}}):new Response('redirected official page');result=await handler(request(good));body=await result.json();assert.equal(result.status,200);assert.equal(body.sourceURL,good);assert.equal(body.html,'redirected official page');
 upstream=()=>new Response(null,{status:302,headers:{Location:'http://127.0.0.1/secret'}});calls=[];result=await handler(request(good));assert.equal((await result.json()).code,'fff_redirect_not_allowed');assert.equal(calls.length,2);
 upstream=()=>new Response(null,{status:302,headers:{Location:good}});result=await handler(request(good));assert.equal((await result.json()).code,'fff_too_many_redirects');
 upstream=()=>new Response('x'.repeat(4000001));result=await handler(request(good));assert.equal((await result.json()).code,'fff_page_too_large');
 upstream=()=>new Response('');result=await handler(request(good));assert.equal((await result.json()).code,'fff_empty_response');
 assert(!JSON.stringify(log).includes('user-session'));
 console.log('PASS: auth, allowlist, safe redirects, bounded reads, exact HTTP/timeout diagnostics and no credential logs');
})().catch(e=>{console.error(e);process.exit(1)});
