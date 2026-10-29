import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const error=(message,status=400)=>Object.assign(new Error(message),{status});
const random=()=>crypto.randomBytes(32).toString('base64url');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const jobPattern=/^[a-zA-Z0-9_-]{1,80}$/;
const API='https://api.canva.com/rest/v1';
export async function authorize(token,config,fetcher=fetch){
 if(!token||token.length>8000)throw error('Connectez-vous au club.',401);
 const headers={apikey:config.publishableKey,Authorization:'Bearer '+token};
 const user=await fetcher(config.supabaseUrl+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});
 if(!user.ok)throw error('Connexion au club expirée.',401);
 const {id}=await user.json();if(!uuid.test(id||''))throw error('Compte invalide.',401);
 const response=await fetcher(config.supabaseUrl+'/rest/v1/club_members?select=user_id&user_id=eq.'+id+'&active=eq.true',{headers,signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw error('Accès éducateur refusé.',403);
 const members=await response.json();
 if(!Array.isArray(members)||!members.some(member=>member.user_id===id))throw error('Compte non autorisé.',403);
 return id;
}
export class Vault {
 constructor(directory,key){
  if(!/^[a-f0-9]{64}$/i.test(key||''))throw error('TOKEN_ENCRYPTION_KEY doit contenir 64 caractères hexadécimaux.');
  this.key=Buffer.from(key,'hex');this.directory=directory;fs.mkdirSync(directory,{recursive:true,mode:0o700});
 }
 file(owner){if(!uuid.test(owner))throw error('Compte invalide.');return path.join(this.directory,owner+'.json');}
 read(owner){
  const file=this.file(owner);if(!fs.existsSync(file))return null;
  const sealed=JSON.parse(fs.readFileSync(file,'utf8'));
  const decipher=crypto.createDecipheriv('aes-256-gcm',this.key,Buffer.from(sealed.iv,'base64'));
  decipher.setAAD(Buffer.from(owner));decipher.setAuthTag(Buffer.from(sealed.tag,'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(sealed.data,'base64')),decipher.final()]).toString('utf8'));
 }
 write(owner,value){
  const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(owner));
  const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  const file=this.file(owner),temp=file+'.'+random()+'.tmp';
  try{fs.writeFileSync(temp,JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')}),{mode:0o600,flag:'wx'});fs.renameSync(temp,file);}
  finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
 }
 remove(owner){fs.rmSync(this.file(owner),{force:true});}
}
export function createCanvaGateway(config,{fetcher=fetch,auth=token=>authorize(token,config,fetcher),now=Date.now}={}){
 const base=new URL(config.publicURL);
 if(base.protocol!=='https:'&&!(config.development&&base.protocol==='http:'&&base.hostname==='127.0.0.1'))throw error('PUBLIC_URL doit utiliser HTTPS.');
 if(base.pathname!=='/'||base.username||base.password||base.search||base.hash)throw error('PUBLIC_URL doit être une origine sans chemin.');
 if(!config.clientId||!config.clientSecret||!Array.isArray(config.origins)||!config.origins.length)throw error('Configuration Canva incomplète.');
 const vault=new Vault(config.directory,config.encryptionKey),states=new Map(),locks=new Map(),rates=new Map(),epochs=new Map();
 const callback=base.origin+'/oauth/callback',basic='Basic '+Buffer.from(config.clientId+':'+config.clientSecret).toString('base64');
 async function serial(owner,fn){const previous=locks.get(owner)||Promise.resolve(),next=previous.catch(()=>{}).then(fn);locks.set(owner,next);try{return await next;}finally{if(locks.get(owner)===next)locks.delete(owner);}}
 function prune(){for(const map of [states,rates])for(const [key,item] of map)if(item.until<now())map.delete(key);}
 async function canva(route,options){
  const result=await fetcher(API+route,{...options,redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!result.ok&&route==='/oauth/token'&&result.status===400){
   const reason=await result.json().catch(()=>({}));
   if(reason.error==='invalid_grant')throw error('Autorisation Canva expirée. Reconnectez Canva.',409);
  }
  if(!result.ok)throw error(result.status===401?'Autorisation Canva expirée. Reconnectez Canva.':'Canva a refusé la demande. Réessayez après vérification.',result.status===401?409:502);
  return result;
 }
 async function exchange(params){
  const res=await canva('/oauth/token',{method:'POST',headers:{Authorization:basic,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params)});
  const value=await res.json();
  if(typeof value.access_token!=='string'||!value.access_token||typeof value.refresh_token!=='string'||!value.refresh_token||!Number.isFinite(value.expires_in)||value.expires_in<=0)throw error('Réponse Canva incomplète.',502);
  return {access:value.access_token,refresh:value.refresh_token,expires:now()+value.expires_in*1000};
 }
 async function token(owner,record){
  if(record.tokens.expires>now()+60000)return record.tokens.access;
  try{record.tokens=await exchange({grant_type:'refresh_token',refresh_token:record.tokens.refresh});vault.write(owner,record);return record.tokens.access;}
  catch(e){if(e.status===409){vault.remove(owner);throw error('Autorisation Canva expirée. Reconnectez Canva.',409);}throw e;}
 }
 function sanitizeJob(value){
  const job=value?.job;if(!job||!jobPattern.test(job.id||'')||!['in_progress','success','failed'].includes(job.status))throw error('Réponse d’import Canva invalide.',502);
  const result={id:job.id,status:job.status};
  if(job.status==='success'){
   result.designs=(job.result?.designs||[]).map(design=>{
    const u=new URL(design.urls?.edit_url);
    if(u.protocol!=='https:'||u.hostname!=='www.canva.com'||u.username||u.password)throw error('Lien de présentation Canva invalide.',502);
    return {id:design.id,edit_url:u.href};
   });
   if(!result.designs.length)throw error('Canva n’a pas renvoyé de présentation.',502);
  }
  return result;
 }
 async function body(req,max){
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>max)throw error('Présentation trop volumineuse (20 Mo maximum).',413);chunks.push(chunk);}
  return Buffer.concat(chunks);
 }
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  const page=(status,message)=>{res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Connexion Canva</title><h1>'+message+'</h1><p>Vous pouvez fermer cet onglet et revenir au site du club.</p></html>');};
  const route=new URL(req.url,'http://service'),origin=req.headers.origin;
  try{
   prune();
   if(route.pathname==='/health'&&req.method==='GET')return send(200,{ok:true,service:'club-canva'});
   if(route.pathname==='/oauth/start'&&req.method==='POST'){
    // Only the trusted site's top-level form can initialize this browser's consent.
    // Never accept a shareable start URL/ticket that could bind a victim's Canva to another coach.
    if(!config.origins.includes(origin))throw error('Origine refusée.',403);
    if(req.headers['content-type']?.split(';')[0]!=='application/x-www-form-urlencoded')throw error('Formulaire de connexion invalide.',415);
    if(states.size>=1000)throw error('Service occupé.',503);
    const params=new URLSearchParams((await body(req,16000)).toString('utf8'));
    let returnURL=null;
    if(params.get('return_url')){
     try{returnURL=new URL(params.get('return_url'));}catch{throw error('Adresse de retour invalide.');}
     if(returnURL.origin!==origin||!returnURL.pathname.endsWith('/canva-return.html')||returnURL.search||returnURL.hash||returnURL.username||returnURL.password)throw error('Adresse de retour invalide.');
    }
    const owner=await auth(params.get('credential'));if(!uuid.test(owner||''))throw error('Compte invalide.',401);
    const rate=rates.get(owner)||{count:0,until:now()+60000};if(++rate.count>60)throw error('Trop de demandes.',429);rates.set(owner,rate);
    const state=random(),verifier=random(),browser=random();states.set(state,{owner,epoch:epochs.get(owner)||0,verifier,browser,returnURL:returnURL?.href,until:now()+600000});
    const url=new URL('https://www.canva.com/api/oauth/authorize');
    url.search=new URLSearchParams({response_type:'code',client_id:config.clientId,redirect_uri:callback,scope:'design:content:write',state,code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
    res.setHeader('Set-Cookie','canva_oauth='+browser+'; HttpOnly; SameSite=Lax; Path=/oauth/; Max-Age=600'+(config.development?'':'; Secure'));
    res.writeHead(302,{Location:url.href});return res.end();
   }
   if(route.pathname==='/oauth/callback'&&req.method==='GET'){
    const state=route.searchParams.get('state'),entry=states.get(state);
    const browser=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('canva_oauth='))?.slice(12);
    if(!entry||browser!==entry.browser)throw error('Retour de connexion invalide ou expiré.',400);
    states.delete(state);res.setHeader('Set-Cookie','canva_oauth=; HttpOnly; SameSite=Lax; Path=/oauth/; Max-Age=0'+(config.development?'':'; Secure'));
    if(route.searchParams.has('error'))return page(400,'Connexion Canva annulée.');
    const code=route.searchParams.get('code');if(!code||code.length>2000)throw error('Code Canva manquant.');
    await serial(entry.owner,async()=>{
     if(entry.epoch!==(epochs.get(entry.owner)||0))throw error('Cette connexion a été annulée.',400);
     const tokens=await exchange({grant_type:'authorization_code',code,code_verifier:entry.verifier,redirect_uri:callback});
     vault.write(entry.owner,{tokens,jobs:[]});
    });
    if(entry.returnURL){res.writeHead(303,{Location:entry.returnURL});return res.end();}
    return page(200,'Canva est connecté.');
   }
   if(!route.pathname.startsWith('/api/'))throw error('Adresse inconnue.',404);
   if(!config.origins.includes(origin))throw error('Origine refusée.',403);
   res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
   if(req.method==='OPTIONS'){
    res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, X-Design-Title');res.writeHead(204);return res.end();
   }
   const owner=await auth((req.headers.authorization||'').replace(/^Bearer /,''));if(!uuid.test(owner||''))throw error('Compte invalide.',401);
   const rate=rates.get(owner)||{count:0,until:now()+60000};if(++rate.count>60)throw error('Trop de demandes. Réessayez dans une minute.',429);rates.set(owner,rate);
   return await serial(owner,async()=>{
    const record=vault.read(owner);
    if(route.pathname==='/api/status'&&req.method==='GET')return send(200,{connected:!!record,latest_job_id:record?.jobs.at(-1)?.id||null});
    if(route.pathname==='/api/connection'&&req.method==='DELETE'){
     let revoked=true;
     try{if(record)await canva('/oauth/revoke',{method:'POST',headers:{Authorization:basic,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:record.tokens.refresh})});}catch{revoked=false;}
     vault.remove(owner);epochs.set(owner,(epochs.get(owner)||0)+1);for(const [key,item] of states)if(item.owner===owner)states.delete(key);
     return send(200,{connected:false,revoked});
    }
    if(!record)throw error('Connectez votre compte Canva.',409);
    if(route.pathname==='/api/imports'&&req.method==='POST'){
     if(req.headers['content-type']!=='application/vnd.openxmlformats-officedocument.presentationml.presentation')throw error('Un fichier PowerPoint est requis.',415);
     const data=await body(req,20*1024*1024);if(data.length<4||data.readUInt32LE(0)!==0x04034b50)throw error('Fichier PowerPoint invalide.');
     const title=Buffer.from(String(req.headers['x-design-title']||''),'base64').toString('utf8');if(!title||title.length>1000)throw error('Titre invalide.');
     const access=await token(owner,record),meta={title_base64:Buffer.from([...title].slice(0,50).join('')).toString('base64'),mime_type:req.headers['content-type']};
     const response=await canva('/imports',{method:'POST',headers:{Authorization:'Bearer '+access,'Content-Type':'application/octet-stream','Import-Metadata':JSON.stringify(meta)},body:data});
     const job=sanitizeJob(await response.json());record.jobs=record.jobs.filter(j=>j.until>now()).slice(-19);record.jobs.push({id:job.id,until:now()+86400000});vault.write(owner,record);return send(200,job);
    }
    const match=route.pathname.match(/^\/api\/imports\/([a-zA-Z0-9_-]{1,80})$/);
    if(match&&req.method==='GET'){
     const id=match[1];if(!record.jobs.some(job=>job.id===id&&job.until>now()))throw error('Import introuvable.',404);
     const access=await token(owner,record),response=await canva('/imports/'+id,{headers:{Authorization:'Bearer '+access}});
     return send(200,sanitizeJob(await response.json()));
    }
    throw error('Adresse inconnue.',404);
   });
  }catch(e){if(!res.headersSent)send(e.status||500,{error:e.status?e.message:'Service Canva temporairement indisponible.'});else res.end();}
 });
 server.requestTimeout=45000;server.headersTimeout=10000;
 return {server,vault};
}
export function runtimeConfig(environment=process.env){
 const settings={...environment,PUBLIC_URL:environment.PUBLIC_URL||environment.RENDER_EXTERNAL_URL};
 const required=['PUBLIC_URL','CANVA_CLIENT_ID','CANVA_CLIENT_SECRET','TOKEN_ENCRYPTION_KEY','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','ALLOWED_ORIGINS'];
 if(required.some(name=>!settings[name]))throw Error('Configuration manquante : '+required.filter(name=>!settings[name]).join(', '));
 return {publicURL:settings.PUBLIC_URL,clientId:settings.CANVA_CLIENT_ID,clientSecret:settings.CANVA_CLIENT_SECRET,encryptionKey:settings.TOKEN_ENCRYPTION_KEY,supabaseUrl:settings.SUPABASE_URL,publishableKey:settings.SUPABASE_PUBLISHABLE_KEY,origins:settings.ALLOWED_ORIGINS.split(',').map(s=>s.trim()).filter(Boolean),directory:settings.DATA_DIR||(settings.RENDER_EXTERNAL_URL?'/tmp/vestiaire-canva':'/data')};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 createCanvaGateway(runtimeConfig()).server.listen(Number(process.env.PORT)||3001,'0.0.0.0',()=>console.log('Service Canva démarré.'));
}
