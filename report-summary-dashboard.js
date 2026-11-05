// Synthèse dérivée du bilan ouvert et de sa causerie mémorisée uniquement.
function reportSummaryRoster(report){
 const roster=report.players.map(p=>({...p}));
 for(const source of report.preparation?.roster||[]){
  const name=source.name?.trim();if(!name)continue;
  const same=roster.filter(p=>playerStatsName(p.name)===playerStatsName(name));
  if(same.length===1){if(!same[0].number&&source.number)same[0].number=String(source.number);continue;}
  if(!same.length)roster.push({...source,number:String(source.number||''),role:source.role==='sub'?'Impacteur / Finisseur':'Titulaire',minutes:''});
 }
 return roster.filter(p=>p.name?.trim()).sort((a,b)=>{
  const number=p=>/^\d+$/.test(String(p.number))&&Number(p.number)>0?Number(p.number):Infinity;
  return number(a)-number(b)||a.name.localeCompare(b.name,'fr');
 });
}
function reportSummaryDashboard(report){
 const view=el('article','report-summary-dashboard report-summary-compact'),info=report.info,plan=report.plan,a=report.analysis;
 const header=el('section','report-summary-match-banner'),identity=el('div');
 identity.append(el('span','eyebrow','STADE MAYENNAIS · SYNTHÈSE'),el('h2','',report.title||'Bilan du match'),el('strong','report-summary-fixture',[info.team,report.eventType==='training'?'':info.opponent].filter(Boolean).join(' / ')));
 identity.append(el('p','report-summary-match-meta',[info.date,info.time,info.competition,info.round,info.stadium||info.venue,info.category].filter(Boolean).join(' · ')));
 const score=report.eventType==='training'?'Bilan de séance':info.goalsFor!==''&&info.goalsAgainst!==''?info.goalsFor+' – '+info.goalsAgainst:'Score à renseigner';
 header.append(identity,el('div','report-summary-score',score));view.append(header);
 const grid=el('div','report-summary-grid');
 const card=title=>{const c=el('section','report-summary-card');c.append(el('h3','',title));grid.append(c);return c;};
 const group=card('Groupe & Temps de jeu'),roster=reportSummaryRoster(report),numbered=roster.filter(p=>/^\d+$/.test(String(p.number))&&Number(p.number)>=1&&Number(p.number)<=14),other=roster.filter(p=>!numbered.includes(p));
 const playerList=players=>{const list=el('ol','report-summary-roster');for(const p of players){const row=el('li'),identity=el('div');row.dataset.summaryNumber=p.number||'';row.append(el('span','report-summary-number',p.number||'—'));identity.append(el('strong','',p.name),el('small','',p.role==='sub'?'Impacteur / Finisseur':p.role==='starter'?'Titulaire':p.role||'Statut à préciser'));row.append(identity,el('span','report-summary-minutes',p.minutes!==undefined&&p.minutes!==''?p.minutes+' min':'—'));list.append(row);}return list;};
 group.append(el('p','report-summary-caption',roster.length+' joueur(s) mémorisé(s) · classement par numéro'));
 if(numbered.length)group.append(playerList(numbered));
 if(other.length)group.append(el('h4','','Numéros à préciser ou hors 1–14'),playerList(other));
 if(!roster.length)group.append(el('p','report-summary-empty','Aucun joueur mémorisé pour ce bilan.'));
 const facts=card('Faits marquants'),timeline=el('ol','report-summary-timeline');
 const events=report.events.map((event,index)=>({event,index})).sort((a,b)=>(a.event.minute===''?Infinity:Number(a.event.minute))-(b.event.minute===''?Infinity:Number(b.event.minute))||a.index-b.index);
 for(const {event:e}of events){const item=el('li','report-summary-event'),detail=el('div');item.dataset.summaryEvent=e.type;const names={'But pour':'But marqué','But contre':'But encaissé','Carton':'Carton · notre équipe','Carton adverse':'Carton · adversaire','Changement':'Changement'};
  if(e.type==='But pour')item.classList.add('is-goal');if(e.card==='red')item.classList.add('is-red-card');
  item.append(el('time','',e.minute!==''?e.minute+'′':'—'));detail.append(el('strong','',names[e.type]||e.type));const text=reportEventDescription(e);if(text?.trim())detail.append(el('p','',text));item.append(detail);timeline.append(item);
 }
 facts.append(events.length?timeline:el('p','report-summary-empty','Aucun fait marquant renseigné.'));view.append(grid);
 const conclusion=el('section','report-summary-conclusion');conclusion.append(el('h3','','Ce qu’on retient'));
 const brief=text=>{const value=(text||'').trim();return value.length>240?value.slice(0,237).trimEnd()+'…':value;};
 const notes=el('div','report-summary-takeaways');
 for(const [label,value]of [['Bilan du groupe',plan.summary],['Point à retenir',a.withBall||a.withoutBall||a.topAttack||a.topDefence],['À améliorer',a.improveAttack||a.improveDefence]])if(value?.trim()){const item=el('p');item.append(el('strong','',label+' · '),document.createTextNode(brief(value)));notes.append(item);}
 if(!notes.children.length)notes.append(el('p','report-summary-empty','Complétez l’analyse pour retrouver les conclusions ici.'));
 conclusion.append(notes);const priority=el('div','report-summary-priority');priority.append(el('h4','','Pour la prochaine séance'),el('p','',plan.priority?.trim()||'Priorité à définir'));
 if(plan.sessionExercise?.trim())priority.append(el('small','','Exercice envisagé · '+brief(plan.sessionExercise)));conclusion.append(priority);view.append(conclusion);return view;
}
document.addEventListener('DOMContentLoaded',()=>{
 const pdf=$('report-pdf'),originalPrint=pdf.onclick;
 const legacyPrepare=prepareReportPrint;window.removeEventListener('beforeprint',legacyPrepare);
 prepareReportPrint=function(){if(!document.body.classList.contains('report-summary-printing'))return legacyPrepare.apply(this,arguments);};
 window.addEventListener('beforeprint',prepareReportPrint);
 function printSummary(){
  if(!reportValid(currentReport))return notify('Vérifiez les champs numériques avant l’export PDF.');
  printSummary.cleanup?.();const paper=reportSummaryDashboard(structuredClone(currentReport));paper.id='report-summary-print';
  const style=document.createElement('style');style.textContent='@page{size:A4 landscape;margin:10mm}';paper.append(style);document.body.append(paper);document.body.classList.add('report-summary-printing');
  const cleanup=()=>{paper.remove();document.body.classList.remove('report-summary-printing');window.removeEventListener('afterprint',cleanup);if(printSummary.cleanup===cleanup)printSummary.cleanup=null;};printSummary.cleanup=cleanup;window.addEventListener('afterprint',cleanup,{once:true});
  try{window.print();}catch{cleanup();notify('L’impression est indisponible dans ce navigateur.');}
 }
 pdf.onclick=()=>reportTab==='preview'?printSummary():originalPrint?.call(pdf);
 const previous=renderReportContent;renderReportContent=function(...args){
  const result=previous.apply(this,args);if(reportTab!=='preview')return result;
  pdf.remove();const root=$('report-content');root.replaceChildren(reportSummaryDashboard(currentReport));
  const tools=el('div','report-summary-export');pdf.hidden=false;pdf.textContent='Imprimer / Exporter la Synthèse Complète (PDF)';tools.append(pdf);root.append(tools);return result;
 };
 if(reportTab==='preview')renderReportContent();
});
