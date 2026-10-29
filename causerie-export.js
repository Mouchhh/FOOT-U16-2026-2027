// Local presentation generation. No upload, OAuth token or account connection is implied.
(() => {
 'use strict';
 let libraryPromise=null;
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
 function textPages(value){
  if(!value)return [];
  const ctx=document.createElement('canvas').getContext('2d');ctx.font='20pt Arial';
  const pages=[];let chunk='',line='',rows=1;
  for(const char of value){
   const newline=char==='\n',wrap=!newline&&ctx.measureText(line+char).width>1000;
   if((newline||wrap)&&rows===12){
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
   add('Équipe adverse',board.opponents.name);add('Formation adverse',board.opponents.formation);
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
  canvas.width=(landscape?840:680)*2;canvas.height=(landscape?680:840)*2;
  compositionPitch(canvas.getContext('2d'),{x:0,y:0,w:canvas.width,h:canvas.height},landscape,board,images,options);
  return {data:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};
 }
 async function build(snapshot,includeLinked){
  await loadLibrary();
  const pptx=new window.PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Le Vestiaire';
  pptx.subject='Causerie du coach';pptx.title=snapshot.board.title||snapshot.board.team;pptx.lang='fr-FR';
  pptx.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'fr-FR'};
  let number=0;
  function slide(title,scope){
   const s=pptx.addSlide();s.background={color:'FFFFFF'};
   s.addShape(pptx.ShapeType.rect,{x:.55,y:.48,w:.48,h:.06,line:{color:'2855A2'},fill:{color:'2855A2'}});
   s.addText(title,{x:.55,y:.7,w:12.2,h:.6,fontFace:'Arial',fontSize:24,bold:true,color:'203958',margin:0,fit:'shrink',breakLine:false});
   s.addText(scope,{x:.55,y:7.05,w:11.4,h:.2,fontSize:10,color:'526780',margin:0,fit:'shrink'});
   s.addText(String(++number),{x:12.1,y:7.05,w:.6,h:.2,fontSize:10,color:'526780',align:'right',margin:0});
   return s;
  }
  const boards=[snapshot.board];if(includeLinked&&snapshot.linked)boards.push(snapshot.linked);
  for(const board of boards){
   const scope=board.boardKind==='plan'?'Vue épurée liée':'Composition & préparation du match';
   const image=await pitchImage(board,snapshot.landscape);
   const cover=slide(board.title||board.team,scope);
   const ratio=image.width/image.height,h=Math.min(5.25,12.1/ratio),w=h*ratio;
   cover.addImage({data:image.data,x:(13.333333-w)/2,y:1.5,w,h});
   const entries=collect(board);
   for(const entry of entries){
    const chunks=textPages(entry.value);
    chunks.forEach((text,index)=>{
     const s=slide(entry.label+(chunks.length>1?' · '+(index+1)+' / '+chunks.length:''),scope);
     s.addText(text,{x:.65,y:1.6,w:12,h:5.1,fontSize:20,color:'203958',margin:0,breakLine:false,fit:'shrink',valign:'top',paraSpaceAfterPt:0});
    });
   }
  }
  return pptx;
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
  dialog.append(el('p','hint','Textes repris tels quels, sans résumé ni reformulation. Les textes sont modifiables ; les terrains sont des images fixes. Les animations restent disponibles sur le site.'));
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
   const popup=window.open('about:blank','vestiaire-canva-'+crypto.randomUUID());
   if(popup){popup.opener=null;popup.document.title='Votre causerie dans Canva';popup.document.body.textContent='Préparation de votre causerie… Cette fenêtre ouvrira votre présentation Canva.';}
   return popup;
  }
  async function startAuthorization(popup=null,afterConnection=null){
   if(busy)return;stopConnectionPoll();
   const version=viewVersion;
   popup=popup||reserveWindow();if(!popup){status.textContent='Autorisez l’ouverture de la fenêtre Canva, puis réessayez.';return;}
   try{
    const credential=clubToken(),form=el('form'),input=el('input'),returnURL=el('input');
    form.method='POST';form.action=gateway+'/oauth/start';form.target=popup.name;input.type='hidden';input.name='credential';input.value=credential;
    returnURL.type='hidden';returnURL.name='return_url';returnURL.value=new URL('canva-return.html',location.href).href;form.append(input,returnURL);document.body.append(form);
    try{form.submit();}finally{form.remove();}
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
   }catch(error){popup.close();status.textContent=error.message;}
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
   const boards=[snapshot.board];if(include.checked&&snapshot.linked)boards.push(snapshot.linked);
   for(const board of boards){
    inventory.append(el('li','','Terrain · '+(board.title||board.team)));
    for(const entry of collect(board))inventory.append(el('li','',entry.label+' · '+entry.value.length+' caractères'));
   }
  }
  function open(check=true){
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
