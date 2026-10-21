let coachEditMode='add';
function renderCoachSelector(){const select=$('coach-select');select.replaceChildren();select.disabled=!!accountCoachBinding;(accountCoachBinding?[activeCoach]:coachProfiles).forEach(p=>{const option=el('option','',p.name);option.value=p.id;select.append(option);});select.value=activeCoach.id;}
function flushCoachWorkspace(){
 stopAnimation();if(document.body.classList.contains('training-mode')&&!applyTrainingForm()){notify('Vérifiez les champs de la séance avant de changer de coach.');return false;}if(!reportValid(currentReport)||!trainingValid(currentTraining)||!valid(state)||!simpleValid(simpleState)){notify('Corrigez les champs invalides avant de changer de coach.');return false;}if(persist()===false)return false;flushReportDraft();saveTrainingDraft();saveSimple();try{coachStorageSet('vestiaire-draft',JSON.stringify(typeof getCompositionBoard==='function'?getCompositionBoard():state));coachStorageSet('vestiaire-report-draft',JSON.stringify(currentReport));coachStorageSet('vestiaire-training-draft',JSON.stringify(currentTraining));coachStorageSet('vestiaire-simple',JSON.stringify(simpleState));return true;}catch{notify('Sauvegarde impossible : vérifiez le stockage de cet appareil avant de changer de coach.');return false;}
}
function activateCoach(id){
 if(id===activeCoach.id)return;
 if(!flushCoachWorkspace()){renderCoachSelector();return;}
 try{localStorage.setItem('vestiaire-active-coach',id);location.reload();}catch{notify('Impossible de changer de coach : stockage indisponible.');renderCoachSelector();}
}
$('coach-select').onchange=e=>{if(confirm('Changer de coach ? Les brouillons de '+activeCoach.name+' seront conservés dans son espace.'))activateCoach(e.target.value);else renderCoachSelector();};
$('coach-add').onclick=()=>{coachEditMode='add';$('coach-form-title').textContent='Ajouter un coach';$('coach-name').value='';$('coach-editor').showModal();};
$('coach-rename').onclick=()=>{coachEditMode='rename';$('coach-form-title').textContent='Modifier le nom du coach';$('coach-name').value=activeCoach.name;$('coach-editor').showModal();};
$('coach-editor-close').onclick=()=>$('coach-editor').close();
$('coach-form').onsubmit=e=>{
 e.preventDefault();const name=$('coach-name').value.trim();if(!name)return;
 if(coachProfiles.some(p=>p.id!==activeCoach.id&&p.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr')))return notify('Ce nom existe déjà : précisez le nom ou le groupe.');
 if(coachEditMode==='add'&&coachProfiles.some(p=>p.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr')))return notify('Ce coach existe déjà.');
 const profile={id:coachEditMode==='add'?crypto.randomUUID():activeCoach.id,name};
 if(coachEditMode==='add'&&coachProfiles.length>=100)return notify('100 profils maximum sur cet appareil.');
 const next=coachEditMode==='add'?[...coachProfiles,profile]:coachProfiles.map(p=>p.id===activeCoach.id?profile:p);
 try{if(!flushCoachWorkspace())return;localStorage.setItem('vestiaire-coach-profiles',JSON.stringify(next));localStorage.setItem('vestiaire-active-coach',profile.id);location.reload();}catch{notify('Impossible d’enregistrer le coach. Vérifiez le stockage de cet appareil.');}
};
function renderCoachAgenda(){
 $('coach-agenda-title').textContent='L’agenda de '+activeCoach.name;
 const counts=$('coach-agenda-counts');counts.replaceChildren();for(const [value,label] of [[trainingLibrary.length,'séances'],[reportLibrary.length,'rapports'],[saves.filter(s=>valid(s.state)&&!s.state.squadDirectory).length,'compositions']]){const item=el('div');item.append(el('strong','',String(value)),el('span','',label));const open=el('button','export','Voir mes '+label);open.onclick=()=>$(label==='séances'?'view-training':label==='rapports'?'view-reports':'view-pitch').click();item.append(open);counts.append(item);}
 const month=$('coach-agenda-month').value;const root=$('coach-agenda-list');root.replaceChildren();const sessions=[...trainingLibrary].filter(s=>!month||s.date.startsWith(month)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 if(!sessions.length){root.append(el('p','report-panel','Aucune séance enregistrée pour ce coach sur cette période. Préparez une séance puis cliquez sur « Enregistrer la séance ».'));return;}
 let lastDate='';sessions.forEach(session=>{if(session.date!==lastDate){root.append(el('h2','coach-agenda-date',new Date(session.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})));lastDate=session.date;}
 const card=el('article','report-panel coach-agenda-card');const info=el('div');info.append(el('strong','',session.time+' · '+(session.title||session.team)),el('p','',session.team+' · '+session.category+' · '+session.players+' joueurs · '+session.duration+' min'),el('p','hint',session.themes.join(' · ')));card.dataset.sessionId=session.id;const open=el('button','primary','Ouvrir la séance');open.onclick=()=>{loadTraining(session);if(currentTraining.id===session.id){setCoachAgenda(false);$('view-training').click();}};card.append(info,open);root.append(card);});
}
function setCoachAgenda(on){
 if(on){setReportView(false);setTrainingView(false);stopAnimation();document.body.classList.add('coach-agenda-mode');$('coach-agenda').hidden=false;for(const id of ['view-pitch','view-training','view-reports']){$(id).classList.remove('active');$(id).setAttribute('aria-pressed','false');}renderCoachAgenda();}
 else{document.body.classList.remove('coach-agenda-mode');$('coach-agenda').hidden=true;}
 $('view-coach-agenda').classList.toggle('active',on);$('view-coach-agenda').setAttribute('aria-pressed',String(on));
}
$('coach-agenda-month').value=localTrainingDate().slice(0,7);$('coach-agenda-month').onchange=renderCoachAgenda;$('coach-agenda-all').onclick=()=>{$('coach-agenda-month').value='';renderCoachAgenda();};
$('view-coach-agenda').onclick=()=>setCoachAgenda(true);for(const id of ['view-pitch','view-training','view-reports'])$(id).addEventListener('click',()=>setCoachAgenda(false));
$('coach-agenda-new').onclick=()=>{setCoachAgenda(false);$('view-training').click();$('training-new').click();};
renderCoachSelector();
