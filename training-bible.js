// Bibliothèque éditoriale : recherche locale, fiches progressives et variantes du coach.
// Aucun compte, document privé ou message n'est envoyé à un service d'IA.
function bibleVariantValid(v){
 return !!v&&v.version===1&&typeof v.title==='string'&&v.title.length<=100&&
 ['width','length','groups','sequences','restSeconds'].every(k=>Number.isInteger(v[k]))&&
 v.width>=6&&v.width<=105&&v.length>=6&&v.length<=120&&v.groups>=1&&v.groups<=40&&
 v.sequences>=1&&v.sequences<=4&&v.restSeconds>=0&&v.restSeconds<=300&&
 (v.organisation===undefined||['single','auto','stations'].includes(v.organisation))&&
 (v.autoProfile===undefined||typeof v.autoProfile==='boolean')&&(v.profileKey===undefined||typeof v.profileKey==='string'&&v.profileKey.length<=1000)&&
 (v.sequenceSettings===undefined||Array.isArray(v.sequenceSettings)&&v.sequenceSettings.length<=4&&Array.from(v.sequenceSettings).every(bibleSequenceSettingValid))&&
 (v.diagramEdits===undefined||Array.isArray(v.diagramEdits)&&v.diagramEdits.length<=16&&typeof bibleDiagramEditValid==='function'&&v.diagramEdits.every(bibleDiagramEditValid)&&new Set(v.diagramEdits.map(e=>e.sequence+'|'+e.signature)).size===v.diagramEdits.length)&&
 (v.sequenceRules===undefined||Array.isArray(v.sequenceRules)&&v.sequenceRules.length===4&&v.sequenceRules.every(s=>typeof s==='string'&&s.length<=1500));
}
const bibleNormalise=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ');
const bibleTime=seconds=>{const s=Math.round(seconds);return Math.floor(s/60)+'′'+(s%60?String(s%60).padStart(2,'0')+'″':'');};
const bibleIntervalText=sequence=>sequence.intervals?.length>1?sequence.intervals.length+' répétitions de '+[...new Set(sequence.intervals.map(i=>bibleTime(i.workSeconds)))].join(' à ')+' de jeu · '+bibleTime(sequence.intervals[0].restSeconds)+' de récupération entre répétitions, comprise dans la séquence.':'';
let bibleCataloguePage=0,bibleCatalogueSignature='',bibleVariantEditing=null;

