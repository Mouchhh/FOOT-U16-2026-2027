import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Store} from './store.mjs';
import {reactionSnapshot,validateEvent} from './attendance.mjs';
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export async function authorize(token,{supabaseUrl,publishableKey},fetcher=fetch){
  if(!token||token.length>8000)throw fail('Connectez-vous au site du club.',401);
  const headers={apikey:publishableKey,Authorization:'Bearer '+token};
  const user=await fetcher(supabaseUrl+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});
  if(!user.ok)throw fail('Connexion expirée. Reconnectez-vous au site.',401);
  const {id}=await user.json();if(!/^[0-9a-f-]{36}$/i.test(id||''))throw fail('Compte invalide.',401);
  const member=await fetcher(supabaseUrl+'/rest/v1/club_members?select=user_id&user_id=eq.'+id+'&active=eq.true',{headers,signal:AbortSignal.timeout(10000)});
  if(!member.ok)throw fail('Accès éducateur refusé.',403);
  const rows=await member.json();if(!Array.isArray(rows)||!rows.some(row=>row.user_id===id))throw fail('Compte non autorisé par le club.',403);
  return id;
}
export function createGateway(config,{adapterFactory,auth=token=>authorize(token,config)}={}){
  const store=new Store(path.join(config.directory,'records')),live=new Map(),rates=new Map();
  const factory=adapterFactory||((owner,callbacks)=>import('./whatsapp.mjs').then(m=>m.createWhatsApp(owner,callbacks)));
  const ownerLocks=new Map();
  async function serial(owner,fn){const previous=ownerLocks.get(owner)||Promise.resolve();const next=previous.catch(()=>{}).then(fn);ownerLocks.set(owner,next);try{return await next;}finally{if(ownerLocks.get(owner)===next)ownerLocks.delete(owner);}}
  async function connect(owner){
    if(live.has(owner))return live.get(owner);
    if(live.size>=(config.maxSessions||4))throw fail('Toutes les connexions du serveur sont utilisées. Contactez le responsable.',503);
    const entry={state:'connecting',qr:null,adapter:null,syncing:null,lastError:null};live.set(owner,entry);
    try{
      entry.adapter=await factory(owner,{directory:path.join(config.directory,'auth'),onState:state=>{if(live.get(owner)!==entry)return;entry.qr=null;Object.assign(entry,state);if(state.state==='ready'){const data=store.read(owner);data.linked=true;store.write(owner,data);}},
      });
      entry.adapter.start().catch(()=>{entry.state='error';entry.qr=null;});return entry;
    }catch{live.delete(owner);throw fail('La passerelle WhatsApp n’a pas pu démarrer.',503);}
  }
  async function refresh(owner,entry,sessionId){
    const data=store.read(owner),event=data.events[sessionId];if(entry?.state!=='ready'||!data.group||!event)return;
    try{
      const snapshot=await entry.adapter.reactions(data.group.id,event.messageId),result=reactionSnapshot(snapshot.members,snapshot.reactions,data.salt);
      Object.assign(event,result,{message:snapshot.message,lastRead:Date.now(),error:null});data.events[sessionId]=event;store.write(owner,data);
    }catch{event.error='Lecture interrompue ; les réactions affichées peuvent être anciennes. Réessayez avant de valider.';store.write(owner,data);}
  }
  function snapshot(owner,sessionId){const data=store.read(owner),entry=live.get(owner),event=data.events[sessionId]||null;return {state:entry?.state||'disconnected',qr:entry?.qr&&entry.qrExpires>Date.now()?entry.qr:null,group:data.group,event};}
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    const parsedUrl=new URL(req.url,'http://gateway'),route=parsedUrl.pathname,sessionId=parsedUrl.searchParams.get('sessionId')||'';
    if(route==='/health'&&req.method==='GET')return send(200,{ok:true,service:'club-whatsapp'});
    const origin=req.headers.origin;if(!config.origins.includes(origin))return send(403,{error:'Origine non autorisée.'});
    res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
    if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE');return send(204,null);}
    const now=Date.now(),ip=req.socket.remoteAddress,bucket=rates.get(ip)||{time:now,count:0};
    if(now-bucket.time>60000){bucket.time=now;bucket.count=0;}bucket.count++;rates.set(ip,bucket);if(rates.size>10000)for(const [key,value]of rates)if(now-value.time>60000)rates.delete(key);
    if(bucket.count>120)return send(429,{error:'Trop de demandes. Réessayez dans une minute.'});
    try{
      const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1],owner=await auth(token);
      let body={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw fail('Demande trop volumineuse.',413);}try{body=JSON.parse(raw||'{}');}catch{throw fail('Demande invalide.');}}
      await serial(owner,async()=>{
        let entry=live.get(owner);
        if(route==='/api/status'&&req.method==='GET'){
          if(!entry&&store.read(owner).linked){entry=await connect(owner);}
          await refresh(owner,entry,sessionId);return send(200,snapshot(owner,sessionId));
        }
        if(route==='/api/connect'&&req.method==='POST'){
          if(entry&&['error','disconnected'].includes(entry.state)){await entry.adapter?.close();live.delete(owner);}
          entry=await connect(owner);return send(200,snapshot(owner,sessionId));
        }
        if(route==='/api/groups'&&req.method==='GET'){if(entry?.state!=='ready')throw fail('Associez d’abord votre compte WhatsApp.',409);return send(200,{groups:await entry.adapter.groups()});}
        if(route==='/api/group'&&req.method==='POST'){
          if(entry?.state!=='ready')throw fail('WhatsApp non connecté.',409);
          const groups=await entry.adapter.groups(),group=groups.find(g=>g.id===body.id);if(!group)throw fail('Groupe inaccessible.',403);
          const data=store.read(owner);data.group=group;data.events={};store.write(owner,data);return send(200,snapshot(owner,sessionId));
        }
        if(route==='/api/announcements'&&req.method==='GET'){
          const data=store.read(owner);if(entry?.state!=='ready'||!data.group)throw fail('Connectez WhatsApp et choisissez le groupe.',409);
          return send(200,{messages:await entry.adapter.announcements(data.group.id)});
        }
        if(route==='/api/event'&&req.method==='POST'){
          const data=store.read(owner);if(!data.group||entry?.state!=='ready')throw fail('Connectez WhatsApp et choisissez un groupe.',409);
          let event;try{event=validateEvent(body);}catch(error){throw fail(error.message);}
          // Le message est vérifié dans le groupe avant toute conservation de son contenu.
          let current;try{current=await entry.adapter.reactions(data.group.id,event.messageId);}catch{throw fail('Ce message n’est pas accessible dans le groupe sélectionné.',400);}
          const result=reactionSnapshot(current.members,current.reactions,data.salt);
          data.events[event.sessionId]={...event,...result,message:current.message,lastRead:Date.now(),error:null};
          const keys=Object.keys(data.events).sort((a,b)=>Date.parse(data.events[b].startsAt)-Date.parse(data.events[a].startsAt));for(const id of keys.slice(12))delete data.events[id];
          store.write(owner,data);return send(200,snapshot(owner,event.sessionId));
        }
        if(route==='/api/disconnect'&&req.method==='DELETE'){
          if(entry){live.delete(owner);await entry.adapter?.stop().catch(()=>{});}
          fs.rmSync(path.join(config.directory,'auth','session-'+owner),{recursive:true,force:true});fs.rmSync(path.join(config.directory,'auth','cache-'+owner),{recursive:true,force:true});store.delete(owner);return send(200,{disconnected:true});
        }
        return send(404,{error:'Action inconnue.'});
      });
    }catch(error){if(!res.headersSent)send(error.status||503,{error:error.status?error.message:'Le service est temporairement indisponible. Réessayez.'});}
  });
  server.requestTimeout=30000;server.headersTimeout=10000;
  return {server,store,async close(){for(const entry of live.values())await entry.adapter?.close();await new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY,origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(!/^https:\/\/[-a-z0-9]+\.supabase\.co$/.test(url||'')||!key||!origins.length)throw Error('Configurer SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY et ALLOWED_ORIGINS.');
  const app=createGateway({supabaseUrl:url,publishableKey:key,origins,directory:path.resolve(process.env.DATA_DIR||'./data'),maxSessions:Math.max(1,Math.min(12,Number(process.env.MAX_SESSIONS)||4))});
  app.server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Passerelle du club démarrée.'));
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();process.exit(0);});
}
