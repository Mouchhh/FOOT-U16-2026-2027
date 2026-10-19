let localCoachProposal=null,localCoachSnapshot=null,localCoachVariant=0;
function localCoachContext(){return JSON.stringify({team:currentTraining.team,category:currentTraining.category,date:currentTraining.date,duration:currentTraining.duration,players:currentTraining.players,keepers:currentTraining.keepers,age:currentTraining.age,level:currentTraining.level,space:currentTraining.space,spaceWidth:currentTraining.spaceWidth,spaceLength:currentTraining.spaceLength,context:currentTraining.context,themes:currentTraining.themes,notes:currentTraining.notes});}
function localCoachReference(){return typeof manualAIReference!=='undefined'&&manualAIReference?manualAIReference:null;}
function openLocalCoachProposal(other=false){
 if(!applyTrainingForm())return notify('Vérifiez le rendez-vous et le groupe.');
 if(!other)localCoachVariant=0;else localCoachVariant++;
 try{
  const proposal=localCoachPlan(currentTraining,{goal:$('local-coach-goal').value,matchDate:$('local-coach-match').value},localCoachReference(),localCoachVariant);
  localCoachProposal=proposal;localCoachSnapshot=localCoachContext();
  const root=$('local-coach-preview');root.replaceChildren(el('h3','',proposal.title),el('p','local-coach-reason',proposal.summary));
  let minute=0;proposal.blocks.forEach(b=>{const exercise=trainingExercises.find(e=>e.id===b.exerciseId),card=el('article','local-coach-preview-block');card.append(el('strong','',minute+'′ — '+(minute+b.duration)+'′ · '+exercise.title),el('p','',b.notes));minute+=b.duration;const details=el('details');details.append(el('summary','','Voir le schéma et les consignes'),trainingExerciseDetail(exercise,{...currentTraining,coachingLoad:proposal.load},{duration:b.duration}));card.append(details);root.append(card);});
  $('local-coach-result').textContent=minute+' minutes · '+currentTraining.players+' joueurs répartis · proposition modifiable';
  if(!$('local-coach-dialog').open)$('local-coach-dialog').showModal();
 }catch(error){notify(error.message||'Impossible de proposer une séance.');}
}
$('local-coach-propose').onclick=()=>openLocalCoachProposal();$('local-coach-alternative').onclick=()=>openLocalCoachProposal(true);$('local-coach-close').onclick=()=>$('local-coach-dialog').close();
$('local-coach-use').onclick=()=>{
 if(!localCoachProposal||!applyTrainingForm())return;
 if(localCoachContext()!==localCoachSnapshot)return notify('Le groupe a changé. Préparez une nouvelle proposition.');
 if(currentTraining.blocks.length&&!confirm('Remplacer le déroulé par cette proposition ? Vos autres informations sont conservées.'))return;
 if(!currentTraining.title?.trim())currentTraining.title=localCoachProposal.title;
 currentTraining.themes=[...localCoachProposal.themes];currentTraining.coachingLoad=localCoachProposal.load;currentTraining.clubAdvice=localCoachProposal.summary;
 currentTraining.blocks=localCoachProposal.blocks.map(b=>({id:crypto.randomUUID(),exerciseId:b.exerciseId,duration:b.duration,notes:b.notes}));
 saveTrainingDraft();syncTrainingForm();renderTrainingBlocks();$('local-coach-dialog').close();notify('Proposition ajoutée à votre brouillon. Ajustez puis enregistrez la séance.');
};
function refreshLocalCoachAdvice(){const node=$('local-coach-advice');node.textContent=currentTraining.clubAdvice||'';node.hidden=!currentTraining.clubAdvice;const ref=localCoachReference();$('local-coach-reference-label').textContent=ref?'Référentiel disponible : '+ref.title+' · '+ref.sections.length+' sections paginées.':'Prêt à proposer une séance avec la bibliothèque du club. Référentiel sportif importable en option.';}
const renderTrainingBlocksWithoutAdvice=renderTrainingBlocks;renderTrainingBlocks=function(){renderTrainingBlocksWithoutAdvice();refreshLocalCoachAdvice();};
// Le bouton historique ouvre désormais la même proposition relue avant application.
generateTraining=()=>openLocalCoachProposal();$('training-generate').onclick=generateTraining;
for(const theme of trainingThemes){const option=el('option','',theme);option.value=theme;$('local-coach-goal').append(option);}
$('local-coach-reference-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>200000)throw Error();const reference=JSON.parse(await file.text());manualAISetReference(reference);refreshLocalCoachAdvice();notify('Référentiel chargé pour les coachs de ce navigateur.');}catch{notify('Référentiel invalide.');}e.target.value='';};
refreshLocalCoachAdvice();