function bibleMaterialText(material){
 const labels={hurdles:'haie(s)',poles:'piquet(s)',ladders:'échelle(s)',hoops:'cerceau(x)',dummies:'mannequin(s)',goals:'but(s)',miniGoals:'mini-but(s)',gates:'porte(s)',discs:'coupelle(s)',cones:'plot(s)',balls:'ballon(s), réserve comprise',bibsBlue:'chasuble(s) bleue(s)',bibsRed:'chasuble(s) rouge(s)',bibsNeutral:'chasuble(s) blanche(s) · appuis',bibsKeeper:'chasuble(s) jaune(s) · gardiens'};
 return Object.entries(labels).filter(([key])=>material[key]>0).map(([key,label])=>material[key]+' '+label).join(' · ');
}
function bibleEffectiveTimeline(exercise,duration,session,variant={}){
 const timeline=bibleTimeline(exercise,duration,session,variant);
 timeline.sequences.forEach((s,i)=>{if(variant.sequenceRules?.[i]?.trim())s.rule=variant.sequenceRules[i].trim();});
 return timeline;
}
function bibleSourceDetails(exercise){
 const knowledge=bibleKnowledge[exercise.id],details=el('details','bible-extra bible-sources');
 details.append(el('summary','','Sources & origine de la fiche'));
 details.append(el('p','',knowledge.sourceNote||'Proposition éditoriale du club, éclairée par les principes des ressources ci-dessous. Les dimensions et variantes sont proposées par l’outil.'));
 const list=el('ul');
 for(const id of knowledge.sourceIds||[]){const source=bibleSources[id];if(!source)continue;const li=el('li'),link=el('a','',source.organisation+' · '+source.title);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';li.append(link);if(source.scope)li.append(el('p','',source.scope));list.append(li);}
 details.append(list);return details;
}

function bibleExerciseDetail(exercise,session=currentTraining,options={}){
 const knowledge=bibleKnowledge[exercise.id],variant=options.variant||exercise.bibleVariant||{},duration=options.duration||12;
 const plan=biblePlan(exercise,session,variant),timeline=bibleEffectiveTimeline(exercise,duration,session,variant);
 const root=el('div','training-detail bible-detail');root.dataset.exercise=exercise.id;
 root.append(el('p','training-goal',exercise.goal));
 const summary=el('div','bible-facts');
 summary.append(el('span','',session.players+' joueurs · '+session.keepers+' G'),el('span','',plan.groups.length+' atelier'+(plan.groups.length>1?'s':'')),el('span','',duration+' min · '+timeline.sequences.length+' séquence'+(timeline.sequences.length>1?'s':'')));
 root.append(summary);
 if(!plan.fits)root.append(el('p','training-alert','Installation à revoir : '+plan.warnings.join(' ')));
 const selector=el('div','bible-sequence-tabs');selector.setAttribute('role','group');selector.setAttribute('aria-label','Séquences de '+exercise.title);
 const diagram=bibleDiagram(exercise,session,{plan,sequenceControls:false,showSequenceRule:false,sequenceIndex:0,animation:false});
 const active=el('section','bible-active-sequence');active.setAttribute('aria-live','polite');
 const buttons=timeline.sequences.map((sequence,index)=>{
  const button=el('button',index===0?'active':'',''+(index+1));button.type='button';button.setAttribute('aria-label','Séquence '+(index+1)+' : '+sequence.title);button.setAttribute('aria-pressed',String(index===0));
  button.onclick=()=>showSequence(index);selector.append(button);return button;
 });
 const sequenceLabel=el('span','','Les séquences');selector.prepend(sequenceLabel);
 function showSequence(index){const sequence=timeline.sequences[index];buttons.forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
  active.replaceChildren(el('h4','','Séquence '+(index+1)+' · '+sequence.title),el('p','bible-sequence-time',bibleTime(sequence.workSeconds)+' de jeu'+(sequence.restSeconds?' puis '+bibleTime(sequence.restSeconds)+' de récupération / retour coach':'')),el('p','bible-sequence-rule',sequence.rule));
  if(sequence.observe)active.append(el('p','bible-observe','À observer : '+sequence.observe));
  if(typeof diagram.bibleSetSequence==='function')diagram.bibleSetSequence(index);
 }
 root.append(selector,diagram,active);showSequence(0);
 const instructions=el('ol','bible-essential-rules');exercise.rules.forEach(rule=>instructions.append(el('li','',rule)));root.append(el('h4','','Pour jouer'),instructions);
 root.append(el('p','training-success','Réussite : '+exercise.success));

 const installation=el('details','bible-extra bible-installation');installation.append(el('summary','','Installer · dimensions, groupes & matériel'));
 installation.append(el('p','bible-material-total','À prévoir au total : '+bibleMaterialText(plan.totalMaterial)));
 const available=bibleAvailable(session),footprint=plan.footprint;
 installation.append(el('p','',"Espace disponible : "+available.width+' × '+available.length+' m. Emprise totale : '+footprint.width+' × '+footprint.length+' m, dégagements compris. '+footprint.cols+' colonne(s) × '+footprint.rows+' ligne(s) ; '+footprint.gap+' m entre ateliers et '+footprint.margin+' m de dégagement extérieur.'));
 const groups=el('ul','training-organisation');
 for(const group of plan.groups){const item=el('li');item.append(el('strong','','Atelier '+group.index+' · '+group.width+' m de largeur × '+group.length+' m de longueur'),el('p','',group.players+' joueurs dont '+group.keepers+' gardien(s) · '+group.roles),el('p','',bibleMaterialText(group.material)));if(group.zoneDimensions?.length)item.append(el('p','',group.zoneDimensions.map(z=>typeof z==='string'?z:z.name+' : '+z.width+' × '+z.length+' m').join(' · ')));groups.append(item);}
 installation.append(groups);
 if(plan.fits&&plan.warnings.length)installation.append(el('p','training-alert',plan.warnings.join(' ')));
 installation.append(el('p','hint','Les portes sont matérialisées par deux plots chacune, déjà comptés dans le matériel. Sans mini-buts, remplacez chaque mini-but par une porte de deux plots et adaptez le score. Vérifiez les dégagements et l’ancrage des buts sur place.'));
 root.append(installation);

 const progression=el('details','bible-extra bible-progression');progression.append(el('summary','','Tout le déroulé · temps, rotations & variantes'));
 const table=el('table','bible-timeline'),thead=el('thead'),hr=el('tr');['Séquence','Jeu / pause','Évolution & observation'].forEach(s=>hr.append(el('th','',s)));thead.append(hr);const tbody=el('tbody');
 for(const sequence of timeline.sequences){const row=el('tr');row.append(el('td','',sequence.index+'. '+sequence.title),el('td','',bibleTime(sequence.workSeconds)+' / '+bibleTime(sequence.restSeconds)),el('td','',sequence.rule+(sequence.observe?' À observer : '+sequence.observe:'')));tbody.append(row);}table.append(thead,tbody);progression.append(table);
 progression.append(el('p','',duration+' min au total, retours du coach et récupérations inclus. Les pauses sont placées entre les séquences.'));
 const rotations=[...new Set(plan.groups.map(g=>g.rotation).filter(Boolean))];
 const notes=[...new Set(plan.groups.flatMap(g=>g.notes||[]))];
 for(const text of [...rotations,...notes])progression.append(el('p','',text));
 progression.append(el('p','hint',session.coachingLoad==='light'?'Match proche : privilégier la qualité des décisions et conserver les pauses. Ajuster ou arrêter une séquence si la qualité ou la récupération se dégrade.':'Les temps ci-dessus sont une proposition. Ajustez la récupération et la difficulté à la qualité des actions observées et au niveau réel du groupe.'));
 for(const warning of timeline.warnings||[])progression.append(el('p','hint',warning));
 root.append(progression);

 const advanced=el('details','bible-extra bible-advanced');advanced.append(el('summary','','Comprendre · lien avec le match & coaching'));
 for(const [label,text]of [['Ce que l’exercice développe',knowledge.objective],['Quand cela sert en match',knowledge.context],['Systèmes & animation',knowledge.systems]])if(text){const p=el('p');p.append(el('strong','',label+' : '),document.createTextNode(text));advanced.append(p);}
 const principles=el('ul');for(const text of knowledge.principles||[])principles.append(el('li','',text));advanced.append(principles,el('h4','','Interventions du coach'));for(const text of exercise.cues)advanced.append(el('p','',text));
 advanced.append(el('p','','Pour faciliter : '+exercise.easier),el('p','','Pour aller plus loin : '+exercise.harder));
 advanced.append(el('p','hint','Le niveau de lecture tactique peut être approfondi sans augmenter les contraintes imposées aux joueurs. Conservez une seule priorité observable à la fois.'));
 root.append(advanced,bibleSourceDetails(exercise));
 if(variant.sequenceRules?.some(s=>s.trim()))root.append(el('p','hint','Variante du coach : vos consignes personnalisées sont conservées. Le schéma reste un repère d’installation ; ajustez-le dans la création libre si vos règles changent les déplacements ou les rôles.'));
 if(options.printing){root.classList.add('bible-print-detail');for(const details of root.querySelectorAll('details'))details.open=true;}
 return root;
}

function bibleSearchMatches(exercise,query){
 const k=bibleKnowledge[exercise.id],normal=bibleNormalise;
 let text=normal([exercise.title,exercise.goal,exercise.theme,exercise.method,biblePhases[k.phase],k.objective,k.context,k.systems,...(k.tags||[]),...(k.principles||[])].join(' '));
 if(exercise.theme==='Conservation')text+=' possession rondo conserver';
 if(exercise.theme==='Relance')text+=' ressortir sortie construction relancer';
 if(exercise.theme==='Pressing')text+=' presser pression pressing';
 if(exercise.theme==='Finition')text+=' finir marquer tirer frappe tir';
 if(exercise.theme==='Technique')text+=' passer passe controle technique';
 if(k.phase==='win')text+=' transition offensive recuperation contre attaque';
 if(k.phase==='loss')text+=' transition defensive perte contre pressing';
 if(k.phase==='off')text+=' sans ballon defendre defensif defense';
 const terms=normal(query).split(/\s+/).filter(t=>t&&!['de','du','la','le','les','des','un','une','en','au','aux','et','pour','mon','ma','mes','je','a'].includes(t));
 return terms.every(term=>text.includes(term)||text.replace(/-/g,'').includes(term.replace(/-/g,'')));
}
function ensureBibleCatalogue(){
 if($('bible-phase'))return;
 const aside=$('training-catalogue').parentElement,search=$('training-search'),theme=$('training-filter');
 aside.classList.add('bible-catalogue');
 const phase=el('select');phase.id='bible-phase';phase.setAttribute('aria-label','Moment du jeu');phase.append(new Option('Tous les moments du jeu',''));
 for(const [value,label]of Object.entries(biblePhases))phase.append(new Option(label,value));
 const filters=el('div','bible-main-filters');filters.append(phase,theme);search.after(filters);
 search.placeholder='Ex. possession, relance, troisième homme…';
 const extras=el('details','bible-search-options');extras.append(el('summary','','Affiner la recherche'));
 const method=el('select');method.id='bible-method';method.setAttribute('aria-label','Forme de travail');method.append(new Option('Toutes les formes de travail',''));for(const name of ['Jeu','Situation','Exercice'])method.append(new Option(name,name));
 const label=el('label'),fit=el('input');fit.id='bible-fit-only';fit.type='checkbox';label.append(fit,document.createTextNode('Installation compatible avec mon espace'));extras.append(method,label);filters.after(extras);
 const status=el('p','bible-results');status.id='bible-results';status.setAttribute('role','status');extras.after(status);
 const context=el('p','bible-group-context');context.id='bible-group-context';aside.querySelector('h2').after(context);
 const reset=el('button','bible-reset','Effacer les filtres');reset.id='bible-reset';reset.type='button';reset.onclick=()=>{search.value='';theme.value='';phase.value='';method.value='';fit.checked=false;bibleCataloguePage=0;renderBibleCatalogue();};status.after(reset);
 for(const input of [phase,method,fit])input.addEventListener('change',()=>{bibleCataloguePage=0;renderTrainingCatalogue();});
}
function renderBibleCatalogue(){
 ensureBibleCatalogue();
 const query=$('training-search').value.trim(),theme=$('training-filter').value,phase=$('bible-phase').value,method=$('bible-method').value,fit=$('bible-fit-only').checked;
 const signature=JSON.stringify([query,theme,phase,method,fit,currentTraining.players,currentTraining.keepers,currentTraining.space,currentTraining.spaceWidth,currentTraining.spaceLength,currentTraining.level,currentTraining.age]);if(signature!==bibleCatalogueSignature){bibleCataloguePage=0;bibleCatalogueSignature=signature;}
 const all=trainingExercises.filter(e=>bibleKnowledge[e.id]&&(!theme||e.theme===theme)&&(!phase||bibleKnowledge[e.id].phase===phase)&&(!method||e.method===method)&&bibleSearchMatches(e,query));
 const plans=new Map(),getPlan=e=>{if(!plans.has(e.id)){const v=biblePreviewState(e).variant,contexts=Array.from({length:v.sequences},(_,i)=>bibleSequenceContext(e,currentTraining,v,i)),first=contexts[0].plan||biblePlan(e,currentTraining,{organisation:'single'});plans.set(e.id,{...first,fits:contexts.every(c=>c.valid&&c.fits)});}return plans.get(e.id);};
 const matches=fit?all.filter(e=>getPlan(e).fits):all,pageSize=8,visible=matches.slice(0,(bibleCataloguePage+1)*pageSize),root=$('training-catalogue');bibleDisposeDiagrams(root);root.replaceChildren();
 const available=bibleAvailable(currentTraining);$('bible-group-context').textContent=currentTraining.players+' joueurs · '+currentTraining.keepers+' G · '+available.width+' × '+available.length+' m';
 if($('bible-intro'))$('bible-intro').textContent=trainingExercises.length+' fiches · schémas, séquences & variantes';
 $('bible-results').textContent=matches.length+' exercice'+(matches.length>1?'s':'')+' trouvé'+(matches.length>1?'s':'');
 $('bible-reset').hidden=!query&&!theme&&!phase&&!method&&!fit;
 for(const exercise of visible){
  const k=bibleKnowledge[exercise.id],plan=getPlan(exercise),card=el('article','training-catalogue-card bible-card');card.dataset.exercise=exercise.id;
  card.append(el('span','eyebrow',biblePhases[k.phase]+' · '+exercise.theme),el('h3','',exercise.title),el('p','',exercise.goal));
  const first=plan.groups[0];card.append(el('p','bible-card-format',(plan.groups.length===1?'Terrain unique':plan.groups.length+' ateliers')+' · '+first.width+' × '+first.length+' m'+(plan.groups.length>1?' par atelier':'')));
  if(!plan.fits)card.append(el('span','bible-fit-warning','Espace ou organisation à revoir'));
  const details=el('details','bible-card-preview');details.append(el('summary','','Voir la fiche adaptée'));
  let rendered=false;details.addEventListener('toggle',()=>{if(!details.open||rendered)return;rendered=true;details.append(trainingExerciseDetail(exercise));const bigger=el('button','export','Agrandir la fiche');bigger.type='button';bigger.onclick=()=>openBibleSheet(exercise);details.append(bigger);});
  const actions=el('div','bible-card-actions'),add=el('button','primary','+ Ajouter à la séance'),adapt=el('button','export','Créer ma variante');add.type=adapt.type='button';add.onclick=()=>addBibleExercise(exercise);adapt.onclick=()=>openBibleVariant(exercise);
  actions.append(add,adapt);card.append(details,actions);root.append(card);
 }
 if(!matches.length)root.append(el('p','hint','Aucun exercice avec ces filtres. Essayez un objectif plus large ou effacez les filtres.'));
 if(visible.length<matches.length){const more=el('button','export bible-more','Voir '+Math.min(pageSize,matches.length-visible.length)+' exercices de plus');more.type='button';more.id='bible-more';more.onclick=()=>{const next=visible.length;bibleCataloguePage++;renderBibleCatalogue();root.children[next]?.querySelector('summary')?.focus();};root.append(more);}
}
function addBibleExercise(exercise,variant=null,duration=12){
 if(!applyTrainingForm())return notify('Vérifiez le groupe et le rendez-vous.');
 if(currentTraining.blocks.length>=20)return notify('20 blocs maximum.');
 const block={id:crypto.randomUUID(),exerciseId:exercise.id,duration,notes:'',bibleVariant:structuredClone(variant||biblePreviewState(exercise).variant)};
 currentTraining.blocks.push(block);saveTrainingDraft();renderTrainingBlocks();notify('Exercice ajouté au déroulé.');return block;
}
function openBibleSheet(exercise){
 let dialog=$('bible-sheet-dialog');if(!dialog){dialog=el('dialog','bible-sheet-dialog');dialog.id='bible-sheet-dialog';document.body.append(dialog);}
 bibleDisposeDiagrams(dialog);dialog.replaceChildren();const heading=el('div','bible-dialog-heading'),title=el('h2','',exercise.title);title.id='bible-sheet-title';dialog.setAttribute('aria-labelledby',title.id);const close=el('button','export','Fermer');close.type='button';close.onclick=()=>dialog.close();heading.append(title,close);
 const actions=el('div','bible-card-actions'),add=el('button','primary','+ Ajouter à la séance'),adapt=el('button','export','Créer ma variante'),free=el('button','export','Ouvrir dans l’atelier libre');add.type=adapt.type=free.type='button';add.onclick=()=>addBibleExercise(exercise);adapt.onclick=()=>{dialog.close();openBibleVariant(exercise);};free.onclick=()=>{dialog.close();bibleOpenInStudio(exercise);};actions.append(add,adapt,free);
 dialog.append(heading,bibleExerciseDetail(exercise,currentTraining),actions);dialog.onclose=()=>{if(dialog.open)return;bibleDisposeDiagrams(dialog);renderTrainingCatalogue();};dialog.showModal();
}

function bibleOpenInStudio(exercise){
 if(!applyTrainingForm())return;
 if(currentTraining.blocks.length>=20)return notify('20 blocs maximum.');
 const opened=$('bible-sheet-dialog')?.querySelector('.bible-detail'),detail=opened?.dataset.exercise===exercise.id?opened:null,sequence=detail?.bibleSelectedSequence?.()||0,variant=detail?.bibleVariant?.()||exercise.bibleVariant||biblePreviewState(exercise).variant,context=bibleSequenceContext(exercise,currentTraining,variant,sequence);if(!context.valid)return notify(context.errors.join(' '));const plan=context.plan,group=plan.groups[Number(detail?.querySelector('.bible-diagram')?.dataset.groupIndex)||0],personal=typeof bibleFindDiagramEdit==='function'?bibleFindDiagramEdit(exercise,group,{diagramEdits:variant.diagramEdits||[],sequenceIndex:sequence}):null,board=personal?structuredClone(personal.board):bibleEditableBoard(exercise,group);
 if(!board||!validExerciseBoard(board))return notify('Ce schéma est trop dense pour l’atelier libre. Créez un atelier plus petit ou partez d’un terrain vierge.');
 openCustomTrainingExercise();if(!$('custom-training-dialog').open)return;
 const time=bibleEffectiveTimeline(exercise,12,currentTraining,exercise.bibleVariant||{});
 const values={title:personal?.title||variant.title||exercise.title,goal:exercise.goal,organisation:'Schéma de l’atelier 1 sur '+plan.groups.length+' · '+group.players+' joueurs dont '+group.keepers+' gardien(s) · '+group.width+' × '+group.length+' m.\n'+group.roles+'\n'+plan.groups.map(g=>'Atelier '+g.index+' : '+g.players+' joueurs · '+g.width+' × '+g.length+' m').join('\n')+'\nEmprise totale : '+plan.footprint.width+' × '+plan.footprint.length+' m, dégagements compris.',instructions:exercise.rules.join('\n')+'\n\n'+time.sequences.map((s,i)=>'Séquence '+(i+1)+' · '+bibleTime(s.workSeconds)+' de jeu'+(s.restSeconds?' / '+bibleTime(s.restSeconds)+' de pause':'')+' : '+s.rule).join('\n'),material:'Total séance : '+bibleMaterialText(plan.totalMaterial)+'\nAtelier illustré : '+bibleMaterialText(group.material),success:exercise.success,kind:['circuit','possession','duel'].includes(exercise.kind)?exercise.kind:'game',width:Math.min(68,group.width),length:Math.min(105,group.length)};
 if(group.width>68||group.length>105){$('custom-training-dialog').close();return notify('Pour l’atelier libre, choisissez une zone de 68 × 105 m maximum.');}
 for(const [key,value]of Object.entries(values))$('custom-training-'+key).value=value;
 $('custom-training-duration').value=12;trainingCustomOrigin={exerciseId:exercise.id,sourceIds:[...bibleKnowledge[exercise.id].sourceIds]};
 exerciseDraft=board;exerciseEnabled=true;exerciseFrame=0;exerciseSelected=null;$('exercise-lines').checked=false;exerciseEditorRefresh();
 notify(personal?'Votre variante et ses étapes ont été copiées dans l’atelier libre.':'Placement initial copié. Vous pouvez modifier le terrain et créer vos déplacements.');
}

function openBibleVariant(exercise,block=null){
 if(!applyTrainingForm())return notify('Vérifiez le groupe et le rendez-vous.');
 if(!block&&currentTraining.blocks.length>=20)return notify('20 blocs maximum.');
 const original=trainingExercises.find(e=>e.id===exercise.id),previous=block?.bibleVariant||biblePreviewState(exercise).variant,plan=biblePlan(original,currentTraining,previous),first=plan.groups[0],duration=block?.duration||12;
 bibleVariantEditing={exercise:original,blockId:block?.id||null};
 let dialog=$('bible-variant-dialog');if(!dialog){dialog=el('dialog','bible-variant-dialog');dialog.id='bible-variant-dialog';dialog.setAttribute('aria-labelledby','bible-variant-title');document.body.append(dialog);}
 dialog.replaceChildren();const form=el('form'),head=el('div','bible-dialog-heading');head.append(el('div','',""));head.firstElementChild.append(el('span','eyebrow','VOTRE VARIANTE'),el('h2','','Adapter l’exercice'));head.querySelector('h2').id='bible-variant-title';
 const close=el('button','export','Fermer');close.type='button';close.onclick=()=>dialog.close();head.append(close);form.append(head,el('p','hint',original.title+' · votre variante sera conservée dans la séance.'));
 const nameLabel=el('label','bible-field','Nom de ma variante'),name=el('input');name.id='bible-variant-name';name.value=previous.title||original.title;name.maxLength=100;name.required=true;nameLabel.append(name);form.append(nameLabel);
 const grid=el('div','bible-variant-grid');
 const modeLabel=el('label','bible-field','Organisation par défaut'),mode=el('select');mode.id='bible-variant-organisation';for(const [value,label]of [['single','Tous ensemble · 1 terrain'],['stations','Ateliers parallèles'],['auto','Proposition automatique']])mode.append(new Option(label,value));mode.value=previous.organisation||(previous.groups>1?'stations':'single');modeLabel.append(mode);form.append(modeLabel);
 const fields=[['width','Largeur par atelier (m)',previous.width||first.width,6,105],['length','Longueur par atelier (m)',previous.length||first.length,6,120],['groups','Nombre d’ateliers',previous.groups||plan.groups.length,1,Math.min(40,Math.floor(currentTraining.players/2))],['duration','Durée totale du bloc (min)',duration,1,120],['sequences','Nombre de séquences',previous.sequences||4,1,4],['rest','Repos entre séquences (s)',previous.restSeconds??60,0,300]];
 const inputs={};for(const [key,labelText,value,min,max]of fields){const label=el('label','bible-field',labelText),input=el('input');input.type='number';input.id='bible-variant-'+key;input.value=value;input.min=min;input.max=max;input.step=1;input.required=true;inputs[key]=input;label.append(input);grid.append(label);}form.append(grid);
 const preview=el('div','bible-variant-preview');preview.id='bible-variant-preview';preview.setAttribute('aria-live','polite');form.append(preview);
 const custom=el('details','bible-extra');custom.append(el('summary','','Personnaliser les consignes par séquence'));const rules=[];for(let i=0;i<4;i++){const label=el('label','bible-field','Séquence '+(i+1)),input=el('textarea');input.id='bible-variant-rule-'+i;input.rows=2;input.maxLength=1500;input.value=previous.sequenceRules?.[i]||'';input.placeholder=bibleKnowledge[original.id].sequences[i]?.rule||'';label.append(input);custom.append(label);rules.push(input);}form.append(custom,el('p','hint','La durée du bloc inclut les pauses. Le temps de jeu est réparti entre les séquences. Les dimensions restent à valider selon votre terrain et votre matériel.'));
 function values(){return{...previous,autoProfile:false,version:1,title:name.value.trim(),width:Number(inputs.width.value),length:Number(inputs.length.value),groups:Number(inputs.groups.value),organisation:mode.value,sequences:Number(inputs.sequences.value),restSeconds:Number(inputs.rest.value),sequenceRules:rules.map(input=>input.value.trim())};}
 function refresh(){const variant=values();preview.replaceChildren();if(!bibleVariantValid(variant))return;const c=bibleSequenceContext(original,currentTraining,variant,0),p=c.plan,time=bibleEffectiveTimeline(original,Number(inputs.duration.value),currentTraining,variant);if(!c.valid){preview.append(el('p','training-alert',c.errors.join(' ')));return;}
  preview.append(el('strong','','Emprise : '+p.footprint.width+' × '+p.footprint.length+' m'),el('p','',p.groups.map(g=>g.players+' joueurs').join(' / ')),el('p','',time.sequences.map(s=>bibleTime(s.workSeconds)+' de jeu'+(s.restSeconds?' + '+bibleTime(s.restSeconds)+' de pause':'')).join(' · ')));
  if(!p.fits)preview.append(el('p','training-alert',p.warnings.join(' ')));else preview.append(el('p','bible-fit-ok','Installation compatible avec l’espace renseigné.'));
 }
 Object.values(inputs).forEach(input=>input.addEventListener('input',refresh));
 inputs.groups.addEventListener('input',()=>{if(Number(inputs.groups.value)>1&&mode.value==='single')mode.value='stations';refresh();});mode.addEventListener('change',refresh);
 const submit=el('button','primary',block?'Enregistrer ma variante':'Ajouter ma variante à la séance');submit.type='submit';form.append(submit);
 form.onsubmit=event=>{event.preventDefault();const variant=values(),minutes=Number(inputs.duration.value);if(!bibleVariantValid(variant)||!Number.isInteger(minutes)||minutes<1||minutes>120)return;
  const invalid=Array.from({length:variant.sequences},(_,i)=>({i,context:bibleSequenceContext(original,currentTraining,variant,i)})).find(item=>!item.context.valid||!item.context.fits);if(invalid){notify('Séquence '+(invalid.i+1)+' à revoir : '+(invalid.context.errors[0]||invalid.context.plan.warnings[0]||'ajustez les dimensions ou les ateliers.'));return;}
  if((variant.sequences-1)*variant.restSeconds+variant.sequences*30>minutes*60){notify('Prévoyez au moins 30 secondes de jeu par séquence, en plus des pauses.');return;}
  if(bibleVariantEditing.blockId){const target=currentTraining.blocks.find(b=>b.id===bibleVariantEditing.blockId);if(!target)return notify('Cet exercice n’est plus dans le déroulé.');target.bibleVariant=variant;target.duration=minutes;saveTrainingDraft();renderTrainingBlocks();notify('Variante enregistrée.');}
  else if(!addBibleExercise(original,variant,minutes))return;
  dialog.close();
 };
 dialog.append(form);refresh();dialog.showModal();
}

window.addEventListener('DOMContentLoaded',()=>{
 // Le sélecteur de surface reste identique ; les dimensions libres sont facultatives.
 const dimensions=el('div','bible-space-dimensions');dimensions.id='training-space-dimensions';dimensions.hidden=currentTraining.space!=='custom';
 for(const [key,labelText,value,max]of [['width','Largeur disponible (m)',40,105],['length','Longueur disponible (m)',30,120]]){const label=el('label','',labelText),input=el('input');input.type='number';input.id='training-space-'+key;input.min=6;input.max=max;input.step=1;input.required=true;input.value=currentTraining[key==='width'?'spaceWidth':'spaceLength']||value;input.onchange=applyTrainingForm;label.append(input);dimensions.append(label);}
 $('training-space-size').closest('label').after(dimensions);
 $('training-space-size').addEventListener('change',()=>{dimensions.hidden=currentTraining.space!=='custom';});
 const toolbar=$('training-prepare-tab')?.parentElement;if(toolbar){const bible=el('button','','La Bible de l’éduc');bible.id='training-bible-tab';bible.type='button';bible.onclick=()=>{window.trainingWizard.openCatalogue();};toolbar.append(bible);}
 const references=$('training-space').querySelector('.training-references');references.replaceChildren(el('summary','','Les sources de la Bible de l’éduc'));
 references.append(el('p','',"Les fiches sont des adaptations éditoriales du club. Chaque fiche précise les ressources qui éclairent ses principes. Les dimensions, la répartition des joueurs et les progressions proposées par l’outil restent ajustables. Le BMF, le BEF et le DES sont des diplômes d’entraîneur, pas des niveaux d’homologation d’exercices."));
 const list=el('ul');for(const source of Object.values(bibleSources)){const li=el('li'),a=el('a','',source.organisation+' · '+source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);list.append(li);}references.append(list);
 renderTrainingCatalogue();
 // Les fenêtres contenant une variante personnelle suivent la fermeture de l'accès privé.
 if(typeof clubNetworkClear==='function'){const clear=clubNetworkClear;clubNetworkClear=function(){for(const id of ['bible-sheet-dialog','bible-variant-dialog','bible-diagram-editor']){const dialog=$(id);if(dialog){dialog.close();dialog.replaceChildren();}}bibleVariantEditing=null;clear();};}
});
