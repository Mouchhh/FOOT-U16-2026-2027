// One canonical appointment for each team/date/time. No destructive merging of old documents.
const trainingAgendaIdentity = () => activeCoach.id + ':' + activeCoachTeam.id;
function trainingAgendaNow() {
  const now=homeClubNow();return {day:now.day,time:new Date(now.minutes*60000).toISOString().slice(11,16)};
}
function trainingAgendaKey(item) { return [item.date,item.time||''].join('T'); }
function trainingAgendaOccurrence(session) {
  if(session.libraryOnly===true&&!session.agendaLink)return null;
  const linked=session.agendaLink;
  if(linked?.eventId) {
    const event=agendaRecurringResolve(linked.eventId);
    if(event?.kind==='training' && (session.date===linked.date&&session.time===linked.time || session.date===event.date&&session.time===event.time))return event;
  }
  return agendaRecurringOccurrences(agendaRecurringRead(),{from:session.date,to:session.date})
    .find(event=>event.kind==='training'&&event.time===session.time)||null;
}
function trainingAgendaAttach(session,event) {
  session.date=event.date;session.time=event.time;
  if(event.recurring)session.agendaLink={eventId:event.id,date:event.date,time:event.time};
  return session;
}
function trainingAgendaNext({unprepared=false}={}) {
  const now=trainingAgendaNow();
  return agendaCalendarAllEvents({from:now.day,to:agendaCalendarAdd(now.day,120)})
    .filter(event=>event.kind==='training'&&trainingAgendaKey(event)>=now.day+'T'+now.time&&(!event.session||coachTeamOwns(event.session))&&(!unprepared||!event.session))
    .sort((a,b)=>trainingAgendaKey(a).localeCompare(trainingAgendaKey(b)))[0]||null;
}
function trainingAgendaDefaults(session) {
  const next=trainingAgendaNext({unprepared:true});
  if(next)trainingAgendaAttach(session,next);
  return session;
}
function trainingAgendaPrepareSave(session) {
  const next=structuredClone(session);
  if(!coachTeamOwns(next))throw Error('Cette séance appartient à une autre équipe.');
  if(next.libraryOnly===true&&!next.agendaLink)return next;
  const occurrence=trainingAgendaOccurrence(next);
  if(occurrence) { trainingAgendaAttach(next,occurrence);next.libraryOnly=false; }
  else delete next.agendaLink;
  if(next.libraryOnly!==true&&!trainingLibrary.some(item=>item.id===next.id)&&trainingLibrary.some(item=>item.id!==next.id&&!item.libraryOnly&&coachTeamOwns(item)&&trainingAgendaKey(item)===trainingAgendaKey(next)))
    throw Error('Une séance est déjà enregistrée sur ce créneau. Ouvrez-la pour la modifier plutôt que créer un doublon.');
  return next;
}
function trainingAgendaOpen(event) {
  if(event.session) {
    const copy=structuredClone(event.session);copy.date=event.date;copy.time=event.time;
    if(!workspaceReplaceDraft('training',copy))return;
  } else {
    const next=trainingAgendaAttach(newTraining(),event);next.title=event.title.slice(0,100);
    if(!workspaceReplaceDraft('training',next))return;
  }
  workspaceNavigation.run('view-training',()=>trainingWizard.go(event.session?3:2));
}
function trainingAgendaChanged() {
  renderTrainingLibrary();renderCoachAgenda();renderHomeQuick();
  document.dispatchEvent(new CustomEvent('training-library-updated'));
}
function trainingDeleteSaved(id,host) {
  const session=trainingLibrary.find(item=>item.id===id&&coachTeamOwns(item));if(!session)return;
  host.querySelector('.training-delete-confirm')?.remove();
  const owner=trainingAgendaIdentity(),fingerprint=JSON.stringify(session),box=el('div','training-delete-confirm');
  box.setAttribute('role','alert');box.append(el('p','','Supprimer cette séance et son rendez-vous dans l’agenda ? Cette action est irréversible.'));
  const cancel=el('button','export','Annuler'),yes=el('button','export training-session-delete','Oui, supprimer'),status=el('p','hint');
  cancel.type=yes.type='button';cancel.onclick=()=>box.remove();
  yes.onclick=()=>{
    if(owner!==trainingAgendaIdentity()||JSON.stringify(trainingLibrary.find(item=>item.id===id))!==fingerprint){status.textContent='La séance ou l’équipe a changé. Rouvrez la confirmation.';return;}
    const old=trainingLibrary, next=old.filter(item=>item.id!==id),occurrence=trainingAgendaOccurrence(session);
    try {
      coachStorageSet('vestiaire-training-library',JSON.stringify(next));
      try {
        if(occurrence&&!next.some(item=>!item.libraryOnly&&(item.agendaLink?.eventId===occurrence.id||trainingAgendaKey(item)===trainingAgendaKey(session)))){const plan=agendaRecurringRead(),revision=plan.revision;plan.exceptions[occurrence.id]={deleted:true};agendaRecurringCommit(plan,revision);}
      } catch(error) {coachStorageSet('vestiaire-training-library',JSON.stringify(old));throw error;}
      trainingLibrary=next;
      if(currentTraining.id===id)trainingResetAfterSave();
      trainingAgendaChanged();box.remove();notify('Séance supprimée. La semaine type et les autres séances sont conservées.');
    } catch(error){status.textContent='Suppression non effectuée : '+error.message;}
  };
  box.append(cancel,yes,status);host.append(box);cancel.focus();
}
document.addEventListener('DOMContentLoaded',()=>{
  const events=agendaCalendarEvents;
  agendaCalendarEvents=function(){
    const input=events(),chosen=new Map();
    for(const item of input.filter(item=>item.kind==='training'&&item.session&&coachTeamOwns(item.session))) {
      const occurrence=trainingAgendaOccurrence(item.session);
      const event=occurrence?{...item,date:occurrence.date,time:occurrence.time,location:occurrence.location,agendaOccurrenceId:occurrence.id}:item;
      const key=trainingAgendaKey(event),previous=chosen.get(key);
      const weight=e=>(e.session.attendance?10000:0)+(e.session.blocks?.length||0)*100;
      if(!previous||weight(event)>weight(previous)||weight(event)===weight(previous)&&(event.session.updatedAt||'')>(previous.session.updatedAt||''))chosen.set(key,event);
    }
    const result=input.filter(item=>item.kind!=='training'||!item.session&&!chosen.has(trainingAgendaKey(item)));
    for(const event of chosen.values())result.push(event);
    return result.map(event=>event.kind==='training'?{...event,open:()=>trainingAgendaOpen(event)}:event)
      .sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
  };
  const create=newTraining;
  newTraining=function(){return trainingAgendaDefaults(create());};
  $('training-delete').onclick=()=>trainingDeleteSaved(currentTraining.id,$('training-space').querySelector('.reports-heading'));
  if(!currentTraining.updatedAt&&!currentTraining.blocks.length&&!currentTraining.title){trainingAgendaDefaults(currentTraining);syncTrainingForm();}
  renderTrainingLibrary();
});
