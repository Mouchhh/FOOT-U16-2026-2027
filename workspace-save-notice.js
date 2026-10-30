// État du document ouvert, distinct de l'état global de partage au club.
document.addEventListener('DOMContentLoaded',()=>{
 const trigger=el('button','workspace-save-trigger');trigger.id='workspace-save-open';trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');
 let frame=0,dialog=null,fields=null;const pending=new Set();
 const changes=new Set(['team','category','date','time','duration','players','keepers','age','level','context','bmf-category','bmf-objective','coaching-load','space-size','space-width','space-length'].map(k=>'training-'+k));
 const equal=(a,b)=>{const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>k!=='updatedAt').map(k=>[k,canonical(v[k])])):v;return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));};
 function current(){
  const body=document.body;
  if(body.classList.contains('training-mode'))return {kind:'training',name:'Séance',value:currentTraining,key:'vestiaire-training-draft',library:'vestiaire-training-library',id:currentTraining.id,valid:trainingValid,save:'training-save'};
  if(body.classList.contains('reports-mode'))return {kind:'report',name:'Bilan',value:currentReport,key:'vestiaire-report-draft',library:'vestiaire-reports',id:currentReport.id,valid:reportValid,save:'report-save'};
  if(['home-mode','coach-agenda-mode','club-network-mode','simple-mode'].some(c=>body.classList.contains(c)))return null;
  const value=terrainBoardKind==='plan'?getGamePlanBoard():getCompositionBoard();
  return {kind:terrainBoardKind,name:terrainBoardKind==='plan'?'Tactique':'Composition',value,key:terrainBoardKind==='plan'?'vestiaire-gameplan-draft':'vestiaire-draft',library:'vestiaire-saves',id:value?.documentId,valid,save:'save'};
 }
 function status(spec){
  if(spec.kind==='training'&&pending.size)return {state:'editing',label:'Saisie en cours',detail:'Votre champ est encore en cours de saisie. Terminez-le puis enregistrez la séance.'};
  if(spec.kind==='training'){
   const candidate=structuredClone(currentTraining),map={team:'team',category:'category',date:'date',time:'time',duration:'duration',players:'players',keepers:'keepers',age:'age',level:'level',context:'context','bmf-category':'bmfCategory','bmf-objective':'bmfObjective','coaching-load':'coachingLoad','space-size':'space',notes:'notes'};
   let invalid=false;
   for(const [id,key]of Object.entries(map)){const input=$('training-'+id);if(!input.validity.valid)invalid=true;candidate[key]=['duration','players','keepers','age'].includes(key)?Number(input.value):input.value;}
   if(candidate.space==='custom')for(const [id,key]of [['training-space-width','spaceWidth'],['training-space-length','spaceLength']])candidate[key]=Number($(id).value);
   if(invalid||!trainingValid(candidate))return {state:'error',label:'Saisie à vérifier',detail:'Certains réglages de la séance sont incomplets ou invalides. Votre version enregistrée ne contient pas ces changements. Corrigez les champs signalés avant d’enregistrer.'};
   // The normal change handler can reject a write and leave the previous model intact.
   if(Object.entries(map).some(([id,key])=>key==='bmfCategory'?bmfCanonicalCategory(candidate[key])!==bmfCanonicalCategory(currentTraining[key]):String(candidate[key])!==String(currentTraining[key]??(key==='coachingLoad'?'normal':'')))||candidate.space==='custom'&&['spaceWidth','spaceLength'].some(key=>candidate[key]!==currentTraining[key]))return {state:'editing',label:'Saisie à enregistrer',detail:'Les champs affichés diffèrent de la version conservée. Terminez la saisie puis enregistrez la séance et vérifiez le message obtenu.'};
  }
  if(!spec.valid(spec.value))return {state:'error',label:'Saisie à vérifier',detail:'Certains champs sont incomplets ou invalides. Corrigez-les avant d’enregistrer.'};
  try{
   // Read without changing the library's concurrent-write baseline.
   const draft=JSON.parse(localStorage.getItem(coachStorageKey(spec.key))||'null'),library=JSON.parse(localStorage.getItem(coachStorageKey(spec.library))||'[]');
   if(!Array.isArray(library))throw Error('invalid library');
   const saved=library.find(row=>spec.library==='vestiaire-saves'?row.state?.documentId===spec.id:row.id===spec.id),value=spec.library==='vestiaire-saves'?saved?.state:saved;
   if(spec.id&&value&&equal(value,spec.value))return {state:'saved',label:'Enregistré ici',detail:'Cette version se trouve dans vos documents enregistrés sur cet appareil. Le partage au club a son propre état.'};
   if(draft&&equal(draft,spec.value))return {state:'draft',label:saved?'Modifications à enregistrer':'Brouillon local',detail:'Votre travail est conservé dans le navigateur de cet appareil. Cliquez sur Enregistrer pour ajouter cette version à vos documents. Le brouillon seul ne se retrouve pas sur un autre appareil.'};
   return {state:'error',label:'Conservation à vérifier',detail:'La conservation de la version ouverte n’est pas confirmée. Enregistrez à nouveau et vérifiez le message obtenu. Gardez cette page ouverte si le stockage est indisponible.'};
  }catch{return {state:'error',label:'Stockage à vérifier',detail:'Le stockage de cet appareil est indisponible ou illisible. Votre document reste ouvert ; la sauvegarde n’est pas confirmée.'};}
 }
 function refresh(){
  frame=0;const spec=current(),strip=$('task-section-navigation');trigger.hidden=!spec;
  if(strip&&trigger.parentNode!==strip)strip.insertBefore(trigger,strip.querySelector('.task-tactical-modes'));
  if(!spec){dialog?.close();return;}
  const s=status(spec);trigger.dataset.state=s.state;const label=s.label;trigger.setAttribute('aria-label',spec.name+' · '+s.label+' · Voir la sauvegarde');if(trigger.textContent!==label)trigger.textContent=label;
  if(dialog?.open){fields.title.textContent=spec.name+' · Sauvegarde';fields.status.textContent=s.label;fields.detail.textContent=s.detail;fields.save.textContent='Enregistrer '+(spec.kind==='training'?'la séance':spec.kind==='report'?'le bilan':spec.kind==='plan'?'la vue tactique':'la composition');fields.cloud.textContent=clubNetworkBound()?'Partage des documents enregistrés : '+clubSaveState.detail:'Le partage au club nécessite une connexion à votre compte. Enregistrer ici conserve votre document sur cet appareil.';}
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(refresh);}
 trigger.onclick=()=>{
  if(dialog?.open)return;dialog?.remove();dialog=el('dialog','completion-dialog workspace-save-dialog');dialog.id='workspace-save-dialog';dialog.setAttribute('aria-labelledby','workspace-save-heading');
  const heading=el('div','section-heading'),title=el('h2'),close=el('button','export','Fermer');title.id='workspace-save-heading';close.type='button';close.onclick=()=>dialog.close();heading.append(title,close);
  const state=el('p','workspace-save-state'),detail=el('p'),cloud=el('p','hint'),actions=el('div','workflow-actions'),save=el('button','primary'),recovery=el('button','export','Retrouver un brouillon remplacé');state.setAttribute('role','status');save.id='workspace-save-action';save.type=recovery.type='button';
  save.onclick=()=>{const spec=current();if(spec)$(spec.save).click();schedule();};
  recovery.onclick=()=>{dialog.close();workspaceOpenRecovery();};
  actions.append(save,recovery);dialog.append(heading,state,detail,cloud,actions);fields={title,status:state,detail,cloud,save};document.body.append(dialog);dialog.showModal();refresh();
 };
 document.addEventListener('input',e=>{if(changes.has(e.target.id))pending.add(e.target.id);schedule();});
 document.addEventListener('change',e=>{pending.delete(e.target.id);schedule();});document.addEventListener('click',schedule);
 document.addEventListener('workspace-draft-changed',()=>{pending.clear();schedule();});window.addEventListener('storage',schedule);
 const writer=coachStorageSet;coachStorageSet=function(...args){try{return writer(...args);}finally{schedule();}};
 const saveRender=clubSaveRender;clubSaveRender=function(){saveRender();schedule();};
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(schedule).observe($('task-section-navigation'),{childList:true});
 window.workspaceSaveNotice={refresh:schedule};refresh();
});
