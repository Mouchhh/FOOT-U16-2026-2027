/* Responsable: read-only RPCs; demo mode contains only fictional fixtures. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),demo=new URLSearchParams(location.search).get('demo')==='1';
 const config=window.CLUB_CLOUD_CONFIG||{},labels={training:'Séance',composition:'Composition',report:'Bilan'};
 let data=null,tab='overview',ownerFilter='',oldOnly=false,pending=false,requestGeneration=0;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const age=d=>Math.max(0,(Date.now()-new Date(d).getTime())/86400000);
 const stamp=days=>new Date(Date.now()-days*86400000).toISOString();
 const date=d=>new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short'}).format(new Date(d));
 function fixtures(){
  const educators=[['c1','Camille Laurent'],['c2','Alex Martin'],['c3','Sam Moreau'],['c4','Lou Bernard'],['c5','Noa Petit'],['c6','Charlie Robin']].map(([id,name])=>({id,name,active:true}));
  const entries=[['c1','training','Conserver pour avancer','U17',0],['c2','report','Bilan collectif · Journée 7','U15',1],['c3','composition','Organisation en 4-3-3','SENIORS',2],['c4','training','Se démarquer entre les lignes','U13',3],['c1','composition','Préparer notre animation offensive','U17',4],['c5','training','Défendre ensemble','U19',5],['c2','training','Sortir du pressing','U15',6],['c3','report','Bilan collectif · Journée 6','SENIORS',9],['c6','composition','Notre organisation sans ballon','U11',15],['c6','training','Créer et utiliser les espaces','U11',18],['c4','report','Bilan collectif · Journée 5','U13',21],['c5','composition','Les repères du week-end','U19',24]];
  const summaries=window.CruzaManagerDemo.documents().map(d=>({id:d.id,owner_id:d.owner_id,kind:d.kind,title:d.title,category:d.category,team:d.stats.teamContext.team,revision:1,updated_at:d.updated_at}));
  return {access:{allowed:true,role:'director',categories:[],display_name:'Direction technique'},generated_at:new Date().toISOString(),total_documents:summaries.length+entries.filter(e=>e[1]==='composition').length,truncated:false,educators,documents:summaries.concat(entries.filter(e=>e[1]==='composition').map(([owner_id,kind,title,category,days],i)=>({id:'demo-'+i,owner_id,kind,title,category,team:category+' · Équipe 1',revision:1+(i%3),updated_at:stamp(days)}))).sort((a,b)=>b.updated_at.localeCompare(a.updated_at))};
 }
 function visible(){
  if(!data)return [];
  let docs=data.documents;
  if(demo&&$('scope').value==='formation')docs=docs.filter(d=>['U13','U15','U17','U19'].includes(d.category));
  const period=$('period').value;if(period!=='all')docs=docs.filter(d=>age(d.updated_at)<=Number(period));
  return docs;
 }
 function coaches(){
  if(!data)return [];
  if(demo&&$('scope').value==='formation'){const ids=new Set(data.documents.filter(d=>['U13','U15','U17','U19'].includes(d.category)).map(d=>d.owner_id));return data.educators.filter(c=>ids.has(c.id));}
  return data.educators;
 }
 const coachName=id=>data.educators.find(c=>c.id===id)?.name||'Éducateur';
 function setStatus(message,login=false){$('status').replaceChildren(node('p','',message));if(login){const a=node('a','','Ouvrir la connexion éducateur →');a.href='index.html?auth=login';$('status').append(a);}$('status').hidden=false;}
 async function rpc(name,body={}){
  let base,session;
  try{const url=new URL(config.url);if(url.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/.test(url.hostname)||url.pathname!=='/'||url.search||url.hash||url.username||url.password||url.port)throw Error();base=url.origin;session=JSON.parse(sessionStorage.getItem('vestiaire-private-session:'+base)||'null')?.session;}catch{throw Object.assign(Error('Cet espace nécessite la configuration du projet Supabase dédié à votre club.'),{code:'configuration'});}
  if(typeof config.publishableKey!=='string'||!config.publishableKey)throw Object.assign(Error('La clé publique du club manque.'),{code:'configuration'});
  if(!session?.access_token||!session?.user?.id||!Number.isFinite(session.expires_at)||session.expires_at*1000<Date.now()+15000)throw Object.assign(Error('Connectez-vous dans l’espace éducateur, puis revenez ici. Votre session doit être valide.'),{code:'login'});
  let response;
  try{response=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:config.publishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(20000)});}catch{throw Error('Le service du club ne répond pas. Réessayez dans un instant.');}
  if(!response.ok){let reason={};try{reason=await response.json();}catch{}
   if(response.status===401)throw Object.assign(Error('Votre session est terminée. Connectez-vous à nouveau.'),{code:'login'});
   if(response.status===403||reason.code==='42501')throw Error('Votre compte n’a pas de droit Responsable pour cet espace. Le club doit vous attribuer un périmètre.');
   if(reason.code==='PGRST202')throw Error('L’espace Responsable doit être installé dans Supabase avant son utilisation.');
   throw Error('Chargement impossible pour le moment. Aucun document n’a été modifié.');
  }
  return response.json();
 }
 function validOverview(v){return v&&v.access?.allowed===true&&['director','pole'].includes(v.access.role)&&Array.isArray(v.educators)&&v.educators.every(c=>c&&typeof c.id==='string'&&typeof c.name==='string')&&Array.isArray(v.documents)&&v.documents.every(d=>d&&typeof d.id==='string'&&typeof d.owner_id==='string'&&typeof d.title==='string'&&typeof d.category==='string'&&labels[d.kind]&&Number.isFinite(new Date(d.updated_at).getTime()));}
 function metric(title,value,detail,icon){const card=node('article','metric'),heading=node('div');heading.append(node('span','',title),node('span','metric-icon',icon));card.append(heading,node('strong','',value),node('p','',detail));return card;}
 function renderMetrics(docs){
  const root=$('metrics');root.replaceChildren();
  root.append(metric('Éducateurs du périmètre',coaches().filter(c=>c.active).length,'Comptes actifs · pas un statut en ligne','♧'),metric('Séances partagées',docs.filter(d=>d.kind==='training').length,'Documents dans la période choisie','▤'),metric('Compositions',docs.filter(d=>d.kind==='composition').length,'Repères de jeu partagés','◎'),metric('Bilans disponibles',docs.filter(d=>d.kind==='report').length,'Pour préparer les échanges','→'));
 }
 function docRow(doc){
  const row=node('div','latest-item'),info=node('div','doc-info');info.append(node('strong','',doc.title),node('p','',coachName(doc.owner_id)+' · '+(doc.category||'Sans catégorie')+' · '+date(doc.updated_at)));
  const button=node('button','open-document','→');button.type='button';button.setAttribute('aria-label','Consulter '+doc.title);button.onclick=()=>preview(doc);
  row.append(node('span','doc-icon',doc.kind==='report'?'→':doc.kind==='composition'?'◎':'▤'),info,node('span','tag '+doc.kind,labels[doc.kind]),button);return row;
 }
 function renderEducators(docs){
  const root=$('educators-list');root.replaceChildren();
  const head=node('div','educator-row educator-head');for(const [label,cls] of [['ÉDUCATEUR',''],['CATÉGORIES',''],['PARTAGES','count'],['DERNIER PARTAGE','last-date'],['','']])head.append(node('span',cls,label));root.append(head);
  const query=$('search').value.trim().toLocaleLowerCase('fr');
  const list=coaches().filter(c=>c.name.toLocaleLowerCase('fr').includes(query));
  if(!list.length)root.append(node('p','empty','Aucun éducateur pour cette recherche.'));
  for(const coach of list){
   const own=docs.filter(d=>d.owner_id===coach.id),allOwn=data.documents.filter(d=>d.owner_id===coach.id),cats=[...new Set(allOwn.map(d=>d.category).filter(Boolean))];
   const row=node('div','educator-row'),identity=node('div','coach'),names=node('div');names.append(node('strong','',coach.name),node('small','',coach.active?'Éducateur du club':'Compte désactivé'));const statsLink=node('button','text-button educator-stat-link','Statistiques →');statsLink.setAttribute('aria-label','Voir les statistiques de '+coach.name);statsLink.onclick=()=>{setTab('statistics');document.dispatchEvent(new CustomEvent('manager-statistics-focus',{detail:{owner:coach.id}}));};names.append(statsLink);
   identity.append(node('span','avatar',coach.name.split(/\s+/).map(s=>s[0]).slice(0,2).join('')),names);
   const categories=node('div','categories');for(const cat of cats.slice(0,3))categories.append(node('span','category-tag',cat));if(!cats.length)categories.append(node('span','category-tag','Non renseignée'));
   const count=node('span','count');count.append(node('b','',String(own.length)),document.createTextNode(' document'+(own.length>1?'s':'')));
   const last=own[0],link=node('button','text-button','→');link.type='button';link.setAttribute('aria-label','Voir les documents de '+coach.name);link.onclick=()=>{ownerFilter=coach.id;oldOnly=false;setTab('documents');};
   row.append(identity,categories,count,node('span','last-date',last?date(last.updated_at):'Aucun sur la période'),link);root.append(row);
  }
 }
 function renderDocuments(docs){
  const query=$('document-search').value.trim().toLocaleLowerCase('fr'),kind=$('kind').value;
  const filtered=docs.filter(d=>(!ownerFilter||d.owner_id===ownerFilter)&&(!oldOnly||age(d.updated_at)>=14)&&(kind==='all'||d.kind===kind)&&(d.title+' '+coachName(d.owner_id)+' '+d.category).toLocaleLowerCase('fr').includes(query));
  $('documents-title').textContent=ownerFilter?'Documents · '+coachName(ownerFilter):oldOnly?'Documents partagés depuis 14 jours ou plus':'Le travail partagé';
  $('clear-filter').hidden=!ownerFilter&&!oldOnly;const root=$('documents-list');root.replaceChildren();
  for(const doc of filtered)root.append(docRow(doc));if(!filtered.length)root.append(node('p','empty','Aucun document partagé pour ces filtres.'));
 }
 function render(){
  if(!data)return;const docs=visible();renderMetrics(docs);renderEducators(docs);renderDocuments(docs);
  $('latest-list').replaceChildren(...docs.slice(0,4).map(docRow));if(!docs.length)$('latest-list').append(node('p','empty','Aucun partage pour la période choisie.'));
  const older=docs.filter(d=>age(d.updated_at)>=14).length;
  $('priority-text').textContent=older?older+' document'+(older>1?'s ont':' a')+' été partagé'+(older>1?'s':'')+' il y a au moins 14 jours. Un point de départ pour préparer une revue avec les éducateurs.':'Les derniers documents sont à portée de main pour préparer votre prochain échange avec les éducateurs.';
  $('priority-action').textContent=older?'Préparer la revue des documents →':'Consulter les derniers partages →';
  $('content').hidden=false;document.dispatchEvent(new CustomEvent('manager-updated'));
 }
 function setTab(value){
  tab=value;document.body.classList.toggle('manager-statistics-mode',tab==='statistics');document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('selected',b.dataset.tab===tab);b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});
  $('overview-panel').hidden=tab!=='overview';$('educators-panel').hidden=!['overview','educators'].includes(tab);$('documents-panel').hidden=tab!=='documents';$('statistics-panel').hidden=tab!=='statistics';$('metrics').hidden=tab==='statistics';document.querySelector('.period-label').hidden=tab==='statistics';render();
 }
 function demoPayload(doc){const source=window.CruzaManagerDemo.documents().find(d=>d.id===doc.id);if(source)return {...source.stats,notes:'Exemple fictif pour découvrir la consultation du travail partagé.'};return {category:doc.category,team:doc.team,objective:'Créer des repères communs et favoriser la prise de décision.',notes:'Exemple fictif pour découvrir la consultation du travail partagé.',blocks:[{title:'Mise en route',duration:15,objective:'Mobilité et disponibilité autour du porteur.'},{title:'Situation collective',duration:25,objective:'Trouver le joueur libre et progresser ensemble.'},{title:'Retour avec le groupe',duration:5,objective:'Identifier un repère à conserver pour la prochaine séance.'}]};}
 function payloadPreview(payload){
  const root=$('preview-content');root.replaceChildren();let count=0;
  const allowed=new Set(['objective','objectives','notes','title','name','description','instructions','coaching','theme','context','formation','team','category','duration','date','time','message','summary','strengths','improvements']);
  const names={objective:'Objectif',objectives:'Objectifs',notes:'Notes',title:'Titre',name:'Nom',description:'Description',instructions:'Consignes',coaching:'Repères éducateur',theme:'Thème',context:'Contexte',formation:'Organisation',team:'Équipe',category:'Catégorie',duration:'Durée (min)',date:'Date',time:'Heure',message:'Message',summary:'Synthèse',strengths:'Points forts',improvements:'Axes de progrès'};
  function walk(obj,depth=0){if(depth>5||count>=60||!obj||typeof obj!=='object')return;for(const [key,value] of Object.entries(obj)){if(count>=60)break;if(allowed.has(key)&&(typeof value==='string'||typeof value==='number')&&String(value).trim()){const section=node('section','preview-section');section.append(node('h3','',names[key]),node('p','',String(value).slice(0,4000)));root.append(section);count++;}else if(Array.isArray(value))value.slice(0,40).forEach(v=>walk(v,depth+1));else if(value&&typeof value==='object'&&!['photo','logo','media','state','pionExplanation'].includes(key))walk(value,depth+1);}}
  walk(payload);if(!count)root.append(node('p','empty','Ce document contient principalement des données graphiques. La synthèse textuelle ne peut pas en restituer le terrain.'));
  root.prepend(node('p','privacy-note','Synthèse textuelle de la version partagée. Les schémas tactiques ne sont pas restitués dans cette première vue.'));
 }
 async function preview(doc){
  const generation=requestGeneration;$('preview-title').textContent=doc.title;$('preview-meta').textContent=coachName(doc.owner_id)+' · '+(doc.category||'Sans catégorie')+' · version '+doc.revision+' · '+date(doc.updated_at);$('preview-content').replaceChildren(node('p','','Chargement…'));$('document-dialog').showModal();
  try{const result=demo?{payload:demoPayload(doc)}:await rpc('club_management_document',{p_document_id:doc.id});if(generation!==requestGeneration||!$('document-dialog').open)return;payloadPreview(result.payload);}
  catch(error){if(generation===requestGeneration)$('preview-content').replaceChildren(node('p','empty',error.message));}
 }
 async function load(){
  if(pending)return;pending=true;$('refresh').disabled=true;requestGeneration++;if($('document-dialog').open)$('document-dialog').close();$('status').hidden=true;
  // Do not leave stale private data visible if authorization or connectivity changed.
  data=null;$('content').hidden=true;document.dispatchEvent(new CustomEvent('manager-reset'));
  try{
   const result=demo?fixtures():await rpc('club_management_overview');if(!validOverview(result))throw Error('La réponse du service est incomplète. Réessayez.');
   data=result;$('manager-name').textContent=data.access.display_name;
   $('club-name').textContent=demo?'Club Horizon · Démo':(window.CLUB_MANAGEMENT_NAME||'Stade Mayennais');
   $('data-date').textContent=(demo?'Exemple fictif actualisé le ':'Actualisé le ')+new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(data.generated_at));
   if(!demo){$('scope').replaceChildren(new Option(data.access.role==='director'?'Tout le club':data.access.categories.join(' · '),'assigned'));$('scope').disabled=true;}
   if(data.truncated){setStatus('La vue présente les 500 derniers documents autorisés sur '+data.total_documents+'. Les indicateurs concernent ces documents chargés, pas tout l’historique du club.');}
   render();
  }catch(error){setStatus(error.message,error.code==='login');$('data-date').textContent='Données indisponibles';}
  finally{pending=false;$('refresh').disabled=false;}
 }
 if(demo){$('demo-banner').hidden=false;$('scope').disabled=false;$('back-app').href='index.html?mode=local';document.querySelector('.brand').href='index.html?mode=local';}
 document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>setTab(button.dataset.tab));
 $('refresh').onclick=load;
 $('scope').onchange=()=>{requestGeneration++;ownerFilter='';oldOnly=false;if($('document-dialog').open)$('document-dialog').close();render();};
 $('period').onchange=render;$('search').oninput=render;$('document-search').oninput=render;$('kind').onchange=render;
 $('show-documents').onclick=()=>{ownerFilter='';oldOnly=false;setTab('documents');};
 $('priority-action').onclick=()=>{ownerFilter='';oldOnly=visible().some(d=>age(d.updated_at)>=14);setTab('documents');};
 $('clear-filter').onclick=()=>{ownerFilter='';oldOnly=false;render();};
 $('close-document').onclick=()=>{requestGeneration++;$('document-dialog').close();};
 window.addEventListener('pageshow',event=>{if(event.persisted)load();});
 document.addEventListener('visibilitychange',()=>{if(!demo&&document.visibilityState==='visible')load();});
 window.cruzaManager=Object.freeze({request:rpc,context:()=>data?{demo,access:data.access,educators:data.educators,scope:demo?$('scope').value:'assigned',key:data.generated_at,tab}:null});
 setTab(new URLSearchParams(location.search).get('view')==='statistics'?'statistics':'overview');load();
})();
