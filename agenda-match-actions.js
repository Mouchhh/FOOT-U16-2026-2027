// Remove a fixture from this coach's agenda without destroying its preparation or common source.
function agendaMatchKeys(event){
 if(event.fff?.key)return [event.fff.key];
 const board=[getCompositionBoard(),...saves.map(s=>s.state)].find(b=>'match:'+(b.documentId||'draft')===event.id);
 if(board?.fffFixtureKey)return [board.fffFixtureKey];
 const fingerprint='manual:'+JSON.stringify([event.date,event.title.slice(0,500),event.category||'',board?.team||'',board?.squad||'']);
 return event.id==='match:draft'?[fingerprint]:[event.id,fingerprint];
}
function agendaRemovedMatches(){try{const data=JSON.parse(coachStorageGet('vestiaire-agenda-removed-matches')||'null');if(data?.version===1&&Array.isArray(data.items)&&data.items.length<=1000&&data.items.every(item=>item&&typeof item.title==='string'&&item.title.length<=200&&Array.isArray(item.keys)&&item.keys.length>=1&&item.keys.length<=2&&item.keys.every(k=>typeof k==='string'&&k.length<=4096)))return data.items;}catch{}return [];}
document.addEventListener('DOMContentLoaded',()=>{
 const root=$('coach-agenda-list'),restore=el('button','export','Rétablir les rencontres supprimées');restore.type='button';restore.id='agenda-matches-restore';restore.hidden=true;$('coach-agenda').querySelector('.reports-heading .report-actions').append(restore);
 function remove(id){
  const event=agendaCalendarEvents().find(e=>e.id===id&&e.kind==='match');if(!event)return;
  const keys=agendaMatchKeys(event),items=agendaRemovedMatches().filter(item=>!item.keys.some(key=>keys.includes(key)));items.push({keys,title:event.title.slice(0,200)});
  if(items.length>1000){notify('Rétablissez des rencontres avant d’en supprimer davantage.');return;}
  try{coachStorageSet('vestiaire-agenda-removed-matches',JSON.stringify({version:1,items}));renderCoachAgenda();notify('Rencontre supprimée sur cet appareil. Vous pouvez la rétablir.');}catch{notify('Suppression non enregistrée. Votre rencontre reste dans le calendrier.');}
 }
 root.addEventListener('contextmenu',event=>{const target=event.target.closest('[data-agenda-match]');if(!target)return;event.preventDefault();remove(target.dataset.agendaMatch);});
 restore.onclick=()=>{try{coachStorageSet('vestiaire-agenda-removed-matches',JSON.stringify({version:1,items:[]}));renderCoachAgenda();notify('Rencontres rétablies dans votre agenda.');}catch{notify('Rétablissement impossible. Vos réglages restent conservés.');}};
 const events=agendaCalendarEvents;agendaCalendarEvents=function(){const hidden=new Set(agendaRemovedMatches().flatMap(item=>item.keys));return events().filter(event=>event.kind!=='match'||!agendaMatchKeys(event).some(key=>hidden.has(key)));};
 const render=renderCoachAgenda;renderCoachAgenda=function(){render();const count=agendaRemovedMatches().length;restore.hidden=count===0;restore.textContent='Rétablir les rencontres ('+count+')';for(const card of root.querySelectorAll('article[data-agenda-match]')){const action=el('button','export agenda-match-remove','Supprimer');action.type='button';action.setAttribute('aria-label','Supprimer cette rencontre de mon agenda');action.onclick=()=>remove(card.dataset.agendaMatch);card.append(action);}};
 const clear=clubNetworkClear;clubNetworkClear=function(){clear();restore.hidden=true;};renderCoachAgenda();
});
