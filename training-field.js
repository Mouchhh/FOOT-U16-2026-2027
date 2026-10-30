// Lecture au bord du terrain, à partir d'une copie de la séance ouverte.
function openTrainingField(){
 if($('training-field-dialog')?.open||!applyTrainingForm())return;
 if(!currentTraining.blocks.length)return notify('Ajoutez un exercice pour ouvrir la fiche terrain.');
 const session=structuredClone(currentTraining),stages=trainingSessionStages(session),dialog=el('dialog','training-field-dialog');dialog.id='training-field-dialog';dialog.setAttribute('aria-labelledby','training-field-title');
 const header=el('header','training-field-header'),title=el('h2','',session.title||'Ma fiche terrain');title.id='training-field-title';const close=el('button','export','Fermer');close.type='button';close.onclick=()=>dialog.close();header.append(title,close);
 const tools=el('div','training-field-tools'),phase=el('select'),workshop=el('select'),sequence=el('select');for(const [input,label]of [[phase,'Phase de la séance'],[workshop,'Exercice à consulter'],[sequence,'Séquence de l’exercice']]){input.setAttribute('aria-label',label);const wrap=el('label','',label);wrap.append(input);tools.append(wrap);}stages.forEach((s,i)=>phase.append(new Option((i+1)+'. '+s.start+'′–'+s.end+'′ · '+(s.parallel?s.blocks.length+' ateliers simultanés':trainingExerciseForBlock(s.blocks[0]).title),String(i))));
 const body=el('div','training-field-body'),footer=el('footer','training-field-footer'),previous=el('button','export','← Phase précédente'),next=el('button','primary','Phase suivante →');previous.type=next.type='button';footer.append(previous,next);dialog.append(header,tools,body,footer);let figure=null;
 function render(resetWorkshop=false,resetSequence=false){
  figure?.bibleDispose?.();figure=null;body.replaceChildren();const stage=stages[Number(phase.value)],shared=trainingStageReview(stage,session);
  if(resetWorkshop){workshop.replaceChildren();stage.blocks.forEach((b,i)=>workshop.append(new Option(trainingExerciseForBlock(b).title,String(i))));}
  const block=stage.blocks[Number(workshop.value)||0],e=trainingExerciseForBlock(block),effective=trainingSessionForBlock(block,session);const variant=block.exerciseId==='custom'?null:bibleInitialVariant(e,effective,block.bibleVariant,true),timeline=variant?bibleEffectiveTimeline(e,block.duration,effective,variant):null;
  if(resetSequence||resetWorkshop){sequence.replaceChildren();if(timeline)timeline.sequences.forEach((s,i)=>sequence.append(new Option((i+1)+'. '+s.title,String(i))));}sequence.disabled=!timeline;
  body.append(el('p','training-field-phase',stage.start+'′–'+stage.end+'′ · installation '+stage.setup+' min · '+(stage.parallel?'Ateliers simultanés':'Exercice commun')),el('h3','',e.title));
  const organisation=el('details','training-field-organisation');organisation.append(el('summary','',stage.parallel?'Organisation et matériel · '+stage.blocks.length+' ateliers':'Organisation et matériel'));
  if(session.notes.trim())organisation.append(el('h4','','Objectif de séance'),el('p','',session.notes));
  if(stage.parallel){organisation.append(el('p','',stage.blocks.map((b,i)=>{const d=shared.data[i];return trainingExerciseForBlock(b).title+' : '+d.players+' joueurs dont '+d.keepers+' G';}).join(' · ')),el('p','hint','Signal commun pour terminer ou changer d’atelier. Si les effectifs diffèrent, recomposer les groupes avant de tourner.'));for(const warning of shared.warnings)body.append(el('p','training-alert',warning));}
  organisation.append(el('h4','','Matériel de cette phase'),el('p','training-field-material',bibleMaterialText(shared.material)||'Voir le matériel des exercices personnels.'));body.append(organisation);
  if(block.exerciseId==='custom'){body.append(trainingCustomDetail(block.custom,effective));if(stage.parallel)body.append(el('p','hint','Dessin personnel conservé : vérifier que ses rôles correspondent au groupe affecté à cet atelier.'));}
  else{
   const i=Number(sequence.value)||0,context=bibleSequenceContext(e,effective,variant,i),s=timeline.sequences[i];
   body.append(el('h4','','Ce que les joueurs doivent réussir'),el('p','',exercisePedagogy[e.id]?.task||e.goal));
   if(!context.valid)body.append(el('p','training-alert',context.errors.join(' ')));
   else{const brief=el('section','training-field-brief');const paintBrief=gindex=>{const g=context.plan.groups[gindex]||context.plan.groups[0],scenario=bibleCoachScenario(e,g,i);brief.replaceChildren(el('p','',g.players+' joueurs dont '+g.keepers+' G · '+g.width+' × '+g.length+' m'),el('h4','','Départ'),el('p','',scenario.start),el('h4','','Déclencheur'),el('p','',bibleDecisionGuide(e,g,{sequenceIndex:i,designIndex:variant.designChoices?.[i]||0}).trigger),el('p','',scenario.score),el('p','training-field-rhythm',bibleTime(s.workSeconds)+' · '+bibleIntervalText(s)+(s.restSeconds?' Puis '+bibleTime(s.restSeconds)+' de pause.':'')),el('h4','','Consigne'),el('p','',s.rule),el('h4','','Rotations'),el('p','',g.rotation),el('h4','','Le coach observe'),el('p','',exercisePedagogy[e.id]?.observe||scenario.look));if(context.offPlayers)brief.append(el('p','training-alert',bibleExerciseOutsideRotation(context)));};paintBrief(0);const layout=el('div','training-field-layout');layout.append(brief);body.append(layout);
    figure=bibleDiagram(e,context.session,{plan:context.plan,animation:false,sequenceControls:false,designIndex:variant.designChoices?.[i]||0,sequenceIndex:i,diagramEdits:variant.diagramEdits||[],onGroupChange:paintBrief});layout.append(figure);if(!context.fits)body.append(el('p','training-alert',context.plan.warnings.join(' ')));
   }
  }
  if(block.notes.trim())body.append(el('h4','','Mes consignes'),el('p','training-field-notes',block.notes));
  if(block.exerciseId==='custom'&&block.custom.material)body.append(el('p','',block.custom.material));
  previous.disabled=Number(phase.value)===0;next.disabled=Number(phase.value)===stages.length-1;
 }
 phase.onchange=()=>{render(true,true);body.scrollTop=0;};workshop.onchange=()=>{render(false,true);body.scrollTop=0;};sequence.onchange=()=>{render();body.scrollTop=0;};previous.onclick=()=>{phase.value=String(Number(phase.value)-1);phase.onchange();};next.onclick=()=>{phase.value=String(Number(phase.value)+1);phase.onchange();};
 dialog.addEventListener('close',()=>{figure?.bibleDispose?.();dialog.remove();},{once:true});document.body.append(dialog);render(true,true);dialog.showModal();
}
document.addEventListener('DOMContentLoaded',()=>{const button=el('button','export','Fiche terrain');button.id='training-field-open';button.type='button';button.onclick=openTrainingField;$('training-pdf').after(button);});
