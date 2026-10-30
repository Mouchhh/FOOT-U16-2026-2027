// Exact causerie generation and explicit Canva transfer through the configured gateway.
(() => {
 'use strict';
 let libraryPromise=null,stylePromise=null;
 const clubBlue='214FA0';
 function loadStyle(){
  if(!stylePromise)stylePromise=(async()=>{
   const fonts=[new FontFace('Calistoga','url(assets/fonts/calistoga/Calistoga-Regular.ttf)'),new FontFace('Montserrat','url(assets/fonts/montserrat/Montserrat-Italic.ttf)',{style:'italic',weight:'100 900'})];
   await Promise.all(fonts.map(async font=>document.fonts.add(await font.load())));
   const load=async src=>{const image=new Image();image.src=src;await image.decode();return image;};
   const [photo,second,logo]=await Promise.all(['assets/photos/celebration-jeunes.jpg','assets/photos/groupe-piste.jpg','assets/causerie-logo.jpeg'].map(load));
   const canvas=document.createElement('canvas');canvas.width=936;canvas.height=1125;const ctx=canvas.getContext('2d');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,936,1125);ctx.fillStyle='#'+clubBlue;ctx.beginPath();ctx.moveTo(0,188);ctx.lineTo(936,1125);ctx.lineTo(0,1125);ctx.fill();
   function cut(image,points,box){
    ctx.save();ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
    const [x,y,w,h]=box,scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);ctx.globalAlpha=.78;
    ctx.drawImage(image,x+(w-image.naturalWidth*scale)/2,y+(h-image.naturalHeight*scale)/2,image.naturalWidth*scale,image.naturalHeight*scale);ctx.restore();
   }
   cut(photo,[[275,0],[570,0],[375,830],[80,830]],[80,0,490,830]);
   cut(second,[[550,295],[840,295],[650,1100],[360,1100]],[360,295,480,805]);
   const toData=image=>{const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d').drawImage(image,0,0);return c.toDataURL('image/png');};
   const decor=canvas.toDataURL('image/png');
   canvas.width=930;canvas.height=1500;const crop=canvas.getContext('2d'),scale=Math.max(930/photo.naturalWidth,1500/photo.naturalHeight);
   crop.drawImage(photo,(930-photo.naturalWidth*scale)/2,(1500-photo.naturalHeight*scale)/2,photo.naturalWidth*scale,photo.naturalHeight*scale);
   const cover=canvas.toDataURL('image/png');canvas.width=480;canvas.height=160;const arrows=canvas.getContext('2d');arrows.fillStyle='#'+clubBlue;
   for(let x=0;x<360;x+=120){arrows.beginPath();[[x,0],[x+70,0],[x+150,80],[x+70,160],[x,160],[x+80,80]].forEach(([px,py],i)=>i?arrows.lineTo(px,py):arrows.moveTo(px,py));arrows.closePath();arrows.fill();}
   return {decor,photo:cover,logo:toData(logo),logoWidth:logo.naturalWidth,logoHeight:logo.naturalHeight,chevrons:canvas.toDataURL('image/png')};
  })().catch(()=>{stylePromise=null;throw Error('Impossible de charger la charte de présentation. Vérifiez les polices et les images du site.');});
  return stylePromise;
 }
 function loadLibrary(){
  if(window.PptxGenJS)return Promise.resolve();
  if(!libraryPromise)libraryPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='vendor/pptxgenjs/pptxgen.bundle.js';
   script.onload=()=>window.PptxGenJS?resolve():reject(Error('Le générateur de présentation est indisponible.'));
   script.onerror=()=>reject(Error('Impossible de charger le générateur. Vérifiez votre connexion au site.'));
   document.head.append(script);
  }).catch(error=>{libraryPromise=null;throw error;});
  return libraryPromise;
 }
 // Split without trimming, summarizing or discarding characters, including blank lines.
 function textPages(value,{fontSize=19,width=6.6,maxRows=14}={}){
  if(!value)return [];
  const ctx=document.createElement('canvas').getContext('2d');ctx.font=fontSize+'pt Calistoga';
  const pages=[];let chunk='',line='',rows=1;
  for(const char of value){
   const newline=char==='\n',wrap=!newline&&ctx.measureText(line+char).width>width*96;
   if((newline||wrap)&&rows===maxRows){
    // Prefer a word boundary between slides; retain the separator verbatim.
    const tail=!newline&&chunk.match(/[ \t]+([^\s]*)$/),cut=tail?chunk.length-tail[1].length:chunk.length;
    pages.push(chunk.slice(0,cut));chunk=chunk.slice(cut);line=chunk;rows=1;
   }
   else if(newline||wrap){rows++;line='';}
   chunk+=char;if(!newline)line+=char;
  }
  if(chunk)pages.push(chunk);
  return pages;
 }
 function collect(board){
  const entries=[];
  const add=(label,value)=>{if(typeof value==='string'&&value.length)entries.push({label,value});};
  const group=(title,fields,source)=>add(title,fields.filter(([key])=>typeof source[key]==='string'&&source[key].length).map(([key,label])=>label+' : '+source[key]).join('\n'));
  group('Équipe & composition',[['title','Nom du document'],['team','Équipe'],['category','Catégorie'],['section','Section'],['squad','Groupe'],['matchDuration','Durée du match (min)'],['formation','Formation']],board);
  const plan=board.matchPreparation;
  if(plan){
   group('Repères du match',[['date',matchPlanFields.date],['title',matchPlanFields.title],['match',matchPlanFields.match]],plan);
   for(const [key,label] of Object.entries(matchPlanFields).filter(([key])=>!['date','title','match'].includes(key))){
    add(label,plan[key]);
    if(key==='opponent')add('Objectif du jour / idées fortes',plan.objectives.map((value,i)=>value.length?(i+1)+'. '+value:'').filter(Boolean).join('\n'));
   }
  }
  add('Consignes tactiques',board.notes);
  add('Effectif',board.players.map(player=>'N° '+player.number+' · '+(player.role==='sub'?'Impacteur / Finisseur':'Titulaire')+' · '+player.name).join('\n'));
  if(board.opponents){
   group('Équipe adverse',[['name','Équipe'],['formation','Formation']],board.opponents);
   add('Effectif adverse',board.opponents.players.map(player=>'N° '+player.number+(player.name?' · '+player.name:'')).join('\n'));
  }
  return entries;
 }
 function capture(){
  const board=structuredClone(state),candidate=getGamePlanBoard();
  const linked=board.boardKind!=='plan'&&board.documentId&&candidate?.sourceCompositionId===board.documentId?structuredClone(candidate):null;
  return {board,linked,landscape:document.body.classList.contains('landscape-mode')};
 }
 async function pitchImage(board,landscape){
  const options={bench:board.benchVisible!==false,opponents:!!board.opponents?.visible,arrows:true,lanes:!!board.lanes};
  const images=await compositionImages(board,options),canvas=document.createElement('canvas');
  canvas.width=1920;canvas.height=1080;
  compositionPitch(canvas.getContext('2d'),{x:0,y:0,w:canvas.width,h:canvas.height},landscape,board,images,options);
  return {data:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};
 }
 async function build(snapshot,includeLinked){
  if(!window.causerieLayout?.build)throw Error('La présentation ne peut pas être préparée. Actualisez le site, puis réessayez.');
  const [,style]=await Promise.all([loadLibrary(),loadStyle()]);
  const pptx=new window.PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Le Vestiaire';
  pptx.subject='Causerie du coach';pptx.title=snapshot.board.title||snapshot.board.team;pptx.lang='fr-FR';
  pptx.theme={headFontFace:'Montserrat',bodyFontFace:'Calistoga',lang:'fr-FR'};
  return window.causerieLayout.build(pptx,snapshot,includeLinked,style,{textPages,pitchImage});
 }
 window.causerieExport={textPages,collect,capture,build};
 document.addEventListener('DOMContentLoaded',()=>{
  let snapshot=null,busy=false,ownerAtOpen=null,connectionPoll=null,viewVersion=0;
  const configured=!!window.CLUB_CANVA_GATEWAY;
  let gateway=null;
  try{if(configured){const url=new URL(window.CLUB_CANVA_GATEWAY);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error();gateway=url.origin;}}catch{}
  const dialog=el('dialog','causerie-dialog');dialog.id='causerie-dialog';dialog.setAttribute('aria-labelledby','causerie-heading');
  const heading=el('div','section-heading'),title=el('h2','','Préparer ma causerie pour Canva');title.id='causerie-heading';
  const close=el('button','icon-button','×');close.type='button';close.setAttribute('aria-label','Fermer la préparation Canva');heading.append(title,close);dialog.append(heading);
  dialog.append(el('p','hint','La présentation suit les rubriques de votre préparation. Les pages s’adaptent aux textes saisis, sans résumé ni reformulation. Les textes sont modifiables ; les terrains sont des images fixes. Les animations restent disponibles sur le site.'));
  const summary=el('p','causerie-summary');dialog.append(summary);
  const label=el('label','causerie-option'),include=el('input');include.type='checkbox';include.id='causerie-linked';label.append(include,document.createTextNode('Inclure la vue épurée liée à cette composition'));dialog.append(label);
  const details=el('details'),count=el('summary'),inventory=el('ul');count.textContent='Vérifier les informations reprises';details.append(count,inventory);dialog.append(details);
  const status=el('p','hint');status.id='causerie-status';status.setAttribute('role','status');dialog.append(status);
  const actions=el('div','report-actions'),download=el('button','primary','Télécharger la présentation (.pptx)'),canva=el('a','causerie-canva-link','Ouvrir Canva ↗');
  download.id='causerie-download';download.type='button';canva.href='https://www.canva.com/';canva.target='_blank';canva.rel='noopener noreferrer';actions.append(download,canva);dialog.append(actions);
  const account=el('p','hint','Compte Canva non connecté au site. Dans Canva, importez le fichier téléchargé, puis vérifiez la présentation. L’import réel et la connexion directe restent à configurer et à valider. Aucun contenu n’est envoyé automatiquement.');dialog.append(account);
  const connectedActions=el('div','report-actions'),connect=el('button','export','Connecter Canva'),refreshConnection=el('button','export','Vérifier la connexion'),disconnect=el('button','export','Déconnecter Canva'),upload=el('button','primary','Créer dans mon Canva');
  connect.type=refreshConnection.type=disconnect.type=upload.type='button';
  connect.id='causerie-connect';refreshConnection.id='causerie-refresh';disconnect.id='causerie-disconnect';upload.id='causerie-upload';
  connectedActions.append(connect,refreshConnection,disconnect,upload);connectedActions.hidden=!gateway;dialog.append(connectedActions);
  const results=el('div','causerie-results');results.id='causerie-results';dialog.append(results);
  if(configured&&!gateway)account.textContent='L’adresse du service Canva est invalide. Le responsable doit configurer une origine HTTPS. Le téléchargement reste disponible.';
  function currentUser(){return typeof clubNetworkSession!=='undefined'?clubNetworkSession?.user?.id:null;}
  function clubToken(){
   const session=typeof clubNetworkSession!=='undefined'?clubNetworkSession:null;
   if(!session?.access_token||!ownerAtOpen||session.user?.id!==ownerAtOpen)throw Error('Connectez-vous au club et rouvrez cette fenêtre avec votre compte.');
   return session.access_token;
  }
  async function request(route,options={}){
   if(!gateway)throw Error('Service Canva non configuré.');
   const version=viewVersion,waking=route==='/api/status'&&(!options.method||options.method==='GET'),attempts=waking?3:1;
   for(let attempt=0;attempt<attempts;attempt++){
    if(version!==viewVersion||!dialog.open)throw Error('Demande annulée. Rouvrez la préparation si nécessaire.');
    const credential=clubToken();
    try{
     const res=await fetch(gateway+route,{...options,credentials:'omit',headers:{Authorization:'Bearer '+credential,...options.headers},signal:AbortSignal.timeout(30000)});
     const value=await res.json().catch(()=>null);
     if(waking&&[502,503,504].includes(res.status)&&attempt+1<attempts){await new Promise(resolve=>setTimeout(resolve,4000));continue;}
     if(!res.ok||!value)throw Error(value?.error||'Le service Canva est indisponible ou en cours de réveil. Réessayez dans un instant.');
     return value;
    }catch(error){
     if(waking&&['TimeoutError','AbortError','TypeError'].includes(error.name)&&attempt+1<attempts){await new Promise(resolve=>setTimeout(resolve,4000));continue;}
     if(['TimeoutError','AbortError','TypeError'].includes(error.name))throw Error('Le service Canva ne répond pas encore. Il peut se réveiller après une mise en veille. Réessayez dans un instant.');
     throw error;
    }
   }
  }
  function showJob(job,remember=false){
   if(currentUser()!==ownerAtOpen)throw Error('Le compte coach a changé. Rouvrez cette fenêtre avec votre compte.');
   results.replaceChildren();
   if(job.status==='failed')throw Error('Canva n’a pas pu importer la présentation. Votre préparation est conservée.');
   if(job.status!=='success')return false;
   if(!Array.isArray(job.designs)||!job.designs.length)throw Error('Canva n’a pas renvoyé de présentation.');
   const links=job.designs.map((design,index)=>{
    const url=new URL(design.edit_url);if(url.protocol!=='https:'||url.hostname!=='www.canva.com'||url.username||url.password)throw Error('Lien Canva invalide.');
    const link=el('a','causerie-canva-link','Ouvrir ma présentation'+(job.designs.length>1?' '+(index+1):'')+' dans Canva ↗');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';return link;
   });
   results.append(...links);status.textContent='Présentation créée. Ouvrez-la dans Canva et vérifiez le rendu avant votre causerie.';
   if(remember){
    const last={url:links[0].href,title:snapshot.board.title||snapshot.board.team};
    try{coachStorageSet('vestiaire-last-canva-presentation',JSON.stringify(last));}
    catch{status.textContent+=' Le lien n’a pas pu être mémorisé sur cet appareil.';}
    window.dispatchEvent(new CustomEvent('causerie:created',{detail:last}));
   }
   return true;
  }
  async function checkConnection(checkJob=false){
   const value=await request('/api/status');
   account.textContent=value.connected?'Votre compte Canva est connecté. Seul le clic « Créer dans mon Canva » envoie cette préparation à Canva.':'Votre compte Canva n’est pas connecté. Autorisez la connexion pour créer votre présentation directement dans votre compte.';
   upload.disabled=!value.connected||busy;disconnect.disabled=!value.connected||busy;connect.textContent=value.connected?'Reconnecter Canva':'Connecter Canva';
   if(checkJob&&value.latest_job_id){
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(value.latest_job_id))throw Error('Identifiant d’import invalide.');
    const job=await request('/api/imports/'+value.latest_job_id);if(!showJob(job))status.textContent='Votre dernière présentation est encore en cours de traitement. Vérifiez à nouveau dans un instant.';
   }
   return value.connected;
  }
  function stopConnectionPoll(){if(connectionPoll){clearInterval(connectionPoll);connectionPoll=null;}}
  function lock(on){busy=on;for(const button of [download,close,connect,refreshConnection,disconnect,upload])button.disabled=on;include.disabled=on;}
  function reserveWindow(){
   let popup;
   try{popup=window.open('about:blank','_blank');}catch{return null;}
   if(popup){popup.opener=null;popup.document.title='Votre causerie dans Canva';popup.document.body.textContent='Préparation de votre causerie… Cette fenêtre ouvrira votre présentation Canva.';}
   return popup;
  }
  async function startAuthorization(popup=null,afterConnection=null){
   if(busy)return;stopConnectionPoll();
   const version=viewVersion;
   popup=popup||reserveWindow();
   const sameTab=!popup;
   try{
    const credential=clubToken(),form=el('form'),input=el('input'),returnURL=el('input');
    form.method='POST';form.action=gateway+'/oauth/start';form.target='_self';input.type='hidden';input.name='credential';input.value=credential;
    returnURL.type='hidden';returnURL.name='return_url';returnURL.value=new URL('canva-return.html',location.href).href;form.append(input,returnURL);
    // Submit inside the reserved window: Safari can lose named targets after opener is cleared.
    // If pop-ups are blocked, a top-level POST still starts OAuth without exposing the token in a URL.
    (popup?popup.document.body:document.body).append(form);
    try{form.submit();}finally{form.remove();}
    if(sameTab){status.textContent='Ouverture de Canva dans cet onglet…';return;}
    status.textContent='Autorisez Canva dans la nouvelle fenêtre, puis revenez ici.';
    let attempts=0,running=false;
    connectionPoll=setInterval(async()=>{
     if(version!==viewVersion||!dialog.open){stopConnectionPoll();return;}
     if(running)return;if(++attempts>48){stopConnectionPoll();status.textContent='Connexion non terminée. Après autorisation dans Canva, vérifiez la connexion avant de créer la présentation.';return;}running=true;
     try{if(await checkConnection()){
      if(version!==viewVersion||!dialog.open){stopConnectionPoll();return;}
      stopConnectionPoll();status.textContent='Canva est connecté. Vous pouvez créer votre présentation.';if(afterConnection)await afterConnection(popup);
     }}
     catch(error){stopConnectionPoll();status.textContent=error.message;}finally{running=false;}
    },2500);
   }catch(error){if(popup&&!popup.closed)popup.close();status.textContent=error.message;}
  }
  connect.onclick=()=>startAuthorization();
  refreshConnection.onclick=()=>checkConnection(true).catch(error=>{status.textContent=error.message;});
  disconnect.onclick=async()=>{
   if(busy)return;stopConnectionPoll();lock(true);
   try{const value=await request('/api/connection',{method:'DELETE'});results.replaceChildren();status.textContent=value.revoked?'Canva est déconnecté.':'Connexion retirée du site. La révocation auprès de Canva a échoué : retirez aussi l’autorisation dans votre compte Canva.';}
   catch(error){status.textContent=error.message;}
   finally{lock(false);checkConnection().catch(error=>{status.textContent=error.message;});}
  };
  async function createPresentation(popup=null){
   if(busy)return;stopConnectionPoll();lock(true);results.replaceChildren();
   try{
    status.textContent='Préparation de la causerie pour votre compte Canva…';
    const pptx=await build(snapshot,include.checked),blob=await pptx.write({outputType:'blob',compression:true});
    const title=snapshot.board.title||snapshot.board.team,title64=btoa(Array.from(new TextEncoder().encode(title),byte=>String.fromCharCode(byte)).join(''));
    let job=await request('/api/imports',{method:'POST',headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.presentationml.presentation','X-Design-Title':title64},body:blob});
    for(let attempt=0;attempt<45;attempt++){
     if(showJob(job,true)){
      if(popup&&!popup.closed){
       try{popup.location.href=results.querySelector('a').href;}catch{status.textContent+=' Utilisez le lien ci-dessous pour l’ouvrir.';}
      }
      return;
     }
     if(!/^[a-zA-Z0-9_-]{1,80}$/.test(job.id))throw Error('Identifiant d’import invalide.');
     status.textContent='Canva prépare votre présentation. Votre brouillon reste conservé.';
     await new Promise(resolve=>setTimeout(resolve,2000));job=await request('/api/imports/'+job.id);
    }
    status.textContent='Canva traite encore votre présentation. Utilisez « Vérifier la connexion » pour retrouver le résultat, sans créer de doublon.';
   }catch(error){if(popup&&!popup.closed)popup.close();status.textContent=error.message+' Votre brouillon reste conservé. Vérifiez le dernier import avant de réessayer.';}
   finally{lock(false);checkConnection().catch(()=>{});}
  }
  upload.onclick=()=>createPresentation(reserveWindow());
  document.body.append(dialog);
  function refresh(){
   inventory.replaceChildren();
   const plans=window.causerieLayout.analyze(snapshot,include.checked);
   for(const plan of plans){
    const fields=[plan.title,...plan.meta,...plan.repères,...plan.context,...plan.goals,...plan.tactics].filter(Boolean);
    for(const entry of fields)inventory.append(el('li','',entry.label+' · '+entry.value.length+' caractères'));
    if(plan.index)inventory.append(el('li','','Schéma de la vue épurée liée'));
   }
  }
  function open(check=true){
   if(!window.causerieLayout?.analyze){notify('Actualisez le site pour charger la présentation, puis réessayez.');return null;}
   viewVersion++;
   stopConnectionPoll();results.replaceChildren();ownerAtOpen=currentUser();snapshot=capture();include.checked=!!snapshot.linked;label.hidden=!snapshot.linked;
   summary.textContent='Document ouvert : '+(snapshot.board.title||snapshot.board.team);
   status.textContent='Cette version reprend le document au moment de l’ouverture de cette fenêtre. Fermez et rouvrez après une modification.';
   refresh();dialog.showModal();
   if(gateway){upload.disabled=true;disconnect.disabled=true;if(check!==false)checkConnection().catch(error=>{account.textContent=error.message;});}
   return viewVersion;
  }
  let launching=false;
  window.causerieExport.createAndOpen=async()=>{
   if(busy||launching)return;
   const version=open(false);
   if(version===null)return;
   if(!gateway){status.textContent='La création directe dans votre Canva attend l’activation du service par le responsable du site. Votre causerie peut déjà être vérifiée et téléchargée ici.';return;}
   const popup=reserveWindow();launching=true;
   status.textContent='Connexion au service Canva… Son réveil peut prendre une minute avec l’offre gratuite.';
   try{
    const connected=await checkConnection();
    if(version!==viewVersion||!dialog.open){if(popup&&!popup.closed)popup.close();return;}
    if(connected)await createPresentation(popup);else await startAuthorization(popup,createPresentation);
   }
   catch(error){if(popup&&!popup.closed)popup.close();status.textContent=error.message;}
   finally{launching=false;}
  };
  include.onchange=refresh;close.onclick=()=>{if(!busy)dialog.close();};
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  dialog.addEventListener('close',()=>{viewVersion++;stopConnectionPoll();});
  download.onclick=async()=>{
   if(busy)return;busy=true;download.disabled=true;include.disabled=true;close.disabled=true;
   status.textContent='Création de la présentation complète…';
   try{
    const pptx=await build(snapshot,include.checked),blob=await pptx.write({outputType:'blob',compression:true});
    mediaDownload(blob,namedDocumentFilename(snapshot.board.title||snapshot.board.team,'pptx'));
    status.textContent='Présentation téléchargée. Importez-la dans Canva et vérifiez les pages avant votre causerie.';
   }catch(error){status.textContent='Export impossible : '+(error.message||'réessayez après avoir vérifié le document.')+' Aucun fichier incomplet n’a été téléchargé.';}
   finally{busy=false;download.disabled=false;include.disabled=false;close.disabled=false;}
  };
  for(const target of [document.querySelector('#match-plan-form .report-actions'),$('composition-export')?.parentElement]){
   if(!target)continue;
   const button=el('button','export','Causerie · Canva');button.type='button';button.dataset.causerieExport='true';button.onclick=open;target.append(button);
  }
  const lastPage=document.querySelector('#terrain-page-2 .terrain-team-section');
  if(lastPage){
   const panel=el('section','causerie-export-panel');panel.setAttribute('aria-labelledby','causerie-export-title');
   const title=el('h2','','Votre causerie dans Canva');title.id='causerie-export-title';
   panel.append(title,el('p','','Retrouvez la préparation du match, vos consignes, votre effectif et le terrain dans une présentation.'));
   const steps=el('ol');
   for(const text of ['Préparez et téléchargez la présentation de votre causerie.','Ouvrez votre Canva personnel, puis choisissez « Importer un fichier ».','Sélectionnez le fichier .pptx téléchargé et vérifiez les pages.'])steps.append(el('li','',text));
   const button=el('button','primary','Préparer ma causerie pour Canva');button.type='button';button.id='causerie-last-page';button.dataset.causerieExport='true';button.onclick=open;
   panel.append(steps,button,el('p','hint',gateway?'Vous pouvez aussi connecter votre Canva dans la fenêtre de préparation.':'Le téléchargement fonctionne sans connecter Canva au site. Les textes sont modifiables ; les terrains sont des images fixes.'));
   lastPage.prepend(panel);
  }
 });
})();
