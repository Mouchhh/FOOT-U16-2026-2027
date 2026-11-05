// Agrégats dérivés : pointages validés, matchs validés et contexte d'équipe actif.
function playerMonthlySnapshot(month,year=playerStatsSeason(month+'-01')){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mois invalide');
 const now=playerStatsNow(),roster=squadPlayers();
 const reports=playerStatsUniqueEvents(reportLibrary.filter(r=>reportValid(r)&&playerStatsOwns(r)&&documentCompletionIsCompleted('report',r)&&playerStatsInSeason(r.info.date,year)&&r.info.date<=now.day&&(!r.info.time||r.info.date<now.day||r.info.time<=now.time)));
 const season=playerStatsSeasonSnapshot(year,{roster,reports}),monthly=playerStatsSeasonSnapshot(year,{roster,reports:reports.filter(r=>r.info.date.startsWith(month)),trainings:trainingLibrary.filter(s=>s.date.startsWith(month))});
 const result=new Map();
 for(const player of roster){
  const seasonStats=season.players.get(player.id),monthStats=monthly.players.get(player.id);
  const attendance=stats=>({entries:stats.attendance.entries.map(e=>({...e,kind:'training'})),present:0,absent:0,unknown:0,rate:null});
  const total=attendance(seasonStats),period=attendance(monthStats),matches=[];
  for(const report of reports){
   if(report.eventType==='training')continue;
   const row=report.players.find(r=>playerStatsResolve(r,roster)?.id===player.id);if(!row)continue;
   const status=['present','absent'].includes(row.matchPresence)?row.matchPresence:Number(row.minutes)>0?'present':'uncertain';
   const entry={date:report.info.date,time:report.info.time||'',title:report.title||report.info.opponent||'Match',kind:'match',status};
   total.entries.push(entry);if(report.info.date.startsWith(month)){period.entries.push(entry);matches.push({report,row});}
  }
  for(const a of [total,period]){for(const e of a.entries){if(e.status==='present')a.present++;else if(e.status==='absent')a.absent++;else a.unknown++;}a.known=a.present+a.absent;a.rate=a.known?Math.round(100*a.present/a.known):null;a.entries.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));}
  result.set(player.id,{player,month,year,season:total,attendance:period,stats:monthStats,matches,review:player.monthlyReviews?.[month]||{appreciation:'',focus:''}});
 }
 return result;
}
const playerMonthlyReportValid=reportValid;
reportValid=function(report){return playerMonthlyReportValid(report)&&report.players.every(r=>r.matchPresence===undefined||['uncertain','present','absent'].includes(r.matchPresence));};
const playerMonthlyDirectoryValid=squadDirectoryValid;
squadDirectoryValid=function(directory){return playerMonthlyDirectoryValid(directory)&&directory.players.every(p=>p.monthlyReviews===undefined||p.monthlyReviews&&typeof p.monthlyReviews==='object'&&!Array.isArray(p.monthlyReviews)&&Object.keys(p.monthlyReviews).length<=120&&Object.entries(p.monthlyReviews).every(([month,r])=>/^\d{4}-(0[1-9]|1[0-2])$/.test(month)&&r&&typeof r.appreciation==='string'&&r.appreciation.length<=2000&&typeof r.focus==='string'&&r.focus.length<=2000&&typeof r.updatedAt==='string'&&Number.isFinite(Date.parse(r.updatedAt))))};
// Les éditeurs de profil antérieurs ne doivent pas effacer les appréciations mensuelles.
const playerMonthlySquadSave=squadSave;
squadSave=function(players){const old=new Map(squadPlayers().map(p=>[p.id,p]));return playerMonthlySquadSave(players.map(p=>p.monthlyReviews===undefined&&old.get(p.id)?.monthlyReviews?{...p,monthlyReviews:structuredClone(old.get(p.id).monthlyReviews)}:p));};
