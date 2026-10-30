// Phases successives ou ateliers simultanés : données locales de la séance.
function trainingSessionStages(session){
 const stages=[];let elapsed=0;
 for(const block of session.blocks){let stage=stages.at(-1);if(!block.parallelId||!stage||stage.id!==block.parallelId){stage={id:block.parallelId||block.id,blocks:[]};stages.push(stage);}stage.blocks.push(block);}
 for(const stage of stages){stage.setup=Math.max(...stage.blocks.map(b=>b.setupMinutes||0));stage.work=Math.max(...stage.blocks.map(b=>b.duration));stage.minutes=stage.setup+stage.work;stage.start=elapsed;stage.end=elapsed+=stage.minutes;stage.parallel=stage.blocks.length>1;}
 return stages;
}
function trainingStageBlockData(block,session){
 if(block.exerciseId==='custom'){const count=block.custom.adaptation?.groups.length||1,cols=Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/cols);return {players:block.workshopPlayers??session.players,keepers:block.workshopKeepers??session.keepers,material:{},width:block.custom.width*cols,length:block.custom.length*rows,custom:true};}
 const e=trainingExerciseForBlock(block),v=bibleInitialVariant(e,session,block.bibleVariant,true),contexts=Array.from({length:v.sequences},(_,i)=>bibleSequenceContext(e,session,v,i)),valid=contexts.filter(c=>c.valid),material={};
 for(const c of valid)for(const [k,n]of Object.entries(c.plan.totalMaterial))material[k]=Math.max(material[k]||0,n);
 return {players:Math.max(0,...valid.map(c=>c.activePlayers)),keepers:Math.max(0,...valid.map(c=>c.activeKeepers)),field:Math.max(0,...valid.map(c=>c.activePlayers-c.activeKeepers)),material,width:Math.max(0,...valid.map(c=>c.plan.footprint.width)),length:Math.max(0,...valid.map(c=>c.plan.footprint.length)),valid:valid.length===contexts.length};
}
function trainingSessionForBlock(block,session){
 const stage=trainingSessionStages(session).find(s=>s.blocks.some(b=>b.id===block.id));if(!stage?.parallel)return session;const d=trainingStageBlockData(block,session);return {...session,players:d.players||session.players,keepers:d.keepers};
}
function trainingStageReview(stage,session){
 const data=stage.blocks.map(b=>trainingStageBlockData(b,session)),players=data.reduce((n,d)=>n+d.players,0),keepers=data.reduce((n,d)=>n+d.keepers,0),field=data.reduce((n,d)=>n+(d.field??d.players-d.keepers),0),material={},warnings=[];
 for(const d of data)for(const [k,n]of Object.entries(d.material))material[k]=(material[k]||0)+n;
 if(stage.parallel){
  if(players>session.players||keepers>session.keepers||field>session.players-session.keepers)warnings.push('Les ateliers demandent ensemble '+players+' joueurs dont '+keepers+' G pour '+session.players+' présents dont '+session.keepers+' G. Répartir des groupes distincts.');
  if(players<session.players)warnings.push((session.players-players)+' joueur(s) non affectés à cette phase : prévoir leur rotation ou une activité encadrée.');
  if(new Set(stage.blocks.map(b=>b.duration)).size>1)warnings.push('Durées différentes : prévoir la récupération du groupe qui termine plus tôt, ou aligner les durées avant la rotation.');
  const envelopes=data.filter(d=>d.width&&d.length).map(d=>({desired:{width:d.width,length:d.length},minimum:{width:d.width,length:d.length}}));
  if(envelopes.length===data.length&&!bibleLayout(envelopes,bibleAvailable(session),false).fits)warnings.push('Les emprises des ateliers simultanés dépassent l’espace disponible, dégagements compris. Réduire les dimensions ou les organiser à la suite.');
 }
 return {data,players,keepers,field,material,warnings};
}
function trainingParallelBudget(session=currentTraining){
 const result={setup:0,work:0,rest:0,unallocated:0};
 for(const stage of trainingSessionStages(session)){
  if(stage.parallel){result.setup+=stage.setup*60;result.parallel=(result.parallel||0)+stage.work*60;}
  else{const b=trainingBlockBudget(stage.blocks[0],session);for(const k of ['setup','work','rest','unallocated'])result[k]+=b[k];}
 }
 return result;
}
function trainingNormalizeStages(blocks){
 const counts=new Map();for(const b of blocks)if(b.parallelId)counts.set(b.parallelId,(counts.get(b.parallelId)||0)+1);
 const seen=new Set();let previous=null;
 for(const b of blocks){if(b.parallelId&&counts.get(b.parallelId)<2)delete b.parallelId;if(b.parallelId&&b.parallelId!==previous&&seen.has(b.parallelId))delete b.parallelId;if(b.parallelId)seen.add(b.parallelId);previous=b.parallelId||null;}
 const remaining=new Map();for(const b of blocks)if(b.parallelId)remaining.set(b.parallelId,(remaining.get(b.parallelId)||0)+1);for(const b of blocks)if(b.parallelId&&remaining.get(b.parallelId)<2)delete b.parallelId;
}
function trainingConfigureParallel(blockId){
 if($('training-parallel-dialog')?.open)return;
 const index=currentTraining.blocks.findIndex(b=>b.id===blockId);if(index<1)return;
 const previous=trainingSessionStages(currentTraining).find(s=>s.blocks.some(b=>b.id===currentTraining.blocks[index-1].id)),selected=currentTraining.blocks[index],blocks=[...previous.blocks.filter(b=>b.id!==blockId),selected],signature=JSON.stringify(currentTraining),coachId=activeCoach.id;
 const dialog=el('dialog','completion-dialog');dialog.id='training-parallel-dialog';dialog.setAttribute('aria-label','Organiser les ateliers simultanés');const head=el('div','section-heading'),close=el('button','export','Annuler');close.type='button';close.onclick=()=>dialog.close();head.append(el('h2','','Organiser les ateliers simultanés'),close);dialog.append(head,el('p','hint','Les exercices ci-dessous démarreront ensemble. Répartissez des joueurs distincts. Leurs consignes et dessins personnels restent conservés ; les effectifs de toutes leurs séquences seront mis à jour.'));
 const defaults=previous.parallel&&previous.blocks.some(b=>b.id===blockId)?blocks.map(b=>trainingStageBlockData(b,currentTraining)):bibleDistribute(currentTraining.players,currentTraining.keepers,blocks.length),rows=[];
 blocks.forEach((b,i)=>{const row=el('fieldset','bible-group-row'),players=el('input'),keepers=el('input');row.append(el('legend','',trainingExerciseForBlock(b).title));for(const [input,label,key,min,max]of [[players,'Joueurs de l’atelier '+(i+1),'players',2,80],[keepers,'Gardiens de l’atelier '+(i+1),'keepers',0,12]]){input.type='number';input.min=min;input.max=max;input.required=true;input.step=1;input.value=defaults[i][key];input.setAttribute('aria-label',label);const wrap=el('label','report-field',label);wrap.append(input);row.append(wrap);}rows.push({block:b,players,keepers});dialog.append(row);});
 const status=el('p','hint');status.setAttribute('role','status');const apply=el('button','primary','Appliquer ces ateliers');apply.type='button';dialog.append(status,el('p','hint','La durée de cette phase est celle de l’atelier le plus long, après l’installation commune. Pour changer d’atelier, utiliser un signal commun ; avec des effectifs différents, recomposer les groupes plutôt qu’échanger deux groupes entiers.'),apply);
 function counts(){const p=rows.reduce((n,r)=>n+Number(r.players.value),0),g=rows.reduce((n,r)=>n+Number(r.keepers.value),0);status.textContent=p+' / '+currentTraining.players+' joueurs · '+g+' / '+currentTraining.keepers+' G · '+Math.max(0,currentTraining.players-p)+' non affectés à cette phase.';return {p,g};}
 rows.forEach(r=>{r.players.oninput=r.keepers.oninput=counts;});counts();
 apply.onclick=()=>{
  if(activeCoach.id!==coachId||JSON.stringify(currentTraining)!==signature){status.textContent='La séance a changé. Fermez puis rouvrez cette répartition.';return;}
  if(!rows.every(r=>r.players.reportValidity()&&r.keepers.reportValidity()))return;
  const {p,g}=counts();if(p>currentTraining.players||g>currentTraining.keepers||p-g>currentTraining.players-currentTraining.keepers||rows.some(r=>Number(r.keepers.value)>Number(r.players.value)-2)){status.textContent='Répartition impossible : vérifier les présents, les gardiens et au moins deux joueurs de champ par atelier.';return;}
  const id=previous.parallel?previous.id:crypto.randomUUID();
  if(trainingCommitBlocks(list=>{for(const r of rows){const b=list.find(b=>b.id===r.block.id),players=Number(r.players.value),keepers=Number(r.keepers.value);b.parallelId=id;
   if(b.exerciseId==='custom'){b.workshopPlayers=players;b.workshopKeepers=keepers;continue;}
   const e=trainingExerciseForBlock(b),v=bibleInitialVariant(e,currentTraining,b.bibleVariant,true);v.autoProfile=false;
   v.sequenceSettings=Array.from({length:4},(_,i)=>{const old={...v.sequenceSettings?.[i]},same=old.groupRoster&&old.groupRoster.reduce((n,g)=>n+g.players,0)===players&&old.groupRoster.reduce((n,g)=>n+g.keepers,0)===keepers;if(!same){delete old.groupRoster;old.organisation='single';old.groups=1;}return {...old,players,keepers};});b.bibleVariant=v;
  }trainingNormalizeStages(list);},true)){dialog.close();notify('Ateliers préparés. Vérifiez leur installation et les rotations dans la relecture de séance.');}
 };
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{
 const budgetText=trainingBudgetText;trainingBudgetText=b=>budgetText(b)+(b.parallel?' · '+bibleTime(b.parallel)+' en ateliers simultanés (rythme propre à chaque atelier)':'');
 trainingBudget=trainingParallelBudget;
 const render=renderTrainingBlocks;renderTrainingBlocks=function(){render();for(const [i,card]of [...$('training-blocks').children].entries()){const b=currentTraining.blocks[i];if(!b)continue;const controls=card.querySelector('.training-block-controls'),stage=trainingSessionStages(currentTraining).find(s=>s.blocks.some(x=>x.id===b.id));if(!controls)continue;
  if(stage.parallel){const label=el('p','training-parallel-label','En parallèle · '+stage.start+'′–'+stage.end+'′ · '+stage.blocks.length+' ateliers');card.querySelector('.section-heading').after(label);const solo=el('button','export','Remettre à la suite');solo.type='button';solo.onclick=()=>trainingCommitBlocks(blocks=>{delete blocks.find(x=>x.id===b.id).parallelId;trainingNormalizeStages(blocks);},true);const allocate=el('button','export','Répartir les ateliers');allocate.type='button';allocate.onclick=()=>trainingConfigureParallel(stage.blocks.at(-1).id);controls.append(allocate,solo);}
  else if(i>0){const together=el('button','export','En parallèle avec le précédent');together.type='button';together.onclick=()=>trainingConfigureParallel(b.id);controls.append(together);}
 }};
 const review=trainingReview;trainingReview=function(session){const r=review(session),stages=trainingSessionStages(session);r.total=stages.at(-1)?.end||0;const parallelBlocks=new Set(stages.filter(s=>s.parallel).flatMap(s=>s.blocks.map(b=>b.id)));r.issues=r.issues.filter(i=>i.code!=='off'||!parallelBlocks.has(i.blockId));const material={};for(const stage of stages){const shared=trainingStageReview(stage,session);for(const [k,n]of Object.entries(shared.material))material[k]=Math.max(material[k]||0,n);for(const text of shared.warnings)r.issues.push({code:'parallel',text,blockId:stage.blocks[0].id});}r.material=material;r.ready=r.issues.length===0;return r;};
 const fit=trainingFitDuration;trainingFitDuration=function(){const stages=trainingSessionStages(currentTraining);if(!stages.some(s=>s.parallel))return fit();const target=currentTraining.duration-stages.reduce((n,s)=>n+s.setup,0),minima=stages.map(s=>Math.max(...s.blocks.map(b=>trainingMinimumMinutes(b)))),sum=stages.reduce((n,s)=>n+s.work,0);if(target<minima.reduce((n,m)=>n+m,0)||target>stages.length*120)return notify('Durée insuffisante pour conserver les récupérations des ateliers.');const values=stages.map((s,i)=>Math.max(minima[i],Math.min(120,Math.floor(target*s.work/sum))));let delta=target-values.reduce((n,v)=>n+v,0),turn=0;while(delta&&turn<20000){const i=turn++%values.length;if(delta>0&&values[i]<120){values[i]++;delta--;}else if(delta<0&&values[i]>minima[i]){values[i]--;delta++;}}if(delta)return;trainingCommitBlocks(blocks=>stages.forEach((s,i)=>s.blocks.forEach(b=>{blocks.find(x=>x.id===b.id).duration=values[i];})),true);};
 renderTrainingBlocks();
});
