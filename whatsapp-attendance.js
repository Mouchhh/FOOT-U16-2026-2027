// Lecture des réactions du message choisi ; aucune modification de séance sans validation.
(()=>{
 const statuses={present:'👍 Présent',absent:'👎 Absent',uncertain:'À confirmer'};
 let data=null,busy=false,timer=null,lastSignature='',lastRefresh=0,edits=new Map(),manual=[],generation=0;
 const root=el('details','training-whatsapp'),summary=el('summary','','Présences WhatsApp'),content=el('div','whatsapp-content'),status=el('p','hint');root.id='training-whatsapp';status.id='whatsapp-status';status.setAttribute('role','status');content.append(status);root.append(summary,content);
 function base(){try{const u=new URL(window.CLUB_WHATSAPP_GATEWAY);if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||!(u.protocol==='https:'||u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))return null;return u.origin;}catch{return null;}}
 const owner=()=>typeof clubNetworkSession!=='undefined'?clubNetworkSession?.user?.id:null;
 const signature=()=>JSON.stringify([owner(),currentTraining.id,currentTraining.date,currentTraining.time]);
 const fingerprint=event=>JSON.stringify([event?.messageId,(event?.responses||[]).map(r=>[r.senderKey,r.status,r.emoji,r.time,r.isMe]).sort((a,b)=>a[0].localeCompare(b[0]))]);
 async function request(path,method='GET',body){
  const identity=signature(),version=generation;if(!base()||!clubNetworkBound())throw Error('Connectez-vous à votre compte éducateur.');
  if(clubNetworkSession.expires_at*1000<Date.now()+30000)await clubNetworkRefreshSession();
  const response=await fetch(base()+path+(path.includes('?')?'&':'?')+'sessionId='+encodeURIComponent(currentTraining.id),{method,headers:{Authorization:'Bearer '+clubNetworkSession.access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(45000)});
  const result=await response.json();if(identity!==signature()||version!==generation)throw Error('Le compte ou la séance a changé.');if(!response.ok)throw Error(result.error||'Passerelle indisponible.');return result;
 }
 const button=(text,action,kind='export')=>{const b=el('button',kind,text);b.type='button';b.onclick=()=>run(action);return b;};
 async function run(action){if(busy)return;busy=true;const previous=signature(),version=generation;root.setAttribute('aria-busy','true');status.textContent='Lecture des réactions…';try{await action();}catch(error){if(signature()===previous&&generation===version){status.textContent=error.message;root.querySelector('#whatsapp-apply')?.setAttribute('disabled','');}}finally{busy=false;root.removeAttribute('aria-busy');}}
 function rows(){const event=data?.event;return [...(event?.responses||[]).map(row=>{const edit=edits.get(row.senderKey)||{},source=JSON.stringify([row.status,row.emoji,row.time]);return {...row,name:edit.name??row.name,included:edit.included??!row.isMe,keeper:edit.keeper??false,status:edit.source===source&&edit.status?edit.status:row.status};}),...manual];}
 function counts(){const included=rows().filter(r=>r.included&&r.status==='present');return {players:included.length,keepers:included.filter(r=>r.keeper).length};}
 function matchesSession(){return data?.event?.sessionId===currentTraining.id&&data.event.startsAt===new Date(currentTraining.date+'T'+currentTraining.time).toISOString();}
 function updateTotals(){const c=counts(),totals=content.querySelector('.whatsapp-totals'),apply=$('whatsapp-apply'),confirmed=$('whatsapp-confirm');if(totals)totals.textContent=c.players+' présents retenus · '+c.keepers+' gardien(s) inclus';if(apply)apply.disabled=!confirmed?.checked||!matchesSession()||!!data?.event?.error||data?.state!=='ready'||!data.event.lastRead||Date.now()-data.event.lastRead>90000||c.players<2||c.players>80||c.keepers>Math.min(12,c.players-2);}
 function editRow(key,values){const row=data?.event?.responses.find(r=>r.senderKey===key);if(row){const old={...(edits.get(key)||{})},source=JSON.stringify([row.status,row.emoji,row.time]);if(old.source!==source)delete old.status;edits.set(key,{...old,...values,source});}else Object.assign(manual.find(r=>r.senderKey===key),values);const confirm=$('whatsapp-confirm');if(confirm)confirm.checked=false;updateTotals();}
 function table(){
  const wrap=el('div','whatsapp-table-wrap'),table=el('table','whatsapp-table'),head=el('tr');for(const label of ['Joueur','Prénom et nom','Réponse','Gardien'])head.append(el('th','',label));const thead=el('thead');thead.append(head);table.append(thead);const body=el('tbody');
  for(const row of rows()){
   const tr=el('tr'),include=el('input'),name=el('input'),state=el('select'),keeper=el('input');include.type=keeper.type='checkbox';include.checked=row.included;keeper.checked=row.keeper;name.value=row.name;name.maxLength=80;
   include.setAttribute('aria-label','Compter '+row.name+' comme joueur');name.setAttribute('aria-label','Nom du joueur '+row.name);state.setAttribute('aria-label','Présence de '+row.name);keeper.setAttribute('aria-label',row.name+' est gardien');
   for(const [value,label]of Object.entries(statuses))state.append(new Option(label,value));state.value=row.status;
   include.onchange=()=>editRow(row.senderKey,{included:include.checked});name.oninput=()=>editRow(row.senderKey,{name:name.value});state.onchange=()=>editRow(row.senderKey,{status:state.value});keeper.onchange=()=>editRow(row.senderKey,{keeper:keeper.checked});
   for(const node of [include,name,state,keeper]){const td=el('td');td.append(node);tr.append(td);}tr.title=row.reason||'Ajout manuel';body.append(tr);
  }
  table.append(body);wrap.append(table);return wrap;
 }
 function accept(next){const changed=fingerprint(next.event)!==fingerprint(data?.event)||next.group?.id!==data?.group?.id;if(changed){const confirmed=$('whatsapp-confirm');if(confirmed)confirmed.checked=false;}data=next;lastRefresh=Date.now();render();}
 function render(){
  const wasConfirmed=$('whatsapp-confirm')?.checked||false;content.replaceChildren(status);status.textContent='';
  if(!clubNetworkBound()){summary.textContent='Présences WhatsApp · espace privé';content.append(el('p','hint','Connectez-vous à votre compte éducateur pour associer votre groupe.'));return;}
  if(!base()){summary.textContent='Présences WhatsApp · à activer';content.append(el('p','','La passerelle du club doit être hébergée avant de pouvoir associer un compte.'),el('p','hint','Lecture des réactions 👍 / 👎 sous le message de la séance. Le coach valide la liste avant l’adaptation.'));const a=el('a','','Installation du serveur');a.href='https://github.com/Mouchhh/FOOT-U16-2026-2027/blob/main/whatsapp-gateway/README.md';a.target='_blank';a.rel='noopener';content.append(a);return;}
  const state=data?.state||'disconnected';summary.textContent='Présences WhatsApp · '+({ready:'connecté',qr:'QR à scanner',connecting:'connexion en cours',error:'connexion à reprendre',disconnected:'non connecté'}[state]||state);
  const actions=el('div','whatsapp-actions');actions.append(button('Actualiser',refresh));
  if(state!=='ready'){
   content.append(el('p','','Association facultative de votre compte WhatsApp. Le serveur conserve une session liée à votre compte éducateur. Cette connexion repose sur WhatsApp Web et peut se déconnecter.'),button(state==='qr'?'Actualiser le QR':'Associer mon compte',async()=>accept(await request('/api/connect','POST'))));
   if(state==='qr'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data?.qr||'')){const image=el('img','whatsapp-qr');image.src=data.qr;image.alt='QR privé à scanner depuis WhatsApp → Appareils connectés → Connecter un appareil';content.append(image,el('p','hint','Sur votre téléphone : WhatsApp → Appareils connectés → Connecter un appareil. Ce QR reste uniquement dans votre espace.'));}
  }
  if(state==='ready'){
   content.append(el('p','',data.group?'Groupe : '+data.group.name:'Choisissez le groupe de votre équipe.'));
   actions.append(button(data.group?'Changer de groupe':'Choisir mon groupe',async()=>{
    const result=await request('/api/groups'),select=el('select');select.setAttribute('aria-label','Groupe WhatsApp de mon équipe');for(const group of result.groups)select.append(new Option(group.name,group.id));
    const box=el('div','whatsapp-selection');box.append(select,button('Utiliser ce groupe',async()=>{if(data?.group&&!confirm('Changer de groupe efface les associations de séances WhatsApp de votre profil. Continuer ?'))return;edits.clear();manual=[];accept(await request('/api/group','POST',{id:select.value}));}));content.append(box);
   }));
   if(data.group)actions.append(button('Choisir le message de cette séance',async()=>{
    const result=await request('/api/announcements'),select=el('select');select.id='whatsapp-message';select.setAttribute('aria-label','Message annonçant la séance');
    for(const message of result.messages){const label=new Date(message.time*1000).toLocaleString('fr-FR')+' · '+message.text;select.append(new Option(label,message.id));}
    const box=el('div','whatsapp-selection');box.append(el('p','hint','Choisissez le message du bon jour : seules ses réactions seront comptées. Les 50 derniers messages texte disponibles sont proposés.'),select,button('Lire ses réactions',async()=>{if(!select.value)throw Error('Aucun message disponible dans ce groupe.');if(!applyTrainingForm())throw Error('Vérifiez la date et les champs de la séance.');edits.clear();manual=[];accept(await request('/api/event','POST',{sessionId:currentTraining.id,title:currentTraining.title||currentTraining.team||'Séance',startsAt:new Date(currentTraining.date+'T'+currentTraining.time).toISOString(),messageId:select.value}));}));content.append(box);
   }));
  }
  content.append(actions);
  if(data?.event){
   const event=data.event;content.append(el('blockquote','whatsapp-message-preview',event.message?.text||'Message sélectionné'),el('p','hint','👍 présent · 👎 absent · autre réaction ou aucune réponse : à confirmer. Décochez les éducateurs et les personnes qui ne sont pas des joueurs.'));
   if(event.lastRead)content.append(el('p','hint','Réactions relues le '+new Date(event.lastRead).toLocaleString('fr-FR')));
   if(event.error)status.textContent=event.error;
   if(event.limited||event.unmatched)content.append(el('p','training-alert','Lecture partielle ou '+event.unmatched+' réaction(s) non rattachée(s) : vérifiez et complétez la liste avant validation.'));
   if(!matchesSession())content.append(el('p','training-alert','La date ou l’horaire a changé : choisissez à nouveau le message pour cette séance.'));
   content.append(table(),button('Ajouter un joueur manuellement',()=>{manual.push({senderKey:'manual-'+crypto.randomUUID(),name:'',included:true,keeper:false,status:'uncertain'});render();}));
   const totals=el('p','whatsapp-totals');content.append(totals);
   const confirmLabel=el('label','whatsapp-confirm'),confirmed=el('input');confirmed.id='whatsapp-confirm';confirmed.type='checkbox';confirmed.checked=wasConfirmed;confirmed.onchange=updateTotals;confirmLabel.append(confirmed,document.createTextNode('J’ai vérifié le message, les noms et les gardiens.'));content.append(confirmLabel);
   const apply=button('Valider l’effectif pour cette séance',async()=>{
    if(!matchesSession())throw Error('La date ou l’horaire a changé : choisissez à nouveau le message de la séance.');
    const identity=signature(),before=fingerprint(data.event),fresh=await request('/api/status');
    if(identity!==signature())throw Error('La séance a changé ; recommencez la validation.');
    if(fingerprint(fresh.event)!==before||fresh.event?.error||fresh.state!=='ready'){accept(fresh);throw Error('Les réactions ont changé ou la lecture a échoué. Vérifiez la liste puis validez à nouveau.');}
    const present=rows().filter(r=>r.included&&r.status==='present'),names=present.map(r=>r.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
    if(present.some(r=>r.name.trim().length<2||r.name==='Participant à identifier')||new Set(names).size!==names.length)throw Error('Identifiez chaque joueur présent avec un nom distinct.');
    const c=counts();if(!$('whatsapp-confirm').checked||c.players<2||c.players>80||c.keepers>Math.min(12,c.players-2))throw Error('Vérifiez l’effectif : au moins deux joueurs de champ, 80 joueurs et 12 gardiens maximum.');
    const oldPlayers=$('training-players').value,oldKeepers=$('training-keepers').value;$('training-players').value=c.players;$('training-keepers').value=c.keepers;
    if(!applyTrainingForm()){$('training-players').value=oldPlayers;$('training-keepers').value=oldKeepers;throw Error('La séance n’a pas pu être mise à jour.');}
    if(!saveTrainingDraft())throw Error('Effectif modifié à l’écran, mais le brouillon n’a pas pu être enregistré. Vérifiez le stockage avant de quitter la page.');
    renderTrainingBlocks();renderTrainingCatalogue();status.textContent='Effectif appliqué au brouillon : '+c.players+' joueurs, dont '+c.keepers+' gardien(s). Enregistrez la séance pour la partager. Les réglages manuels restent conservés.';
   },'primary');apply.id='whatsapp-apply';content.append(apply);updateTotals();
  }
  if(data&&state!=='disconnected')content.append(button('Déconnecter WhatsApp et effacer mes collectes',async()=>{if(!confirm('Déconnecter ce compte WhatsApp du serveur et effacer ses collectes de réactions ?'))return;await request('/api/disconnect','DELETE');data=null;edits.clear();manual=[];render();}));
 }
 async function refresh(){const previous=signature(),version=generation,next=await request('/api/status');if(previous===signature()&&version===generation)accept(next);}
 function check(){
  const next=signature();if(next!==lastSignature){generation++;lastSignature=next;data=null;edits.clear();manual=[];render();lastRefresh=0;}
  if(!busy&&!root.querySelector('.whatsapp-selection')&&!(root.contains(document.activeElement)&&['INPUT','SELECT'].includes(document.activeElement.tagName))&&base()&&clubNetworkBound()&&document.body.classList.contains('training-mode')&&!document.hidden&&Date.now()-lastRefresh>30000)run(refresh);
 }
 document.addEventListener('DOMContentLoaded',()=>{const page=$('training-step-2');if(!page)return;const footer=page.querySelector('.training-step-footer');if(footer)footer.before(root);else page.append(root);render();check();timer=setInterval(check,5000);});
 root.addEventListener('toggle',()=>{if(root.open&&base()&&clubNetworkBound())run(refresh);});
 new MutationObserver(check).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});
 window.addEventListener('pageshow',()=>{if(!timer)timer=setInterval(check,5000);check();});
})();
