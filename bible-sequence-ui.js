// Les critères appartiennent à une séquence ; le groupe présent reste celui de la séance.
const biblePreviewDrafts=new Map();
function bibleSequenceSettingValid(setting){
 if(!setting||typeof setting!=='object'||Array.isArray(setting))return false;
 const bounds={players:[2,80],keepers:[0,12],width:[6,105],length:[6,120],groups:[1,40]};
 return Object.entries(setting).every(([key,value])=>key==='organisation'?['single','auto','stations'].includes(value):Object.hasOwn(bounds,key)&&Number.isInteger(value)&&value>=bounds[key][0]&&value<=bounds[key][1]);
}
function bibleInitialVariant(exercise,session,source=null,legacy=false){
 if(source?.version===1)return structuredClone(source);
 const organisation=legacy?'auto':'single',plan=biblePlan(exercise,session,{organisation}),group=plan.groups[0],time=bibleTimeline(exercise,12,session);
 return {version:1,title:exercise.title,width:Math.max(6,Math.min(105,group.width)),length:Math.max(6,Math.min(120,group.length)),groups:plan.groups.length,sequences:time.sequences.length,restSeconds:60,organisation,sequenceRules:['','','','']};
}
function biblePreviewState(exercise,session=currentTraining){
 const key=session.id+'|'+exercise.id,signature=JSON.stringify([session.players,session.keepers,session.space,session.spaceWidth,session.spaceLength,session.age,session.level]);
 if(!biblePreviewDrafts.has(key))biblePreviewDrafts.set(key,{variant:bibleInitialVariant(exercise,session,exercise.bibleVariant),duration:12,signature,customised:!!exercise.bibleVariant});
 const preview=biblePreviewDrafts.get(key);if(preview.signature!==signature){if(!preview.customised)preview.variant=bibleInitialVariant(exercise,session,exercise.bibleVariant);preview.signature=signature;}return preview;
}
function bibleDisposeDiagrams(container){container.querySelectorAll('.bible-detail').forEach(detail=>detail.bibleDispose?.());container.querySelectorAll('.bible-diagram').forEach(figure=>figure.bibleDispose?.());}
function bibleInstallationContents(container,context,session){
 const heading=container.querySelector('summary');container.replaceChildren();if(heading)container.append(heading);
 if(!context.valid){container.append(el('p','training-alert',context.errors.join(' ')));return;}
 const plan=context.plan,available=bibleAvailable(session),f=plan.footprint;
 container.append(el('p','bible-material-total','À prévoir pour cette séquence : '+bibleMaterialText(plan.totalMaterial)),el('p','','Espace disponible : '+available.width+' × '+available.length+' m. Emprise : '+f.width+' × '+f.length+' m, dégagements compris ('+f.margin+' m autour, '+f.gap+' m entre ateliers).'));
 const list=el('ul','training-organisation');for(const g of plan.groups){const item=el('li');item.append(el('strong','',(plan.groups.length===1?'Terrain unique':'Atelier '+g.index)+' · '+g.width+' m de largeur × '+g.length+' m de longueur'),el('p','',g.players+' joueurs dont '+g.keepers+' G · '+g.roles),el('p','',bibleMaterialText(g.material)));if(g.zoneDimensions.length>1)item.append(el('p','',g.zoneDimensions.map(z=>z.name+' : '+z.width+' × '+z.length+' m').join(' · ')));list.append(item);}container.append(list);
 if(context.offPlayers)container.append(el('p','bible-off-players',context.offPlayers+' hors exercice : '+context.offFieldPlayers+' joueurs de champ et '+context.offKeepers+' G. Prévoir leur activité ou leur rotation avec les joueurs en jeu.'));
 for(const note of [...new Set(plan.groups.flatMap(g=>[g.rotation,...g.notes]).filter(Boolean))])container.append(el('p','',note));
 container.append(el('p','hint','Portes : deux plots par porte, déjà comptés. Vérifiez les dégagements et l’ancrage des buts avant de commencer.'));
}
const bibleBaseExerciseDetail=bibleExerciseDetail;
bibleExerciseDetail=function(exercise,session=currentTraining,options={}){
 const preview=!options.blockId&&!options.printing?biblePreviewState(exercise,session):null;
 let variant=bibleInitialVariant(exercise,session,options.variant||exercise.bibleVariant||preview?.variant,!!options.blockId||!!options.printing);
 const duration=options.duration||preview?.duration||12,timeline=bibleEffectiveTimeline(exercise,duration,session,variant);
 const root=bibleBaseExerciseDetail(exercise,session,{...options,variant});
 root.querySelector(':scope > .training-alert')?.remove();
 const facts=root.querySelector('.bible-facts'),oldSelector=root.querySelector('.bible-sequence-tabs'),selector=el('div','bible-sequence-tabs'),stage=el('div','bible-sequence-stage'),oldDiagram=root.querySelector('.bible-diagram'),active=root.querySelector('.bible-active-sequence'),installation=root.querySelector('.bible-installation'),progression=root.querySelector('.bible-progression');
 oldDiagram?.bibleDispose?.();oldDiagram.replaceWith(stage);oldSelector.replaceWith(selector);selector.setAttribute('role','group');selector.setAttribute('aria-label','Séquences de '+exercise.title);selector.append(el('span','','Les séquences'));
 const alert=el('div','bible-sequence-warning');stage.before(alert);
 const guide=el('div','bible-coach-guide-host');stage.before(guide);
 const oldRules=root.querySelector('.bible-essential-rules');if(typeof bibleCoachGuide==='function'&&oldRules){oldRules.previousElementSibling?.remove();oldRules.remove();}
 let index=0,figure=null,timer=0;
 const inputs={},settings=el('details','bible-sequence-settings'),settingsTitle=el('summary','','Mon groupe & mon terrain · séquence 1');settings.append(settingsTitle);
 const grid=el('div','bible-criteria-grid');
 for(const [key,labelText,min,max]of [['players','Joueurs, gardiens inclus',2,session.players],['keepers','Gardiens',0,session.keepers],['width','Largeur de jeu (m)',6,105],['length','Longueur de jeu (m)',6,120]]){const label=el('label','bible-field',labelText),input=el('input');input.type='number';input.min=min;input.max=max;input.step=1;input.required=true;input.setAttribute('aria-label',labelText+' · séquence');input.dataset.criterion=key;inputs[key]=input;label.append(input);grid.append(label);}
 const modeLabel=el('label','bible-field','Organisation'),mode=el('select');mode.setAttribute('aria-label','Organisation de la séquence');mode.dataset.criterion='organisation';for(const [value,label]of [['single','Tous ensemble · 1 terrain'],['stations','Ateliers parallèles'],['auto','Proposition automatique']])mode.append(new Option(label,value));modeLabel.append(mode);grid.append(modeLabel);inputs.organisation=mode;
 const groupsLabel=el('label','bible-field','Nombre d’ateliers'),groups=el('input');groups.type='number';groups.min=1;groups.max=40;groups.step=1;groups.setAttribute('aria-label','Nombre d’ateliers de la séquence');groups.dataset.criterion='groups';groupsLabel.append(groups);grid.append(groupsLabel);inputs.groups=groups;
 const available=bibleAvailable(session);settings.append(grid,el('p','hint','Groupe présent : '+session.players+' joueurs dont '+session.keepers+' G · espace disponible : '+available.width+' × '+available.length+' m. Les réglages sont indépendants pour chaque séquence.'));
 const editGroup=el('button','bible-edit-present','Modifier les présents ou l’espace disponible');editGroup.type='button';editGroup.onclick=()=>{root.closest('dialog')?.close();window.trainingWizard?.go(2);};settings.append(editGroup);
 const actions=el('div','bible-criteria-actions'),autoSize=el('button','export','Proposer les dimensions'),all=el('button','export','Appliquer à toutes les séquences'),saved=el('p','bible-criteria-status');autoSize.type=all.type='button';actions.append(autoSize,all);settings.append(actions,saved);
 if(!options.printing)selector.after(settings);
 const distributions=el('details','bible-distributions'),distributionSummary=el('summary','','Comment répartir ce groupe ?'),distributionChoices=el('div','bible-distribution-choices');
 distributions.append(distributionSummary,el('p','hint','Choisissez un jeu commun ou plusieurs ateliers. Les effectifs sont répartis avec un écart d’un joueur maximum ; équilibrez aussi les niveaux et les postes avec votre connaissance du groupe.'),distributionChoices);
 if(!options.printing)settings.after(distributions);
 const buttons=timeline.sequences.map((s,i)=>{const b=el('button',i===0?'active':'',String(i+1));b.type='button';b.setAttribute('aria-label','Séquence '+(i+1)+' : '+s.title);b.onclick=()=>{if(timer&&applyFields()===false)return;show(i,true);};selector.append(b);return b;});
 function contextAt(i){return bibleSequenceContext(exercise,session,variant,i);}
 function renderDistributions(context){
  distributionChoices.replaceChildren();if(options.printing||!context.valid)return;
  const effective=context.session,automatic=biblePlan(exercise,effective,{organisation:'auto'}),counts=[...new Set([1,2,3,4,automatic.groups.length,context.plan.groups.length])].filter(n=>n<=Math.floor(effective.players/2)).sort((a,b)=>a-b);
  for(const count of counts){
   const organisation=count===1?'single':'stations',basis=biblePlan(exercise,effective,{organisation,groups:count}),proposed=biblePlan(exercise,effective,{organisation,groups:count,width:Math.max(...basis.groups.map(g=>g.width)),length:Math.max(...basis.groups.map(g=>g.length))}),button=el('button','bible-distribution-choice');button.type='button';button.dataset.groups=String(count);button.disabled=!proposed.fits;
   const selected=context.plan.groups.length===count;button.setAttribute('aria-pressed',String(selected));
   button.append(el('strong','',count===1?'Tous ensemble':count+' ateliers équilibrés'),el('span','',proposed.groups.map(g=>g.players).join(' + ')+' joueurs · gardiens inclus'),el('small','',proposed.fits?proposed.groups.map(g=>g.width+' × '+g.length+' m').filter((v,i,a)=>a.indexOf(v)===i).join(' / '):'Effectif ou espace insuffisant'));
   button.onclick=()=>{const g=proposed.groups[0];writeSettings({...variant.sequenceSettings?.[index],players:context.activePlayers,keepers:context.activeKeepers,organisation:count===1?'single':'stations',groups:count,width:g.width,length:g.length});persist();show(index,true);saved.textContent='Répartition appliquée à cette séquence. Les autres séquences restent modifiables.';};
   distributionChoices.append(button);
  }
  const list=el('ul','bible-team-breakdown');for(const g of context.plan.groups)list.append(el('li','',(context.plan.groups.length>1?'Atelier '+g.index+' : ':'')+g.roles));distributionChoices.append(list,el('p','hint',context.plan.groups.map(g=>g.rotation).filter((v,i,a)=>a.indexOf(v)===i).join(' ')));
 }
 function writeSettings(value){variant.sequenceSettings=Array.from({length:4},(_,i)=>({...variant.sequenceSettings?.[i]}));variant.sequenceSettings[index]=value;}
 function persist(){
  if(!bibleVariantValid(variant))return;
  if(options.blockId){const block=currentTraining.blocks.find(b=>b.id===options.blockId);if(block&&block.exerciseId===exercise.id){block.bibleVariant=structuredClone(variant);saveTrainingDraft();saved.textContent='Réglages conservés dans le brouillon. Enregistrez la séance pour les synchroniser.';}}
  else if(preview){preview.variant=structuredClone(variant);preview.customised=true;saved.textContent='Réglages prêts : ajoutez cet exercice à la séance pour les conserver.';}
 }
 function readFields(){return{players:Number(inputs.players.value),keepers:Number(inputs.keepers.value),width:Number(inputs.width.value),length:Number(inputs.length.value),organisation:mode.value,groups:mode.value==='single'?1:Number(groups.value)||1};}
 function applyFields(){
  clearTimeout(timer);timer=0;
  if(![inputs.players,inputs.keepers,inputs.width,inputs.length,...(mode.value==='stations'?[groups]:[])].every(input=>input.checkValidity())){alert.replaceChildren(el('p','training-alert','Complétez les critères avec des nombres valides.'));figure?.bibleDispose?.();figure=null;stage.replaceChildren();return false;}
  writeSettings(readFields());persist();show(index,false);return true;
 }
 for(const [key,input]of Object.entries(inputs))input.addEventListener(key==='organisation'?'change':'input',()=>{if(key==='organisation'){groupsLabel.hidden=mode.value!=='stations';if(mode.value==='stations'&&Number(groups.value)<2)groups.value=2;}clearTimeout(timer);timer=setTimeout(applyFields,140);});
 function fillFields(context){const s=variant.sequenceSettings?.[index]||{},g=context.plan?.groups[0];inputs.players.value=s.players??session.players;inputs.keepers.value=s.keepers??session.keepers;inputs.width.value=s.width??variant.width??g?.width;inputs.length.value=s.length??variant.length??g?.length;mode.value=s.organisation||variant.organisation||(variant.groups>1?'stations':'single');groups.value=s.groups??variant.groups??context.plan?.groups.length??1;groupsLabel.hidden=mode.value!=='stations';}
 function renderProgression(){
  const summary=progression.querySelector('summary');progression.replaceChildren(summary);const table=el('table','bible-timeline'),head=el('tr');for(const text of ['Séquence','Jeu / pause','Groupe & espace','Consigne'])head.append(el('th','',text));const thead=el('thead');thead.append(head);const tbody=el('tbody');
  timeline.sequences.forEach((s,i)=>{const c=contextAt(i),g=c.plan?.groups[0],row=el('tr');row.append(el('td','',(i+1)+'. '+s.title),el('td','',bibleTime(s.workSeconds)+' / '+bibleTime(s.restSeconds)),el('td','',c.activePlayers+' joueurs · '+c.activeKeepers+' G'+(g?' · '+g.width+' × '+g.length+' m · '+c.plan.groups.length+' terrain(s)':' · critères à revoir')+(c.offPlayers?' · '+c.offPlayers+' hors exercice':'')),el('td','',s.rule+(s.observe?' À observer : '+s.observe:'')));tbody.append(row);});table.append(thead,tbody);progression.append(table,el('p','',duration+' min, récupérations comprises. Les joueurs hors exercice restent dans l’effectif présent : prévoir leur rotation ou une activité complémentaire.'));
 }
 function show(next,fill){
  clearTimeout(timer);timer=0;index=next;root.dataset.sequenceIndex=String(index);settingsTitle.textContent='Mon groupe & mon terrain · séquence '+(index+1);buttons.forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
  const c=contextAt(index),s=timeline.sequences[index];if(fill)fillFields(c);
  const cardFormat=root.closest('.training-catalogue-card')?.querySelector('.bible-card-format'),g=c.plan?.groups[0];if(cardFormat)cardFormat.textContent='Séquence '+(index+1)+' · '+(g?(c.plan.groups.length===1?'terrain unique':c.plan.groups.length+' ateliers')+' · '+g.width+' × '+g.length+' m':'critères à revoir');
  figure?.bibleDispose?.();stage.replaceChildren();alert.replaceChildren();
  facts.replaceChildren(el('span','',c.activePlayers+' joueurs · '+c.activeKeepers+' G'),el('span','',c.plan?(c.plan.groups.length===1?'Tous ensemble · 1 terrain':c.plan.groups.length+' ateliers'):'Critères à revoir'),el('span','',duration+' min · '+timeline.sequences.length+' séquences'));
  if(c.offPlayers>0)facts.append(el('span','bible-off-players',c.offPlayers+' hors exercice'));
  if(!c.valid){alert.append(el('p','training-alert',c.errors.join(' ')));figure=null;}
  else{figure=bibleDiagram(exercise,c.session,{plan:c.plan,sequenceControls:false,showSequenceRule:false,sequenceIndex:index,animation:!options.printing,onGroupChange:groupIndex=>renderGuide(c,groupIndex)});stage.append(figure);if(!c.fits)alert.append(el('p','training-alert',c.plan.warnings.join(' ')));else if(c.plan.warnings.some(w=>w.includes('format conseillé')))alert.append(el('p','hint',c.plan.warnings.filter(w=>w.includes('format conseillé')).join(' ')));}
  active.replaceChildren(el('h4','','Séquence '+(index+1)+' · '+s.title),el('p','bible-sequence-time',bibleTime(s.workSeconds)+' de jeu'+(s.restSeconds?' puis '+bibleTime(s.restSeconds)+' de récupération / retour coach':'')),el('p','bible-sequence-rule',s.rule));if(s.observe)active.append(el('p','bible-observe','À observer : '+s.observe));
  if(c.offPlayers>0)active.append(el('p','bible-off-players',c.offPlayers+' hors exercice, dont '+c.offKeepers+' G : organiser leur rotation.'));
  bibleInstallationContents(installation,c,session);renderProgression();renderDistributions(c);renderGuide(c,0);root.bibleContext=c;
 }
 function renderGuide(context,groupIndex){if(typeof bibleCoachGuide!=='function')return;guide.replaceChildren(bibleCoachGuide(exercise,context,index,groupIndex,timeline.sequences[index]?.rule));if(options.printing)guide.querySelectorAll('details').forEach(d=>d.open=true);}
 autoSize.onclick=()=>{const values=readFields(),effective={...session,players:values.players,keepers:values.keepers};const check=bibleSequenceContext(exercise,session,{sequenceSettings:[{players:values.players,keepers:values.keepers}]},0);if(!check.valid){alert.replaceChildren(el('p','training-alert',check.errors.join(' ')));return;}const p=biblePlan(exercise,effective,{organisation:mode.value,groups:values.groups}),g=p.groups[0];inputs.width.value=Math.min(105,g.width);inputs.length.value=Math.min(120,g.length);applyFields();};
 settings.addEventListener('focusout',()=>{if(timer)applyFields();});
 all.onclick=()=>{if(applyFields()===false)return;const c=contextAt(index);if(!c.valid)return;const value={...variant.sequenceSettings[index]};variant.sequenceSettings=Array.from({length:4},()=>({...value}));persist();show(index,false);saved.textContent='Les mêmes critères sont appliqués à toutes les séquences.';};
 root.bibleVariant=()=>structuredClone(variant);root.bibleSelectedSequence=()=>index;root.bibleDispose=()=>{clearTimeout(timer);figure?.bibleDispose?.();};show(0,true);
 if(options.printing){
  const layouts=el('div','bible-sequence-print');const seen=new Set();timeline.sequences.forEach((s,i)=>{const c=contextAt(i),key=JSON.stringify([c.activePlayers,c.activeKeepers,c.options.width,c.options.length,c.options.organisation,c.options.groups]);if(seen.has(key))return;seen.add(key);const section=el('section');section.append(el('h4','','Installation · séquence '+(i+1)+' · '+c.activePlayers+' joueurs dont '+c.activeKeepers+' G'));if(i===0&&c.valid)return;if(!c.valid)section.append(el('p','training-alert',c.errors.join(' ')));else{section.append(bibleDiagram(exercise,c.session,{plan:c.plan,sequenceIndex:i,sequenceControls:false,animation:false}));if(c.offPlayers)section.append(el('p','',c.offPlayers+' hors exercice, dont '+c.offKeepers+' G.'));section.append(el('p','',bibleMaterialText(c.plan.totalMaterial)));}layouts.append(section);});progression.after(layouts);
 }
 return root;
};
