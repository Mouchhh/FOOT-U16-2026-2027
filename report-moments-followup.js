// Match narrative is separate from the canonical player statistics and attendance.
const reportMomentFields = {strongMoments:'Temps forts',weakMoments:'Temps faibles',keyOpponentEvents:'Faits de jeu majeurs et événements clés de l’adversaire'};
const reportMomentValid = reportValid;
reportValid = function(report) {
  return reportMomentValid(report) && Object.keys(reportMomentFields).every(key => report.analysis[key] === undefined || reportText(report.analysis[key]));
};
renderReportPlayers = function(root) {
  const section = el('section', 'report-moments-events');
  section.id = 'report-moments-panel';
  renderReportEvents(section);
  const tools = section.querySelector('.report-actions');
  tools.replaceChildren();
  for (const [label, type, card] of [['+ Fait de jeu de notre équipe','But pour',''],['+ Fait de jeu de l’adversaire','But contre',''],['+ Carton jaune','Carton','yellow'],['+ Carton rouge','Carton','red']]) {
    const button=el('button','export',label);button.type='button';
    button.onclick=()=>{
      if(currentReport.events.length>=100)return notify('100 faits maximum.');
      reportEventsCommit(()=>currentReport.events.push({minute:'',type,card,detail:''}));
    };
    tools.append(button);
  }
  for (const select of section.querySelectorAll('[aria-label="Événement"]')) {
    const selected=select.value;
    for (const option of [...select.options]) {
      if(!['But pour','But contre','Carton','Carton adverse',selected].includes(option.value))option.remove();
      else if(option.value==='But pour')option.textContent='But marqué';
      else if(option.value==='But contre')option.textContent='But encaissé';
    }
  }
  root.append(section);
};
const reportMomentsDocument = buildReportDocument;
buildReportDocument = function(...args) {
  const document = reportMomentsDocument.apply(this,args);
  const section = el('section');
  for (const [key,label] of Object.entries(reportMomentFields)) if(currentReport.analysis[key]?.trim()) reportPrintText(section,label,currentReport.analysis[key]);
  if(section.children.length) {section.prepend(el('h2','','Moments marquants'));document.append(section);}
  return document;
};
document.addEventListener('DOMContentLoaded', () => {
  const navigation = el('div','squad-followup-tabs');
  navigation.setAttribute('role','group');navigation.setAttribute('aria-label','Vues de l’effectif');
  const roster = el('button','export','Effectif'), follow = el('button','export','Suivi des joueurs');
  roster.type=follow.type='button';navigation.append(roster,follow);squadHeading.after(navigation);
  const panel = el('section','squad-followup');panel.id='squad-followup';panel.hidden=true;
  const label = el('label','report-field','Joueur'), select=el('select');select.setAttribute('aria-label','Joueur à suivre');label.append(select);
  const content = el('div','squad-followup-content');content.setAttribute('aria-live','polite');panel.append(label,content);squadList.before(panel);
  let active=false;
  function paint() {
    const id=select.value, players=squadPlayers();
    select.replaceChildren(...players.map(p=>new Option(p.name,p.id)));
    if(players.some(p=>p.id===id))select.value=id;
    const stats=playerStatsSeasonSnapshot(playerStatsCurrentSeason()).players.get(select.value);
    content.replaceChildren();
    if(!stats){content.append(el('p','hint','Aucun joueur dans cette équipe.'));return;}
    content.append(el('h3','',stats.player.name));
    const metrics=el('p','squad-followup-metrics');metrics.textContent=playerStatsDisplay(stats,'minutes')+' min · Présence '+(stats.attendance.rate===null?'—':stats.attendance.rate+' %')+' · '+playerStatsDisplay(stats,'goals')+' buts · '+playerStatsDisplay(stats,'assists')+' passes · Jaunes '+playerStatsDisplay(stats,'yellowCards')+' / Rouges '+playerStatsDisplay(stats,'redCards');content.append(metrics);
    content.append(el('h4','','Historique des bilans'));
    for(const report of [...stats.reports].reverse())content.append(el('p','squad-followup-history',report.date+' · '+report.title+' · '+(report.minutes||'—')+' min · Buts '+(report.goals||'—')+' / Passes '+(report.assists||'—')+' · Jaunes '+(report.yellowCards||'—')+' / Rouges '+(report.redCards||'—')));
    if(!stats.reports.length)content.append(el('p','hint','Aucun bilan enregistré pour cette saison.'));
    content.append(el('h4','','Présences aux séances'));
    for(const entry of [...stats.attendance.entries].reverse())content.append(el('p','squad-followup-history',entry.date+' · '+entry.time+' · '+entry.title+' · '+({present:'Présent',absent:'Absent',uncertain:'À confirmer'}[entry.status]||'À confirmer')));
    if(!stats.attendance.entries.length)content.append(el('p','hint','Aucun pointage enregistré pour cette saison.'));
  }
  function show(on) {active=on;squadDialog.classList.toggle('squad-followup-mode',on);panel.hidden=!on;roster.setAttribute('aria-pressed',String(!on));follow.setAttribute('aria-pressed',String(on));if(on)paint();}
  roster.onclick=()=>show(false);follow.onclick=()=>show(true);select.onchange=paint;
  const before=squadRender;squadRender=function(...args){const result=before.apply(this,args);if(active)paint();return result;};
  if (window.monthlyPlayerReview) {
    const openMonth = monthlyPlayerReview.open;
    monthlyPlayerReview.open = function(...args) { show(false); return openMonth.apply(this,args); };
  }
  show(false);
});
