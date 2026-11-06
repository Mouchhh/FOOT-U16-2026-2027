// Public FFF page relay. Never forwards user credentials to the upstream site.
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({code:'method_not_allowed'},405);
 try{
  const auth=req.headers.get('Authorization')||'';
  if(!auth.startsWith('Bearer '))return reply({code:'unauthorized'},401);
  const user=await fetch(Deno.env.get('SUPABASE_URL')+'/auth/v1/user',{headers:{Authorization:auth,apikey:Deno.env.get('SUPABASE_ANON_KEY')||''},signal:AbortSignal.timeout(5000)});
  if(!user.ok)return reply({code:'unauthorized'},401);
  const input=await req.json();let url:URL;
  try{url=new URL(input.sourceURL);}catch{return reply({code:'invalid_source'},400);}
  if(url.protocol!=='https:'||url.hostname!=='epreuves.fff.fr'||url.port||url.username||url.password||url.search||url.hash||!/^\/competition\/(club|engagement|championnat)\/[A-Za-z0-9_/-]+$/.test(url.pathname))return reply({code:'invalid_source'},400);
  const upstream=await fetch(url.href,{redirect:'error',headers:{Accept:'text/html','Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
  if(!upstream.ok)return reply({code:'fff_unavailable'},502);
  const reader=upstream.body?.getReader();if(!reader)return reply({code:'fff_unavailable'},502);
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4000000){await reader.cancel();return reply({code:'fff_page_too_large'},502);}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  return reply({sourceURL:url.href,html:new TextDecoder().decode(bytes),fetchedAt:new Date().toISOString()});
 }catch{return reply({code:'fff_unavailable'},502);}
});
