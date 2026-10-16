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
let clubNetworkSession=null,clubNetworkMember=null,clubNetworkMembers=[],clubNetworkRows=[],clubNetworkPreview=null,clubNetworkSources=[],clubNetworkRefreshPromise=null,clubNetworkGeneration=0,clubNetworkBusy=false,clubNetworkOffset=0,clubNetworkHasMore=false,clubNetworkQueue=Promise.resolve();
const clubNetworkSessionKey='vestiaire-private-session:'+clubNetworkBase;
const clubNetworkKinds={training:'Séance',report:'Rapport',composition:'Composition'};
function clubNetworkStatus(message){$('club-network-status').textContent=message;}
function clubNetworkMessage(error){
 if(error?.code==='40001')return 'Conflit de version : récupérez votre version partagée avant de modifier et republier. La version en ligne est conservée.';
 if(error?.status===401)return 'Connexion expirée. Reconnectez-vous ; vos documents locaux sont conservés.';
 if(error?.status===403||error?.code==='42501')return 'Accès refusé. Contactez le responsable du club pour vérifier votre invitation et votre autorisation.';
 if(error?.status===429)return 'Trop de demandes. Patientez avant de réessayer la connexion ou le partage.';
 if(error?.status===400||error?.status===422)return 'Demande refusée : vérifiez votre adresse, votre mot de passe ou le contenu du document.';
 return 'Service indisponible ou connexion interrompue. Les données locales restent conservées ; réessayez le partage.';
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
function clubNetworkStoreSession(session){
 if(!session||typeof session.access_token!=='string'||typeof session.refresh_token!=='string'||!session.user?.id)throw Error('Session invalide.');
 clubNetworkSession={access_token:session.access_token,refresh_token:session.refresh_token,expires_at:Number(session.expires_at)||Math.floor(Date.now()/1000)+Number(session.expires_in||3600),user:{id:session.user.id,email:session.user.email||''}};
 // Session limitée à cet onglet, jamais sauvegardée dans les données exportées du coach.
 try{sessionStorage.setItem(clubNetworkSessionKey,JSON.stringify({session:clubNetworkSession,coachId:activeCoach.id}));}catch{}
}
async function clubNetworkRefreshSession(){
 if(clubNetworkRefreshPromise)return clubNetworkRefreshPromise;
 if(!clubNetworkSession)throw clubNetworkError('Connexion requise',401);
 clubNetworkRefreshPromise=(async()=>{try{const session=await clubNetworkRequest('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:clubNetworkSession.refresh_token},auth:false});clubNetworkStoreSession(session);}catch(error){clubNetworkClear();throw error;}finally{clubNetworkRefreshPromise=null;}})();return clubNetworkRefreshPromise;
}
function clubNetworkClear(){
 clubNetworkGeneration++;clubNetworkSession=null;clubNetworkMember=null;clubNetworkMembers=[];clubNetworkRows=[];clubNetworkPreview=null;clubNetworkSources=[];
 try{sessionStorage.removeItem(clubNetworkSessionKey);}catch{}
 $('club-network-preview-content').replaceChildren();$('club-network-preview-title').textContent='';$('club-network-preview-author').textContent='';$('club-network-preview').close();$('club-network-list').replaceChildren();$('club-network-source').replaceChildren();$('club-network-author').replaceChildren();$('club-network-identity').textContent='';for(const id of ['club-network-password','club-network-old-password','club-network-new-password','club-network-confirm-password'])$(id).value='';clubNetworkRenderState();
}
function clubNetworkPreferenceKey(){return 'vestiaire-private-auto:'+clubNetworkBase+':'+clubNetworkSession.user.id+':'+activeCoach.id;}
function clubNetworkAutoEnabled(){try{return !!clubNetworkMember&&localStorage.getItem(clubNetworkPreferenceKey())==='true';}catch{return false;}}
function clubNetworkVersionKey(kind,id){return 'vestiaire-private-version:'+clubNetworkBase+':'+clubNetworkSession.user.id+':'+activeCoach.id+':'+kind+':'+id;}
function clubNetworkKnownVersion(kind,id){try{const saved=JSON.parse(sessionStorage.getItem(clubNetworkVersionKey(kind,id))||'null');return saved&&Number.isInteger(saved.revision)&&saved.revision>0&&typeof saved.id==='string'?saved:{revision:0,id:null};}catch{return {revision:0,id:null};}}
function clubNetworkRememberVersion(kind,id,revision,documentId=null){try{sessionStorage.setItem(clubNetworkVersionKey(kind,id),JSON.stringify({revision,id:documentId}));}catch{clubNetworkStatus('Document partagé. Stockage local indisponible : récupérez la version en ligne avant de la modifier.');}}
function clubNetworkPayloadValid(kind,payload){try{return kind==='training'?trainingValid(payload):kind==='report'?reportValid(payload):kind==='composition'?!!valid(payload):false;}catch{return false;}}
function clubNetworkSource(kind,payload){
 const id=kind==='composition'?payload.documentId:payload.id;
 if(!id||!clubNetworkPayloadValid(kind,payload))return null;
 const fallback=kind==='training'?payload.date+' · '+payload.team:kind==='report'?(payload.info.date||'Match')+' · '+payload.info.team+' / '+payload.info.opponent:payload.team+' · '+payload.formation;
 return {kind,id,title:(payload.title?.trim()||fallback||clubNetworkKinds[kind]).slice(0,150),payload:structuredClone(payload)};
}
function clubNetworkRenderSources(){
 clubNetworkSources=[];
 for(const [kind,list] of [['training',trainingLibrary],['report',reportLibrary],['composition',saves.map(s=>s.state)]])for(const payload of list){const source=clubNetworkSource(kind,payload);if(source)clubNetworkSources.push(source);}
 const select=$('club-network-source'),previous=select.value;select.replaceChildren();
 const placeholder=el('option','',clubNetworkSources.length?'Choisir un document enregistré…':'Enregistrez d’abord une séance, un rapport ou une composition');placeholder.value='';select.append(placeholder);
 clubNetworkSources.forEach((source,i)=>{const option=el('option','',clubNetworkKinds[source.kind]+' · '+source.title);option.value=String(i);select.append(option);});if([...select.options].some(o=>o.value===previous))select.value=previous;
}
function clubNetworkRenderState(){
 $('club-network-setup').hidden=clubNetworkReady;$('club-network-login').hidden=!clubNetworkReady||!!clubNetworkMember;$('club-network-connected').hidden=!clubNetworkMember;
 if(clubNetworkMember){$('club-network-identity').textContent=clubNetworkMember.display_name+' · profil local : '+activeCoach.name;$('club-network-auto').checked=clubNetworkAutoEnabled();clubNetworkRenderSources();}
}
async function clubNetworkLoadMember(){
 const session=clubNetworkSession;if(!session)throw clubNetworkError('',401);
 const members=await clubNetworkRequest('/rest/v1/club_members?select=user_id,display_name,active&order=display_name');
 if(!Array.isArray(members))throw Error('Réponse invalide');
 const member=members.find(m=>m.user_id===session.user.id&&m.active===true);
 if(!member)throw clubNetworkError('Non autorisé',403);
 clubNetworkMembers=members;clubNetworkMember=member;clubNetworkRenderState();
 const select=$('club-network-author'),previous=select.value;select.replaceChildren();const all=el('option','','Tous les éducateurs');all.value='';select.append(all);
 for(const m of members){const option=el('option','',m.display_name+(m.active?'':' · ancien membre'));option.value=m.user_id;select.append(option);}select.value=previous;
}
async function clubNetworkList(more=false){
 if(!clubNetworkMember)return;
 const author=$('club-network-author').value,kind=$('club-network-kind').value;
 const query=new URLSearchParams({select:'id,owner_id,kind,source_id,title,revision,updated_at',order:'updated_at.desc,id.asc',limit:'50',offset:String(more?clubNetworkOffset:0)});
 if(author)query.set('owner_id','eq.'+author);if(kind)query.set('kind','eq.'+kind);
 const rows=await clubNetworkRequest('/rest/v1/club_documents?'+query);
 if(!Array.isArray(rows))throw Error('Réponse invalide');
 clubNetworkRows=more?[...clubNetworkRows,...rows]:rows;clubNetworkOffset=clubNetworkRows.length;clubNetworkHasMore=rows.length===50;clubNetworkRenderRows();
 clubNetworkStatus(clubNetworkRows.length+' document(s) chargé(s) · actualisé à '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'})+'.');
}
function clubNetworkAuthor(id){return clubNetworkMembers.find(m=>m.user_id===id)?.display_name||'Éducateur du club';}
function clubNetworkRenderRows(){
 const root=$('club-network-list');root.replaceChildren();
 if(!clubNetworkRows.length)root.append(el('p','report-panel','Aucun document partagé pour ces filtres.'));
 for(const row of clubNetworkRows){
  const article=el('article','report-panel club-network-card'),info=el('div');info.append(el('h3','',row.title),el('p','',clubNetworkKinds[row.kind]+' · '+clubNetworkAuthor(row.owner_id)),el('p','hint','Version '+row.revision+' · '+new Date(row.updated_at).toLocaleString('fr-FR',{timeZone:'Europe/Paris'})));
  const actions=el('div','report-actions'),open=el('button','export','Consulter');open.onclick=()=>clubNetworkRun(()=>clubNetworkOpen(row));actions.append(open);
  if(row.owner_id===clubNetworkSession.user.id){const remove=el('button','export','Retirer du partage');remove.onclick=()=>clubNetworkRun(async()=>{if(!confirm('Retirer ce document de l’espace du club ? Les copies locales sont conservées.'))return;await clubNetworkRequest('/rest/v1/rpc/club_remove_document',{method:'POST',body:{p_id:row.id,p_expected_revision:row.revision}});clubNetworkRememberVersion(row.kind,row.source_id,0);await clubNetworkList();});actions.append(remove);}
  article.append(info,actions);root.append(article);
 }
 $('club-network-more').hidden=!clubNetworkHasMore;
}
async function clubNetworkPublish(source){
 if(!clubNetworkMember||!source||!clubNetworkPayloadValid(source.kind,source.payload))throw Error('Document invalide');
 if(new Blob([JSON.stringify(source.payload)]).size>7*1024*1024)throw clubNetworkError('Document trop volumineux',400);
 const expected=clubNetworkKnownVersion(source.kind,source.id);
 const result=await clubNetworkRequest('/rest/v1/rpc/club_publish_document',{method:'POST',body:{p_kind:source.kind,p_source_id:source.id,p_title:source.title,p_payload:source.payload,p_expected_revision:expected.revision,p_expected_id:expected.id}});
 const row=Array.isArray(result)&&result.length===1?result[0]:result;
 if(!row||row.owner_id!==clubNetworkSession.user.id||row.source_id!==source.id||!Number.isInteger(row.revision))throw Error('Réponse invalide');
 clubNetworkRememberVersion(source.kind,source.id,row.revision,row.id);clubNetworkStatus('Partagé avec les éducateurs : '+source.title+' · version '+row.revision+'.');
}
function clubNetworkComposition(payload){
 const root=el('article','report-document');root.append(el('h2','',payload.title||payload.team),el('p','',payload.team+' · '+(payload.category||'')+' · '+payload.formation));
 const pitch=el('div','club-network-pitch');pitch.setAttribute('aria-label','Composition en lecture seule');
 for(const p of payload.players.filter(p=>p.role!=='sub')){const token=el('div','club-network-player');token.style.left=p.x+'%';token.style.top=p.y+'%';if(p.photo){const img=el('img');img.src=p.photo;img.alt='';token.append(img);}token.append(el('strong','',String(p.number)),el('span','',p.name));pitch.append(token);}root.append(pitch);
 const bench=payload.players.filter(p=>p.role==='sub');if(bench.length)root.append(el('h3','','Impacteurs / Finisseurs'),el('p','',bench.map(p=>p.number+' · '+p.name).join(' / ')));
 root.append(el('p','',payload.notes));return root;
}
async function clubNetworkOpen(metadata){
 const rows=await clubNetworkRequest('/rest/v1/club_documents?select=*&id=eq.'+encodeURIComponent(metadata.id)+'&limit=1'),row=rows?.[0];
 if(!row||!clubNetworkPayloadValid(row.kind,row.payload))throw clubNetworkError('Document incompatible',400);
 clubNetworkPreview=row;let content;
 if(row.kind==='training'){const original=currentTraining;try{currentTraining=structuredClone(row.payload);content=trainingDocument();}finally{currentTraining=original;}}
 else if(row.kind==='report'){const original=currentReport;try{currentReport=structuredClone(row.payload);content=buildReportDocument();}finally{currentReport=original;}}
 else content=clubNetworkComposition(row.payload);
 const own=row.owner_id===clubNetworkSession.user.id;$('club-network-preview-title').textContent=row.title;$('club-network-preview-author').textContent=clubNetworkAuthor(row.owner_id)+' · version '+row.revision+' · lecture seule';$('club-network-copy').textContent=own?'Récupérer dans mon espace pour modifier':'Créer une copie dans mon espace';$('club-network-preview-content').replaceChildren(content);$('club-network-preview').showModal();
}
function clubNetworkImport(){
 const row=clubNetworkPreview;if(!row||!clubNetworkMember)return;
 const own=row.owner_id===clubNetworkSession.user.id,payload=structuredClone(row.payload),kind=row.kind;
 const id=own?row.source_id:crypto.randomUUID();if(kind==='composition')payload.documentId=id;else payload.id=id;
 if(!own){payload.title=('Copie · '+(payload.title||row.title)).slice(0,100);if(kind==='training')payload.coach=activeCoach.name;if(kind==='report')payload.info.coach=activeCoach.name;}
 if(!clubNetworkPayloadValid(kind,payload))return notify('Document incompatible.');
 const exists=kind==='training'?trainingLibrary.some(x=>x.id===id):kind==='report'?reportLibrary.some(x=>x.id===id):saves.some(x=>x.state.documentId===id);
 if(!confirm((exists?'Récupérer la version partagée dans votre bibliothèque locale ?':'Ajouter ce document à votre bibliothèque locale ?')+(own?' Si ce document est ouvert, il sera remplacé ; les différences du brouillon seront conservées dans une copie locale.':' Le brouillon ouvert est conservé.')))return;
 // L’import ne déclenche pas de republication automatique.
 const key=kind==='training'?'vestiaire-training-library':kind==='report'?'vestiaire-reports':'vestiaire-saves';
 const next=kind==='training'?[payload,...trainingLibrary.filter(x=>x.id!==id)]:kind==='report'?[payload,...reportLibrary.filter(x=>x.id!==id)]:[{date:new Date().toISOString(),state:payload},...saves.filter(x=>x.state.documentId!==id)];
 const opened=kind==='training'?currentTraining:kind==='report'?currentReport:state;
 const replaceOpened=own&&(kind==='composition'?opened.documentId:opened.id)===id;
 if(replaceOpened&&JSON.stringify(opened)!==JSON.stringify(payload)){const backup=structuredClone(opened);if(kind==='composition')backup.documentId=crypto.randomUUID();else backup.id=crypto.randomUUID();backup.title=('Copie avant récupération · '+(backup.title||row.title)).slice(0,100);if(!clubNetworkPayloadValid(kind,backup))throw Error('Brouillon invalide');next.push(kind==='composition'?{date:new Date().toISOString(),state:backup}:backup);}
 clubNetworkOriginalStorageSet(key,JSON.stringify(next));
 if(replaceOpened){if(kind==='training'){currentTraining=structuredClone(payload);saveTrainingDraft();syncTrainingForm();renderTrainingBlocks();renderTrainingCatalogue();}else if(kind==='report'){currentReport=structuredClone(payload);flushReportDraft();renderReportContent();}else{state=structuredClone(payload);render();persist();}}
 if(kind==='training'){trainingLibrary=next;renderTrainingLibrary();}else if(kind==='report'){reportLibrary=next;renderReportLibrary();}else{saves=next;renderSaves();}
 if(own)clubNetworkRememberVersion(kind,id,row.revision,row.id);
 clubNetworkRenderSources();$('club-network-preview').close();notify('Ajouté à votre bibliothèque locale. Ouvrez-le depuis vos documents pour travailler dessus.');
}
async function clubNetworkRun(action){
 if(clubNetworkBusy)return;clubNetworkBusy=true;$('club-network-dialog').setAttribute('aria-busy','true');
 try{await action();}catch(error){const message=clubNetworkMessage(error);if(error?.status===401||error?.status===403||error?.code==='42501')clubNetworkClear();clubNetworkStatus(message);}finally{clubNetworkBusy=false;$('club-network-dialog').removeAttribute('aria-busy');}
}
$('view-club-network').onclick=()=>{clubNetworkRenderState();$('club-network-dialog').showModal();if(clubNetworkMember)clubNetworkRun(async()=>{await clubNetworkLoadMember();await clubNetworkList();});else clubNetworkStatus(clubNetworkReady?'Connectez-vous avec le compte créé par le responsable du club.':'Activation du service privé en attente.');};
$('club-network-close').onclick=()=>$('club-network-dialog').close();$('club-network-preview-close').onclick=()=>{$('club-network-preview').close();$('club-network-preview-content').replaceChildren();clubNetworkPreview=null;};
$('club-network-login').onsubmit=e=>{e.preventDefault();clubNetworkRun(async()=>{
 const email=$('club-network-email').value.trim(),password=$('club-network-password').value;$('club-network-password').value='';
 const session=await clubNetworkRequest('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});clubNetworkStoreSession(session);await clubNetworkLoadMember();await clubNetworkList();
});};
$('club-network-password-form').onsubmit=e=>{e.preventDefault();clubNetworkRun(async()=>{
 const password=$('club-network-old-password').value,next=$('club-network-new-password').value,confirmation=$('club-network-confirm-password').value;
 if(next!==confirmation)return clubNetworkStatus('Les deux nouveaux mots de passe doivent être identiques.');
 if(next.length<12)return clubNetworkStatus('Choisissez un mot de passe de 12 caractères minimum.');
 const email=clubNetworkSession.user.email,session=await clubNetworkRequest('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});
 if(session.user?.id!==clubNetworkSession.user.id)throw clubNetworkError('Compte différent',403);
 clubNetworkStoreSession(session);await clubNetworkRequest('/auth/v1/user',{method:'PUT',body:{password:next}});
 for(const id of ['club-network-old-password','club-network-new-password','club-network-confirm-password'])$(id).value='';
 clubNetworkStatus('Mot de passe modifié.');
});};
$('club-network-logout').onclick=()=>clubNetworkRun(async()=>{try{if(clubNetworkSession)await clubNetworkRequest('/auth/v1/logout?scope=local',{method:'POST'});}finally{clubNetworkClear();clubNetworkStatus('Déconnecté. Les sauvegardes locales sont conservées.');}});
$('club-network-auto').onchange=()=>{try{localStorage.setItem(clubNetworkPreferenceKey(),String($('club-network-auto').checked));clubNetworkStatus($('club-network-auto').checked?'Partage activé pour les prochains enregistrements de '+activeCoach.name+'.':'Partage automatique désactivé.');}catch{clubNetworkStatus('Impossible de conserver cette préférence.');$('club-network-auto').checked=false;}};
$('club-network-publish').onclick=()=>clubNetworkRun(async()=>{const index=$('club-network-source').value;if(index==='')return clubNetworkStatus('Choisissez un document déjà enregistré.');await clubNetworkPublish(clubNetworkSources[Number(index)]);await clubNetworkList();});
$('club-network-refresh').onclick=()=>clubNetworkRun(async()=>{await clubNetworkLoadMember();await clubNetworkList();});
for(const id of ['club-network-author','club-network-kind'])$(id).onchange=()=>clubNetworkRun(()=>clubNetworkList());$('club-network-more').onclick=()=>clubNetworkRun(()=>clubNetworkList(true));
$('club-network-copy').onclick=()=>clubNetworkRun(clubNetworkImport);
// Les écritures locales restent prioritaires. Seules les bibliothèques explicitement enregistrées sont partagées.
const clubNetworkOriginalStorageSet=coachStorageSet;
coachStorageSet=function(key,value){
 const old=coachStorageGet(key);clubNetworkOriginalStorageSet(key,value);
 const kind=key==='vestiaire-training-library'?'training':key==='vestiaire-reports'?'report':key==='vestiaire-saves'?'composition':null;
 if(!kind||!clubNetworkAutoEnabled())return;
 try{
  const unwrap=x=>kind==='composition'?x.state:x,previous=JSON.parse(old||'[]'),next=JSON.parse(value),generation=clubNetworkGeneration;
  const byId=new Map(previous.map(x=>{const p=unwrap(x);return [kind==='composition'?p.documentId:p.id,JSON.stringify(p)];}));
  for(const item of next){const payload=unwrap(item),source=clubNetworkSource(kind,payload);if(!source||byId.get(source.id)===JSON.stringify(payload))continue;
   clubNetworkQueue=clubNetworkQueue.then(async()=>{if(generation!==clubNetworkGeneration||!clubNetworkAutoEnabled())return;try{await clubNetworkPublish(source);if($('club-network-dialog').open)await clubNetworkList();}catch(error){clubNetworkStatus(clubNetworkMessage(error));notify('Enregistré sur cet appareil ; partage non effectué. Ouvrez l’espace privé pour réessayer.');}});
  }
 }catch{clubNetworkStatus('Enregistré sur cet appareil ; partage à réessayer manuellement.');}
};
clubNetworkRenderState();
if(clubNetworkReady){
 try{const saved=JSON.parse(sessionStorage.getItem(clubNetworkSessionKey)||'null');if(saved?.coachId===activeCoach.id&&saved.session?.user?.id){clubNetworkStoreSession(saved.session);clubNetworkRun(async()=>{await clubNetworkLoadMember();});}else sessionStorage.removeItem(clubNetworkSessionKey);}catch{clubNetworkClear();}
}
