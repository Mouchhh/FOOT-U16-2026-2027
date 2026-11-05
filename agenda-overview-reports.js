// Vue dérivée : ne modifie ni les événements, ni les présences, ni les bilans.
function agendaOverviewSnapshot(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mois invalide');
 const now=playerStatsNow(),from=month+'-01',to=agendaCalendarAdd(agendaCalendarMonth(month,1)+'-01',-1);
 const reports=playerStatsUniqueEvents(reportLibrary.filter(r=>reportValid(r)&&playerStatsOwns(r)&&r.info.date>=from&&r.info.date<=to&&r.info.date<=now.day));
 const events=agendaCalendarAllEvents({from,to}).filter(e=>['training','match'].includes(e.kind)&&e.date>=from&&e.date<=to);
 const used=new Set(),rows=[],seen=new Set();
 const due=e=>e.date<now.day||e.date===now.day&&!!e.time&&e.time<=now.time;
 for(const event of events){
  if(event.kind==='training'){
   const key=event.date+'T'+event.time;if(seen.has('training:'+key))continue;seen.add('training:'+key);
   const session=window.playerAttendanceSessions.sessionFor(event),attendance=session?.attendance;
   const pointage=attendance&&trainingAttendanceValid(attendance)&&attendance.rows.some(r=>r.included&&['present','absent'].includes(r.status));
   rows.push({event,session,report:null,due:due(event),done:due(event)&&!!pointage,planned:true});
  }else{
   const keys=agendaMatchKeys(event),key=keys[0];if(seen.has('match:'+key))continue;seen.add('match:'+key);
   const exact=reports.filter(r=>keys.includes(r.agendaSourceKey));
   const board=agendaEventBoard(event),opponent=event.fff?.opponent||board?.matchPreparation?.opponent;
   const candidates=opponent?reports.filter(r=>r.info.date===event.date&&playerStatsName(r.info.opponent)===playerStatsName(opponent)):[];
   const report=exact[0]||(candidates.length===1?candidates[0]:null);
   if(report)used.add(report.id);
   rows.push({event,report,session:null,due:due(event),done:due(event)&&!!(report&&documentCompletionIsCompleted('report',report)||event.fff?.score),planned:true});
  }
 }
 for(const report of reports)if(!used.has(report.id))rows.push({event:{id:'report:'+report.id,kind:'match',date:report.info.date,time:report.info.time,title:report.title||report.info.opponent},report,session:null,due:due({date:report.info.date,time:report.info.time}),done:documentCompletionIsCompleted('report',report),planned:false});
 const elapsed=rows.filter(r=>r.planned&&r.due),done=elapsed.filter(r=>r.done),rate=elapsed.length?Math.round(100*done.length/elapsed.length):null;
 const stats=monthlyPlayerSnapshot(month),players=[...stats.players.values()];
 let present=0,absent=0;for(const p of players){present+=p.attendance.present;absent+=p.attendance.absent;}
 const trainings=elapsed.filter(r=>r.event.kind==='training'),durations=trainings.filter(r=>Number.isFinite(r.session?.duration));
 const plannedMinutes=durations.reduce((n,r)=>n+r.session.duration,0),documentedMinutes=durations.filter(r=>r.done).reduce((n,r)=>n+r.session.duration,0);
 const minutes=players.filter(p=>p.known.minutes).map(p=>p.totals.minutes);
 return {month,from,to,rows:rows.sort((a,b)=>b.event.date.localeCompare(a.event.date)||(b.event.time||'').localeCompare(a.event.time||'')),elapsed,done,rate,assiduity:present+absent?Math.round(100*present/(present+absent)):null,present,absent,plannedMinutes,documentedMinutes,durationsKnown:durations.length,durationsExpected:trainings.length,minutes,players};
}
document.addEventListener('DOMContentLoaded',()=>{
 const host=$('agenda-page-0'),counts=$('coach-agenda-counts');if(!host)return;counts.hidden=true;
 const root=el('section','agenda-overview-reports');root.id='agenda-overview-reports';
 const header=el('div','agenda-overview-heading'),title=el('h2','','Vue d’ensemble & Rapports'),label=el('label','','Période'),month=document.createElement('input');month.type='month';month.id='agenda-overview-month';month.value=agendaCalendarToday().slice(0,7);label.append(month);header.append(title,label);
 const body=el('div','agenda-overview-grid'),main=el('div'),summary=el('aside','agenda-overview-summary'),kpis=el('section','agenda-overview-kpis'),activity=el('section','agenda-overview-activity');main.append(kpis,activity);body.append(main,summary);root.append(header,body);host.append(root);
 const percent=v=>v===null?'—':v+' %';
 function metric(label,value,note){const item=el('div','agenda-overview-metric');item.append(el('span','',label),el('strong','',value));if(note)item.append(el('small','',note));return item;}
 function openReport(report){if(currentReport.id!==report.id&&!workspaceReplaceDraft('report',report))return;workspaceNavigation.run('view-reports',()=>{reportTab='general';renderReportTabs();renderReportContent();});}
 function render(){
  if(!month.validity.valid||!month.value)return;
  const s=agendaOverviewSnapshot(month.value);kpis.replaceChildren();activity.replaceChildren();summary.replaceChildren();
  const previous=agendaOverviewSnapshot(agendaCalendarMonth(month.value,-1));
  const delta=s.rate!==null&&previous.rate!==null?s.rate-previous.rate:null;
  kpis.append(metric('Taux de réalisation documenté',percent(s.rate),delta===null?'Événements échus uniquement':(delta>=0?'+':'')+delta+' points par rapport au mois précédent'));
  for(const [kind,label]of [['training','Séances réalisées'],['match','Matchs joués']]){const all=s.elapsed.filter(r=>r.event.kind===kind);kpis.append(metric(label,all.filter(r=>r.done).length+' / '+all.length));}
  activity.append(el('h3','','Activité du mois · accès direct'));
  const details=el('p','agenda-overview-note','Réalisé = présences pointées, bilan validé ou score officiel. Une préparation enregistrée ne prouve pas la réalisation.');activity.append(details);
  if(!s.rows.length)activity.append(el('p','hint','Aucun événement dans cette équipe pour ce mois.'));
  for(const row of s.rows){const e=row.event,article=el('article','agenda-overview-event is-'+e.kind),text=el('div'),actions=el('div','agenda-overview-actions');
   text.append(el('small','',[e.kind==='match'?'Match':'Séance',agendaCalendarDateLabel(e.date),e.time].filter(Boolean).join(' · ')),el('strong','',e.title||e.label||'Événement'),el('span','agenda-overview-state',(!row.planned?'Hors planning · ':'')+(row.done?'Réalisation documentée':row.due?'Réalisation à confirmer':'À venir')));
   const button=el('button','export',row.report?'Consulter le Rapport →':e.kind==='training'?'Voir la Séance →':row.due?'Compléter le bilan →':'Voir la préparation →');button.type='button';
   button.onclick=()=>{if(row.report)openReport(row.report);else if(e.kind==='match')row.due?agendaEventReport(e,e.date):e.open();else if(row.session){loadTraining(row.session);if(currentTraining.id===row.session.id)workspaceNavigation.run('view-training',()=>trainingWizard.go(3));}else e.open();};actions.append(button);
   if(e.kind==='training'&&row.due){const attendance=el('button','export','Présences');attendance.type='button';attendance.onclick=()=>window.playerAttendanceSessions.open({date:e.date,year:playerStatsSeason(e.date)});actions.append(attendance);}
   article.append(text,actions);activity.append(article);
  }
  summary.append(el('h3','','Synthèse mensuelle'),metric('Assiduité globale',percent(s.assiduity),s.present+' présences · '+s.absent+' absences pointées'));
  if(s.assiduity!==null){const meter=document.createElement('progress');meter.max=100;meter.value=s.assiduity;meter.setAttribute('aria-label','Assiduité globale');summary.append(meter);}
  summary.append(metric('Volume documenté',s.documentedMinutes+' / '+s.plannedMinutes+' min',s.durationsKnown+' / '+s.durationsExpected+' séances avec durée connue. Estimation selon la durée prévue des séances pointées.'));
  if(s.plannedMinutes){const meter=document.createElement('progress');meter.max=s.plannedMinutes;meter.value=s.documentedMinutes;meter.setAttribute('aria-label','Volume documenté sur volume prévu connu');summary.append(meter);}
  summary.append(metric('Répartition des temps de jeu',s.minutes.length?Math.min(...s.minutes)+'–'+Math.max(...s.minutes)+' min':'—',s.minutes.length+' / '+s.players.length+' joueurs avec minutes renseignées'));
  if(s.minutes.length)summary.append(el('small','agenda-overview-note','Moyenne : '+Math.round(s.minutes.reduce((n,v)=>n+v,0)/s.minutes.length)+' min. Les valeurs manquantes ne sont pas assimilées à zéro.'));
  const players=el('button','export','Voir le suivi mensuel des joueurs →');players.type='button';players.onclick=()=>window.monthlyPlayerReview.open(month.value);
  const print=el('button','primary','Exporter le Rapport Mensuel');print.type='button';print.id='agenda-overview-export';print.onclick=()=>exportPDF(s);
  summary.append(players,el('p','agenda-overview-note','Les séances sans pointage ne sont pas comptées comme des absences. Le volume réellement effectué n’est pas mesuré séparément.'),print);
 }
 function exportPDF(s){
  exportPDF.cleanup?.();$('agenda-overview-print')?.remove();const paper=el('section');paper.id='agenda-overview-print';
  paper.append(el('h1','','Stade Mayennais · Rapport mensuel'),el('p','',[activeCoach.name,activeCoachTeam.name||activeCoachTeam.category||activeCoachTeam.team,s.month].filter(Boolean).join(' · ')),el('p','','Réalisation documentée : '+percent(s.rate)+' · Assiduité : '+percent(s.assiduity)));
  paper.append(summary.cloneNode(true));paper.querySelectorAll('button').forEach(b=>b.remove());
  for(const row of s.rows)paper.append(el('p','',row.event.date+' · '+row.event.title+' · '+(row.done?'Réalisation documentée':row.due?'À confirmer':'À venir')));
  paper.append(el('h2','','Suivi individuel'));
  for(const p of s.players)paper.append(el('p','',p.player.name+' · '+(p.known.minutes?p.totals.minutes+' min':'Minutes non renseignées')+' · Présence : '+percent(p.attendance.rate)+' · Buts / passes : '+playerStatsDisplay(p,'goals')+' / '+playerStatsDisplay(p,'assists')+' · Cartons J/R : '+playerStatsDisplay(p,'yellowCards')+' / '+playerStatsDisplay(p,'redCards')));
  document.body.append(paper);document.body.classList.add('agenda-overview-printing');
  const cleanup=()=>{document.body.classList.remove('agenda-overview-printing');paper.remove();window.removeEventListener('afterprint',cleanup);if(exportPDF.cleanup===cleanup)exportPDF.cleanup=null;};
  exportPDF.cleanup=cleanup;window.addEventListener('afterprint',cleanup,{once:true});try{window.print();}catch{cleanup();notify('L’impression est indisponible dans ce navigateur.');}
 }
 month.onchange=render;const old=renderCoachAgenda;renderCoachAgenda=function(){const result=old.apply(this,arguments);render();return result;};
 window.agendaOverviewReports={render,snapshot:agendaOverviewSnapshot};render();
});
