// Read-only dashboard: canonical agenda, validated reports and recorded attendance.
function homeWidgetsSnapshot(){
 const now=playerStatsNow(),month=now.day.slice(0,7),previous=agendaCalendarMonth(month,-1);
 const monthly=[...playerMonthlySnapshot(month).values()];
 const entries=monthly.flatMap(p=>p.season.entries.filter(e=>e.kind==='training').map(e=>({...e,playerId:p.player.id})));
 const events=agendaCalendarAllEvents({from:agendaCalendarAdd(now.day,-60),to:agendaCalendarAdd(now.day,90)}).filter(e=>['training','match'].includes(e.kind)&&playerStatsInSeason(e.date,playerStatsSeason(now.day))&&(!e.session||playerStatsOwns(e.session)));
 const elapsed=e=>e.date<now.day||e.date===now.day&&!!e.time&&e.time<=now.time;
 const keys=[...new Set(events.filter(e=>e.kind==='training'&&elapsed(e)).map(e=>e.date+'T'+(e.time||'')))].sort().slice(-3);
 const recent=entries.filter(e=>keys.includes(e.date+'T'+e.time));
 const rate=rows=>{const known=rows.filter(e=>['present','absent'].includes(e.status));return known.length?Math.round(100*known.filter(e=>e.status==='present').length/known.length):null;};
 const currentRate=rate(entries.filter(e=>e.date.startsWith(month))),oldRate=rate(entries.filter(e=>e.date.startsWith(previous)));
 const reports=playerStatsUniqueEvents(reportLibrary.filter(r=>reportValid(r)&&playerStatsOwns(r)&&r.eventType!=='training'&&documentCompletionIsCompleted('report',r)&&elapsed({date:r.info.date,time:r.info.time})&&playerStatsInSeason(r.info.date,playerStatsSeason(now.day)))).sort((a,b)=>(b.info.date+b.info.time).localeCompare(a.info.date+a.info.time));
 const scored=reports.filter(r=>/^\d+$/.test(String(r.info.goalsFor))&&/^\d+$/.test(String(r.info.goalsAgainst))).slice(0,5);
 const form=scored.map(r=>Number(r.info.goalsFor)>Number(r.info.goalsAgainst)?'V':Number(r.info.goalsFor)===Number(r.info.goalsAgainst)?'N':'D');
 const upcoming=kind=>events.filter(e=>e.kind===kind&&!elapsed(e)).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))[0]||null;
 return {now,rate:rate(recent),active:new Set(recent.filter(e=>e.status==='present').map(e=>e.playerId)).size,sessions:keys.length,unknown:Math.max(0,keys.length*monthly.length-recent.filter(e=>['present','absent'].includes(e.status)).length),delta:currentRate!==null&&oldRate!==null?currentRate-oldRate:null,scored,form,points:form.reduce((n,v)=>n+(v==='V'?3:v==='N'?1:0),0),match:upcoming('match'),training:upcoming('training'),recommendation:reports[0]?.plan?.priority||reports[0]?.plan?.sessionObjective||''};
}
function renderHomeWidgets(){
 const root=$('home-live-widgets');if(!root)return;const s=homeWidgetsSnapshot();root.replaceChildren();
 const card=(title,kind)=>{const node=el('article','home-live-card '+kind);node.append(el('h2','',title));root.append(node);return node;};
 const group=card('Dynamique du Groupe','home-live-group');
 group.append(el('strong','home-live-value',s.rate===null?'Présence à confirmer':s.rate+'% de présence'));
 const gauge=el('progress');gauge.max=100;gauge.value=s.rate??0;gauge.setAttribute('aria-label','Présence connue sur les trois dernières séances');group.append(gauge);
 group.append(el('p','',s.sessions?s.active+' joueur'+(s.active===1?'':'s')+' présent'+(s.active===1?'':'s')+' sur les '+s.sessions+' dernières séances':'Aucune séance passée dans l’agenda'));
 group.append(el('p','home-live-caption',s.delta===null?'Évolution mensuelle : données insuffisantes':(s.delta>0?'+':'')+s.delta+' points ce mois'));
 if(s.unknown)group.append(el('small','home-live-caption',s.unknown+' présence(s) à confirmer · taux sur les pointages connus'));
 const form=card('Forme · 5 derniers matchs','home-live-form');form.append(el('strong','home-live-value',s.form.length?s.points+' pts / '+s.form.length*3:'Aucun résultat validé'));
 const circles=el('div','home-live-results');s.form.slice().reverse().forEach(v=>{const circle=el('span','home-live-result result-'+v,v);circle.title={V:'Victoire',N:'Match nul',D:'Défaite'}[v];circles.append(circle);});form.append(circles);
 const last=s.scored[0];form.append(el('p','',last?'Dernier match : '+last.info.goalsFor+' – '+last.info.goalsAgainst+' · '+last.info.opponent:'Les résultats apparaîtront après validation des bilans.'));
 const label=e=>homeDayLabel(e.date,s.now.day)+(e.time?' · '+e.time:'')+' · '+e.title;
 form.append(el('p','home-live-caption',s.match?'Prochain rendez-vous : '+label(s.match):'Aucun prochain match planifié'));
 const training=card('Agenda & séance','home-live-training'),event=s.training;
 training.append(el('strong','home-live-value',event?homeDayLabel(event.date,s.now.day):'À planifier'));
 training.append(el('h3','','Ce qui est prévu'),el('p','',event?[event.title,event.session?.themes?.join(' · '),event.time].filter(Boolean).join(' · '):'Aucune prochaine séance dans l’agenda.'));
 training.append(el('h3','','Conseil issu du dernier bilan'),el('p','',s.recommendation||'Renseignez une priorité dans votre prochain bilan pour retrouver ici votre axe de travail.'));
 const open=el('button','home-live-open',event?'Ouvrir / Préparer la séance →':'Ouvrir l’agenda →');open.type='button';open.onclick=()=>{if(event?.session){loadTraining(event.session);if(currentTraining.id===event.session.id)workspaceNavigation.run('view-training',()=>trainingWizard.go(3));}else if(event?.open)event.open();else workspaceNavigation.run('view-coach-agenda',()=>workspaceFlows.agenda.go(1));};training.append(open);
}
document.addEventListener('DOMContentLoaded',()=>{
 const root=el('section');root.id='home-live-widgets';root.setAttribute('aria-label','Tableau de bord de mon équipe');document.querySelector('.home-hero').after(root);
 let frame=0;const refresh=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(document.body.classList.contains('home-mode'))renderHomeWidgets();});};
 const old=renderHomeQuick;renderHomeQuick=function(){old();refresh();};
 for(const name of ['click','change','input','club-session-ready','workspace-draft-changed'])document.addEventListener(name,refresh);window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['class']});setInterval(refresh,60000);refresh();
});
