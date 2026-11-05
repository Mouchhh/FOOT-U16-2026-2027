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
 const view=el('article','report-summary-dashboard');
 const heading=el('div','report-summary-heading');heading.append(el('span','eyebrow','STADE MAYENNAIS · SYNTHÈSE COMPLÈTE'),el('h2','',report.title||'Bilan du match'));view.append(heading);
 const grid=el('div','report-summary-grid');
 const card=title=>{const c=el('section','report-summary-card');c.append(el('h3','',title));grid.append(c);return c;};
 const match=card('Effectif & Match'),info=report.info;
 const score=report.eventType==='training'?'Bilan de séance':info.goalsFor!==''&&info.goalsAgainst!==''?info.goalsFor+' – '+info.goalsAgainst:'Score à renseigner';
 match.append(el('div','report-summary-score',score),el('strong','report-summary-fixture',[info.team,report.eventType==='training'?'':info.opponent].filter(Boolean).join(' / ')));
 const context=el('dl','report-summary-context');
 for(const [label,value]of [['Date',info.date],['Horaire',info.time],['Catégorie',info.category],['Compétition',info.competition],['Journée / tour',info.round],['Lieu',info.stadium],['Terrain',info.venue],['Durée',info.duration?info.duration+' min':''],['Système',info.formation||report.preparation?.formation],['Conditions',info.conditions],['Éducateur',info.coach],['Score à la pause',info.halfFor!==''&&info.halfAgainst!==''?info.halfFor+' – '+info.halfAgainst:''],['Buteurs / passeurs',info.scorers]])if(value?.trim()){context.append(el('dt','',label),el('dd','',value));}
 match.append(context,el('h4','','Groupe mémorisé · N° 1 à 14'));
 const roster=reportSummaryRoster(report),numbered=roster.filter(p=>Number(p.number)>=1&&Number(p.number)<=14),other=roster.filter(p=>!numbered.includes(p));
 function playerList(players){const list=el('ol','report-summary-roster');for(const p of players){const row=el('li'),identity=el('div');row.dataset.summaryNumber=p.number||'';row.append(el('span','report-summary-number',p.number||'—'));
  identity.append(el('strong','',p.name),el('small','',p.role==='sub'?'Impacteur / Finisseur':p.role||'Statut à préciser'));
  const stats=[];if(p.minutes!==undefined&&p.minutes!=='')stats.push(p.minutes+' min');for(const [key,label]of [['goals','but(s)'],['assists','passe(s)'],['yellowCards','jaune(s)'],['redCards','rouge(s)']])if(p[key]!==undefined&&p[key]!=='')stats.push(p[key]+' '+label);
  if(p.attendanceMode==='manual'&&p.attendanceRate!==''&&p.attendanceRate!==undefined)stats.push('Présence '+p.attendanceRate+' %');
  if(stats.length)identity.append(el('small','report-summary-player-stats',stats.join(' · ')));row.append(identity);list.append(row);
 }return list;}
 if(numbered.length)match.append(playerList(numbered));else match.append(el('p','report-summary-empty','Aucun joueur numéroté de 1 à 14 dans ce bilan.'));
 if(other.length)match.append(el('h4','','Numéros à préciser ou hors 1–14'),playerList(other));
 if(!roster.length)match.append(el('p','report-summary-empty','Importez la causerie ou renseignez le groupe du match pour retrouver les joueurs ici.'));
 const facts=card('Faits marquants'),timeline=el('ol','report-summary-timeline');
 const events=report.events.map((event,index)=>({event,index})).sort((a,b)=>(a.event.minute===''?Infinity:Number(a.event.minute))-(b.event.minute===''?Infinity:Number(b.event.minute))||a.index-b.index);
 for(const {event:e}of events){const item=el('li','report-summary-event'),detail=el('div');item.dataset.summaryEvent=e.type;const names={'But pour':'But marqué','But contre':'But encaissé','Carton':'Carton · notre équipe','Carton adverse':'Carton · adversaire','Changement':'Changement'};
  if(e.type==='But pour')item.classList.add('is-goal');if(e.card==='red')item.classList.add('is-red-card');
  item.append(el('time','',e.minute!==''?e.minute+'′':'—'));detail.append(el('strong','',names[e.type]||e.type));
  const text=reportEventDescription(e);if(text?.trim())detail.append(el('p','',text));item.append(detail);timeline.append(item);
 }
 facts.append(events.length?timeline:el('p','report-summary-empty','Aucun fait marquant renseigné.'));
 const tactics=card('Bilan tactique & Action');
 function note(parent,title,value){if(!value?.trim())return;const section=el('div','report-summary-note');section.append(el('h4','',title),el('p','',value));parent.append(section);}
 const a=report.analysis,plan=report.plan;
 for(const [label,key]of [['Avec le ballon','withBall'],['Sans le ballon','withoutBall'],['Points forts offensifs','topAttack'],['Points forts défensifs','topDefence'],['À améliorer avec le ballon','improveAttack'],['À améliorer sans le ballon','improveDefence'],['Récupération / perte','transitions'],['Phases arrêtées','setPieces']])note(tactics,label,a[key]);
 const priority=el('section','report-summary-priority');priority.append(el('h4','','Priorité de la semaine'),el('p','',plan.priority?.trim()||'Priorité à définir'));tactics.append(priority);
 note(tactics,'Objectif de séance',plan.sessionObjective);note(tactics,'Exercice prévu',plan.sessionExercise);note(tactics,'Message au groupe',plan.summary);
 const ratings=el('div','report-summary-ratings');
 for(const [key,label]of Object.entries({...reportSport,...reportHuman})){const r=report.ratings[key];if(r?.score||r?.note?.trim()){const row=el('div');row.append(el('strong','',label+(r.score?' · '+r.score+' / 5':'')));if(r.note?.trim())row.append(el('p','',r.note));ratings.append(row);}}
 if(ratings.children.length){tactics.append(el('h4','','Évaluations et observations'),ratings);}
 for(const [label,key]of [['Focus individuel','individualFocus'],['Remarques du staff','staff'],['Première période · note conservée','firstHalf'],['Seconde période · note conservée','secondHalf'],['Temps forts · note conservée','strongMoments'],['Temps faibles · note conservée','weakMoments'],['Faits adverses · note conservée','keyOpponentEvents']])note(tactics,label,a[key]);
 for(const [label,key]of [['Suivi prévu','reviewDate'],['Séance antérieure 1','session1'],['Séance antérieure 2','session2'],['Séance antérieure 3','session3']])note(tactics,label,plan[key]);
 view.append(grid);return view;
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
