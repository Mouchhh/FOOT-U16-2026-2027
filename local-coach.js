let localCoachProposal=null,localCoachSnapshot=null,localCoachVariant=0;
function localCoachContext(){return JSON.stringify({coach:activeCoach.id,session:{...currentTraining,updatedAt:''},goal:$('local-coach-goal').value,matchDate:$('local-coach-match').value,reference:localCoachReference()});}

function localCoachReference(){return typeof manualAIReference!=='undefined'&&manualAIReference?manualAIReference:null;}
function openLocalCoachProposal(other=false){
 if(!applyTrainingForm())return notify('Vérifiez le rendez-vous et le groupe.');
 if(!other)localCoachVariant=0;else localCoachVariant++;
 try{
  const proposal=localCoachPlan(currentTraining,{goal:$('local-coach-goal').value,matchDate:$('local-coach-match').value},localCoachReference(),localCoachVariant);
  localCoachProposal=proposal;localCoachSnapshot=localCoachContext();
  const root=$('local-coach-preview');if(typeof bibleDisposeDiagrams==='function')bibleDisposeDiagrams(root);root.replaceChildren(el('h3','',proposal.title),el('p','local-coach-reason',proposal.summary));
  root.prepend(el('p','hint','Proposition locale du site · à relire par le coach, sans validation automatique du responsable sportif.'));if(proposal.references.length){const refs=el('details');refs.append(el('summary','','Renvois au document importé · à vérifier'));for(const citation of proposal.references){const section=localCoachReference()?.sections.find(s=>s.id===citation.id);if(section)refs.append(el('strong','',section.title+' · p. '+section.page),el('p','',section.text));}root.append(refs);}
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
 const next=structuredClone(currentTraining);if(!next.title?.trim())next.title=localCoachProposal.title;
 next.themes=[...localCoachProposal.themes];next.coachingLoad=localCoachProposal.load;next.clubAdvice=localCoachProposal.summary;
 next.blocks=localCoachProposal.blocks.map(b=>({id:crypto.randomUUID(),exerciseId:b.exerciseId,duration:b.duration,notes:b.notes}));
 if(!workspaceReplaceDraft('training',next))return;localCoachProposal=null;$('local-coach-dialog').close();notify('Proposition ajoutée à votre brouillon. Ajustez puis enregistrez la séance.');
};
function refreshLocalCoachAdvice(){const node=$('local-coach-advice');node.textContent=currentTraining.clubAdvice||'';node.hidden=!currentTraining.clubAdvice;const ref=localCoachReference();$('local-coach-reference-label').textContent=ref?'Référentiel disponible : '+ref.title+' · '+ref.sections.length+' sections paginées.':'Prêt à proposer une séance avec la bibliothèque du club. Référentiel sportif importable en option.';}
const renderTrainingBlocksWithoutAdvice=renderTrainingBlocks;renderTrainingBlocks=function(){renderTrainingBlocksWithoutAdvice();refreshLocalCoachAdvice();};
// Le bouton historique ouvre désormais la même proposition relue avant application.
generateTraining=()=>openLocalCoachProposal();$('training-generate').onclick=generateTraining;
for(const theme of trainingThemes){const option=el('option','',theme);option.value=theme;$('local-coach-goal').append(option);}
$('local-coach-reference-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>200000)throw Error();const reference=JSON.parse(await file.text());manualAISetReference(reference);refreshLocalCoachAdvice();notify('Référentiel conservé dans votre espace sur cet appareil.');}catch{notify('Référentiel invalide.');}e.target.value='';};
refreshLocalCoachAdvice();

$('local-coach-dialog').addEventListener('close',()=>{if(typeof bibleDisposeDiagrams==='function')bibleDisposeDiagrams($('local-coach-preview'));});
