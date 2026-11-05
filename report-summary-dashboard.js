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
 const away=reportMatchLocation(report).venue==='Extérieur';
 const header=el('section','report-summary-match-banner'),identity=el('div');
 identity.append(el('span','eyebrow','STADE MAYENNAIS · SYNTHÈSE'),el('h2','',report.title||'Bilan du match'),el('strong','report-summary-fixture',(away?[info.opponent,info.team]:[info.team,report.eventType==='training'?'':info.opponent]).filter(Boolean).join(' / ')));
 identity.append(el('p','report-summary-match-meta',[info.date,info.time,info.competition,info.round,info.stadium||info.venue,info.category].filter(Boolean).join(' · ')));
 const score=report.eventType==='training'?'Bilan de séance':info.goalsFor!==''&&info.goalsAgainst!==''?(away?info.goalsAgainst:info.goalsFor)+' – '+(away?info.goalsFor:info.goalsAgainst):'Score à renseigner';
 const scores=el('div','report-summary-scores');scores.append(el('div','report-summary-score',score));
 if(report.eventType!=='training'&&(info.halfFor!==''||info.halfAgainst!==''))scores.append(el('small','report-summary-halftime','Mi-temps : '+((away?info.halfAgainst:info.halfFor)||'—')+' – '+((away?info.halfFor:info.halfAgainst)||'—')));
 header.append(identity,scores);view.append(header);
 const grid=el('div','report-summary-grid');
 const card=title=>{const c=el('section','report-summary-card');c.append(el('h3','',title));grid.append(c);return c;};
 const group=card('Groupe');group.classList.add('report-summary-group');const roster=reportSummaryRoster(report),numbered=roster.filter(p=>/^\d+$/.test(String(p.number))&&Number(p.number)>=1&&Number(p.number)<=14),other=roster.filter(p=>!numbered.includes(p));
 const playerList=players=>{
  const list=el('ol','report-summary-roster');
  for(const p of players){
   const row=el('li'),identity=el('div');row.dataset.summaryNumber=p.number||'';row.append(el('span','report-summary-number',p.number||'—'));
   identity.append(el('strong','',p.name),el('small','',p.role==='sub'?'Impacteur / Finisseur':p.role==='starter'?'Titulaire':p.role||'Statut à préciser'));row.title=p.name+' · '+(p.role||'Statut à préciser');
   const metrics=el('span','report-summary-player-metrics');metrics.append(el('span','report-summary-minutes',p.minutes!==undefined&&p.minutes!==''?p.minutes+' min':'—'));
   for(const [key,emoji,label]of [['goals','⚽','Buts'],['assists','👟','Passes décisives']]){
    const raw=p[key],value=raw!==''&&raw!==undefined&&raw!==null&&Number.isInteger(Number(raw))&&Number(raw)>=0?Number(raw):Number.isInteger(p.eventStats?.[key])?p.eventStats[key]:null;
    const stat=el('span','report-summary-player-contribution');stat.dataset.contribution=key;stat.title=label+' dans ce bilan';stat.setAttribute('aria-label',label+' : '+(value===null?'non renseigné':value));
    const icon=el('span','',emoji);icon.setAttribute('aria-hidden','true');stat.append(icon,el('strong','',value===null?'—':String(value)));metrics.append(stat);
   }
   row.append(identity,metrics);list.append(row);
  }return list;
 };
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
 facts.append(events.length?timeline:el('p','report-summary-empty','Aucun fait marquant renseigné.'));
 const main=el('div','report-summary-main');
 const matchRecap=el('section','report-summary-match-recap');matchRecap.append(el('h3','','Repères du match'));
 const context=el('dl','report-summary-match-data');
 for(const [label,value]of [['Organisation',info.formation||report.preparation?.formation],['Durée',info.duration?info.duration+' min':''],['Lieu de rencontre',reportMatchLocation(report).venue],['Conditions',info.conditions],['Buteurs / passeurs renseignés',info.scorers]])if(value?.trim()){context.append(el('dt','',label),el('dd','',value));}
 matchRecap.append(context.children.length?context:el('p','report-summary-empty','Les repères apparaîtront après la saisie du match.'));
 const analysis=el('section','report-summary-analysis');analysis.append(el('h3','','Synthèse de l’analyse'));
 const excerpts=el('div','report-summary-analysis-grid');
 const brief=text=>{const value=(text||'').trim();return value.length>240?value.slice(0,237).trimEnd()+'…':value;};
 for(const [label,values]of [['Avec le ballon',[a.withBall,a.topAttack]],['Sans le ballon',[a.withoutBall,a.topDefence]],['Progrès avec le ballon',[a.improveAttack]],['Progrès sans le ballon',[a.improveDefence]],['Récupération / perte',[a.transitions]],['Phases arrêtées',[a.setPieces]]]){
  const texts=[...new Set(values.filter(t=>t?.trim()).map(t=>t.trim()))];if(!texts.length)continue;
  const note=el('div','report-summary-analysis-item');note.append(el('h4','',label));for(const text of texts)note.append(el('p','',brief(text)));excerpts.append(note);
 }
 analysis.append(excerpts.children.length?excerpts:el('p','report-summary-empty','Aucune observation dans l’analyse pour le moment.'));
 const ratings=el('div','report-summary-rating-chips');
 for(const [key,label]of Object.entries({...reportSport,...reportHuman})){const r=report.ratings[key];if(r?.score){ratings.append(el('span','',label+' · '+r.score+' / 5'));}if(r?.note?.trim()){const note=el('div','report-summary-analysis-item');note.append(el('h4','',label),el('p','',brief(r.note)));excerpts.append(note);}}
 if(excerpts.children.length&&!analysis.contains(excerpts))analysis.replaceChildren(analysis.querySelector('h3'),excerpts);
 if(ratings.children.length)analysis.append(ratings);
 main.append(matchRecap,analysis,facts);grid.append(main);view.append(grid);
 if(plan.summary?.trim()){const message=el('p','report-summary-message');message.append(el('strong','','Message au groupe · '),document.createTextNode(brief(plan.summary)));view.append(message);}
 return view;
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
