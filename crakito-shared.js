// Lecture de la base existante : aucune conversation ni copie de document stockée ici.
function crakitoDocumentSummary(row){
 const p=row.payload,lines=[];
 if(row.kind==='training'){
  lines.push([p.category,p.date,p.time].filter(Boolean).join(' · '),p.players+' joueurs · '+p.duration+' min · '+trainingSpaceLabels[p.space]);
  if(p.notes.trim())lines.push('Objectif / contexte : '+p.notes);
  p.blocks.slice(0,8).forEach((b,i)=>{const ex=trainingExerciseForBlock(b);lines.push((i+1)+'. '+ex.title+' · '+b.duration+' min');if(b.custom?.instructions)lines.push('Consignes : '+b.custom.instructions);if(b.notes)lines.push('Adaptations : '+b.notes);});
 }else if(row.kind==='report'){
  lines.push([p.info.category,p.info.date,p.info.team,p.info.opponent].filter(Boolean).join(' · '));
  if(p.info.goalsFor!==''&&p.info.goalsAgainst!=='')lines.push('Score renseigné : '+p.info.goalsFor+' – '+p.info.goalsAgainst);
  for(const key of ['withBall','withoutBall','transitions','setPieces','improveAttack','improveDefence'])if(p.analysis[key].trim())lines.push(reportAnalysis[key]+' : '+p.analysis[key]);
  for(const key of ['priority','session1','session2','success'])if(p.plan[key].trim())lines.push(reportPlan[key]+' : '+p.plan[key]);
 }else{
  lines.push([p.team,p.category,p.formation].filter(Boolean).join(' · '));if(p.notes?.trim())lines.push('Notes : '+p.notes);
  const prep=p.matchPreparation;if(prep){for(const key of ['context','opponent','defensive','offensive','specific'])if(typeof prep[key]==='string'&&prep[key].trim())lines.push(prep[key]);if(Array.isArray(prep.objectives))lines.push(...prep.objectives.filter(Boolean));}
 }
 return lines.filter(Boolean).join('\n\n').slice(0,7000)||'Ce document ne contient pas encore de consignes ou d’observations à résumer.';
}
document.addEventListener('DOMContentLoaded',()=>{
 const assistant=$('club-assistant'),topics=$('crakito-topics'),open=el('button','export','Base commune du club');open.type='button';open.id='crakito-shared-open';topics.prepend(open);
 const panel=el('section','crakito-shared');panel.id='crakito-shared';panel.hidden=true;panel.innerHTML='<div class="section-heading"><div><h3>La base commune du club</h3><p>Les documents enregistrés par les éducateurs autorisés. Les brouillons et conversations restent personnels.</p></div><button type="button" id="crakito-shared-close" class="icon-button" aria-label="Fermer la base commune">×</button></div><form id="crakito-shared-search"><label>Titre ou nom de l’éducateur<input id="crakito-shared-query" maxlength="150" placeholder="Ex. pressing, Hugo, U18…"></label><label>Type<select id="crakito-shared-kind"><option value="">Tous les documents</option><option value="training">Séances</option><option value="report">Rapports</option><option value="composition">Compositions</option></select></label><button type="submit" class="primary">Rechercher</button></form><p id="crakito-shared-status" role="status"></p><div id="crakito-shared-results"></div>';topics.after(panel);
 const preview=document.createElement('dialog');preview.id='crakito-shared-preview';preview.setAttribute('aria-label','Document partagé en lecture seule');preview.innerHTML='<div class="section-heading"><h2>Document du club</h2><button type="button" id="crakito-shared-preview-close" class="icon-button" aria-label="Fermer le document">×</button></div><p id="crakito-shared-source"></p><div id="crakito-shared-document"></div>';document.body.append(preview);
 let request=0,actor=null,rows=[];
 const status=$('crakito-shared-status'),results=$('crakito-shared-results');
 function identity(){return clubNetworkBound()?clubNetworkMember.user_id:null;}
 function reset(){request++;rows=[];results.replaceChildren();preview.close();$('crakito-shared-document').replaceChildren();$('crakito-shared-source').textContent='';status.textContent='';panel.hidden=true;$('crakito-shared-query').value='';}
 function authorised(){return identity()===actor&&!!actor;}
 async function read(metadata){if(!authorised())throw Error('Reconnectez-vous à l’espace privé.');const data=await clubNetworkRequest('/rest/v1/club_documents?'+new URLSearchParams({select:'*',id:'eq.'+metadata.id,limit:'1'}));if(!authorised())throw Error('Session terminée.');const row=data?.[0];if(!row){throw Error('Ce document a été supprimé ou n’est plus accessible. Actualisez la recherche.');}if(row.owner_id!==metadata.owner_id||row.kind!==metadata.kind||!clubNetworkPayloadValid(row.kind,row.payload)||clubNetworkPayloadId(row.kind,row.payload)!==row.source_id)throw Error('Ce document n’est pas compatible.');return row;}
 function source(row){return clubNetworkKinds[row.kind]+' · '+clubNetworkAuthor(row.owner_id)+' · version '+row.revision+' · '+new Date(row.updated_at).toLocaleString('fr-FR');}
 function render(){results.replaceChildren();const query=crakitoNormalize($('crakito-shared-query').value.trim()),kind=$('crakito-shared-kind').value;const filtered=rows.filter(r=>(!kind||r.kind===kind)&&(!query||crakitoNormalize(r.title+' '+clubNetworkAuthor(r.owner_id)).includes(query)));status.textContent=rows.length+' document(s) dans la base · '+filtered.length+' résultat(s) · actualisé à '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'. Recherche dans les titres et les noms des éducateurs.';
 if(!filtered.length)results.append(el('p','','Aucun résultat. Essayez un titre plus court ou un autre éducateur. Seuls les documents enregistrés et synchronisés apparaissent.'));
 for(const metadata of filtered.slice(0,30)){
  const card=el('article','crakito-shared-card'),actions=el('div','report-actions'),excerpt=el('div','crakito-shared-excerpt');card.append(el('h4','',metadata.title),el('p','hint',source(metadata)),actions,excerpt);
  for(const [label,full]of [['Voir le résumé',false],['Consulter le document',true]]){const button=el('button','export',label);button.type='button';button.onclick=async()=>{const token=request;button.disabled=true;try{const row=await read(metadata);if(token!==request||!authorised())return;if(!full){excerpt.replaceChildren(el('p','hint','Extraits du document de '+clubNetworkAuthor(row.owner_id)+' · version '+row.revision+' — propos de l’auteur, à adapter à votre groupe.'),el('p','crakito-shared-text',crakitoDocumentSummary(row)));}else{
   let content;if(row.kind==='training'){const original=currentTraining;try{currentTraining=structuredClone(row.payload);content=trainingDocument();}finally{currentTraining=original;}}else if(row.kind==='report'){const original=currentReport;try{currentReport=structuredClone(row.payload);content=buildReportDocument();}finally{currentReport=original;}}else content=clubNetworkComposition(row.payload);
   $('crakito-shared-source').textContent=row.title+' · '+source(row)+' · lecture seule';$('crakito-shared-document').replaceChildren(content);if(!preview.open)preview.showModal();
  }}catch(error){if(token===request)excerpt.replaceChildren(el('p','training-alert',error.message||'Lecture impossible.'));}finally{button.disabled=false;}};actions.append(button);}
  results.append(card);
 }
 if(filtered.length>30)results.append(el('p','hint','30 résultats affichés : précisez le titre ou le nom pour affiner.'));
 }
 async function load(){const token=++request;rows=[];results.replaceChildren();if(!identity()){status.textContent='Connectez-vous à l’espace privé avec votre compte éducateur pour accéder à la base commune. En mode local, aucun document du club n’est chargé.';return;}actor=identity();status.textContent='Lecture de la base commune…';try{
  const all=[];for(let offset=0;offset<10000;offset+=100){const page=await clubNetworkRequest('/rest/v1/club_documents?'+new URLSearchParams({select:'id,owner_id,kind,source_id,title,revision,updated_at',order:'updated_at.desc,id.asc',limit:'100',offset:String(offset)}));if(token!==request||!authorised())return;if(!Array.isArray(page))throw Error('Réponse invalide.');all.push(...page);if(page.length<100)break;if(offset===9900)throw Error('La base dépasse la limite de recherche.');}
  rows=all.filter(r=>r&&Object.hasOwn(clubNetworkKinds,r.kind)&&typeof r.title==='string');render();
 }catch(error){if(token!==request)return;rows=[];results.replaceChildren();status.textContent='Base commune indisponible. '+clubNetworkMessage(error)+' Réessayez avec Rechercher.';}}
 open.onclick=()=>{panel.hidden=false;load();};$('crakito-shared-close').onclick=()=>{reset();};$('crakito-shared-search').onsubmit=e=>{e.preventDefault();load();};$('crakito-shared-kind').onchange=()=>{if(authorised()&&rows.length)render();};$('crakito-shared-preview-close').onclick=()=>{preview.close();$('crakito-shared-document').replaceChildren();};preview.addEventListener('close',()=>$('crakito-shared-document').replaceChildren());
 // Un changement de compte ou une révocation efface les extraits en mémoire.
 new MutationObserver(()=>{const next=identity();if(next!==actor){if(actor)assistant.close();reset();actor=next;}}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 assistant.addEventListener('close',()=>{request++;});
 window.crakitoOpenShared=()=>open.click();
});
