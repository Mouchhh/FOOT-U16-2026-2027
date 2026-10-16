// Planification locale et adaptations proposées ; le coach reste responsable de la séance.
const trainingThemes=['Technique','Conservation','Relance','Pressing','Défense','Transitions','Largeur','Finition','Duels','Démarquage','CPA','Gardiens','Jeu global'];
const trainingLevels={discovery:'Découverte / reprise des bases',developing:'En développement',advanced:'Confirmé'};
const trainingSpaces={small:[32,24],half:[68,52],full:[68,105]};
const trainingText=(s,max=12000)=>typeof s==='string'&&s.length<=max;
function localTrainingDate(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function trainingDateValid(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&localTrainingDate(d)===s;}
function newTraining(){const count=Math.min(32,Math.max(4,state.players.length)),age=Number(state.category?.match(/U(\d+)/i)?.[1]||18);return {version:1,id:crypto.randomUUID(),updatedAt:'',coach:activeCoach.name,team:state.team,category:state.category||'',date:localTrainingDate(),time:'18:30',duration:90,players:count,keepers:1,age:Math.min(65,Math.max(12,age)),level:'developing',context:'District',space:'half',themes:['Relance'],notes:'',blocks:[]};}
function trainingValid(s){
 return s&&(s.coach===undefined||trainingText(s.coach,70))&&s.version===1&&trainingText(s.id,100)&&!!s.id&&trainingText(s.updatedAt,100)&&trainingText(s.team,50)&&trainingText(s.category,30)&&trainingDateValid(s.date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)&&Number.isInteger(s.duration)&&s.duration>=30&&s.duration<=150&&Number.isInteger(s.players)&&s.players>=4&&s.players<=32&&Number.isInteger(s.keepers)&&s.keepers>=0&&s.keepers<=Math.min(4,s.players-2)&&Number.isInteger(s.age)&&s.age>=12&&s.age<=65&&Object.hasOwn(trainingLevels,s.level)&&['Loisir','District','Régional','National','Autre'].includes(s.context)&&Object.hasOwn(trainingSpaces,s.space)&&Array.isArray(s.themes)&&s.themes.length>=1&&s.themes.length<=3&&new Set(s.themes).size===s.themes.length&&s.themes.every(t=>trainingThemes.includes(t))&&trainingText(s.notes)&&Array.isArray(s.blocks)&&s.blocks.length<=20&&new Set(s.blocks.map(b=>b?.id)).size===s.blocks.length&&s.blocks.every(b=>b&&trainingText(b.id,100)&&trainingExercises.some(e=>e.id===b.exerciseId)&&Number.isInteger(b.duration)&&b.duration>=1&&b.duration<=120&&trainingText(b.notes));
}
let currentTraining=newTraining(),trainingLibrary=[];
try{const draft=JSON.parse(coachStorageGet('vestiaire-training-draft')||'null');if(trainingValid(draft))currentTraining=draft;const list=JSON.parse(coachStorageGet('vestiaire-training-library')||'[]');if(Array.isArray(list))trainingLibrary=list.filter(trainingValid);}catch{}
function saveTrainingDraft(){if(!trainingValid(currentTraining))return false;currentTraining.updatedAt=new Date().toISOString();try{coachStorageSet('vestiaire-training-draft',JSON.stringify(currentTraining));$('training-status').textContent='Brouillon conservé sur cet appareil · enregistrez la séance pour la retrouver dans la bibliothèque.';return true;}catch{$('training-status').textContent='Stockage plein ou indisponible : exportez un JSON.';return false;}}
// Répartition équilibrée : tous les présents sont affectés une seule fois, gardiens compris.
function trainingOrganisation(exercise,session=currentTraining){
 const n=session.players;const count=Math.max(1,Math.min(Math.round(n/exercise.target),Math.floor(n/4)));const base=Math.floor(n/count),rest=n%count;let remainingGK=session.keepers;
 const groups=Array.from({length:count},(_,i)=>({players:base+(i<rest?1:0),keepers:0}));
 for(let i=0;remainingGK>0;i++){const g=groups[i%count];if(g.keepers<g.players-2){g.keepers++;remainingGK--;}}
 const cols=Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/cols),available=trainingSpaces[session.space],factor=(session.age<15?.9:1)*(session.level==='discovery'?.9:session.level==='advanced'?1.1:1);
 return groups.map((g,index)=>{
 const desiredW=Math.round(exercise.width*Math.sqrt(g.players/exercise.target)*factor),desiredL=Math.round(exercise.length*Math.sqrt(g.players/exercise.target)*factor);const width=Math.max(6,Math.min(desiredW,Math.floor(available[0]/cols)-2)),length=Math.max(6,Math.min(desiredL,Math.floor(available[1]/rows)-2));
 let roles,allocation;
 if(exercise.kind==='circuit'){roles=g.players+' participants dans le circuit, gardiens inclus au jeu au pied';allocation=[g.players];}
 else if(exercise.kind==='possession'){const defenders=Math.min(2,Math.max(1,Math.floor(g.players/3)));roles=(g.players-defenders)+' en conservation + '+defenders+' à la récupération (gardiens inclus)';allocation=[g.players-defenders,defenders];}
 else if(exercise.kind==='duel'){const side=Math.floor(g.players/2),neutral=g.players%2;roles=side+' contre '+side+(neutral?' + 1 appui neutre':'')+' (gardiens inclus au jeu au pied)';allocation=[side,side,neutral];}
 else{const field=g.players-g.keepers,side=Math.floor(field/2),neutral=field%2;roles=side+' contre '+side+(neutral?' + 1 appui neutre':'')+(g.keepers?' + '+g.keepers+' gardien(s)'+(g.keepers>2?' dont '+(g.keepers-2)+' en rotation à chaque série':''):' · portes / mini-buts sans gardien');allocation=[side,side,neutral,g.keepers];}
 return {...g,index:index+1,width,length,roles,allocation,tight:width<desiredW||length<desiredL};
 });
}
function trainingAdaptation(exercise,s=currentTraining){
 const young=s.age<15,novice=s.level==='discovery',advanced=s.level==='advanced';
 return {level:novice?exercise.easier:advanced?exercise.harder:'Commencer par : '+exercise.easier+' Puis progresser vers : '+exercise.harder,
 load:young||novice?'Séries courtes de 2 à 3 min, avec 1 min de récupération et de retour du coach. Ajuster selon l’observation.':'Séries de 3 à 4 min, avec 1 à 2 min de récupération et de retour du coach. Ajuster selon l’observation.',
 rotation:exercise.kind==='circuit'?'Changer de poste après chaque séquence ; tous les joueurs conservent un rôle.':'Permuter les rôles à chaque série ; les appuis et les gardiens en rotation participent sur la durée du bloc.',
 keeper:s.keepers===0?'Sans gardien : utiliser des portes ou mini-buts ; pour un thème gardien, travailler seulement le jeu au pied et changer de thème pour les gestes spécifiques.':exercise.kind==='duel'||exercise.kind==='possession'||exercise.kind==='circuit'?'Les gardiens comptent dans les présents et participent au jeu au pied, sans être ajoutés à l’effectif.':'Répartir les gardiens entre ateliers. Dans un atelier à un gardien, alterner les deux équipes sur le même but ; avec plus de deux, faire tourner à chaque série.'};
}
function trainingTotal(){return currentTraining.blocks.reduce((sum,b)=>sum+b.duration,0);}
function trainingFinish(){const [h,m]=currentTraining.time.split(':').map(Number),total=h*60+m+trainingTotal();return String(Math.floor(total/60)%24).padStart(2,'0')+':'+String(total%60).padStart(2,'0')+(total>=1440?' (lendemain)':'');}
function syncTrainingForm(){
 const values={team:currentTraining.team,category:currentTraining.category,date:currentTraining.date,time:currentTraining.time,duration:currentTraining.duration,players:currentTraining.players,keepers:currentTraining.keepers,age:currentTraining.age,level:currentTraining.level,context:currentTraining.context,'space-size':currentTraining.space,notes:currentTraining.notes};for(const [key,value] of Object.entries(values))if($('training-'+key).value!==String(value))$('training-'+key).value=value;
 $('training-themes').replaceChildren();trainingThemes.forEach(theme=>{const label=el('label');const input=el('input');input.type='checkbox';input.checked=currentTraining.themes.includes(theme);input.onchange=()=>{if(input.checked){if(currentTraining.themes.length>=3){input.checked=false;return notify('Trois thèmes prioritaires maximum.');}currentTraining.themes.push(theme);}else{if(currentTraining.themes.length===1){input.checked=true;return notify('Gardez au moins un thème.');}currentTraining.themes=currentTraining.themes.filter(t=>t!==theme);}saveTrainingDraft();};label.append(input,document.createTextNode(theme));$('training-themes').append(label);});
}
function applyTrainingForm(){
 const mapping={team:'team',category:'category',date:'date',time:'time',duration:'duration',players:'players',keepers:'keepers',age:'age',level:'level',context:'context','space-size':'space',notes:'notes'},candidate=structuredClone(currentTraining);let invalid=false;
 for(const [id,key] of Object.entries(mapping)){const input=$('training-'+id);input.setCustomValidity('');if(!input.checkValidity()){input.reportValidity();invalid=true;break;}candidate[key]=['duration','players','keepers','age'].includes(key)?Number(input.value):input.value;}
 if(invalid)return false;
 if(candidate.keepers>Math.min(4,candidate.players-2)){$('training-keepers').setCustomValidity('Gardez au moins deux joueurs de champ ; 4 gardiens maximum.');$('training-keepers').reportValidity();return false;}
 if(!trainingValid(candidate))return false;currentTraining=candidate;saveTrainingDraft();renderTrainingBlocks();renderTrainingCatalogue();renderTrainingWeek();return true;
}
for(const key of ['team','category','date','time','duration','players','keepers','age','level','context','space-size','notes'])$('training-'+key).addEventListener('change',applyTrainingForm);
function trainingFieldNote(block){const label=el('label','report-field','Mes ajustements / matériel');const input=el('textarea');input.rows=2;input.maxLength=12000;input.value=block.notes;input.oninput=()=>{block.notes=input.value;saveTrainingDraft();};label.append(input);return label;}
function trainingExerciseDetail(exercise,session=currentTraining){
 const root=el('div','training-detail');root.append(el('p','training-goal',exercise.goal),trainingDiagram(exercise,session));root.append(el('p','','Matériel proposé : '+(exercise.kind==='circuit'?session.players+' ballons':Math.max(2,Math.ceil(session.players/exercise.target)*2)+' ballons, réserve comprise')+', coupelles, chasubles de trois couleurs'+(['game','finish','cpa'].includes(exercise.kind)?', buts disponibles ou portes de coupelles':'')+'.'));const org=trainingOrganisation(exercise,session);const list=el('ul','training-organisation');org.forEach(g=>list.append(el('li','',('Atelier '+g.index+' · '+g.players+' joueurs dont '+g.keepers+' gardien(s) · '+g.width+' × '+g.length+' m\n'+g.roles))));root.append(list);
 if(org.some(g=>g.tight))root.append(el('p','training-alert','Surface limitée : l’espace par atelier a été réduit. Validez l’installation ; si le jeu devient trop dense, privilégiez des portes et des situations courtes ou élargissez la zone.'));
 root.append(el('h4','','Consignes'));const rules=el('ol');exercise.rules.forEach(rule=>rules.append(el('li','',rule)));root.append(rules,el('h4','','Le coach observe'));exercise.cues.forEach(cue=>root.append(el('p','',cue)));root.append(el('p','training-success','Réussite observable : '+exercise.success));const adaptation=trainingAdaptation(exercise,session);
 for(const [title,text] of [['Adapter au niveau',adaptation.level],['Rythme proposé',adaptation.load],['Rotations',adaptation.rotation],['Gardiens',adaptation.keeper]]){const p=el('p');p.append(el('strong','',title+' : '),document.createTextNode(text));root.append(p);}return root;
}
function renderTrainingBlocks(){
 const total=trainingTotal();$('training-total').textContent=total+' / '+currentTraining.duration+' min prévues · fin '+trainingFinish();$('training-total').classList.toggle('training-alert',total!==currentTraining.duration);
 $('training-blocks').replaceChildren();if(!currentTraining.blocks.length)$('training-blocks').append(el('p','hint','Choisissez les thèmes puis proposez une séance, ou ajoutez des exercices depuis la bibliothèque.'));
 let elapsed=0;currentTraining.blocks.forEach((block,index)=>{
 const exercise=trainingExercises.find(e=>e.id===block.exerciseId),card=el('article','report-panel training-block');const head=el('div','section-heading');head.append(el('h3','',(index+1)+'. '+exercise.title),el('span','',elapsed+'′ — '+(elapsed+block.duration)+'′'));elapsed+=block.duration;card.append(head,el('p','hint',exercise.method+' · '+exercise.theme));
 const controls=el('div','training-block-controls');const label=el('label','','Durée du bloc (min)');const minutes=el('input');minutes.type='number';minutes.min=1;minutes.max=120;minutes.step=1;minutes.value=block.duration;minutes.onchange=()=>{if(!minutes.checkValidity()){minutes.reportValidity();return;}block.duration=Number(minutes.value);saveTrainingDraft();renderTrainingBlocks();};label.append(minutes);controls.append(label);
 for(const [text,delta] of [['↑',-1],['↓',1]]){const b=el('button','export',text);b.setAttribute('aria-label',delta<0?'Monter cet exercice':'Descendre cet exercice');b.disabled=index+delta<0||index+delta>=currentTraining.blocks.length;b.onclick=()=>{const other=index+delta;[currentTraining.blocks[index],currentTraining.blocks[other]]=[currentTraining.blocks[other],currentTraining.blocks[index]];saveTrainingDraft();renderTrainingBlocks();};controls.append(b);}
 const remove=el('button','export','Retirer');remove.onclick=()=>{currentTraining.blocks.splice(index,1);saveTrainingDraft();renderTrainingBlocks();};controls.append(remove);card.append(controls);
 const detail=el('details');detail.open=true;detail.append(el('summary','','Organisation, consignes et adaptations'),trainingExerciseDetail(exercise),trainingFieldNote(block));card.append(detail);const illustration=trainingIllustration(exercise);if(illustration)card.append(illustration);$('training-blocks').append(card);
 });
}
function renderTrainingCatalogue(){
 const query=$('training-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),theme=$('training-filter').value;$('training-catalogue').replaceChildren();let count=0;
 trainingExercises.filter(e=>(!theme||e.theme===theme)&&(e.title+' '+e.theme+' '+e.goal).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query)).forEach(exercise=>{count++;const card=el('article','training-catalogue-card');card.append(el('span','eyebrow',exercise.method+' · '+exercise.theme),el('h3','',exercise.title),el('p','',exercise.goal));const details=el('details');details.append(el('summary','','Voir la fiche adaptée'),trainingExerciseDetail(exercise));const add=el('button','export','+ Ajouter à la séance');add.onclick=()=>{if(!applyTrainingForm())return notify('Vérifiez le groupe et le rendez-vous.');if(currentTraining.blocks.length>=20)return notify('20 blocs maximum.');currentTraining.blocks.push({id:crypto.randomUUID(),exerciseId:exercise.id,duration:12,notes:''});saveTrainingDraft();renderTrainingBlocks();};card.append(details,add);const illustration=trainingIllustration(exercise);if(illustration)card.append(illustration);$('training-catalogue').append(card);});if(!count)$('training-catalogue').append(el('p','hint','Aucun exercice trouvé. Essayez un autre thème.'));
}
for(const theme of [...new Set(trainingExercises.map(e=>e.theme))]){const option=el('option','',theme);option.value=theme;$('training-filter').append(option);}
$('training-search').oninput=renderTrainingCatalogue;$('training-filter').onchange=renderTrainingCatalogue;
function generateTraining(){
 if(!applyTrainingForm())return notify('Vérifiez les réglages du groupe.');if(currentTraining.blocks.length&&!confirm('Remplacer le déroulé actuel par une proposition adaptée ?'))return;
 const duration=currentTraining.duration,warm=Math.max(6,Math.round(duration*.14)),cool=5;const count=duration>=60?4:3;
 const main=[],usage={};for(let i=0;i<count-1;i++){const theme=currentTraining.themes[i%currentTraining.themes.length],choices=trainingExercises.filter(e=>e.theme===theme&&(theme==='Jeu global'||e.id!=='freegame'));main.push(choices[(usage[theme]||0)%choices.length]?.id||'passes');usage[theme]=(usage[theme]||0)+1;}main.push('freegame');
 const remaining=duration-warm-cool,base=Math.floor(remaining/count),rest=remaining%count;
 currentTraining.blocks=[{id:crypto.randomUUID(),exerciseId:'warm',duration:warm,notes:''},...main.map((id,i)=>({id:crypto.randomUUID(),exerciseId:id,duration:base+(i<rest?1:0),notes:''})),{id:crypto.randomUUID(),exerciseId:'cool',duration:cool,notes:''}];saveTrainingDraft();renderTrainingBlocks();notify('Proposition créée : '+duration+' minutes, à valider et ajuster.');
}
$('training-generate').onclick=generateTraining;
$('training-report-link').onclick=()=>{const text=[currentReport.plan.priority,currentReport.analysis.improveAttack,currentReport.analysis.improveDefence].filter(v=>v.trim()).join('\n');if(!text)return notify('Le rapport ouvert ne contient pas encore de priorité ou d’axe de progrès.');if(currentTraining.notes.trim()&&!confirm('Remplacer l’objectif personnalisé par les priorités du rapport ouvert ?'))return;currentTraining.notes=text.slice(0,12000);syncTrainingForm();saveTrainingDraft();};
function trainingWeekStart(value){const d=new Date(value+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return localTrainingDate(d);}
function renderTrainingWeek(){
 const root=$('training-week');root.replaceChildren();const monday=trainingWeekStart(currentTraining.date);const end=new Date(monday+'T12:00:00');end.setDate(end.getDate()+6);const sunday=localTrainingDate(end);root.append(el('strong','','Semaine du '+new Date(monday+'T12:00:00').toLocaleDateString('fr-FR')));
 const sessions=trainingLibrary.filter(s=>s.date>=monday&&s.date<=sunday).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 if(!sessions.length)root.append(el('p','hint','Aucune séance enregistrée cette semaine.'));sessions.forEach(s=>{const b=el('button','export',new Date(s.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'short'})+' · '+s.time+' · '+s.team);b.onclick=()=>loadTraining(s);root.append(b);});
}
function renderTrainingLibrary(){const select=$('training-library');select.replaceChildren();const empty=el('option','','Ouvrir une séance…');empty.value='';select.append(empty);[...trainingLibrary].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).forEach(s=>{const option=el('option','',s.date+' · '+s.time+' · '+s.team);option.value=s.id;select.append(option);});select.value=trainingLibrary.some(s=>s.id===currentTraining.id)?currentTraining.id:'';renderTrainingWeek();}
function loadTraining(session){if(!confirm('Ouvrir cette séance ? Le brouillon courant sera remplacé.')){renderTrainingLibrary();return;}currentTraining=structuredClone(session);saveTrainingDraft();syncTrainingForm();renderTrainingBlocks();renderTrainingCatalogue();renderTrainingLibrary();}
$('training-library').onchange=e=>{const session=trainingLibrary.find(s=>s.id===e.target.value);if(session)loadTraining(session);};
$('training-save').onclick=()=>{if(!applyTrainingForm())return notify('Vérifiez les champs de la séance.');currentTraining.coach=activeCoach.name;const next=[structuredClone(currentTraining),...trainingLibrary.filter(s=>s.id!==currentTraining.id)];try{coachStorageSet('vestiaire-training-library',JSON.stringify(next));trainingLibrary=next;renderTrainingLibrary();$('training-status').textContent='Séance enregistrée dans la bibliothèque.';notify('Séance enregistrée.');}catch{notify('Stockage plein : exportez un JSON.');}};
$('training-new').onclick=()=>{if(!confirm('Créer une nouvelle séance ? Enregistrez le brouillon actuel pour le retrouver.'))return;currentTraining=newTraining();saveTrainingDraft();syncTrainingForm();renderTrainingBlocks();renderTrainingLibrary();renderTrainingCatalogue();};
$('training-duplicate').onclick=()=>{if(!applyTrainingForm())return;currentTraining=structuredClone(currentTraining);currentTraining.id=crypto.randomUUID();saveTrainingDraft();renderTrainingLibrary();notify('Séance dupliquée en brouillon : choisissez sa date puis enregistrez-la.');};
$('training-delete').onclick=()=>{if(!trainingLibrary.some(s=>s.id===currentTraining.id))return notify('Cette séance est uniquement un brouillon.');if(!confirm('Retirer cette séance de la bibliothèque ? Le brouillon reste accessible.'))return;const next=trainingLibrary.filter(s=>s.id!==currentTraining.id);try{coachStorageSet('vestiaire-training-library',JSON.stringify(next));trainingLibrary=next;renderTrainingLibrary();}catch{notify('Impossible de modifier le stockage.');}};
$('training-json').onclick=()=>{if(applyTrainingForm())mediaDownload(new Blob([JSON.stringify(currentTraining,null,2)],{type:'application/json'}),'seance-'+currentTraining.date+'.json');};
$('training-import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>3*1024*1024)throw Error();const session=JSON.parse(await file.text());if(!trainingValid(session))throw Error();if(!confirm('Importer cette séance et remplacer le brouillon courant ?'))return;currentTraining=session;saveTrainingDraft();syncTrainingForm();renderTrainingBlocks();renderTrainingCatalogue();renderTrainingLibrary();}catch{notify('Fichier de séance invalide.');}finally{e.target.value='';}};
function trainingDocument(){
 const root=el('article','report-document');const head=el('div','report-doc-heading');head.append(el('div','eyebrow','STADE MAYENNAIS · SÉANCE DE LA SEMAINE'),el('h1','','Fiche de séance'),el('p','',[currentTraining.team,currentTraining.category].filter(Boolean).join(' · ')));root.append(head);root.append(el('p','','Coach : '+(currentTraining.coach||activeCoach.name)));
 root.append(el('p','',new Date(currentTraining.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+' · '+currentTraining.time+' → '+trainingFinish()),el('p','',currentTraining.players+' joueurs dont '+currentTraining.keepers+' gardien(s) · âge repère '+currentTraining.age+' ans · '+trainingLevels[currentTraining.level]+' · '+currentTraining.context),el('p','',trainingTotal()+' minutes de contenu / objectif '+currentTraining.duration+' min · thèmes : '+currentTraining.themes.join(', ')));
 if(trainingTotal()!==currentTraining.duration)root.append(el('p','training-alert','Le total du déroulé diffère de la durée prévue. Ajustez les blocs avant la séance.'));
 if(currentTraining.notes.trim())reportPrintText(root,'Objectif et contexte',currentTraining.notes);
 let elapsed=0;currentTraining.blocks.forEach((block,index)=>{const exercise=trainingExercises.find(e=>e.id===block.exerciseId),section=el('section');section.append(el('h2','',(index+1)+'. '+exercise.title+' · '+elapsed+'′ à '+(elapsed+block.duration)+'′ ('+block.duration+' min)'),el('p','',exercise.method+' · '+exercise.theme),trainingExerciseDetail(exercise));if(block.notes.trim())reportPrintText(section,'Ajustements du coach / matériel',block.notes);root.append(section);elapsed+=block.duration;});
 root.append(el('p','hint','Proposition pédagogique du club à adapter au groupe et aux conditions réelles. Pas d’homologation ni de classement BMF / BEF / DES.'));return root;
}
const trainingPrintRoot=el('div');trainingPrintRoot.id='training-print';document.body.append(trainingPrintRoot);
function prepareTrainingPrint(){if(!document.body.classList.contains('training-mode'))return;trainingPrintRoot.replaceChildren(trainingDocument());document.body.classList.add('training-printing');document.title='Séance — '+currentTraining.team+' — '+currentTraining.date;}
window.addEventListener('beforeprint',prepareTrainingPrint);window.addEventListener('afterprint',()=>document.body.classList.remove('training-printing'));
$('training-pdf').onclick=()=>{if(!applyTrainingForm())return notify('Vérifiez les champs avant l’export.');prepareTrainingPrint();window.print();};
function setTrainingView(on){
 if(on){setReportView(false);stopAnimation();if(!currentTraining.updatedAt&&!currentTraining.blocks.length){currentTraining.team=state.team;currentTraining.category=state.category||'';currentTraining.age=Math.max(12,Math.min(65,Number(state.category?.match(/U(\d+)/i)?.[1]||18)));}document.body.classList.add('training-mode');$('training-space').hidden=false;for(const id of ['view-pitch','view-reports']){$(id).classList.remove('active');$(id).setAttribute('aria-pressed','false');}syncTrainingForm();renderTrainingBlocks();renderTrainingCatalogue();renderTrainingLibrary();}
 else{document.body.classList.remove('training-mode');$('training-space').hidden=true;}
 $('view-training').classList.toggle('active',on);$('view-training').setAttribute('aria-pressed',String(on));
}
$('view-training').onclick=()=>setTrainingView(true);for(const id of ['view-pitch','view-reports'])$(id).addEventListener('click',()=>setTrainingView(false));
syncTrainingForm();renderTrainingBlocks();renderTrainingCatalogue();renderTrainingLibrary();

for(const id of ['date','time','duration','players','keepers','age'])$('training-'+id).required=true;
$('training-notes').addEventListener('input',e=>{currentTraining.notes=e.target.value;saveTrainingDraft();});

function trainingIllustration(exercise){
 const mapping={press:'press',trap:'trap',build:'build','keeper-feet':'build',triangle:'third'};const scenario=mapping[exercise.id];if(!scenario)return null;
 const button=el('button','export','Illustrer le principe au tableau');button.style.marginTop='12px';button.onclick=()=>{
 if(!applyTrainingForm())return notify('Vérifiez les réglages de la séance.');if(!confirm('Ouvrir une illustration du principe ? Le tableau de pions sera réinitialisé ; votre séance est conservée.'))return;
 $('view-pitch').click();$('mode-simple').click();loadSimple(scenario);notify('Illustration pédagogique du principe : adaptez-la à votre exercice.');
 };return button;
}
