// Reuse the coach's actual saved work; no second library or new sharing service.
function trainingPersonalExercises(){
 const entries=[],seen=new Set();
 const sources=[{session:currentTraining,draft:true},...trainingLibrary.map(session=>({session,draft:false}))];
 for(const {session,draft}of sources)for(const block of session.blocks){
  if(block.exerciseId!=='custom'||!trainingCustomValid(block.custom))continue;
  const signature=JSON.stringify([block.custom,block.duration,block.setupMinutes||0,block.recoveryMinutes??null,block.notes]);if(seen.has(signature))continue;seen.add(signature);
  entries.push({sessionId:session.id,block:structuredClone(block),draft,label:(draft?'Brouillon ouvert sur cet appareil':(session.title||session.team)+' · '+session.date)});
 }
 return entries;
}
function trainingOpenPersonalExercises(){
 if($('training-personal-library')?.open)return;if(!applyTrainingForm())return;
 const sessionId=currentTraining.id,coachId=activeCoach.id,entries=trainingPersonalExercises(),dialog=el('dialog','completion-dialog');dialog.id='training-personal-library';dialog.setAttribute('aria-label','Mes exercices personnels');
 const head=el('div','section-heading'),close=el('button','export','Fermer');close.type='button';close.onclick=()=>dialog.close();head.append(el('h2','','Mes exercices personnels'),close);dialog.append(head,el('p','hint','Exercices issus de vos séances enregistrées et de votre préparation ouverte. Chaque ajout crée une copie indépendante. Enregistrez la séance pour retrouver vos créations dans une autre séance ou sur un autre appareil.'));
 const label=el('label','report-field','Chercher un exercice personnel'),search=el('input');search.type='search';search.maxLength=150;label.append(search);const list=el('div'),status=el('p','hint');status.setAttribute('role','status');dialog.append(label,list,status);
 const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 function render(){list.replaceChildren();const query=normal(search.value.trim());const filtered=entries.filter(e=>normal([e.block.custom.title,e.block.custom.goal,e.label].join(' ')).includes(query));status.textContent=filtered.length+' exercice(s)';
  if(!filtered.length)list.append(el('p','','Aucun exercice personnel trouvé. Créez votre exercice puis enregistrez sa séance pour le réutiliser.'));
  for(const entry of filtered){const row=el('section','report-panel'),copy=el('button','primary','Ajouter une copie');copy.type='button';row.append(el('h3','',entry.block.custom.title),el('p','hint',entry.label),el('p','',entry.block.custom.goal),el('p','hint',entry.block.custom.width+' × '+entry.block.custom.length+' m · '+entry.block.duration+' min · '+(entry.block.custom.board?.frames.length||0)+' image(s) d’animation'),copy);
   copy.onclick=()=>{if(activeCoach.id!==coachId||currentTraining.id!==sessionId){status.textContent='La séance ou le coach a changé. Fermez puis rouvrez vos exercices.';return;}if(currentTraining.blocks.length>=20){status.textContent='20 blocs maximum : retirez un exercice avant de poursuivre.';return;}const b=structuredClone(entry.block);b.id=crypto.randomUUID();if(!trainingCommitBlocks(blocks=>blocks.push(b))){status.textContent='Copie non ajoutée : le déroulé précédent est conservé.';return;}dialog.close();trainingWizard.go(3);notify('Copie indépendante ajoutée. Vérifiez l’effectif, les dimensions et les rotations pour cette séance.');};list.append(row);
  }
 }
 search.oninput=render;render();document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();search.focus();
}
document.addEventListener('DOMContentLoaded',()=>{
 const button=el('button','export','Mes exercices');button.id='training-personal-exercises';button.type='button';button.onclick=trainingOpenPersonalExercises;$('training-custom-add').after(button);
 const clear=clubNetworkClear;clubNetworkClear=function(){$('training-personal-library')?.close();$('custom-training-dialog')?.close();clear();};
});
