// Optional report drafting uses only coach-entered facts; no automatic match diagnosis.
function assistantReportSignature(){return JSON.stringify({coach:activeCoach.id,report:{...currentReport,updatedAt:''}});}
function crakitoOpenReportProposal(){
 if($('crakito-report-proposal')?.open)return;
 const snapshot=assistantReportSignature(),dialog=el('dialog','completion-dialog');dialog.id='crakito-report-proposal';dialog.setAttribute('aria-labelledby','crakito-report-title');
 const title=el('h2','','Préparer mon bilan');title.id='crakito-report-title';const close=el('button','export','Fermer');close.type='button';close.onclick=()=>dialog.close();dialog.append(title,el('p','hint','Faits saisis par le coach · aucune observation ou aucun score inventé. Aperçu avant modification du brouillon.'));
 const form=el('form'),fields={},definitions=[['withBall','Avec le ballon','analysis'],['withoutBall','Sans le ballon','analysis'],['priority','Priorité à travailler','plan'],['success','Critère observable de progrès','plan']];
 for(const [key,label]of definitions){const wrap=el('label','report-field',label),input=el('textarea');input.rows=2;input.maxLength=3000;input.setAttribute('aria-label',label);fields[key]=input;wrap.append(input);form.append(wrap);}
 const review=el('button','primary','Voir la proposition');review.type='submit';const result=el('div'),status=el('p','hint');status.setAttribute('role','status');form.append(review);dialog.append(form,status,result,close);let proposal=null;
 form.oninput=()=>{proposal=null;result.replaceChildren();status.textContent='Relisez la proposition après chaque modification.';};
 form.onsubmit=event=>{event.preventDefault();result.replaceChildren();if(snapshot!==assistantReportSignature())return status.textContent='Le rapport ou le coach a changé. Fermez puis rouvrez cette préparation.';
  if(!definitions.some(([key])=>fields[key].value.trim()))return status.textContent='Renseignez au moins une observation ou une priorité.';
  proposal=structuredClone(currentReport);const changes=[];
  for(const [key,label,section]of definitions){const value=fields[key].value.trim();if(!value)continue;changes.push({label,before:currentReport[section][key],after:value});proposal[section][key]=value;}
  result.append(el('h3','','Proposition · à confirmer'));for(const change of changes){result.append(el('strong','',change.label));if(change.before)result.append(el('p','hint','Texte actuellement renseigné : '+change.before));result.append(el('p','training-custom-text',change.after));}
  result.append(el('p','hint','Seules ces rubriques seront remplacées. Le brouillon précédent sera conservé dans la récupération. Aucun partage avant Enregistrer le rapport.'));
  const apply=el('button','primary','Appliquer à mon brouillon de rapport');apply.type='button';apply.onclick=()=>{
   if(!proposal||snapshot!==assistantReportSignature())return status.textContent='La proposition est devenue obsolète. Fermez puis recommencez depuis le rapport actuel.';
   if(!workspaceReplaceDraft('report',proposal))return status.textContent='Application impossible. Le rapport ouvert est conservé ; vérifiez le stockage puis réessayez.';
   dialog.close();$('view-reports').click();reportTab='general';renderReportTabs();renderReportContent();notify('Bilan ajouté au brouillon. Relisez puis enregistrez le rapport pour le partager.');
  };result.append(apply);status.textContent='Faits et objectifs fournis par vous · pas de validation sportive automatique.';
 };
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();fields.withBall.focus();
}
window.crakitoOpenReportProposal=crakitoOpenReportProposal;
document.addEventListener('DOMContentLoaded',()=>{
 document.addEventListener('club-session-ready',()=>{if(!clubNetworkBound())return;try{const reference=JSON.parse(coachStorageGet('vestiaire-club-reference')||'null');if(manualReferenceValid(reference)){manualAIReference=reference;$('manual-ai-reference-status').textContent='Document importé dans votre espace : '+reference.title+' · renvois à vérifier par le coach.';refreshLocalCoachAdvice();}}catch{}});
 const clear=clubNetworkClear;clubNetworkClear=function(){
  window.crakitoClearConversation?.();$('crakito-report-proposal')?.close();$('local-coach-dialog')?.close();localCoachProposal=null;localCoachSnapshot=null;manualAIContext=null;manualAIProposal=null;manualAISnapshot=null;manualAIReference=null;
  for(const id of ['manual-ai-prompt','manual-ai-answer'])if($(id))$(id).value='';for(const id of ['manual-ai-preview','local-coach-preview'])$(id)?.replaceChildren();if($('manual-ai-apply'))$('manual-ai-apply').disabled=true;for(const id of ['manual-ai-reference-status','local-coach-reference-label'])if($(id))$(id).textContent='Aucun référentiel chargé dans cette session.';const goal=$('local-coach-goal');goal?.querySelectorAll('[data-assistant-goal]').forEach(e=>e.remove());if(goal)goal.selectedIndex=0;clear();
 };
});
