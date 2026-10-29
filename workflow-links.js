// Passages explicites entre documents du coach actif ; aucune copie silencieuse.
function workflowOpenReport(report,tab='general'){
 return workspaceNavigation.run('view-reports',()=>{
  if(report.id!==currentReport.id&&!workspaceReplaceDraft('report',report))return;
  reportTab=tab;renderReportTabs();renderReportContent();
 });
}
function workflowMatchReview(){
 const previousDialog=$('workflow-match-dialog');if(previousDialog?.open)return;previousDialog?.remove();
 const coach=activeCoach.id,candidate=newReport(),signature=JSON.stringify(getCompositionBoard());
 const dialog=el('dialog','completion-dialog');dialog.id='workflow-match-dialog';dialog.setAttribute('aria-label','Préparer le bilan du match');
 const heading=el('div','section-heading'),close=el('button','export','Fermer');close.type='button';close.onclick=()=>dialog.close();heading.append(el('h2','','Après le match'),close);
 dialog.append(heading,el('p','',candidate.info.team+' · '+(candidate.info.opponent||'Adversaire à renseigner')+' · '+(candidate.info.date||'Date à renseigner')),el('p','hint','Le nouveau bilan reprend la date, l’adversaire, le contexte, la composition et les objectifs de cette causerie. Les observations restent à remplir après le match. Votre bilan précédent reste récupérable dans « Autres outils ».'));
 const status=el('p','hint');status.setAttribute('role','status');
 const unchanged=()=>{if(activeCoach.id!==coach||JSON.stringify(getCompositionBoard())!==signature){status.textContent='La préparation ou le coach a changé. Fermez puis rouvrez ce passage au bilan.';return false;}return true;};
 const matches=r=>candidate.info.date&&candidate.info.opponent.trim()&&['team','category','date','opponent'].every(k=>r.info[k]===candidate.info[k]);
 const existing=[currentReport,...reportLibrary.filter(r=>r.id!==currentReport.id)].filter(matches);
 for(const report of existing){const open=el('button','export','Reprendre le bilan existant · '+(report.title||report.info.opponent));open.type='button';open.onclick=()=>{if(!unchanged())return;dialog.close();workflowOpenReport(report);};dialog.append(open);}
 const create=el('button','primary',existing.length?'Créer un autre bilan de ce match':'Créer le bilan de ce match');create.id='workflow-create-report';create.type='button';
 create.onclick=()=>{if(!unchanged())return;if(!workspaceNavigationCanLeave())return;if(!workspaceReplaceDraft('report',candidate)){status.textContent='Le bilan n’a pas pu être créé. Le document précédent reste ouvert.';return;}dialog.close();workflowOpenReport(currentReport);};
 dialog.append(create,status);dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
function workflowShowTrainingWeek(){
 if(!applyTrainingForm())return;
 // The normal save handler reports success only after persistence succeeds.
 if($('training-save').onclick()!==true)return;
 workspaceNavigation.run('view-coach-agenda',()=>{
  $('coach-agenda-month').value='';$('coach-agenda-week').value=currentTraining.date;
  $('coach-agenda-category').value='';$('coach-agenda-author').value='';
  renderCoachAgenda();workspaceFlows.agenda.go(1);
  const card=[...document.querySelectorAll('.coach-agenda-card')].find(e=>e.dataset.sessionId===currentTraining.id);
  if(card){card.classList.add('workflow-highlight');card.tabIndex=-1;card.focus({preventScroll:true});card.scrollIntoView({block:'nearest'});}
 });
}
function workflowRenderTrainingLinks(){
 const root=$('workflow-training-links');if(!root)return;root.replaceChildren();
 root.append(el('h3','','La suite de ma séance'),el('p','hint',currentTraining.date+' à '+currentTraining.time+' · Enregistrez cette fiche pour la retrouver dans votre agenda.'));
 const actions=el('div','workflow-actions'),agenda=el('button','export','Enregistrer et voir dans l’agenda');agenda.id='workflow-training-agenda';agenda.type='button';agenda.onclick=workflowShowTrainingWeek;actions.append(agenda);
 const ids=[...new Set(currentTraining.blocks.map(b=>b.matchSource?.reportId).filter(Boolean))];
 for(const id of ids){const source=currentReport.id===id?currentReport:reportLibrary.find(r=>r.id===id),reference=currentTraining.blocks.find(b=>b.matchSource?.reportId===id).matchSource;
  if(source){const open=el('button','export','Revoir le bilan · '+(source.info.opponent||source.info.date));open.type='button';open.dataset.reportId=id;open.onclick=()=>workflowOpenReport(source,'plan');actions.append(open);}
  else root.append(el('p','hint','Bilan d’origine indisponible dans cet espace · '+reference.date+' · '+reference.opponent+'. Les objectifs restent conservés dans les exercices.'));
 }
 root.append(actions);
}
document.addEventListener('DOMContentLoaded',()=>{
 const match=el('section','workflow-links');match.id='workflow-match-links';const button=el('button','export','Préparer le bilan de ce match');button.id='workflow-match-report';button.type='button';button.onclick=workflowMatchReview;
 match.append(el('h3','','Après le match'),el('p','hint','Retrouver les objectifs de la causerie pour observer ce qui a fonctionné et préparer la suite.'),button);$('task-causerie').append(match);
 const training=el('section','workflow-links');training.id='workflow-training-links';$('training-step-3').append(training);
 const renderTraining=renderTrainingBlocks;renderTrainingBlocks=function(){renderTraining();workflowRenderTrainingLinks();};workflowRenderTrainingLinks();
 const renderReport=renderReportContent;renderReportContent=function(){renderReport();if(reportTab!=='general')return;const panel=el('section','workflow-links');panel.id='workflow-report-links';const next=el('button','export','Choisir les priorités pour la prochaine séance');next.type='button';next.onclick=()=>workspaceNavigation.run('view-reports',()=>{reportTab='plan';renderReportTabs();renderReportContent();$('report-to-training').scrollIntoView({block:'center'});$('report-to-training').focus({preventScroll:true});});panel.append(el('h3','','Du bilan au terrain'),el('p','hint','Renseignez vos observations, puis retenez une ou deux priorités dans le plan d’action.'),next);$('report-content').append(panel);};renderReportContent();
});
