// Assigned fixtures appear directly in their educator’s agenda. No category-only or global fallback.
function agendaClubSchedules(){const name=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr');return clubFixtureSchedules.filter(schedule=>schedule.ownerCoachName&&name(schedule.ownerCoachName)===name(activeCoach.name));}
function agendaClubSchedule(){return agendaClubSchedules()[0]||null;}
function agendaClubFixtures(schedule=null){
 return (schedule?[schedule]:agendaClubSchedules()).flatMap(s=>s.fixtures.map(f=>{const home=f.home===s.team;return {...f,scheduleId:s.id,sourceInfo:s.source+' · '+s.season,key:'club:'+s.id+':'+(f.id||'j'+f.round),title:f.home+' / '+f.away,opponent:home?f.away:f.home,team:s.team,category:s.category,competition:(f.competition||s.competition)+' · '+(f.roundLabel||'Journée '+f.round),location:home?'À domicile · stade à préciser':'À l’extérieur · stade à préciser',status:f.status||'confirmed'};}));
}
function agendaClubScore(fixture){return fixture.score?fixture.score.home+'–'+fixture.score.away+(fixture.penalties?' · TAB '+fixture.penalties.home+'–'+fixture.penalties.away:''):'';}
function agendaClubFixtureEvents(){
 return agendaClubFixtures().filter(f=>f.status!=='cancelled'&&agendaCalendarMatches(f.date,f.category,activeCoach.name)).map(f=>({id:f.key,kind:'match',label:(f.score?'Match joué ':'Match ')+f.category,date:f.date,time:f.time,title:f.title+(f.score?' · '+agendaClubScore(f):''),category:f.category,fff:f,sourceInfo:f.sourceInfo,open:()=>agendaFFFPrepare(f)}));
}
document.addEventListener('DOMContentLoaded',()=>{
 const events=agendaCalendarEvents;agendaCalendarEvents=function(){const base=events(),incoming=agendaClubFixtureEvents(),fixtures=agendaClubFixtures(),linked=new Map();for(const board of [getCompositionBoard(),...saves.map(s=>s.state)])if(valid(board)&&board.fffFixtureKey)linked.set('match:'+(board.documentId||'draft'),board.fffFixtureKey);
  const visible=base.filter(event=>{const key=linked.get(event.id);return !clubFixtureSchedules.some(schedule=>key?.startsWith('club:'+schedule.id+':')&&!agendaClubSchedules().includes(schedule));});
  for(const event of visible){const fixture=fixtures.find(f=>f.key===linked.get(event.id));if(!fixture)continue;if(fixture.status==='cancelled'){event.title='ANNULÉ · '+event.title;continue;}if(fixture.date!==event.date)continue;event.time=fixture.time;event.fff=fixture;event.sourceInfo=fixture.sourceInfo;const index=incoming.findIndex(e=>e.id===fixture.key);if(index>=0)incoming.splice(index,1);if(fixture.score&&!event.title.includes(' · '+agendaClubScore(fixture)))event.title+=' · '+agendaClubScore(fixture);}
  return [...visible,...incoming].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')||a.title.localeCompare(b.title,'fr'));
 };
 renderCoachAgenda();
});
