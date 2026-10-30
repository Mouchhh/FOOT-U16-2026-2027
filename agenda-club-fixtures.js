// Common season data, coach-scoped subscription. A date change keeps the same round key.
function agendaClubSchedule(){try{const id=coachStorageGet('vestiaire-club-calendar-team');return clubFixtureSchedules.find(s=>s.id===id)||null;}catch{return null;}}
function agendaClubFixtures(schedule=agendaClubSchedule()){
 if(!schedule)return [];
 return schedule.fixtures.map(f=>{const home=f.home===schedule.team;return {...f,key:'club:'+schedule.id+':j'+f.round,title:f.home+' / '+f.away,opponent:home?f.away:f.home,team:schedule.team,category:schedule.category,competition:schedule.competition+' · Journée '+f.round,location:home?'À domicile · stade à préciser':'À l’extérieur · stade à préciser',status:f.status||'confirmed'};});
}
function agendaClubFixtureEvents(){
 const schedule=agendaClubSchedule();if(!schedule)return [];
 return agendaClubFixtures(schedule).filter(f=>f.status!=='cancelled'&&agendaCalendarMatches(f.date,schedule.category,activeCoach.name)).map(f=>({id:f.key,kind:'match',label:f.score?'Match joué':'Match',date:f.date,time:f.time,title:f.title+(f.score?' · '+f.score.home+'–'+f.score.away:''),category:schedule.category,fff:f,sourceInfo:schedule.source+' · '+schedule.season,open:()=>agendaFFFPrepare(f)}));
}
document.addEventListener('DOMContentLoaded',()=>{
 const panel=el('section','agenda-fff-panel agenda-club-fixtures');panel.id='agenda-club-fixtures';
 const heading=el('h3','','Les rencontres de mon équipe'),label=el('label','report-field','Choisir mon calendrier d’équipe'),select=el('select');select.id='agenda-club-team';select.append(new Option('Choisir une équipe…',''));for(const schedule of clubFixtureSchedules)select.append(new Option(schedule.team+' · '+schedule.category+' Division 1 · '+schedule.season,schedule.id));label.append(select);
 const summary=el('p','hint'),status=el('p','hint');status.id='agenda-club-status';status.setAttribute('role','status');
 panel.append(heading,label,summary,status);$('agenda-fff-panel').before(panel);
 function refresh(){const schedule=agendaClubSchedule();select.value=schedule?.id||'';summary.textContent=schedule?schedule.fixtures.length+' rencontres disponibles, dont '+schedule.fixtures.filter(f=>f.score).length+' avec résultat. Les matchs apparaissent automatiquement dans votre agenda. Les autres coachs peuvent choisir ce même calendrier sans importer de fichier.':'Choisissez votre équipe une fois sur cet appareil. Son calendrier partagé s’affichera dans votre agenda.';status.textContent=schedule?'Source : rencontres transmises par le club · horaires de Paris. Les corrections du calendrier partagé seront reprises à la mise à jour du site ; aucune synchronisation FFF en direct.':'';}
 select.onchange=()=>{try{coachStorageSet('vestiaire-club-calendar-team',select.value);renderCoachAgenda();}catch{refresh();status.textContent='Choix non enregistré. Votre calendrier précédent est conservé.';}};
 const events=agendaCalendarEvents;agendaCalendarEvents=function(){const base=events(),incoming=agendaClubFixtureEvents(),fixtures=agendaClubFixtures(),linked=new Map();for(const board of [getCompositionBoard(),...saves.map(s=>s.state)])if(valid(board)&&board.fffFixtureKey)linked.set('match:'+(board.documentId||'draft'),board.fffFixtureKey);
  for(const event of base){const fixture=fixtures.find(f=>f.key===linked.get(event.id));if(!fixture)continue;if(fixture.status==='cancelled'){event.title='ANNULÉ · '+event.title;continue;}if(fixture.date!==event.date)continue;event.time=fixture.time;event.fff=fixture;event.sourceInfo=agendaClubSchedule().source+' · '+agendaClubSchedule().season;const index=incoming.findIndex(e=>e.id===fixture.key);if(index>=0)incoming.splice(index,1);if(fixture.score&&!event.title.includes(' · '+fixture.score.home+'–'+fixture.score.away))event.title+=' · '+fixture.score.home+'–'+fixture.score.away;}
  return [...base,...incoming].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')||a.title.localeCompare(b.title,'fr'));
 };
 const render=renderCoachAgenda;renderCoachAgenda=function(){render();refresh();};refresh();renderCoachAgenda();
});
