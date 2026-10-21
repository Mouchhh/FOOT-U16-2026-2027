// Espace partagé optionnel. Autorisations et contrôle des versions appliqués dans PostgreSQL.
const clubNetworkConfig=window.CLUB_CLOUD_CONFIG||{};
function clubNetworkConfigValid(c){
 if(!c||typeof c.url!=='string'||typeof c.publishableKey!=='string')return false;
 try{const u=new URL(c.url);if(u.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/.test(u.hostname)||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash)return false;}catch{return false;}
 const key=c.publishableKey;if(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))return true;
 try{const body=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return key.split('.').length===3&&body.role==='anon';}catch{return false;}
}
const clubNetworkReady=clubNetworkConfigValid(clubNetworkConfig);
const clubNetworkBase=clubNetworkReady?clubNetworkConfig.url.replace(/\/$/,''):'';
let clubNetworkSession=null,clubNetworkMember=null,clubNetworkMembers=[],clubNetworkRows=[],clubNetworkPreview=null,clubNetworkSources=[],clubNetworkRefreshPromise=null,clubNetworkGeneration=0,clubNetworkBusy=false,clubNetworkQueue=Promise.resolve(),clubNetworkSyncPromise=null,clubNetworkTimer=null,clubNetworkPageSize=50,clubNetworkCachedVersions=new Map();
const clubNetworkPresenceSession=crypto.randomUUID();
let clubNetworkPresenceState='loading',clubNetworkConnected=[],clubNetworkActivity=[],clubNetworkActivityState='loading',clubNetworkPresenceWriteState='loading';
const clubNetworkSessionKey='vestiaire-private-session:'+clubNetworkBase;
const clubNetworkBindingKey='vestiaire-account-binding:'+clubNetworkBase;
const clubNetworkKinds={training:'Séance',report:'Rapport',composition:'Composition'};
const clubNetworkLocalMode=new URLSearchParams(location.search).get('mode')==='local';
let clubNetworkPrivateRequested=clubNetworkReady&&!clubNetworkLocalMode;
const clubSaveLocalErrors=new Set();
let clubSaveState={state:'pending',detail:'Vérification des documents enregistrés…',conflict:false};
function clubSaveStatus(state,detail,conflict=false){if(clubSaveLocalErrors.size&&state!=='error'){state='error';detail='Une sauvegarde locale ou sa mise en attente a échoué. Enregistrez à nouveau le document concerné ; le partage n’est pas confirmé.';}clubSaveState={state,detail,conflict};clubSaveRender();}
function clubSaveRender(){
 let root=$('club-save-indicator');
 if(!root){
  root=el('details','club-save-indicator');root.id='club-save-indicator';
  const summary=el('summary'),label=el('span');label.id='club-save-label';label.setAttribute('role','status');label.setAttribute('aria-live','polite');summary.append(label);
  const panel=el('div','club-save-panel'),detail=el('p');detail.id='club-save-detail';
  const retry=el('button','export','Réessayer');retry.id='club-save-retry';retry.type='button';retry.onclick=()=>{if(clubNetworkSyncPromise)return;clubSaveStatus('pending','Nouvelle tentative de synchronisation…');clubNetworkQueueSync();};
  const resolve=el('button','export','Voir le conflit');resolve.id='club-save-resolve';resolve.type='button';resolve.onclick=()=>{$('view-club-network').click();root.open=false;};
  panel.append(el('strong','','Documents enregistrés'),detail,el('p','hint','Les brouillons restent sur cet appareil jusqu’au clic sur « Enregistrer ». Le partage est réservé aux éducateurs autorisés.'),retry,resolve);root.append(summary,panel);document.querySelector('.header-actions').prepend(root);
 }
 root.hidden=!clubNetworkBound();root.dataset.state=clubSaveState.state;
 const label={saved:'Enregistré et partagé',pending:'En attente',error:'Échec'}[clubSaveState.state];
 if($('club-save-label').textContent!==label)$('club-save-label').textContent=label;
 $('club-save-detail').textContent=clubSaveState.detail;
 $('club-save-retry').hidden=clubSaveState.state==='saved'||clubSaveState.conflict||clubSaveLocalErrors.size>0;
 $('club-save-resolve').hidden=!clubSaveState.conflict;
}
function clubNetworkStatus(message){for(const id of ['club-network-status','club-sync-status','club-network-list-status'])$(id).textContent=message;}
function clubNetworkMessage(error){
 if(error?.code==='document_invalid')return 'Le document à partager est introuvable ou invalide sur cet appareil. Ouvrez-le et enregistrez-le à nouveau.';
 if(error?.code==='40001')return 'Conflit de version : une autre version existe. Ouvrez « Travail du club » et récupérez votre version partagée avant de reporter vos changements. Rien n’a été écrasé.';
 if(error?.code==='invalid_credentials')return 'Adresse e-mail ou mot de passe incorrect. Réessayez ou utilisez « Mot de passe oublié ? ».';
 if(['user_already_exists','email_exists'].includes(error?.code))return 'Ce compte existe déjà. Connectez-vous ou utilisez « Mot de passe oublié ? ».';
 if(error?.code==='weak_password')return 'Choisissez un mot de passe plus solide, avec au moins 12 caractères, et évitez les mots de passe courants.';
 if(error?.code==='same_password')return 'Choisissez un mot de passe différent de l’ancien.';
 if(error?.code==='otp_expired')return 'Ce lien est expiré ou déjà utilisé. Demandez un nouveau lien.';
 if(error?.code==='signup_disabled')return 'La création des comptes doit être activée par le responsable après installation de la liste des adresses autorisées.';
 if(error?.code==='PGRST202')return 'La mise à jour des inscriptions privées doit être installée par le responsable dans Supabase.';
 if(error?.code==='signup_not_allowed'||error?.code==='unexpected_failure')return 'Création du compte refusée : vérifiez que le responsable a installé les inscriptions privées et autorisé votre adresse, puis fourni un code d’invitation valide. Si le compte existe déjà, utilisez « Se connecter ».';
 if(error?.code==='email_not_confirmed')return 'Votre adresse doit être confirmée. Consultez votre messagerie ou contactez le responsable du club.';
 if(error?.status===401)return 'Connexion expirée. Reconnectez-vous ; vos brouillons locaux sont conservés.';
 if(error?.status===403||error?.code==='42501')return 'Ce compte n’est pas autorisé. Le responsable doit autoriser cette adresse dans le club.';
 if(error?.status===429)return 'Trop de demandes. Patientez avant de réessayer.';
 if(error?.status===400||error?.status===422)return 'Demande refusée : vérifiez votre e-mail, votre mot de passe ou le document.';
 return 'Connexion interrompue ou service indisponible. Les enregistrements locaux sont conservés ; la synchronisation réessaiera à la reconnexion.';
}
function clubNetworkError(message,status=0,code=''){const error=new Error(message);error.status=status;error.code=code;return error;}
async function clubNetworkRequest(path,{method='GET',body,auth=true,retry=true}={}){
 if(!clubNetworkReady)throw Error('Service non configuré.');
 const generation=clubNetworkGeneration;
 if(auth){if(!clubNetworkSession)throw clubNetworkError('Connexion requise',401);if(clubNetworkSession.expires_at*1000<Date.now()+30000)await clubNetworkRefreshSession();}
 const headers={apikey:clubNetworkConfig.publishableKey,'Content-Type':'application/json'};
 if(auth)headers.Authorization='Bearer '+clubNetworkSession.access_token;
 const response=await fetch(clubNetworkBase+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(generation!==clubNetworkGeneration)throw Error('Session terminée.');
 const text=await response.text();if(generation!==clubNetworkGeneration)throw Error('Session terminée.');let result=null;try{result=text?JSON.parse(text):null;}catch{throw Error('Réponse serveur invalide.');}
 if(!response.ok){
  if(auth&&response.status===401&&retry){await clubNetworkRefreshSession();return clubNetworkRequest(path,{method,body,auth,retry:false});}
  throw clubNetworkError('Requête refusée',response.status,result?.code||'');
 }
 return result;
}
function clubNetworkPayloadValid(kind,payload){try{return kind==='training'?trainingValid(payload):kind==='report'?reportValid(payload):kind==='composition'?!!valid(payload):false;}catch{return false;}}
function clubNetworkSource(kind,payload){
 const id=kind==='composition'?payload.documentId:payload.id;
 if(!id||!clubNetworkPayloadValid(kind,payload))return null;
 const fallback=kind==='training'?payload.date+' · '+payload.team:kind==='report'?(payload.info.date||'Match')+' · '+payload.info.team+' / '+payload.info.opponent:payload.team+' · '+payload.formation;
 return {kind,id,title:((kind==='composition'&&payload.boardKind==='plan'&&!payload.title?.startsWith('Plan de jeu · ')?'Plan de jeu · ':'')+(payload.title?.trim()||fallback||clubNetworkKinds[kind])).slice(0,150),payload:structuredClone(payload)};
}
function clubNetworkComposition(payload){
 if(payload.squadDirectory&&typeof squadReadOnly==='function')return squadReadOnly(payload);
 const root=el('article','report-document');root.append(el('h2','',payload.title||payload.team),el('p','',payload.team+' · '+(payload.category||'')+' · '+payload.formation));
 const pitch=el('div','club-network-pitch');pitch.setAttribute('aria-label','Composition en lecture seule');
 for(const p of payload.players.filter(p=>p.role!=='sub')){const token=el('div','club-network-player');token.style.left=p.x+'%';token.style.top=p.y+'%';if(p.photo){const img=el('img');img.src=p.photo;img.alt='';token.append(img);}token.append(el('strong','',String(p.number)),el('span','',p.name));pitch.append(token);}root.append(pitch);
 const bench=payload.players.filter(p=>p.role==='sub');if(bench.length)root.append(el('h3','','Impacteurs / Finisseurs'),el('p','',bench.map(p=>p.number+' · '+p.name).join(' / ')));
 if(matchPreparationFilled(payload.matchPreparation))root.append(matchPreparationDocument(payload.matchPreparation));root.append(el('p','',payload.notes));return root;
}
function clubNetworkStoreSession(session){
 if(!session||typeof session.access_token!=='string'||typeof session.refresh_token!=='string'||!session.user?.id)throw Error('Session invalide.');
 clubNetworkSession={access_token:session.access_token,refresh_token:session.refresh_token,expires_at:Number(session.expires_at)||Math.floor(Date.now()/1000)+Number(session.expires_in||3600),user:{id:session.user.id,email:session.user.email||''}};
 sessionStorage.setItem(clubNetworkSessionKey,JSON.stringify({session:clubNetworkSession}));
}
async function clubNetworkRefreshSession(){
 if(clubNetworkRefreshPromise)return clubNetworkRefreshPromise;
 if(!clubNetworkSession)throw clubNetworkError('Connexion requise',401);
 clubNetworkRefreshPromise=(async()=>{try{const session=await clubNetworkRequest('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:{refresh_token:clubNetworkSession.refresh_token}});clubNetworkStoreSession(session);}catch(error){if(error.status===400||error.status===401||error.status===403)clubNetworkClear();throw error;}finally{clubNetworkRefreshPromise=null;}})();return clubNetworkRefreshPromise;
}
function clubNetworkBound(){return !!clubNetworkMember&&activeCoach.id==='account-'+clubNetworkMember.user_id;}
function clubNetworkRenderState(){
 clubSaveRender();
 const bound=clubNetworkBound();document.documentElement.classList.toggle('club-private-request',clubNetworkPrivateRequested);document.documentElement.classList.toggle('club-authenticated',bound);document.body.classList.toggle('club-private-active',bound);
 $('club-auth-gate').hidden=!clubNetworkPrivateRequested||bound;$('club-network-setup').hidden=clubNetworkReady;$('club-network-connected').hidden=!bound;$('club-account-bar').hidden=!bound;$('club-connected').hidden=!bound;
 if(bound){renderCoachSelector();$('coach-profile').querySelector('p').textContent='Profil lié à votre compte. Consultez les autres éducateurs dans « Travail du club ».';$('club-account-name').textContent=clubNetworkMember.display_name;$('club-network-identity').textContent=clubNetworkMember.display_name;$('club-network-shortcut').textContent='Travail du club';clubNetworkRenderSources();}
 else $('club-network-shortcut').textContent='Connexion éducateurs';
}
function clubNetworkClear(){
 clubSaveLocalErrors.clear();clubSaveState={state:'pending',detail:'Vérification des documents enregistrés…',conflict:false};if($('club-save-indicator'))$('club-save-indicator').hidden=true;
 clubNetworkGeneration++;clearInterval(clubNetworkTimer);clubNetworkTimer=null;clubNetworkSession=null;clubNetworkMember=null;clubNetworkMembers=[];clubNetworkRows=[];clubNetworkPreview=null;clubNetworkSources=[];clubNetworkCachedVersions.clear();clubNetworkConnected=[];clubNetworkActivity=[];clubNetworkActivityState='loading';clubNetworkPresenceState='loading';clubNetworkPresenceWriteState='loading';if(typeof clubAccountClear==='function')clubAccountClear();$('club-connected-names').replaceChildren();$('club-connected-count').textContent='';$('club-connected-status').textContent='';
 sessionStorage.removeItem(clubNetworkSessionKey);sessionStorage.removeItem(clubNetworkBindingKey);
 $('club-network-preview').close();$('club-network-preview-content').replaceChildren();$('club-network-preview-title').textContent='';$('club-network-preview-author').textContent='';$('club-network-list').replaceChildren();$('club-network-source').replaceChildren();$('club-network-author').replaceChildren();$('club-account-name').textContent='';
 for(const id of ['club-network-password','club-network-old-password','club-network-new-password','club-network-confirm-password','club-signup-password','club-signup-confirm','club-signup-code','club-signup-first-name','club-signup-last-name'])$(id).value='';
 clubNetworkRenderState();
}
function clubNetworkVersionKey(kind,id){return 'vestiaire-private-version:'+clubNetworkBase+':'+activeCoach.id+':'+kind+':'+id;}
function clubNetworkKnownVersion(kind,id){try{const v=JSON.parse(sessionStorage.getItem(clubNetworkVersionKey(kind,id))||'null');return v&&Number.isInteger(v.revision)&&v.revision>0&&typeof v.id==='string'?v:{revision:0,id:null};}catch{return {revision:0,id:null};}}
function clubNetworkRememberVersion(kind,id,revision,documentId=null){sessionStorage.setItem(clubNetworkVersionKey(kind,id),JSON.stringify({revision,id:documentId}));}
function clubNetworkLibrary(kind){return kind==='training'?trainingLibrary:kind==='report'?reportLibrary:saves.map(x=>x.state);}
function clubNetworkLibraryKey(kind){return kind==='training'?'vestiaire-training-library':kind==='report'?'vestiaire-reports':'vestiaire-saves';}
const clubNetworkOriginalStorageSet=coachStorageSet;
function clubNetworkSetLibrary(kind,list){
 const next=kind==='composition'?list.map(state=>({date:new Date().toISOString(),state})):list;
 clubNetworkOriginalStorageSet(clubNetworkLibraryKey(kind),JSON.stringify(next));
 if(kind==='training'){trainingLibrary=next;renderTrainingLibrary();}else if(kind==='report'){reportLibrary=next;renderReportLibrary();}else{saves=next;renderSaves();if(typeof squadLibraryChanged==='function')squadLibraryChanged();}
}
function clubNetworkPayloadId(kind,payload){return kind==='composition'?payload.documentId:payload.id;}
function clubNetworkPendingPrefix(){return coachStorageKey('vestiaire-cloud-pending:');}
function clubNetworkPendingKey(kind,id){return clubNetworkPendingPrefix()+kind+':'+id;}
function clubNetworkPendingJobs(){
 const jobs=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key.startsWith(clubNetworkPendingPrefix()))continue;try{const job=JSON.parse(localStorage.getItem(key));if(job&&Object.hasOwn(clubNetworkKinds,job.kind)&&typeof job.id==='string'&&['save','delete'].includes(job.op)&&typeof job.stamp==='string')jobs.push(job);}catch{}}
 return jobs;
}
function clubNetworkPending(kind,id){try{return JSON.parse(localStorage.getItem(clubNetworkPendingKey(kind,id))||'null');}catch{return null;}}
function clubNetworkMarkPending(kind,id,op){
 const previous=clubNetworkPending(kind,id),expected=previous?.expected||clubNetworkKnownVersion(kind,id);
 localStorage.setItem(clubNetworkPendingKey(kind,id),JSON.stringify({kind,id,op,expected,stamp:crypto.randomUUID(),conflict:false}));
 clubSaveStatus('pending',navigator.onLine?'Enregistré sur cet appareil ; envoi au club en cours.':'Hors connexion : enregistrement conservé sur cet appareil, en attente de partage.');
}
function clubNetworkAuthor(id){return clubNetworkMembers.find(m=>m.user_id===id)?.display_name||'Éducateur du club';}
function clubNetworkRenderSources(){
 clubNetworkSources=[];for(const kind of Object.keys(clubNetworkKinds))for(const payload of clubNetworkLibrary(kind)){const source=clubNetworkSource(kind,payload);if(source)clubNetworkSources.push(source);}
 const select=$('club-network-source'),previous=select.value;select.replaceChildren();const empty=el('option','',clubNetworkSources.length?'Choisir un document enregistré…':'Enregistrez une séance, une composition ou un rapport');empty.value='';select.append(empty);
 clubNetworkSources.forEach((s,i)=>{const o=el('option','',(s.payload.squadDirectory?'Effectif':clubNetworkKinds[s.kind])+' · '+s.title);o.value=String(i);select.append(o);});if([...select.options].some(x=>x.value===previous))select.value=previous;
}
async function clubNetworkLoadMember(){
 const members=await clubNetworkRequest('/rest/v1/club_members?select=user_id,display_name,active&order=display_name');
 if(!Array.isArray(members))throw Error('Réponse invalide');const member=members.find(m=>m.user_id===clubNetworkSession.user.id&&m.active===true);if(!member)throw clubNetworkError('Compte non autorisé',403);
 clubNetworkMembers=members;clubNetworkMember=member;
 if(!clubNetworkBound()||activeCoach.name!==member.display_name){
  if(!flushCoachWorkspace())throw Error('Impossible de préserver le travail ouvert.');
  sessionStorage.setItem(clubNetworkBindingKey,JSON.stringify({userId:member.user_id,coach:{id:'account-'+member.user_id,name:member.display_name}}));
  const url=new URL(location.href);url.searchParams.delete('mode');url.searchParams.delete('auth');url.hash='educateurs';history.replaceState(null,'',url.href);location.reload();return false;
 }
 const author=$('club-network-author'),previous=author.value;author.replaceChildren();const all=el('option','','Tous les éducateurs');all.value='';author.append(all);
 for(const m of members){const option=el('option','',m.display_name+(m.active?'':' · ancien membre'));option.value=m.user_id;author.append(option);}author.value=previous;
 clubNetworkRenderState();return true;
}
async function clubNetworkPublish(source,expected=clubNetworkKnownVersion(source.kind,source.id)){
 if(!clubNetworkBound()||!clubNetworkPayloadValid(source.kind,source.payload))throw Error('Document invalide');
 if(new Blob([JSON.stringify(source.payload)]).size>7*1024*1024)throw clubNetworkError('Document trop volumineux',400);
 const response=await clubNetworkRequest('/rest/v1/rpc/club_publish_document',{method:'POST',body:{p_kind:source.kind,p_source_id:source.id,p_title:source.title,p_payload:source.payload,p_expected_revision:expected.revision,p_expected_id:expected.id}});
 const row=Array.isArray(response)?response[0]:response;if(!row||row.owner_id!==clubNetworkSession.user.id||row.source_id!==source.id||!Number.isInteger(row.revision))throw Error('Réponse invalide');
 clubNetworkRememberVersion(source.kind,source.id,row.revision,row.id);return row;
}
async function clubNetworkFlushPending(){
 const generation=clubNetworkGeneration;
 const execute=async()=>{
  for(const job of clubNetworkPendingJobs()){
   if(generation!==clubNetworkGeneration||!clubNetworkBound())return;if(job.conflict)continue;
   let row=null;
   try{
    if(job.op==='delete'){
     if(!job.expected.revision){const existing=await clubNetworkRequest('/rest/v1/club_documents?'+new URLSearchParams({select:'id,revision',owner_id:'eq.'+clubNetworkSession.user.id,kind:'eq.'+job.kind,source_id:'eq.'+job.id,limit:'1'}));if(existing?.length)throw clubNetworkError('Version inconnue',409,'40001');}
     if(job.expected.revision>0)await clubNetworkRequest('/rest/v1/rpc/club_remove_document',{method:'POST',body:{p_id:job.expected.id,p_expected_revision:job.expected.revision}});
     clubNetworkRememberVersion(job.kind,job.id,0);
    }else{
     const raw=JSON.parse(coachStorageGet(clubNetworkLibraryKey(job.kind))||'[]'),payload=raw.map(x=>job.kind==='composition'?x.state:x).find(x=>clubNetworkPayloadId(job.kind,x)===job.id),source=payload&&clubNetworkSource(job.kind,payload);
     if(!source)throw clubNetworkError('Document local introuvable ou invalide',400,'document_invalid');row=await clubNetworkPublish(source,job.expected);
    }
    const latest=clubNetworkPending(job.kind,job.id);
    if(latest?.stamp===job.stamp)localStorage.removeItem(clubNetworkPendingKey(job.kind,job.id));
    else if(latest&&row){latest.expected={revision:row.revision,id:row.id};localStorage.setItem(clubNetworkPendingKey(job.kind,job.id),JSON.stringify(latest));}
   }catch(error){
    if(error.code==='40001'){const latest=clubNetworkPending(job.kind,job.id);if(latest?.stamp===job.stamp){latest.conflict=true;localStorage.setItem(clubNetworkPendingKey(job.kind,job.id),JSON.stringify(latest));}continue;}
    throw error;
   }
  }
 };
 if(navigator.locks)await navigator.locks.request('vestiaire-sync:'+clubNetworkBase+':'+activeCoach.id,execute);else await execute();
}
function clubNetworkQueueSync(){
 clubNetworkQueue=clubNetworkQueue.catch(()=>{}).then(()=>clubNetworkSync());return clubNetworkQueue;
}
async function clubNetworkSync(){
 if(!clubNetworkBound())return;if(clubNetworkSyncPromise)return clubNetworkSyncPromise;
 clubNetworkSyncPromise=(async()=>{
  try{
   if(!await clubNetworkLoadMember())return;
   await clubNetworkUpdatePresence();
   await clubNetworkFlushPending();
   const all=[];for(let offset=0;;offset+=100){
    if(offset>=10000)throw Error('Trop de documents');
    const page=await clubNetworkRequest('/rest/v1/club_documents?'+new URLSearchParams({select:'id,owner_id,kind,source_id,title,revision,updated_at',order:'updated_at.desc,id.asc',limit:'100',offset:String(offset)}));
    if(!Array.isArray(page))throw Error('Réponse invalide');all.push(...page);if(page.length<100)break;
   }
   clubNetworkRows=all;
   for(const metadata of all.filter(r=>r.owner_id===clubNetworkSession.user.id)){
    if(clubNetworkPending(metadata.kind,metadata.source_id))continue;
    const known=clubNetworkKnownVersion(metadata.kind,metadata.source_id),exists=clubNetworkLibrary(metadata.kind).some(p=>clubNetworkPayloadId(metadata.kind,p)===metadata.source_id);
    const cached=clubNetworkCachedVersions.get(metadata.kind+':'+metadata.source_id);
    if(exists&&((known.id===metadata.id&&known.revision===metadata.revision)||(cached?.id===metadata.id&&cached?.revision===metadata.revision)))continue;
    const rows=await clubNetworkRequest('/rest/v1/club_documents?select=*&id=eq.'+encodeURIComponent(metadata.id)+'&limit=1'),row=rows?.[0];if(!row||!clubNetworkPayloadValid(row.kind,row.payload)||clubNetworkPayloadId(row.kind,row.payload)!==row.source_id)continue;
    const list=clubNetworkLibrary(row.kind),opened=row.kind==='training'?currentTraining:row.kind==='report'?currentReport:state;
    // Une mise à jour distante ne touche jamais le brouillon ouvert, ni sa version de départ.
    const isOpen=row.kind==='composition'&&typeof terrainHasDraftId==='function'?terrainHasDraftId(row.source_id):clubNetworkPayloadId(row.kind,opened)===row.source_id;
    clubNetworkSetLibrary(row.kind,[structuredClone(row.payload),...list.filter(p=>clubNetworkPayloadId(row.kind,p)!==row.source_id)]);
    clubNetworkCachedVersions.set(row.kind+':'+row.source_id,{id:row.id,revision:row.revision});
    if(!isOpen)clubNetworkRememberVersion(row.kind,row.source_id,row.revision,row.id);
   }
   const ownIds=new Set(all.filter(r=>r.owner_id===clubNetworkSession.user.id).map(r=>r.kind+':'+r.source_id));
   for(const kind of Object.keys(clubNetworkKinds)){
    const list=clubNetworkLibrary(kind),next=list.filter(p=>{const id=clubNetworkPayloadId(kind,p),known=clubNetworkKnownVersion(kind,id);if(known.revision>0&&!ownIds.has(kind+':'+id)&&!clubNetworkPending(kind,id)){clubNetworkRememberVersion(kind,id,0);return false;}return true;});
    if(next.length!==list.length)clubNetworkSetLibrary(kind,next);
   }
   clubNetworkRenderSources();clubNetworkRenderRows();
   const pending=clubNetworkPendingJobs(),conflicts=pending.filter(j=>j.conflict).length;
   clubSaveStatus(conflicts?'error':pending.length?'pending':'saved',conflicts?'Conflit de version : votre copie locale est conservée. Ouvrez le document partagé avant de reporter vos changements.':pending.length?pending.length+' document(s) conservé(s) sur cet appareil, en attente de partage.':'Confirmation du serveur à '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'})+'. Les documents enregistrés sont partagés avec le club.',conflicts>0);
   clubNetworkStatus(conflicts?conflicts+' conflit(s) à résoudre dans « Travail du club ». Vos versions locales sont conservées.':pending.length?pending.length+' enregistrement(s) en attente de synchronisation.':'Synchronisé avec le club · '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'}));
  }catch(error){clubSaveStatus(!navigator.onLine||error instanceof TypeError||error.name==='TimeoutError'?'pending':'error',!navigator.onLine||error instanceof TypeError||error.name==='TimeoutError'?'Connexion indisponible : les enregistrements locaux restent en attente. Nouvelle tentative au retour de la connexion.':clubNetworkMessage(error));clubNetworkPresenceState='unavailable';clubNetworkConnected=[];clubNetworkActivity=[];clubNetworkActivityState='unavailable';clubNetworkRenderPresence();if(error.status===401||error.status===403||error.code==='42501')clubNetworkClear();clubNetworkStatus(clubNetworkMessage(error));}
  finally{clubNetworkSyncPromise=null;}
 })();return clubNetworkSyncPromise;
}
function clubNetworkRenderRows(){
 const profiles=$('club-network-coach-cards');profiles.replaceChildren();
 const everyone=el('button','club-coach-card','Tous les éducateurs');everyone.setAttribute('aria-pressed',String(!$('club-network-author').value));everyone.onclick=()=>{$('club-network-author').value='';clubNetworkRenderRows();};profiles.append(everyone);
 for(const member of clubNetworkMembers){const count=clubNetworkRows.filter(r=>r.owner_id===member.user_id).length;if(!member.active&&!count)continue;const button=el('button','club-coach-card');button.dataset.userId=member.user_id;button.append(el('strong','',member.display_name),el('span','',(member.user_id===clubNetworkSession.user.id?'Mon profil · ':'')+count+' document(s)'),el('span','club-coach-activity'));button.setAttribute('aria-pressed',String($('club-network-author').value===member.user_id));button.onclick=()=>{$('club-network-author').value=member.user_id;clubNetworkPageSize=50;clubNetworkRenderRows();};profiles.append(button);}
 clubNetworkRenderCoachActivity();
 const root=$('club-network-list'),author=$('club-network-author').value,kind=$('club-network-kind').value;root.replaceChildren();
 const rows=clubNetworkRows.filter(r=>(!author||r.owner_id===author)&&(!kind||r.kind===kind)&&(typeof clubDocumentMatches!=='function'||clubDocumentMatches(r)));
 if(!rows.length)root.append(el('p','report-panel','Aucun document enregistré pour ces filtres. Vos prochains enregistrements apparaîtront ici.'));
 for(const row of rows.slice(0,clubNetworkPageSize)){
  const own=row.owner_id===clubNetworkSession.user.id,card=el('article','report-panel club-network-card'),info=el('div');info.append(el('h3','',row.title),el('p','',(row.title.startsWith('Effectif · ')?'Effectif':clubNetworkKinds[row.kind])+' · '+clubNetworkAuthor(row.owner_id)),el('p','hint','Version '+row.revision+' · '+new Date(row.updated_at).toLocaleString('fr-FR',{timeZone:'Europe/Paris'})));
  const actions=el('div','report-actions'),open=el('button',own?'primary':'export',own?'Ouvrir pour modifier':'Consulter');open.onclick=()=>clubNetworkRun(()=>clubNetworkOpen(row));actions.append(open);
  if(own){const remove=el('button','export','Supprimer du club');remove.onclick=()=>clubNetworkRun(async()=>{
   if(!confirm('Supprimer ce document enregistré du club et de votre bibliothèque ? Le brouillon ouvert reste conservé.'))return;
   await clubNetworkRequest('/rest/v1/rpc/club_remove_document',{method:'POST',body:{p_id:row.id,p_expected_revision:row.revision}});localStorage.removeItem(clubNetworkPendingKey(row.kind,row.source_id));clubNetworkRememberVersion(row.kind,row.source_id,0);clubNetworkSetLibrary(row.kind,clubNetworkLibrary(row.kind).filter(p=>clubNetworkPayloadId(row.kind,p)!==row.source_id));await clubNetworkSync();
  });actions.append(remove);}
  card.append(info,actions);if(typeof clubDocumentDecorate==='function')clubDocumentDecorate(card,row);root.append(card);
 }
 $('club-network-more').hidden=rows.length<=clubNetworkPageSize;if(typeof clubDocumentSearchProgress==='function')clubDocumentSearchProgress();
}
function clubNetworkShowView(on=true){
 if(!on){document.body.classList.remove('club-network-mode');$('club-network-dialog').hidden=true;$('view-club-network').classList.remove('active');$('view-club-network').setAttribute('aria-pressed','false');return;}
 if(!clubNetworkBound())return clubNetworkRequestPrivate();
 if(on){setTrainingView(false);setReportView(false);setCoachAgenda(false);stopAnimation();document.body.classList.add('club-network-mode');$('club-network-dialog').hidden=false;for(const id of ['view-pitch','view-training','view-reports','view-coach-agenda']){$(id).classList.remove('active');$(id).setAttribute('aria-pressed','false');}clubNetworkRenderRows();clubNetworkQueueSync();}
 else{document.body.classList.remove('club-network-mode');$('club-network-dialog').hidden=true;}
 $('view-club-network').classList.toggle('active',on);$('view-club-network').setAttribute('aria-pressed',String(on));
}
function clubNetworkRequestPrivate(){
 if(!clubNetworkPrivateRequested&&!flushCoachWorkspace())return;
 clubNetworkPrivateRequested=true;history.replaceState(null,'','#educateurs');clubNetworkRenderState();clubNetworkStatus(clubNetworkReady?'Connectez-vous ou créez votre compte avec une adresse autorisée par le club.':'Service du club non configuré.');
}
async function clubNetworkOpen(metadata){
 const rows=await clubNetworkRequest('/rest/v1/club_documents?select=*&id=eq.'+encodeURIComponent(metadata.id)+'&limit=1'),row=rows?.[0];if(!row||!clubNetworkPayloadValid(row.kind,row.payload)||clubNetworkPayloadId(row.kind,row.payload)!==row.source_id)throw clubNetworkError('Document incompatible',400);
 clubNetworkPreview=row;
 if(row.payload.squadDirectory&&row.owner_id===clubNetworkSession.user.id){const pending=clubNetworkPending(row.kind,row.source_id);if(pending){squadResolveRemote(row);return;}clubNetworkSetLibrary(row.kind,[structuredClone(row.payload),...clubNetworkLibrary(row.kind).filter(p=>p.documentId!==row.source_id)]);clubNetworkRememberVersion(row.kind,row.source_id,row.revision,row.id);openCoachSquad();return;}
 if(row.owner_id===clubNetworkSession.user.id){clubNetworkImport(true);return;}
 let content;if(row.kind==='training'){const original=currentTraining;try{currentTraining=structuredClone(row.payload);content=trainingDocument();}finally{currentTraining=original;}}
 else if(row.kind==='report'){const original=currentReport;try{currentReport=structuredClone(row.payload);content=buildReportDocument();}finally{currentReport=original;}}
 else content=clubNetworkComposition(row.payload);
 $('club-network-preview-title').textContent=row.title;$('club-network-preview-author').textContent=clubNetworkAuthor(row.owner_id)+' · version '+row.revision+' · lecture seule';$('club-network-preview-content').replaceChildren(content);$('club-network-preview').showModal();
}
function clubNetworkImport(openOwn=false){
 const row=clubNetworkPreview;if(!row||!clubNetworkBound())return;if(row.payload.squadDirectory)return notify('Cet effectif est consultable ici. Gérez vos joueurs depuis « Mes joueurs enregistrés ».');
 const kind=row.kind,own=row.owner_id===clubNetworkSession.user.id,payload=structuredClone(row.payload),opened=kind==='training'?currentTraining:kind==='report'?currentReport:(typeof getTerrainDraftFor==='function'?getTerrainDraftFor(row.payload):state);
 if(own){
  if(!confirm('Ouvrir cette version enregistrée ? Le brouillon courant sera conservé sur cet appareil dans une copie si nécessaire.'))return;
  if(document.body.classList.contains('training-mode')&&!applyTrainingForm())return;
  const list=clubNetworkLibrary(kind),pending=clubNetworkPending(kind,row.source_id);
  // Conserver les différences du document ouvert et toute sauvegarde locale non envoyée.
  const backups=[];if(clubNetworkPayloadValid(kind,opened)&&JSON.stringify(opened)!==JSON.stringify(payload))backups.push(opened);
  const unsent=list.find(p=>clubNetworkPayloadId(kind,p)===row.source_id);if(pending&&unsent&&JSON.stringify(unsent)!==JSON.stringify(opened))backups.push(unsent);
  const copies=backups.map(p=>{const copy=structuredClone(p);if(kind==='composition')copy.documentId=crypto.randomUUID();else copy.id=crypto.randomUUID();copy.title=('Copie locale avant ouverture · '+(copy.title||row.title)).slice(0,100);return copy;});
  clubNetworkSetLibrary(kind,[payload,...list.filter(p=>clubNetworkPayloadId(kind,p)!==row.source_id),...copies]);localStorage.removeItem(clubNetworkPendingKey(kind,row.source_id));clubNetworkRememberVersion(kind,row.source_id,row.revision,row.id);
  if(kind==='training'){currentTraining=payload;saveTrainingDraft();syncTrainingForm();renderTrainingBlocks();renderTrainingCatalogue();$('view-training').click();}
  else if(kind==='report'){currentReport=payload;flushReportDraft();renderReportContent();$('view-reports').click();}
  else{state=payload;render();persist();$('view-pitch').click();}
 }else{
  if(!confirm('Créer une copie indépendante dans votre espace ? L’original du collègue sera conservé.'))return;
  if(kind==='composition')payload.documentId=crypto.randomUUID();else payload.id=crypto.randomUUID();payload.title=('Copie · '+(payload.title||row.title)).slice(0,100);if(kind==='training')payload.coach=activeCoach.name;if(kind==='report')payload.info.coach=activeCoach.name;
  clubNetworkSetLibrary(kind,[payload,...clubNetworkLibrary(kind)]);clubNetworkMarkPending(kind,clubNetworkPayloadId(kind,payload),'save');clubNetworkQueueSync();notify('Copie ajoutée dans votre bibliothèque ; partage en attente de confirmation.');
 }
 $('club-network-preview').close();clubNetworkRenderSources();
}
async function clubNetworkRun(action){
 if(clubNetworkBusy)return;clubNetworkBusy=true;if(typeof clubAccountBusy==='function')clubAccountBusy(true);try{await action();}catch(error){if(error.status===401||error.status===403||error.code==='42501')clubNetworkClear();clubNetworkStatus(!clubNetworkBound()&&typeof clubAccountMessage==='function'?clubAccountMessage(error):clubNetworkMessage(error));}finally{clubNetworkBusy=false;if(typeof clubAccountBusy==='function')clubAccountBusy(false);if(typeof clubAccountContinueReturn==='function')clubAccountContinueReturn();}
}
async function clubNetworkAfterLogin(session){
 clubNetworkStoreSession(session);if(!await clubNetworkLoadMember())return;
 await clubNetworkSync();clearInterval(clubNetworkTimer);clubNetworkTimer=setInterval(()=>{if(!document.hidden)clubNetworkQueueSync();},10000);
 const url=new URL(location.href);url.searchParams.delete('auth');history.replaceState(history.state,'',url.href);if(typeof showClubHome==='function')showClubHome();else clubNetworkShowView();document.dispatchEvent(new CustomEvent('club-session-ready'));
}
async function clubNetworkLogout(){
 if(!flushCoachWorkspace())return;
 const leaving=clubNetworkLeavePresence(),logout=fetch(clubNetworkBase+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:clubNetworkConfig.publishableKey,Authorization:'Bearer '+clubNetworkSession.access_token},credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(3000)});clubNetworkClear();clubNetworkStatus('Déconnexion en cours…');await Promise.allSettled([leaving,logout]);location.replace('accueil.html');
}
$('club-network-login').onsubmit=e=>{e.preventDefault();clubNetworkRun(async()=>{
 const email=$('club-network-email').value.trim(),password=$('club-network-password').value;$('club-network-password').value='';clubNetworkStatus('Connexion et récupération de votre espace…');
 const session=await clubNetworkRequest('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});await clubNetworkAfterLogin(session);
});};
function clubAuthChoose(mode){
 const signup=mode==='signup';$('club-network-login').hidden=signup;$('club-network-signup').hidden=!signup;$('club-auth-show-signup').hidden=signup;
 const url=new URL(location.href);url.searchParams.set('auth',signup?'signup':'login');history.replaceState(null,'',url.href);
 if(signup)clubNetworkStatus('Renseignez votre prénom, votre nom et les accès autorisés par le club.');
}
$('club-auth-show-signup').onclick=()=>clubAuthChoose('signup');
$('club-auth-show-login').onclick=()=>clubAuthChoose('login');
$('club-network-signup').onsubmit=e=>{e.preventDefault();clubNetworkRun(async()=>{
 const firstName=$('club-signup-first-name').value.trim(),lastName=$('club-signup-last-name').value.trim();if(!firstName||!lastName||(firstName+' '+lastName).length>70)return clubNetworkStatus('Renseignez un prénom et un nom, avec 70 caractères maximum au total.');
 const email=$('club-signup-email').value.trim(),password=$('club-signup-password').value;if(password!==$('club-signup-confirm').value)return clubNetworkStatus('Les deux mots de passe doivent être identiques.');
 const ready=await clubNetworkRequest('/rest/v1/rpc/club_profile_registration_ready',{method:'POST',auth:false,body:{}});if(ready!==true)throw clubNetworkError('Installation nécessaire',400,'PGRST202');
 const settings=await clubNetworkRequest('/auth/v1/settings',{auth:false});if(settings.disable_signup)throw clubNetworkError('Inscriptions fermées',400,'signup_disabled');
 // L'autorisation de l'adresse est vérifiée par les triggers serveur, jamais dans le navigateur.
 const session=await clubNetworkRequest('/auth/v1/signup'+(typeof clubAccountReturnURL==='function'?'?redirect_to='+encodeURIComponent(clubAccountReturnURL('login')):''),{method:'POST',auth:false,body:{email,password,data:{club_activation_code:$('club-signup-code').value.trim(),first_name:firstName,last_name:lastName}}});$('club-signup-code').value='';$('club-signup-password').value='';$('club-signup-confirm').value='';
 if(session.access_token)await clubNetworkAfterLogin(session);else{$('club-auth-show-login').click();$('club-network-email').value=email;clubNetworkStatus('Compte demandé. Confirmez votre adresse avec le message reçu avant de vous connecter. Si vous ne recevez rien, contactez le responsable.');}
});};
$('club-network-password-form').onsubmit=e=>{e.preventDefault();clubNetworkRun(async()=>{
 const password=$('club-network-old-password').value,next=$('club-network-new-password').value;if(next.length<12||next!==$('club-network-confirm-password').value)return clubNetworkStatus('Choisissez deux mots de passe identiques de 12 caractères minimum.');
 const session=await clubNetworkRequest('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email:clubNetworkSession.user.email,password}});if(session.user?.id!==clubNetworkSession.user.id)throw clubNetworkError('Compte différent',403);clubNetworkStoreSession(session);await clubNetworkRequest('/auth/v1/user',{method:'PUT',body:{password:next}});for(const id of ['club-network-old-password','club-network-new-password','club-network-confirm-password'])$(id).value='';clubNetworkStatus('Mot de passe modifié.');
});};
for(const id of ['club-network-logout','club-account-signout'])$(id).onclick=()=>clubNetworkRun(clubNetworkLogout);
for(const id of ['view-club-network','club-account-library'])$(id).onclick=()=>clubNetworkShowView();
$('club-network-shortcut').onclick=e=>{e.preventDefault();clubNetworkShowView();};$('club-network-close').onclick=()=>$('view-pitch').click();
for(const id of ['view-pitch','view-training','view-reports','view-coach-agenda'])$(id).addEventListener('click',()=>clubNetworkShowView(false));
$('club-network-preview-close').onclick=()=>{$('club-network-preview').close();$('club-network-preview-content').replaceChildren();clubNetworkPreview=null;};$('club-network-copy').onclick=()=>clubNetworkRun(()=>clubNetworkImport());
for(const id of ['club-network-author','club-network-kind'])$(id).onchange=()=>{clubNetworkPageSize=50;clubNetworkRenderRows();};$('club-network-more').onclick=()=>{clubNetworkPageSize+=50;clubNetworkRenderRows();};$('club-network-refresh').onclick=()=>clubNetworkQueueSync();
$('club-network-publish').onclick=()=>clubNetworkRun(async()=>{const value=$('club-network-source').value;if(value==='')return clubNetworkStatus('Choisissez un document enregistré.');const s=clubNetworkSources[Number(value)];clubNetworkMarkPending(s.kind,s.id,'save');await clubNetworkQueueSync();});
$('club-network-import-local').onclick=()=>clubNetworkRun(async()=>{
 if(!confirm('Importer les documents du profil local sélectionné dans votre compte et les partager au club ? Ne continuez que pour vos propres documents. Les originaux locaux seront conservés.'))return;
 let count=0;for(const kind of Object.keys(clubNetworkKinds)){
  const list=[...clubNetworkLibrary(kind)];for(const profile of coachProfiles.filter(p=>p.id===$('club-network-legacy-profile').value)){let raw;try{raw=JSON.parse(localStorage.getItem(coachStorageKey(clubNetworkLibraryKey(kind),profile.id))||'[]');}catch{continue;}if(!Array.isArray(raw))continue;
   for(const entry of raw){const payload=structuredClone(kind==='composition'?entry.state:entry);if(!clubNetworkPayloadValid(kind,payload))continue;if(kind==='composition')payload.documentId=crypto.randomUUID();else payload.id=crypto.randomUUID();list.push(payload);clubNetworkMarkPending(kind,clubNetworkPayloadId(kind,payload),'save');count++;}
  }clubNetworkSetLibrary(kind,list);
 }clubNetworkStatus(count+' document(s) importé(s).');await clubNetworkQueueSync();
});
// Enregistrer dans le site privé signifie enregistrer sur le compte et rendre visible au club.
coachStorageSet=function(key,value){
 const previous=coachStorageGet(key);try{clubNetworkOriginalStorageSet(key,value);clubSaveLocalErrors.delete(key);}catch(error){clubSaveLocalErrors.add(key);clubSaveStatus('error','Le stockage sur cet appareil a échoué : cette modification n’est pas enregistrée. Libérez de l’espace et enregistrez à nouveau.');throw error;}if(!clubNetworkBound())return;
 const kind=key==='vestiaire-training-library'?'training':key==='vestiaire-reports'?'report':key==='vestiaire-saves'?'composition':null;if(!kind)return;
 try{
  const unwrap=x=>kind==='composition'?x.state:x,old=JSON.parse(previous||'[]').map(unwrap),next=JSON.parse(value).map(unwrap),oldMap=new Map(old.map(p=>[clubNetworkPayloadId(kind,p),JSON.stringify(p)])),ids=new Set(next.map(p=>clubNetworkPayloadId(kind,p)));
  for(const payload of next){const s=clubNetworkSource(kind,payload);if(s&&oldMap.get(s.id)!==JSON.stringify(payload))clubNetworkMarkPending(kind,s.id,'save');}
  for(const payload of old){const id=clubNetworkPayloadId(kind,payload);if(id&&!ids.has(id))clubNetworkMarkPending(kind,id,'delete');}
  clubSaveLocalErrors.delete('queue:'+key);clubNetworkStatus('Enregistré sur cet appareil · synchronisation avec le club…');clubNetworkQueueSync();
 }catch{clubSaveLocalErrors.add('queue:'+key);clubSaveStatus('error','Le document est conservé sur cet appareil, mais sa mise en attente de partage a échoué. Enregistrez-le à nouveau.');clubNetworkStatus('Enregistré sur cet appareil, mais la synchronisation doit être réessayée.');}
};
function clubNetworkResume(){if(typeof clubAccountRecoveryActive!=='undefined'&&clubAccountRecoveryActive)return;if(clubNetworkSession){try{const saved=JSON.parse(sessionStorage.getItem(clubNetworkSessionKey)||'null')?.session;if(saved?.user?.id!==clubNetworkSession.user.id){clubNetworkClear();clubNetworkStatus('Votre session est terminée. Connectez-vous à nouveau.');return;}clubNetworkStoreSession(saved);}catch{clubNetworkClear();clubNetworkStatus('Votre session n’est plus disponible. Connectez-vous à nouveau.');return;}}if(clubNetworkSession&&!clubNetworkMember&&!clubNetworkBusy)clubNetworkRun(()=>clubNetworkAfterLogin(clubNetworkSession));else clubNetworkQueueSync();}
window.addEventListener('offline',()=>{if(clubNetworkBound())clubSaveStatus('pending','Hors connexion : le partage et la vérification sont en attente. Les documents déjà partagés restent disponibles au club.');});
for(const event of ['online','focus'])window.addEventListener(event,clubNetworkResume);document.addEventListener('visibilitychange',()=>{if(!document.hidden)clubNetworkQueueSync();});
window.addEventListener('hashchange',()=>{if(location.hash==='#educateurs'&&!clubNetworkBound())clubNetworkRequestPrivate();});
for(const profile of coachProfiles){const option=el('option','',profile.name);option.value=profile.id;$('club-network-legacy-profile').append(option);}
clubNetworkRenderState();
if(new URLSearchParams(location.search).get('auth')==='signup')clubAuthChoose('signup');
if(clubNetworkReady&&!clubNetworkLocalMode){
 try{const handled=typeof clubAccountHandleReturn==='function'&&clubAccountHandleReturn();const saved=JSON.parse(sessionStorage.getItem(clubNetworkSessionKey)||'null');if(handled){}else if(saved?.session?.user?.id)clubNetworkRun(()=>clubNetworkAfterLogin(saved.session));else if(!new URLSearchParams(location.search).has('auth')&&/^https?:$/.test(location.protocol))location.replace('accueil.html');else if(!$('club-network-signup').hidden)clubNetworkStatus('Renseignez votre prénom, votre nom et le code d’invitation remis par le club.');else clubNetworkStatus('Connectez-vous pour entrer dans l’espace privé du club.');}catch{clubNetworkClear();}
}

function clubNetworkCoachActivity(person){
 const details=clubNetworkActivityState==='ready'?clubNetworkActivity.find(p=>p.user_id===person.user_id):null,known=typeof details?.is_online==='boolean'||clubNetworkPresenceState==='ready';
 const online=person.active&&(typeof details?.is_online==='boolean'?details.is_online:clubNetworkPresenceState==='ready'&&clubNetworkConnected.some(p=>p.user_id===person.user_id));
 const date=details?.last_login?new Date(details.last_login):null;
 const lastLogin=date&&Number.isFinite(date.getTime())?new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'}).format(date):details&&details.last_login===null?'Pas encore de connexion':'Non disponible';
 return {online,label:!person.active?'Accès désactivé':online?'En ligne':known?'Hors ligne':'Statut indisponible',lastLogin};
}
function clubNetworkRenderCoachActivity(){
 const profiles=$('club-network-coach-cards');let help=$('club-presence-help');if(!help){help=el('p','club-presence-help');help.id='club-presence-help';help.setAttribute('role','status');profiles.prepend(help);}
 const setup=[clubNetworkPresenceState,clubNetworkActivityState,clubNetworkPresenceWriteState].includes('setup'),unavailable=[clubNetworkPresenceState,clubNetworkActivityState,clubNetworkPresenceWriteState].includes('unavailable'),reason=setup?'setup':unavailable?'unavailable':'';
 help.hidden=!reason;if(help.dataset.reason!==reason){help.dataset.reason=reason;help.replaceChildren();if(reason){help.append(document.createTextNode(setup?'Le suivi des connexions doit être activé par le responsable du club. ':'Le suivi des connexions est temporairement indisponible. '));if(setup){const link=el('a','','Script d’activation Supabase');link.href='supabase/club-presence.sql';link.target='_blank';link.rel='noopener';help.append(link,document.createTextNode(' · '));}const retry=el('button','export','Réessayer');retry.type='button';retry.onclick=()=>clubNetworkQueueSync();help.append(retry);}}
 for(const card of document.querySelectorAll('#club-network-coach-cards .club-coach-card[data-user-id]')){
  const member=clubNetworkMembers.find(m=>m.user_id===card.dataset.userId),root=card.querySelector('.club-coach-activity');if(!member||!root)continue;
  const activity=clubNetworkCoachActivity(member),status=el('span','club-coach-presence'),dot=el('i',activity.online?'online':'offline');dot.setAttribute('aria-hidden','true');status.append(dot,el('span','club-coach-status',activity.label));
  root.replaceChildren(status,el('small','club-last-login','Dernière connexion : '+activity.lastLogin));
 }
}
function clubNetworkRenderPresence(){
 const root=$('club-connected-names');root.replaceChildren();const ready=clubNetworkPresenceState==='ready';
 $('club-connected-title').textContent='Les éducateurs';$('club-connected-count').textContent=ready?clubNetworkConnected.length+' en ligne':'';
 $('club-connected-status').textContent=ready?'LED verte : activité détectée dans les 90 dernières secondes. Cliquez sur un nom pour consulter son travail.':'Statut en ligne indisponible pour le moment.';
 const online=new Set(clubNetworkConnected.map(p=>p.user_id));
 const people=clubNetworkMembers.filter(m=>m.active).sort((a,b)=>Number(online.has(b.user_id))-Number(online.has(a.user_id))||a.display_name.localeCompare(b.display_name,'fr'));
 if(!people.length)root.append(el('p','hint','Aucun éducateur à afficher.'));
 for(const person of people){
  const status=clubNetworkCoachActivity(person),isOnline=status.online;
  const button=el('button','club-connected-person');button.dataset.userId=person.user_id;
  const dot=el('i',isOnline?'online':'unknown');dot.setAttribute('role','img');dot.setAttribute('aria-label',status.label);
  const name=el('span','',person.display_name+(person.user_id===clubNetworkSession?.user.id?' · vous':''));name.append(el('small','',status.label));
  name.append(el('small','club-last-login','Dernière connexion : '+status.lastLogin));button.append(dot,name);button.onclick=()=>{$('club-network-author').value=person.user_id;clubNetworkShowView();};root.append(button);
 }
 clubNetworkRenderCoachActivity();if(typeof renderClubHomeStats==='function')renderClubHomeStats();
}
async function clubNetworkUpdatePresence(){
 if(!clubNetworkBound())return;
 const authError=error=>error?.status===401||error?.status===403||error?.code==='42501';
 const failure=error=>['PGRST202','42P01','42883'].includes(error?.code)||error?.status===404?'setup':'unavailable';
 // L'échec d'un point d'entrée ne doit pas masquer les lectures encore disponibles.
 try{
  if(!document.hidden)await clubNetworkRequest('/rest/v1/rpc/club_presence_ping',{method:'POST',body:{p_session_id:clubNetworkPresenceSession,p_online:true}});clubNetworkPresenceWriteState='ready';
 }catch(error){
  if(authError(error))throw error;clubNetworkPresenceWriteState=failure(error);
 }
 const [presence,activity]=await Promise.allSettled([clubNetworkRequest('/rest/v1/rpc/club_connected_coaches',{method:'POST',body:{}}),clubNetworkRequest('/rest/v1/rpc/club_educator_activity',{method:'POST',body:{}})]);
 for(const result of [presence,activity])if(result.status==='rejected'&&authError(result.reason))throw result.reason;
 if(presence.status==='fulfilled'&&Array.isArray(presence.value)){clubNetworkConnected=presence.value;clubNetworkPresenceState='ready';}
 else{clubNetworkConnected=[];clubNetworkPresenceState=failure(presence.reason);}
 if(activity.status==='fulfilled'&&Array.isArray(activity.value)){clubNetworkActivity=activity.value;clubNetworkActivityState='ready';if(clubNetworkPresenceState!=='ready'){clubNetworkConnected=activity.value.filter(p=>p.is_online===true);clubNetworkPresenceState='ready';}}
 else{clubNetworkActivity=[];clubNetworkActivityState=failure(activity.reason);}
 clubNetworkRenderPresence();
}
async function clubNetworkLeavePresence(keepalive=false){
 if(!clubNetworkBound()||!clubNetworkSession)return;
 // Meilleur effort : une fermeture brutale expire aussi côté serveur après 90 secondes.
 try{await fetch(clubNetworkBase+'/rest/v1/rpc/club_presence_ping',{method:'POST',headers:{apikey:clubNetworkConfig.publishableKey,Authorization:'Bearer '+clubNetworkSession.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_session_id:clubNetworkPresenceSession,p_online:false}),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',keepalive,signal:AbortSignal.timeout(1500)});}catch{}
}
window.addEventListener('pagehide',()=>{void clubNetworkLeavePresence(true);});
window.addEventListener('pageshow',event=>{if(event.persisted)clubNetworkResume();});
