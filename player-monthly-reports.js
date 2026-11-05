document.addEventListener('DOMContentLoaded',()=>{
 const controls=el('div','player-monthly-controls'),label=el('label','','Mois du bilan individuel'),month=document.createElement('input');month.type='month';month.id='player-monthly-month';month.value=playerStatsNow().day.slice(0,7);label.append(month);controls.append(label);squadList.before(controls);
 const icon='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M14 3H6v18h12V7Z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></svg>';
 const rate=a=>a.rate===null?'—':a.rate+' %';
 const owner=()=>activeCoach.id+':'+activeCoachTeam.id;
 function data(){return playerMonthlySnapshot(month.value);}
 function indicator(title,a){const part=el('div','player-monthly-attendance');part.append(el('small','',title),el('strong','',rate(a)),el('span','',a.present+'/'+a.known+' séances & matchs pointés'));part.title=a.unknown+' présence(s) à confirmer, exclue(s) du taux';const meter=document.createElement('progress');meter.max=100;meter.value=a.rate||0;meter.setAttribute('aria-label',title);if(a.rate===null)meter.setAttribute('aria-valuetext','Aucun pointage connu');part.append(meter);return part;}
 function decorate(){
  const year=playerStatsCurrentSeason();if(month.value&&playerStatsSeason(month.value+'-01')!==year)month.value=year===playerStatsSeason()?playerStatsNow().day.slice(0,7):year+'-07';
  if(!month.value||!month.validity.valid)return;const snapshot=data();
  for(const card of squadList.querySelectorAll('[data-player-id]')){
   card.querySelector('.player-monthly-row')?.remove();const row=snapshot.get(card.dataset.playerId);if(!row)continue;
   // L'ancien indicateur ne concernait que les entraînements : les deux nouveaux le remplacent.
   const old=card.querySelector('.player-stat-badges [data-stat="attendance"]');if(old)old.hidden=true;
   const strip=el('div','player-monthly-row'),button=el('button','player-monthly-pdf');button.type='button';button.innerHTML=icon;button.append(document.createTextNode('Bilan Mensuel (PDF)'));button.setAttribute('aria-label','Bilan Mensuel (PDF) · '+row.player.name);button.onclick=e=>{e.stopPropagation();printPlayer(data().get(row.player.id));};
   const edit=el('button','player-monthly-review-edit');edit.type='button';edit.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m4 16 12-12 4 4-12 12H4ZM14 6l4 4"/></svg>';edit.setAttribute('aria-label','Appréciations mensuelles · '+row.player.name);edit.title='Rédiger les appréciations du mois';edit.onclick=e=>{e.stopPropagation();open(row.player.id);};
   const actions=el('div','player-monthly-row-actions');actions.append(button,edit);
   strip.append(indicator('Présence ce mois',row.attendance),indicator('Présence Saison',row.season),actions);card.append(strip);
  }
 }
 const panel=el('section','player-monthly-editor');panel.hidden=true;panel.id='player-monthly-editor';controls.after(panel);let selected=null,expectedOwner=null;
 function open(id,period=null){if(period&&/^\d{4}-(0[1-9]|1[0-2])$/.test(period)){month.value=period;playerStatsSelectedSeason=playerStatsSeason(period+'-01');}const row=data().get(id);if(!row)return;selected=id;expectedOwner=owner();let baseline=JSON.stringify(row.player.monthlyReviews?.[month.value]||null);panel.replaceChildren();panel.hidden=false;
  const header=el('div','player-monthly-editor-head'),close=el('button','export','Retour à l’effectif');close.type='button';close.onclick=()=>{panel.hidden=true;};header.append(el('h3','','Bilan mensuel · '+row.player.name+' · '+month.value),close);panel.append(header);
  const stats=el('p','player-monthly-editor-stats');stats.textContent='Présence : '+rate(row.attendance)+' ('+row.attendance.present+'/'+row.attendance.known+') · '+playerStatsDisplay(row.stats,'minutes')+' min · ⚽ '+playerStatsDisplay(row.stats,'goals')+' · 👟 '+playerStatsDisplay(row.stats,'assists');panel.append(stats);
  const fields=el('div','player-monthly-editor-fields'),inputs={};
  for(const [key,title]of [['appreciation','Appréciation du mois'],['focus','Axes de travail']]){const wrap=el('label','',title),input=document.createElement('textarea');input.rows=3;input.maxLength=2000;input.value=row.review[key]||'';inputs[key]=input;wrap.append(input);fields.append(wrap);}panel.append(fields);
  const actions=el('div','player-monthly-editor-actions'),save=el('button','export','Enregistrer les appréciations'),print=el('button','player-monthly-pdf');save.type=print.type='button';print.innerHTML=icon;print.append(document.createTextNode('Imprimer / Enregistrer en PDF'));const status=el('p','hint');status.setAttribute('role','status');
  function saveReview(){if(owner()!==expectedOwner)return notify('L’équipe a changé. Rouvrez le bilan.'),false;const players=squadPlayers(),player=players.find(p=>p.id===id);if(!player)return false;if(JSON.stringify(player.monthlyReviews?.[month.value]||null)!==baseline)return notify('Ces appréciations ont changé. Rouvrez le bilan avant de les modifier.'),false;
   const values={appreciation:inputs.appreciation.value,focus:inputs.focus.value};if(values.appreciation===(player.monthlyReviews?.[month.value]?.appreciation||'')&&values.focus===(player.monthlyReviews?.[month.value]?.focus||''))return true;
   const entry={...values,updatedAt:new Date().toISOString()};
   const updated=players.map(p=>p.id===id?{...p,monthlyReviews:{...(p.monthlyReviews||{}),[month.value]:entry}}:p);
   if(!squadSave(updated))return false;baseline=JSON.stringify(entry);status.textContent='Appréciations enregistrées.';decorate();return true;}
  save.onclick=saveReview;print.onclick=()=>{if(saveReview())printPlayer(data().get(id));};actions.append(save,print);panel.append(actions,status);panel.scrollIntoView({block:'start',behavior:'instant'});
 }
 function printPlayer(row){
  if(!row)return;printPlayer.cleanup?.();const paper=el('article');paper.id='player-monthly-print';
  paper.append(el('p','player-monthly-print-brand','STADE MAYENNAIS · BILAN INDIVIDUEL'),el('h1','',row.player.name),el('p','',row.month+' · '+squadPlayerCategory(row.player)+' · '+(row.player.position||'Poste non renseigné')+' · '+activeCoach.name));
  const metrics=el('div','player-monthly-print-metrics');metrics.append(indicator('Présence du mois',row.attendance),indicator('Présence Saison',row.season));paper.append(metrics);
  paper.append(el('p','','Temps de jeu : '+playerStatsDisplay(row.stats,'minutes')+' min · Buts : '+playerStatsDisplay(row.stats,'goals')+' · Passes décisives : '+playerStatsDisplay(row.stats,'assists')+' · Cartons J/R : '+playerStatsDisplay(row.stats,'yellowCards')+' / '+playerStatsDisplay(row.stats,'redCards')));
  const table=document.createElement('table'),head=document.createElement('tr');for(const value of ['Date','Match','Statut','Minutes','Buts / passes','Jaunes / rouges'])head.append(el('th','',value));table.append(head);
  for(const r of row.stats.reports){const line=document.createElement('tr');for(const value of [r.date,r.title,r.role||'Non renseigné',r.minutes!==''&&r.minutes!==undefined?r.minutes:'—',(r.goals===''?'—':r.goals??'—')+' / '+(r.assists===''?'—':r.assists??'—'),(r.yellowCards===''?'—':r.yellowCards??'—')+' / '+(r.redCards===''?'—':r.redCards??'—')])line.append(el('td','',String(value)));table.append(line);}paper.append(el('h2','','Bilans et temps de jeu'),row.stats.reports.length?table:el('p','','Aucun bilan validé ce mois.'));
  paper.append(el('h2','','Présences · séances et matchs'));
  for(const e of row.attendance.entries)paper.append(el('p','',e.date+' · '+(e.kind==='match'?'Match':'Séance')+' · '+e.title+' · '+({present:'Présent',absent:'Absent',uncertain:'À confirmer'}[e.status]||'À confirmer')));
  if(!row.attendance.entries.length)paper.append(el('p','','Aucun pointage enregistré.'));
  paper.append(el('h2','','Faits de jeu individuels'));
  let facts=0;for(const {report}of row.matches)for(const e of report.events){const ids=[e.playerId,e.assisterId,e.secondPlayerId];if(!ids.includes(row.player.id))continue;paper.append(el('p','',report.info.date+' · '+(e.minute!==''?e.minute+'′ · ':'')+reportEventDescription(e)));facts++;}if(!facts)paper.append(el('p','','Aucun fait individuel renseigné.'));
  paper.append(el('h2','','Appréciation du mois'),el('p','',row.review.appreciation||'Non renseignée'),el('h2','','Axes de travail'),el('p','',row.review.focus||'Non renseignés'));
  for(const {report,row:player}of row.matches)for(const [key,title]of [['note','Observation du bilan'],['objective','Objectif individuel conservé']])if(player[key]?.trim())paper.append(el('h3','',title+' · '+report.info.date),el('p','',player[key]));
  paper.append(el('small','','Présences : pointages connus uniquement. Les valeurs à confirmer, les séances futures et les matchs non validés sont exclus des taux. Les buts concernent les buts marqués et passes décisives attribués au joueur ; aucun but encaissé individuel n’est déduit.'));
  const oldTitle=document.title,printTitle='Bilan mensuel · '+row.player.name+' · '+row.month;document.title=printTitle;document.body.append(paper);document.body.classList.add('player-monthly-printing');const css=document.createElement('style');css.textContent='@page{size:A4 portrait;margin:14mm}';paper.append(css);
  const cleanup=()=>{paper.remove();if(document.title===printTitle)document.title=oldTitle;document.body.classList.remove('player-monthly-printing');window.removeEventListener('afterprint',cleanup);if(printPlayer.cleanup===cleanup)printPlayer.cleanup=null;};printPlayer.cleanup=cleanup;window.addEventListener('afterprint',cleanup,{once:true});try{window.print();}catch{cleanup();notify('Impression indisponible dans ce navigateur.');}
 }
 function matchControls(){
  if(currentReport.eventType==='training')return;
  for(const line of document.querySelectorAll('#report-players-panel .report-minute-line[data-attendance-roster-id]')){
   if(line.querySelector('.player-match-presence'))continue;const id=line.dataset.attendanceRosterId,player=squadPlayers().find(p=>p.id===id);if(!player)continue;
   const label=el('label','player-match-presence','Match'),select=document.createElement('select');select.setAttribute('aria-label','Présence match · '+player.name);select.append(new Option('—','uncertain'),new Option('Présent','present'),new Option('Absent','absent'));
   const get=()=>currentReport.players.find(r=>playerStatsResolve(r)?.id===id);select.value=get()?.matchPresence||'uncertain';select.onchange=()=>{let row=get();if(!row){if(currentReport.players.length>=40)return notify('40 joueurs maximum.');const remembered=currentReport.preparation?.roster?.find(p=>playerStatsName(p.name)===playerStatsName(player.name));row={id:crypto.randomUUID(),squadPlayerId:id,name:player.name,number:String(player.number),role:remembered?.role==='sub'?'Impacteur / Finisseur':'Titulaire',minutes:'',score:'',note:'',objective:''};currentReport.players.push(row);}if(select.value==='absent'&&Number(row.minutes)>0){select.value=row.matchPresence||'uncertain';return notify('Ce joueur a des minutes jouées. Corrigez-les avant de le déclarer absent.');}row.matchPresence=select.value;reportAutosave();};label.append(select);line.append(label);
  }
 }
 const render=squadRender;squadRender=function(...args){const result=render.apply(this,args);decorate();return result;};
 const renderReport=renderReportContent;renderReportContent=function(...args){const result=renderReport.apply(this,args);matchControls();return result;};
 const renderMinutes=renderReportQuickMinutes;renderReportQuickMinutes=function(...args){const result=renderMinutes.apply(this,args);matchControls();return result;};
 month.onchange=()=>{panel.hidden=true;if(month.value&&month.validity.valid){playerStatsSelectedSeason=playerStatsSeason(month.value+'-01');squadRender();}};document.addEventListener('attendance-saved',decorate);document.addEventListener('report-saved',decorate);
 const monthlyRoot=document.querySelector('.monthly-review-content');
 function monthlyButtons(){for(const row of document.querySelectorAll('.monthly-player-row[data-monthly-player]')){if(row.querySelector('.player-monthly-pdf'))continue;const b=el('button','player-monthly-pdf');b.type='button';b.innerHTML=icon;b.append(document.createTextNode('Bilan Mensuel (PDF)'));b.onclick=()=>{const period=$('monthly-review-month').value;printPlayer(playerMonthlySnapshot(period).get(row.dataset.monthlyPlayer));};row.append(b);}}
 if(monthlyRoot)new MutationObserver(monthlyButtons).observe(monthlyRoot,{childList:true});monthlyButtons();
 const previousPrint=prepareReportPrint;window.removeEventListener('beforeprint',previousPrint);prepareReportPrint=function(){if(!document.body.classList.contains('player-monthly-printing'))return previousPrint.apply(this,arguments);};window.addEventListener('beforeprint',prepareReportPrint);
 new MutationObserver(matchControls).observe($('report-content'),{childList:true,subtree:true});
 window.playerMonthlyReports={open,print:printPlayer,snapshot:playerMonthlySnapshot};decorate();matchControls();
});
