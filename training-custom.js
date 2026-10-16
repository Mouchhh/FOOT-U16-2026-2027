// Création libre : les exercices du coach font partie du document de séance.
const customTrainingLabels={title:'Nom de l’exercice',goal:'Objectif',organisation:'Organisation / répartition des joueurs',instructions:'Consignes',material:'Matériel',success:'Critère de réussite'};
function trainingCustomValid(ex){return ex&&Object.keys(customTrainingLabels).every(k=>typeof ex[k]==='string'&&ex[k].length<=(k==='title'?100:3000))&&ex.title.trim().length>0&&['game','possession','circuit','duel'].includes(ex.kind)&&Number.isInteger(ex.width)&&ex.width>=6&&ex.width<=68&&Number.isInteger(ex.length)&&ex.length>=6&&ex.length<=105&&(!Object.hasOwn(ex,"board")||validExerciseBoard(ex.board));}
function trainingExerciseForBlock(block){return block.exerciseId==='custom'?{id:'custom',title:block.custom.title,method:'Création du coach',theme:'Exercice personnalisé',custom:block.custom}:trainingExercises.find(e=>e.id===block.exerciseId);}
function trainingCustomDetail(custom,session){
 const root=el('div','training-detail');
 for(const key of ['goal','organisation','instructions','material','success'])if(custom[key].trim()){root.append(el('h4','',customTrainingLabels[key]),el('p','training-custom-text',custom[key]));}
 const exercise={id:'custom',title:custom.title,goal:'Placement indicatif selon le type d’exercice, à adapter à vos consignes.',kind:custom.kind,width:custom.width,length:custom.length,target:session.players};
 if(custom.board)root.append(exerciseBoardPreview(custom.board,custom.title));else root.append(el('p','hint','Schéma indicatif : répartition des '+session.players+' joueurs. Il ne traduit pas automatiquement vos consignes libres.'),trainingDiagram(exercise,session));
 const available=trainingSpaces[session.space];root.append(el('p','hint','Zone demandée : '+custom.width+' × '+custom.length+' m · espace disponible : '+available[0]+' × '+available[1]+' m (repères à ajuster sur place).'));
 if(custom.width>available[0]||custom.length>available[1])root.append(el('p','training-alert','La zone demandée dépasse l’espace disponible. Le schéma est limité à la surface disponible : adaptez les dimensions ou l’organisation.'));
 return root;
}
let trainingCustomEditing=null;
function openCustomTrainingExercise(block=null){
 if(!applyTrainingForm())return notify('Vérifiez les paramètres de la séance.');
 if(!block&&currentTraining.blocks.length>=20)return notify('20 blocs maximum.');
 trainingCustomEditing=block?.id||null;const available=trainingSpaces[currentTraining.space];
 const custom=block?.custom||{title:'',goal:'',organisation:'',instructions:'',material:'',success:'',kind:'game',width:available[0],length:available[1]};
 for(const key of [...Object.keys(customTrainingLabels),'kind','width','length'])$('custom-training-'+key).value=custom[key];
 $('custom-training-duration').value=block?.duration||Math.min(15,Math.max(1,currentTraining.duration-trainingTotal()||12));$('custom-training-dialog-title').textContent=block?'Modifier mon exercice':'Créer mon exercice';$('custom-training-dialog').showModal();
}
function renderManualTrainingMode(){
 const manual=currentTraining.creationMode==='manual';$('training-manual').classList.toggle('active',manual);$('training-manual').setAttribute('aria-pressed',String(manual));$('training-assisted').classList.toggle('active',!manual);$('training-assisted').setAttribute('aria-pressed',String(!manual));document.body.classList.toggle('training-manual-mode',manual);
 $('training-themes-help').textContent=manual?'Choisissez jusqu’à trois thèmes pour votre séance. Vous construisez librement tout le contenu du déroulé.':'Choisissez jusqu’à trois thèmes prioritaires. Le générateur construit une proposition : activation, ateliers, réinvestissement et retour au calme, à valider par le coach.';
 const left=currentTraining.duration-trainingTotal();$('training-remaining').textContent=left>0?left+' min à répartir':left===0?'Durée prévue atteinte':Math.abs(left)+' min au-delà de la durée prévue';
}
document.addEventListener('DOMContentLoaded',()=>{
 const before=renderTrainingBlocks;renderTrainingBlocks=function(){before();renderManualTrainingMode();};
 $('training-manual').onclick=()=>{
  if(currentTraining.creationMode==='manual')return $('training-title').focus();
  if(!applyTrainingForm())return;
  if(currentTraining.blocks.length&&!confirm('Créer une nouvelle séance vide avec ces paramètres ? Enregistrez la séance actuelle avant de continuer si vous souhaitez la conserver.'))return;
  const next=structuredClone(currentTraining);next.id=crypto.randomUUID();next.title='';next.updatedAt='';next.blocks=[];next.creationMode='manual';delete next.clubAdvice;delete next.coachingLoad;currentTraining=next;saveTrainingDraft();syncTrainingForm();renderTrainingBlocks();renderTrainingLibrary();$('training-title').focus();notify('Séance vierge créée : choisissez vos paramètres, puis ajoutez vos exercices.');
 };
 $('training-assisted').onclick=()=>{if(!applyTrainingForm())return;currentTraining.creationMode='assisted';saveTrainingDraft();renderManualTrainingMode();};
 $('training-custom-add').onclick=()=>openCustomTrainingExercise();$('training-custom-catalogue').onclick=()=>$('training-search').focus();$('custom-training-close').onclick=()=>$('custom-training-dialog').close();
 $('custom-training-form').onsubmit=event=>{
  event.preventDefault();const custom=Object.fromEntries(Object.keys(customTrainingLabels).map(key=>[key,$('custom-training-'+key).value.trim()]));custom.kind=$('custom-training-kind').value;custom.width=Number($('custom-training-width').value);custom.length=Number($('custom-training-length').value);const duration=Number($('custom-training-duration').value);const board=serializeExerciseBoard();if(board)custom.board=board;
  if(!trainingCustomValid(custom)||!Number.isInteger(duration)||duration<1||duration>120)return notify('Vérifiez le nom, la durée et les dimensions de l’exercice.');
  const block=trainingCustomEditing?currentTraining.blocks.find(b=>b.id===trainingCustomEditing):null;
  if(trainingCustomEditing&&!block)return notify('Cet exercice n’est plus présent dans la séance.');
  if(block){block.custom=custom;block.duration=duration;}else{if(currentTraining.blocks.length>=20)return notify('20 blocs maximum.');currentTraining.blocks.push({id:crypto.randomUUID(),exerciseId:'custom',custom,duration,notes:''});}
  saveTrainingDraft();renderTrainingBlocks();$('custom-training-dialog').close();
 };
 renderManualTrainingMode();
});
