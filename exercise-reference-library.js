document.addEventListener('DOMContentLoaded',()=>{
 const intentions={conservation:'Conservation & Progression',finition:'Déséquilibre & Finition',transition:'Transitions OFF/DEF · DEF/OFF',defense:'Bloc & Organisation défensive'};
 const phases={activation:'Échauffement / Activation',situation:'Situations réduites',jeu:'Jeux thématiques',opposition:'Oppositions grand terrain'};
 let intention='',phase='';
 const panel=el('section','exercise-reference-navigation');panel.setAttribute('aria-label','Classement des exercices');
 const intentNav=el('div','exercise-reference-intentions'),phaseNav=el('div','exercise-reference-phases');intentNav.setAttribute('role','group');intentNav.setAttribute('aria-label','Intentions de jeu');phaseNav.setAttribute('role','group');phaseNav.setAttribute('aria-label','Formats d’exercice');panel.append(intentNav,phaseNav);
 function paint(){for(const b of intentNav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.intention===intention));for(const b of phaseNav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.phase===phase));}
 function clearOld(){for(const id of ['supplied-section','bible-bmf-category','training-filter'])if($(id))$(id).value='';}
 for(const [key,label]of [['','Toutes les intentions'],...Object.entries(intentions)]){const b=el('button','export',label);b.type='button';b.dataset.intention=key;b.onclick=()=>{intention=key;clearOld();bibleCataloguePage=0;renderBibleCatalogue();};intentNav.append(b);}
 for(const [key,label]of [['','Tous les formats'],...Object.entries(phases)]){const b=el('button','export',label);b.type='button';b.dataset.phase=key;b.onclick=()=>{phase=key;clearOld();bibleCataloguePage=0;renderBibleCatalogue();};phaseNav.append(b);}
 const original=suppliedCatalogueExercises;
 suppliedCatalogueExercises=function(filters={}){
  if(!intention&&!phase)return original(filters);
  const unique=new Map();
  for(const meta of exerciseReferenceIndex.find({intention,phase})){
   const e=exerciseReferenceIndex.resolve(meta.id);if(!e||unique.has(e.id))continue;
   if(filters.source&&meta.source!==filters.source||filters.section&&!suppliedExerciseEngine.sectionsFor(e).includes(filters.section)||filters.axis&&suppliedMomentAxes[e.moment]!==filters.axis||filters.objective&&suppliedObjective(e)!==filters.objective)continue;
   const text=[e.title,e.game,e.name,e.obj,e.goal,e.sub,...e.rules,...e.coach].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(filters.query&&!text.includes(String(filters.query).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()))continue;unique.set(e.id,e);
  }return [...unique.values()];
 };
 const render=renderBibleCatalogue;
 renderBibleCatalogue=function(...args){
  const result=render.apply(this,args),root=$('training-catalogue');root.before(panel);paint();if(intention||phase||$('supplied-source')?.value)$('bible-reset').hidden=false;
  const advanced=document.querySelector('.bible-search-options');if(advanced)for(const id of ['bible-bmf-category','training-filter']){const label=$(id)?.closest('label');if(label&&!advanced.contains(label))advanced.append(label);}
  for(const card of root.querySelectorAll('[data-exercise]')){
   const e=suppliedExerciseEngine.getExercise(card.dataset.exercise,Number(card.dataset.view)),meta=exerciseReferenceIndex.forExercise(e);if(!meta)continue;
   const classification=card.querySelector('.exercise-classification');classification.textContent=(meta.classification_a_verifier?'Activation / travail transversal':intentions[meta.intention])+' · '+phases[meta.phase];
   const format=card.querySelector('.bible-card-format');format.replaceChildren();for(const label of [meta.effectif_min+'–'+meta.effectif_max+' joueurs',meta.duree+' min',meta.surface])format.append(el('span','exercise-reference-badge',label));
   if(meta.effectif_a_verifier)format.append(el('span','exercise-reference-badge','Effectif à vérifier dans la source'));
   const [add,view]=card.querySelectorAll('.bible-card-actions button');add.textContent='+ Ajouter à ma séance';view.textContent='Voir l’exercice';
  }return result;
 };
 $('bible-reset')?.addEventListener('click',()=>{intention='';phase='';},true);
 window.exerciseReferenceLibrary={select(nextIntention='',nextPhase=''){intention=nextIntention;phase=nextPhase;clearOld();renderBibleCatalogue();}};
 renderBibleCatalogue();
});
