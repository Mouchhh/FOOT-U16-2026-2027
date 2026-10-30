// Reuse actual work and keep explicitly created exercises available independently of the open session.
function trainingStoredPersonalExercises(){try{const records=JSON.parse(coachStorageGet('vestiaire-personal-exercises')||'[]');return Array.isArray(records)?records.filter(r=>r&&trainingText(r.label,200)&&r.source&&Number.isInteger(r.source.players)&&r.source.players>=2&&r.source.players<=80&&Number.isInteger(r.source.keepers)&&r.source.keepers>=0&&r.source.keepers<=12&&r.block?.exerciseId==='custom'&&trainingValid({...newTraining(),blocks:[r.block]})):[];}catch{return [];}}
function trainingKeepPersonalExercise(block){const entries=trainingStoredPersonalExercises().filter(r=>r.block.id!==block.id);if(entries.length>=200){notify('Exercice conservé dans le brouillon. Bibliothèque personnelle pleine : enregistrez sa séance pour le retrouver.');return false;}entries.unshift({block:structuredClone(block),source:{players:block.workshopPlayers??currentTraining.players,keepers:block.workshopKeepers??currentTraining.keepers},label:'Mon exercice · '+activeCoach.name});try{coachStorageSet('vestiaire-personal-exercises',JSON.stringify(entries));return true;}catch{notify('Exercice conservé dans le brouillon ; sa copie indépendante n’a pas pu être enregistrée.');return false;}}
function trainingPersonalExercises(){
 const entries=[],seen=new Set();
 const sources=[{session:currentTraining,draft:true},...trainingLibrary.map(session=>({session,draft:false}))];
 for(const {session,draft}of sources)for(const block of session.blocks){
  if(block.exerciseId!=='custom'||!trainingCustomValid(block.custom))continue;
  const signature=JSON.stringify([block.custom,block.duration,block.setupMinutes||0,block.recoveryMinutes??null,block.notes]);if(seen.has(signature))continue;seen.add(signature);
  entries.push({sessionId:session.id,block:structuredClone(block),draft,source:{players:block.workshopPlayers??session.players,keepers:block.workshopKeepers??session.keepers},label:(draft?'Brouillon ouvert sur cet appareil':(session.title||session.team)+' · '+session.date)});
 }
 for(const record of trainingStoredPersonalExercises()){const b=record.block,signature=JSON.stringify([b.custom,b.duration,b.setupMinutes||0,b.recoveryMinutes??null,b.notes]);if(seen.has(signature))continue;seen.add(signature);entries.push({...structuredClone(record),draft:false,sessionId:null});}
 return entries;
}
function trainingOpenPersonalExercises(){
 if($('training-personal-library')?.open)return;if(!applyTrainingForm())return;
 const sessionId=currentTraining.id,coachId=activeCoach.id,entries=trainingPersonalExercises(),dialog=el('dialog','completion-dialog');dialog.id='training-personal-library';dialog.setAttribute('aria-label','Mes exercices personnels');
 const head=el('div','section-heading'),close=el('button','export','Fermer');close.type='button';close.onclick=()=>dialog.close();head.append(el('h2','','Mes exercices personnels'),close);dialog.append(head,el('p','hint','Exercices issus de vos séances enregistrées et de votre préparation ouverte. Chaque ajout crée une copie indépendante. Les créations sont conservées sur cet appareil. Pour les partager au club ou les retrouver sur un autre appareil, enregistrez une séance qui les contient.'));
 const label=el('label','report-field','Chercher un exercice personnel'),search=el('input');search.type='search';search.maxLength=150;label.append(search);const list=el('div'),status=el('p','hint');status.setAttribute('role','status');dialog.append(label,list,status);
 const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 function render(){list.replaceChildren();const query=normal(search.value.trim());const filtered=entries.filter(e=>normal([e.block.custom.title,e.block.custom.goal,e.label].join(' ')).includes(query));status.textContent=filtered.length+' exercice(s)';
  if(!filtered.length)list.append(el('p','','Aucun exercice personnel trouvé. Créez votre exercice puis enregistrez sa séance pour le réutiliser.'));
  for(const entry of filtered){const row=el('section','report-panel'),copy=el('button','primary','Ajouter une copie');copy.type='button';row.append(el('h3','',entry.block.custom.title),el('p','hint',entry.label),el('p','',entry.block.custom.goal),el('p','hint',entry.block.custom.width+' × '+entry.block.custom.length+' m · '+entry.block.duration+' min · '+(entry.block.custom.board?.frames.length||0)+' image(s) d’animation'),copy);const adapt=el('button','export','Adapter à ma séance');adapt.type='button';adapt.onclick=()=>trainingReuseExercise(entry.block,entry.source,entry.label);row.append(adapt);
   copy.onclick=()=>{if(activeCoach.id!==coachId||currentTraining.id!==sessionId){status.textContent='La séance ou le coach a changé. Fermez puis rouvrez vos exercices.';return;}if(currentTraining.blocks.length>=20){status.textContent='20 blocs maximum : retirez un exercice avant de poursuivre.';return;}const b=structuredClone(entry.block);b.id=crypto.randomUUID();if(!trainingCommitBlocks(blocks=>blocks.push(b))){status.textContent='Copie non ajoutée : le déroulé précédent est conservé.';return;}dialog.close();trainingWizard.go(3);notify('Copie indépendante ajoutée. Vérifiez l’effectif, les dimensions et les rotations pour cette séance.');};list.append(row);
  }
 }
 search.oninput=render;render();document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();search.focus();
}
document.addEventListener('DOMContentLoaded',()=>{
 $('custom-training-form').addEventListener('submit',()=>{if($('custom-training-dialog').open)return;const block=trainingCustomEditing?currentTraining.blocks.find(b=>b.id===trainingCustomEditing):currentTraining.blocks.at(-1);if(block?.exerciseId==='custom')trainingKeepPersonalExercise(block);});
 const button=el('button','export','Mes exercices');button.id='training-personal-exercises';button.type='button';button.onclick=trainingOpenPersonalExercises;$('training-custom-add').after(button);
 const clear=clubNetworkClear;clubNetworkClear=function(){$('training-personal-library')?.close();$('custom-training-dialog')?.close();clear();};
});
