/* Pure derived statistics. No storage, mutation or inference from missing inputs. */
(function(root){
 'use strict';
 const clean=v=>typeof v==='string'?v.trim():'';
 const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v?v:'';
 const number=(v,max=9999,decimal=false)=>((typeof v==='number'||typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v))&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=max&&(decimal||Number.isInteger(Number(v))))?Number(v):null;
 const round=v=>Math.round(v*10)/10;
 const percent=(a,b)=>b?round(100*a/b):null;
 const stamp=d=>Date.parse(d.updated_at)||0;
 const normal=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
 const minute=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?s:'';
 const scope=d=>JSON.stringify([d.owner_id,d.category,clean(d.stats?.teamContext?.id)||clean(d.stats?.team)||'équipe non précisée']);
 const identity=row=>clean(row.squadPlayerId)||clean(row.id);
 const rateKeys=['project','defence','attack','physical','cohesion','attitude','emotions'];
 function monday(date){const v=new Date(date+'T12:00:00Z');v.setUTCDate(v.getUTCDate()-(v.getUTCDay()+6)%7);return v.toISOString().slice(0,10);}
 function attendance(doc,now,nowLocal){
  const s=doc.stats,a=s.attendance,date=day(s.date),time=minute(s.time);
  if(!a||!date||!time||a.version!==1||a.date!==date||a.time!==time||!Number.isFinite(Date.parse(a.validatedAt))||Date.parse(a.validatedAt)>Date.parse(now)||date+'T'+time>nowLocal.slice(0,16)||!Array.isArray(a.rows))return null;
  const rows=new Map();for(const row of a.rows.filter(r=>r&&typeof r==='object').sort((a,b)=>Number(!!clean(b.squadPlayerId))-Number(!!clean(a.squadPlayerId)))){
   const id=identity(row);if(!id||row.included!==true||!['present','absent','uncertain'].includes(row.status)||rows.has(id))continue;rows.set(id,row);
  }return {rows:[...rows.values()],stamp:Date.parse(a.validatedAt)};
 }
 function aggregate(input,{from='',to='',now=new Date().toISOString(),owner='',category=''}={}){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
  const nowLocal=parts.year+'-'+parts.month+'-'+parts.day+'T'+parts.hour+':'+parts.minute;
  const docs=Array.isArray(input)?input:[],players=new Map(),trainingMap=new Map(),matchMap=new Map();let missingDates=0,ignored=0;
  for(const d of docs){
   if(!d||!d.stats||!['training','report'].includes(d.kind)||(owner&&d.owner_id!==owner)||(category==='__uncategorized__'?d.category!=='':category&&d.category!==category))continue;
   const date=day(d.kind==='report'?d.stats.info?.date:d.stats.date);if(!date){missingDates++;continue;}
   if(from&&date<from||to&&date>to)continue;
   if(d.kind==='training'){
    if(d.stats.libraryOnly===true){ignored++;continue;}
    const time=minute(d.stats.time),key=JSON.stringify([scope(d),date,time||d.source_id||d.id]);
    const old=trainingMap.get(key),a=attendance(d,now,nowLocal),oldA=old&&attendance(old,now,nowLocal);
    if(!old||a&&(!oldA||a.stamp>oldA.stamp)||((!a&&!oldA)||(a&&oldA&&a.stamp===oldA.stamp))&&stamp(d)>stamp(old))trainingMap.set(key,d);
   }else{
    if(d.stats.eventType==='training'){ignored++;continue;}
    const s=d.stats,key=JSON.stringify([scope(d),s.agendaSourceKey||s.statsEventId||s.id||d.source_id||d.id,date,s.info?.time||'',normal(s.info?.opponent)]),old=matchMap.get(key);
    if(!old||stamp(d)>stamp(old))matchMap.set(key,d);
   }
  }
  const result={sessions:0,dueSessions:0,futureSessions:0,pointedSessions:0,preparedMinutes:0,knownDurationSessions:0,present:0,absent:0,uncertain:0,attendanceRate:null,coverage:null,matches:0,scoredMatches:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,playingMinutes:0,knownMinuteRows:0,missingMinuteRows:0,unlinkedRows:0,missingDates,ignored,duplicates:0,themes:[],weeks:[],ratings:[],players:[]};
  const themes=new Map(),weeks=new Map(),knownRosterIds=new Map(),ratings=new Map(rateKeys.map(k=>[k,{sum:0,n:0}]));
  function week(date){const key=monday(date);if(!weeks.has(key))weeks.set(key,{date:key,sessions:0,pointed:0,present:0,absent:0,uncertain:0});return weeks.get(key);}
  function player(doc,row){const context=scope(doc);if(doc.kind==='training'){if(!knownRosterIds.has(context))knownRosterIds.set(context,new Set());knownRosterIds.get(context).add(identity(row));}if(doc.kind==='report'&&!clean(row.squadPlayerId)&&!knownRosterIds.get(context)?.has(clean(row.id))){result.unlinkedRows++;return null;}const id=identity(row);if(!id){result.unlinkedRows++;return null;}const key=scope(doc)+'|'+id;if(!players.has(key))players.set(key,{id,key,name:clean(row.name)||'Joueur sans nom',owner_id:doc.owner_id,category:doc.category,team:doc.stats.teamContext?.team||doc.stats.team||'',present:0,absent:0,uncertain:0,known:0,rate:null,matches:0,minutes:0,minuteRows:0,missingMinutes:0,goals:0,goalRows:0,assists:0,assistRows:0,yellowCards:0,yellowRows:0,redCards:0,redRows:0});return players.get(key);}
  for(const d of trainingMap.values()){
   const s=d.stats;result.sessions++;const w=week(s.date);w.sessions++;
   if(s.date+'T'+(minute(s.time)||'23:59')<=nowLocal.slice(0,16))result.dueSessions++;else result.futureSessions++;
   const duration=number(s.duration,180);if(duration!==null){result.preparedMinutes+=duration;result.knownDurationSessions++;}
   for(const theme of new Set(Array.isArray(s.themes)?s.themes.map(clean).filter(Boolean):[]))themes.set(theme,(themes.get(theme)||0)+1);
   const a=attendance(d,now,nowLocal);if(!a)continue;
   if(a.rows.some(r=>['present','absent'].includes(r.status))){result.pointedSessions++;w.pointed++;}
   for(const row of a.rows){const key=row.status==='present'?'present':row.status==='absent'?'absent':'uncertain';result[key]++;w[key]++;const pr=player(d,row);if(pr)pr[key]++;}
  }
  for(const d of matchMap.values()){
   const s=d.stats;if(day(s.info.date)>nowLocal.slice(0,10))continue;result.matches++;
   const gf=number(s.info.goalsFor,99),ga=number(s.info.goalsAgainst,99);if(gf!==null&&ga!==null){result.scoredMatches++;result.goalsFor+=gf;result.goalsAgainst+=ga;result[gf>ga?'wins':gf<ga?'losses':'draws']++;}
   for(const k of rateKeys){const v=number(s.ratings?.[k]?.score,5,true);if(v!==null&&v>=.5&&v*2%1===0){ratings.get(k).sum+=v;ratings.get(k).n++;}}
   const seen=new Set();for(const row of (Array.isArray(s.players)?s.players:[]).filter(r=>r&&typeof r==='object').sort((a,b)=>Number(!!clean(b.squadPlayerId))-Number(!!clean(a.squadPlayerId)))){
    const id=identity(row);if(id&&seen.has(id))continue;if(id)seen.add(id);
    const minutes=number(row.minutes,180),pr=player(d,row);
    if(minutes===null)result.missingMinuteRows++;else{result.playingMinutes+=minutes;result.knownMinuteRows++;}
    if(!pr)continue;pr.matches++;if(minutes===null)pr.missingMinutes++;else{pr.minutes+=minutes;pr.minuteRows++;}
    for(const [key,count] of [['goals','goalRows'],['assists','assistRows'],['yellowCards','yellowRows'],['redCards','redRows']]){const n=number(row[key],99);if(n!==null){pr[key]+=n;pr[count]++;}}
   }
  }
  result.attendanceRate=percent(result.present,result.present+result.absent);result.coverage=percent(result.present+result.absent,result.present+result.absent+result.uncertain);
  result.pointageCoverage=percent(result.pointedSessions,result.dueSessions);
  result.themes=[...themes].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'fr'));
  result.weeks=[...weeks.values()].sort((a,b)=>a.date.localeCompare(b.date));
  result.ratings=[...ratings].map(([key,v])=>({key,n:v.n,average:v.n?round(v.sum/v.n):null}));
  result.players=[...players.values()].map(p=>({...p,known:p.present+p.absent,rate:percent(p.present,p.present+p.absent)})).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  return result;
 }
 function groups(documents,options={}){
  const keys=new Map();for(const d of documents||[]){if(!d?.stats||!['training','report'].includes(d.kind)||(options.owner&&d.owner_id!==options.owner)||(options.category==='__uncategorized__'?d.category!=='':options.category&&d.category!==options.category))continue;keys.set(JSON.stringify([d.owner_id,d.category]),{owner:d.owner_id,category:d.category});}
  return [...keys.values()].map(v=>({...v,...aggregate(documents,{...options,owner:v.owner,category:v.category||'__uncategorized__'})})).filter(v=>v.sessions||v.matches).sort((a,b)=>a.category.localeCompare(b.category,'fr',{numeric:true})||a.owner.localeCompare(b.owner));
 }
 root.CruzaManagerStats=Object.freeze({aggregate,groups});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.CruzaManagerStats;
})(typeof window==='undefined'?globalThis:window);
