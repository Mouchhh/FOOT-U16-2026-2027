// Match preparation is a historical snapshot; follow-up lists only this coach's documents.
function reportFollowupSessions(){
 const linked=s=>s.blocks.some(b=>b.matchSource?.reportId===currentReport.id);
 const rows=trainingLibrary.filter(linked).map(session=>({session,draft:false}));
 if(linked(currentTraining)){const saved=rows.find(r=>r.session.id===currentTraining.id);if(saved){saved.session=currentTraining;saved.draft=JSON.stringify({...currentTraining,updatedAt:''})!==JSON.stringify({...trainingLibrary.find(s=>s.id===currentTraining.id),updatedAt:''});}else rows.push({session:currentTraining,draft:true});}
 return rows.sort((a,b)=>(a.session.date+a.session.time).localeCompare(b.session.date+b.session.time));
}
function reportPreparationPanel(editable=true){
 const panel=el('section','report-panel');panel.append(el('h3','','Objectifs préparés et observations'));
 const snapshot=currentReport.preparation;
 if(!snapshot){panel.append(el('p','hint','Ce rapport ancien ne contient pas de préparation mémorisée.'));if(editable){const button=el('button','export','Associer la préparation de la composition actuelle');button.type='button';button.onclick=()=>{if(!confirm('Associer la composition actuelle à ce rapport ? Vérifiez qu’elle correspond au même match.'))return;currentReport.preparation=reportPreparationSnapshot(getCompositionBoard());reportAutosave();renderReportContent();};panel.append(button);}return panel;}
 panel.append(el('p','hint','Préparation mémorisée · '+snapshot.formation+' · '+(snapshot.plan.date||'Date non renseignée')+' · '+(snapshot.plan.opponent||'Adversaire non renseigné')));
 if(snapshot.roster?.length){const roster=el('details');roster.open=!editable;roster.append(el('summary','','Composition mémorisée · '+snapshot.roster.length+' joueurs'));for(const player of snapshot.roster)roster.append(el('p','',player.number+' · '+player.name+' · '+(player.role==='sub'?'Impacteur / Finisseur':'Titulaire')));panel.append(roster);}
 for(const [label,key]of [['Contexte','context'],['Animation défensive','defensive'],['Animation offensive','offensive'],['Compléments','specific']])if(snapshot.plan[key])panel.append(el('strong','',label),el('p','',snapshot.plan[key]));
 if(!snapshot.objectives.length)panel.append(el('p','hint','Aucun objectif renseigné dans la préparation de ce match.'));
 snapshot.objectives.forEach((objective,index)=>{panel.append(el('h4','',(index+1)+'. '+objective.text));if(editable){const status=reportField('Constat · objectif '+(index+1),objective.status,v=>objective.status=v,{choices:['Non évalué','À renforcer','En progrès','Atteint']});status.querySelector('select').setAttribute('aria-label','Constat · objectif '+(index+1));panel.append(status,reportField('Observation · objectif '+(index+1),objective.observation,v=>objective.observation=v,{area:true,rows:2,maxLength:3000}));const priority=el('button','export','Retenir comme priorité');priority.type='button';priority.onclick=()=>{if(currentReport.plan.priority&&currentReport.plan.priority!==objective.text&&!confirm('Remplacer la priorité actuelle par cet objectif ?'))return;currentReport.plan.priority=objective.text;reportAutosave();renderReportContent();notify('Priorité retenue. Choisissez ensuite les exercices adaptés.');};panel.append(priority);}else panel.append(el('p','',objective.status+' · '+(objective.observation||'Observation non renseignée')));});return panel;
}
function renderMatchFollowup(){
 if(!['general','plan'].includes(reportTab))return;
 const root=$('report-content'),details=el('details');details.id='report-match-preparation';details.append(el('summary','','Objectifs du match · préparation et observations'),reportPreparationPanel());root.append(details);
 const panel=el('section','report-panel');panel.id='report-session-followup';panel.append(el('h3','','Suivi dans les séances'));
 const rows=reportFollowupSessions();if(!rows.length)panel.append(el('p','hint','Aucune séance reliée pour le moment. Choisissez une priorité puis préparez les exercices à partir de ce bilan.'));
 for(const {session,draft}of rows){const row=el('div','report-text-block');row.append(el('strong','',(session.title||session.team)+' · '+session.date+' '+session.time),el('p','hint',draft?'Brouillon local · à enregistrer':'Séance enregistrée'));
 const objectives=[...new Set(session.blocks.filter(b=>b.matchSource?.reportId===currentReport.id).map(b=>b.matchSource.objective))];row.append(el('p','',objectives.join(' · ')));
 const button=el('button','export','Ouvrir cette séance');button.type='button';button.onclick=()=>{if(session!==currentTraining){loadTraining(session);if(currentTraining.id!==session.id)return;}$('view-training').click();window.trainingWizard?.go(3);};row.append(button);panel.append(row);}root.append(panel);
}
document.addEventListener('DOMContentLoaded',()=>{
 const renderBefore=renderReportContent;renderReportContent=function(){renderBefore();renderMatchFollowup();};
 const printBefore=buildReportDocument;buildReportDocument=function(){const doc=printBefore();if(currentReport.preparation)doc.append(reportPreparationPanel(false));return doc;};
 if(['general','plan'].includes(reportTab))renderReportContent();
});
