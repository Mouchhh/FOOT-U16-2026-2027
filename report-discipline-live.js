// Projection du bilan ouvert : la bibliothèque et les cumuls sauvegardés ne sont pas modifiés.
function reportDisciplinePreview(report){
 if(report.eventType==='training')return [];
 const roster=squadPlayers(),draft=reportEventsApply(structuredClone(report),roster),now=playerStatsNow();
 const dated=trainingDateValid(draft.info.date);if(!dated)draft.info.date=now.day;
 if(draft.info.date>now.day)return [];
 const key=playerStatsEventKey(draft),reports=reportLibrary.filter(r=>r.id!==draft.id&&playerStatsEventKey(r)!==key);
 const snapshot=playerStatsSeasonSnapshot(playerStatsSeason(draft.info.date),{roster,reports:[...reports,draft],now:{...now,day:draft.info.date,time:draft.info.date===now.day?now.time:'23:59'}});
 const seen=new Set(),warnings=[];
 for(const row of draft.players){const player=playerStatsResolve(row,roster);if(!player||seen.has(player.id)||Number(row.yellowCards)<=0||!row.yellowCards)continue;seen.add(player.id);
  const stats=snapshot.players.get(player.id);if(!stats)continue;
  warnings.push({player,status:stats.discipline,dateMissing:!dated});
 }return warnings;
}
function reportDisciplineBanner(root,report){
 root.querySelector('.report-discipline-live')?.remove();const warnings=reportDisciplinePreview(report);if(!warnings.length)return;
 const banner=el('section','report-discipline-live');banner.setAttribute('aria-label','Suivi des avertissements');banner.setAttribute('aria-live','polite');
 for(const {player,status,dateMissing}of warnings){const row=el('div','report-discipline-live-item'+(status.alert?' is-critical':''));row.dataset.disciplinePlayer=player.id;if(status.alert)row.setAttribute('role','alert');
  const card=el('i','player-stat-card-symbol is-yellow');card.setAttribute('aria-hidden','true');const text=el('div');text.append(el('strong','',player.name+' · '+status.yellow+' jaune'+(status.yellow>1?'s':'')+' / '+status.matches+' match'+(status.matches>1?'s':'')));
  text.append(el('small','',status.alert?'Risque de suspension · seuil de 3 jaunes atteint. Vérifiez la situation disciplinaire.':'Avertissement pris en compte · seuil d’alerte : 3 jaunes sur la série de 10 matchs.'));
  if(dateMissing)text.append(el('small','','Date du match à préciser pour confirmer le suivi.'));row.append(card,text);banner.append(row);
 }
 banner.append(el('p','report-discipline-live-note','Projection avec le bilan en cours. Les statistiques de l’effectif sont mises à jour à l’enregistrement.'));
 const error=root.querySelector('#report-goal-error');if(error)error.before(banner);else{
  const facts=root.querySelector('.report-summary-timeline')?.closest('.report-summary-card')||root.querySelector('.report-summary-main>.report-summary-card');if(facts)facts.querySelector('h3').after(banner);
 }
}
document.addEventListener('DOMContentLoaded',()=>{
 function refresh(){if(['general','players','preview'].includes(reportTab))reportDisciplineBanner($('report-content'),currentReport);}
 const commit=reportEventsCommit;reportEventsCommit=function(...args){const result=commit.apply(this,args);refresh();return result;};
 const render=renderReportContent;renderReportContent=function(...args){const result=render.apply(this,args);refresh();return result;};
 const summary=reportSummaryDashboard;reportSummaryDashboard=function(report){const view=summary(report);reportDisciplineBanner(view,report);return view;};
 $('report-content').addEventListener('input',event=>{if(event.target.matches('input,select'))refresh();});refresh();
});
