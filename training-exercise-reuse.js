// Shared and personal exercises use the receiving coach's session, never the source document.
function trainingCustomReusePlan(block,source,target,groups=1){
 const available=bibleAvailable(target),count=Math.max(1,Math.min(Math.floor(target.players/2),Math.round(groups)||1));
 const roster=bibleDistribute(target.players,target.keepers,count);
 const original=block.custom.adaptation?.groups[0]?.players||block.workshopPlayers||(Number.isInteger(source?.players)?source.players:null);
 // Keep the technical distances of circuits/duels; area density is only a proposal for opposition games.
 const factor=original&&['game','possession'].includes(block.custom.kind)?Math.sqrt((target.players/count)/original):1;
 const width=Math.max(6,Math.min(68,Math.floor(available.width/Math.ceil(Math.sqrt(count))),Math.round(block.custom.width*factor)));
 const length=Math.max(6,Math.min(105,Math.floor(available.length/Math.ceil(count/Math.ceil(Math.sqrt(count)))),Math.round(block.custom.length*factor)));
 return {roster,width,length,original,changed:!original||original!==target.players||source.keepers!==target.keepers||count!==1,board:!!block.custom.board};
}
function trainingReuseExercise(block,source,label='Exercice personnel'){
 if(!applyTrainingForm())return;
 const owner=activeCoach.id,sessionId=currentTraining.id,original=structuredClone(block),reference=structuredClone(source||{});
 const dialog=el('dialog','completion-dialog exercise-reuse-dialog');dialog.id='exercise-reuse-dialog';dialog.setAttribute('aria-label','Adapter cet exercice');
 const heading=el('div','section-heading'),close=el('button','export','Annuler');close.type='button';close.onclick=()=>dialog.close();heading.append(el('h2','','Adapter cet exercice à ma séance'),close);
 const fields=el('div','training-form');
 function field(name,value,min,max){const label=el('label','report-field',name),input=el('input');input.type='number';input.min=min;input.max=max;input.step=1;input.value=value;input.required=true;label.append(input);fields.append(label);return input;}
 const groups=field('Nombre de groupes',1,1,Math.floor(currentTraining.players/2)),width=field('Largeur par atelier (m)',original.custom.width,6,68),length=field('Longueur par atelier (m)',original.custom.length,6,105);
 const info=el('p','hint'),details=el('p','training-custom-text'),noteLabel=el('label','report-field','Rôles et rotations adaptés'),notes=el('textarea');notes.maxLength=4000;notes.rows=4;notes.placeholder='Précisez qui démarre, qui attend, quand et comment les rôles changent.';noteLabel.append(notes);
 const warning=el('p','training-alert'),ackLabel=el('label'),ack=el('input');ack.type='checkbox';ackLabel.append(ack,document.createTextNode(' J’ai vérifié les consignes et je vérifierai le schéma personnalisé avant utilisation.'));
 const apply=el('button','primary','Ajouter la copie adaptée'),status=el('p','hint');apply.type='button';status.setAttribute('role','status');
 let plan;
 function refresh(){plan=trainingCustomReusePlan(original,reference,currentTraining,Number(groups.value));width.value=plan.width;length.value=plan.length;info.textContent=label+' → '+currentTraining.players+' joueurs dont '+currentTraining.keepers+' gardien(s). Dimensions proposées selon l’effectif et la place disponible ; à valider selon l’objectif.';details.textContent=plan.roster.map((g,i)=>'Groupe '+(i+1)+' : '+g.players+' joueurs dont '+g.keepers+' gardien(s)').join('\n');warning.textContent=plan.board?'Le dessin et l’animation de l’auteur sont conservés. Les joueurs et les flèches personnalisés ne sont pas redistribués automatiquement : ouvrez l’éditeur pour les ajuster aux groupes indiqués.':'Le placement indicatif utilise votre effectif. Les consignes libres de l’auteur restent à vérifier, notamment leurs chiffres et leurs rotations.';ack.checked=false;}
 groups.oninput=refresh;
 apply.onclick=()=>{
  if(activeCoach.id!==owner||currentTraining.id!==sessionId){status.textContent='La séance ou le coach a changé. Rouvrez cette adaptation.';return;}
  if(![groups,width,length].every(input=>input.reportValidity()))return;
  if(plan.roster.some(g=>g.keepers>g.players-2)){status.textContent='Gardez au moins deux joueurs de champ par groupe : réduisez le nombre de groupes.';return;}
  if(!ack.checked||!notes.value.trim()){status.textContent='Précisez les rôles et rotations puis confirmez leur vérification.';return;}
  if(currentTraining.blocks.length>=20){status.textContent='20 blocs maximum.';return;}
  const copy=structuredClone(original);copy.id=crypto.randomUUID();delete copy.parallelId;delete copy.workshopPlayers;delete copy.workshopKeepers;
  copy.custom.width=Number(width.value);copy.custom.length=Number(length.value);
  const bounds=bibleAvailable(currentTraining),cols=Math.ceil(Math.sqrt(Number(groups.value))),rows=Math.ceil(Number(groups.value)/cols);
  if(copy.custom.width*cols>bounds.width||copy.custom.length*rows>bounds.length){status.textContent='Ces ateliers dépassent l’espace disponible. Réduisez leurs dimensions ou le nombre de groupes.';return;}
  copy.custom.adaptation={version:1,players:currentTraining.players,keepers:currentTraining.keepers,groups:structuredClone(plan.roster),source:label.slice(0,200),rotations:notes.value.trim()};
  const adaptation='Adaptation depuis '+label+'\n'+details.textContent+'\nZone par atelier : '+copy.custom.width+' × '+copy.custom.length+' m\nRôles et rotations : '+notes.value.trim();
  copy.notes=[original.notes,adaptation].filter(Boolean).join('\n\n');
  if(copy.notes.length>12000){status.textContent='Notes trop longues : raccourcissez les rotations.';return;}
  if(!trainingCommitBlocks(blocks=>blocks.push(copy))){status.textContent='Copie non ajoutée : le déroulé précédent est conservé.';return;}
  dialog.close();$('club-network-preview')?.close();$('training-personal-library')?.close();$('view-training').click();trainingWizard.go(3);notify('Copie indépendante ajoutée. Vérifiez son schéma dans « Modifier mon exercice ».');
 };
 dialog.append(heading,info,fields,details,noteLabel,warning,ackLabel,apply,status);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});refresh();dialog.showModal();
}
document.addEventListener('DOMContentLoaded',()=>{
 // The existing preview remains read-only. Importing one exercise does not import the colleague's roster/session.
 const host=$('club-network-preview-content'),observer=new MutationObserver(()=>{
  if(host.querySelector('.exercise-reuse-shared'))return;const row=clubNetworkPreview;
  if(row?.kind!=='training'||!row.payload?.blocks)return;
  const custom=row.payload.blocks.filter(b=>b.exerciseId==='custom'&&trainingCustomValid(b.custom));if(!custom.length)return;
  const section=el('section','report-panel exercise-reuse-shared');section.append(el('h3','','Reprendre un exercice dans ma séance'));
  for(const block of custom){const button=el('button','export','Adapter « '+block.custom.title+' »');button.type='button';button.onclick=()=>trainingReuseExercise(block,row.payload,clubNetworkAuthor(row.owner_id)+' · '+(row.payload.title||row.title));section.append(button);}host.prepend(section);
 });observer.observe(host,{childList:true});
 const render=renderTrainingBlocks;renderTrainingBlocks=function(){render();for(const [i,block]of currentTraining.blocks.entries()){if(block.exerciseId!=='custom')continue;const card=$('training-blocks').children[i],button=el('button','export','Adapter les groupes et dimensions');button.type='button';button.onclick=()=>trainingReuseExercise(block,currentTraining,'Ma séance · '+block.custom.title);card?.querySelector('.training-block-controls')?.append(button);}};renderTrainingBlocks();
});
