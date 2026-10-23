// Bibliothèque de séquences nommées, isolée dans l'espace local de chaque coach.
let simpleLibrary=[],simpleLegacyLibrary=[];
function simpleSequenceValid(entry){return entry&&typeof entry.id==='string'&&entry.id.length<=100&&typeof entry.title==='string'&&entry.title.trim().length>0&&entry.title.length<=100&&typeof entry.updatedAt==='string'&&simpleValid(entry.state)&&['0.5','1','2'].includes(entry.speed)&&['forward','back'].includes(entry.choice);}
function simpleLibraryValid(list){return Array.isArray(list)&&list.length<=200&&list.every(simpleSequenceValid)&&new Set(list.map(s=>s.id)).size===list.length;}
try{const saved=JSON.parse(coachStorageGet('vestiaire-simple-library')||'[]');if(simpleLibraryValid(saved))simpleLegacyLibrary=saved;}catch{}
function simpleExplanationValid(payload){return !!payload?.pionExplanation&&simpleSequenceValid(payload.pionExplanation)&&payload.documentId===payload.pionExplanation.id&&payload.pionExplanation.state.sequenceId===payload.documentId;}
function simpleRefreshLibrary(){
 const shared=saves.filter(s=>simpleExplanationValid(s.state)).map(s=>s.state.pionExplanation),ids=new Set(shared.map(e=>e.id));
 simpleLibrary=[...shared,...simpleLegacyLibrary.filter(e=>!ids.has(e.id))];
}
function simpleCommitLibrary(list){
 if(!simpleLibraryValid(list))throw Error('Bibliothèque d’explications invalide ou pleine.');
 const next=[...saves.filter(s=>!s.state?.pionExplanation),...list.map(entry=>{
  const previous=saves.find(s=>s.state?.pionExplanation&&s.state.documentId===entry.id);
  if(previous&&JSON.stringify(previous.state.pionExplanation)===JSON.stringify(entry))return previous;
  return {date:entry.updatedAt,state:{team:'Explications · pions',category:previous?.state.category||state.category||'',formation:'4-3-3',color:'#2855a2',notes:'',players:[],arrows:[],documentId:entry.id,title:entry.title,pionExplanation:structuredClone(entry)}};
 })];
 // One canonical write uses the existing durable journal, conflict checks and outbox.
 coachStorageSet('vestiaire-saves',JSON.stringify(next));saves=next;simpleLegacyLibrary=[];
 // Retire the old device-only cache after its contents are safely in the canonical library.
 try{coachStorageSet('vestiaire-simple-library','[]');}catch{notify('Les anciennes copies locales restent conservées sur cet appareil.');}
 simpleRefreshLibrary();renderSaves();
}
function renderSimpleLibrary(){
 simpleRefreshLibrary();
 const selected=$('simple-library').value;$('simple-library').replaceChildren();const placeholder=el('option','','Choisir une séquence enregistrée');placeholder.value='';$('simple-library').append(placeholder);
 simpleLibrary.forEach(entry=>{const option=el('option','',entry.title);option.value=entry.id;$('simple-library').append(option);});
 $('simple-library').value=simpleLibrary.some(s=>s.id===selected)?selected:'';simpleLibraryButtons();
}
function simpleLibraryButtons(){const selected=simpleLibrary.some(s=>s.id===$('simple-library').value);$('simple-sequence-open').disabled=!selected;$('simple-sequence-delete').disabled=!selected;}
function syncSimpleSequenceTitle(){$('simple-sequence-name').value=simpleState.sequenceTitle||'';$('simple-title').textContent=simpleState.sequenceTitle?.trim()||simpleScenario(simpleState).title;}
const renderSimpleBeforeLibrary=renderSimple;
renderSimple=function(){renderSimpleBeforeLibrary();syncSimpleSequenceTitle();};
$('simple-sequence-name').oninput=e=>{simpleState.sequenceTitle=e.target.value;$('simple-title').textContent=e.target.value.trim()||simpleScenario(simpleState).title;saveSimple();};
function saveSimpleSequence(copy=false){
 const title=$('simple-sequence-name').value.trim();if(!title){$('simple-sequence-name').focus();return notify('Donnez un nom à votre séquence.');}
 stopAnimation();
 const id=!copy&&simpleState.sequenceId?simpleState.sequenceId:crypto.randomUUID();
 const snapshot=structuredClone(simpleState.scenario==='custom'?customRestoreSnapshot(structuredClone(simpleState),0):(animationStart||simpleState));snapshot.sequenceId=id;snapshot.sequenceTitle=title;
 const entry={id,title,updatedAt:new Date().toISOString(),state:snapshot,speed:$('animation-speed').value,choice:$('animation-choice').value};
 const next=[entry,...simpleLibrary.filter(s=>s.id!==id)];if(!simpleLibraryValid(next))return notify('200 séquences maximum. Supprimez une ancienne séquence avant de continuer.');
 try{simpleCommitLibrary(next);simpleState.sequenceId=id;simpleState.sequenceTitle=title;saveSimple();renderSimpleLibrary();$('simple-library').value=id;simpleLibraryButtons();notify('Explication « '+title+' » enregistrée'+(typeof clubNetworkBound==='function'&&clubNetworkBound()?' · partage au club en attente de confirmation.':' sur cet appareil. Connectez-vous pour la partager.'));}catch(error){notify(typeof clubNetworkMessage==='function'&&error.code?clubNetworkMessage(error):'Explication non enregistrée : stockage indisponible. Le tableau ouvert reste conservé.');}
}
$('simple-sequence-save').onclick=()=>saveSimpleSequence();$('simple-sequence-copy').onclick=()=>saveSimpleSequence(true);
$('simple-library').onchange=simpleLibraryButtons;
$('simple-sequence-open').onclick=()=>{
 const entry=simpleLibrary.find(s=>s.id===$('simple-library').value);if(!entry)return;
 if(!confirm('Ouvrir « '+entry.title+' » ? Le tableau courant restera récupérable dans Brouillons & récupération.'))return;
 if(typeof simpleExplanationOpen==='function'){if(simpleExplanationOpen(entry))notify('Explication ouverte. Le tableau précédent reste récupérable.');return;}
 stopAnimation(true);simpleState=structuredClone(entry.state);simpleSelected=null;$('animation-speed').value=entry.speed;$('animation-choice').value=entry.choice;renderSimple();saveSimple();notify('Séquence chargée. Vous pouvez la modifier ou la lire.');
};
$('simple-sequence-delete').onclick=()=>{
 const entry=simpleLibrary.find(s=>s.id===$('simple-library').value);if(!entry||!confirm('Supprimer la séquence « '+entry.title+' » ? Le tableau ouvert reste conservé.'))return;
 const next=simpleLibrary.filter(s=>s.id!==entry.id);try{simpleCommitLibrary(next);renderSimpleLibrary();notify('Séquence supprimée.');}catch{notify('Suppression impossible : stockage indisponible.');}
};
renderSimpleLibrary();syncSimpleSequenceTitle();
