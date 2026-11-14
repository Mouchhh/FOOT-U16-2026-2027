// Small match identity cues on the existing editors; no new document store or workflow.
(() => {
  'use strict';
  const normalize = value => coachTeamNormalize(String(value || ''));
  const usableBoard = b => !!b && valid(b) && coachTeamOwns(b) && !b.squadDirectory && !b.pionExplanation && b.boardKind !== 'plan';
  const boardKey = b => b?.fffFixtureKey || (b?.documentId ? 'match:' + b.documentId : '');
  const eventKey = e => e.fff?.key || agendaMatchKeys(e)[0];
  function boards() {
    const unique = new Map();
    for (const b of [getCompositionBoard(), ...saves.map(s => s.state)])
      if (usableBoard(b)) unique.set(b.documentId || 'draft', unique.get(b.documentId || 'draft') || b);
    return [...unique.values()];
  }
  function events() {
    const today = homeClubNow().day, seen = new Set();
    return agendaCalendarAllEvents({ from: agendaCalendarAdd(today, -21), to: agendaCalendarAdd(today, 21) })
      .filter(e => e.kind === 'match' && trainingDateValid(e.date) && e.fff?.status !== 'cancelled' && !/^ANNULÉ/i.test(e.title)
        && (e.fff ? normalize(e.category || e.fff.category) === normalize(activeCoachTeam.category) : boards().some(b => 'match:' + b.documentId === e.id)))
      .filter(e => { const k = eventKey(e); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function ended(e) {
    const now = homeClubNow();
    return e.date < now.day || e.date === now.day && !!e.time && Date.parse(e.date + 'T' + e.time + ':00Z') / 60000 + 150 <= now.minutes;
  }
  function suggested(kind) {
    const now = homeClubNow(), list = events().filter(e => kind === 'report'
      ? ended(e) && e.date >= agendaCalendarAdd(now.day, -14)
      : !ended(e) && e.date <= agendaCalendarAdd(now.day, 7));
    list.sort((a,b) => kind === 'report' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    if (!list.length) return { event: null, ambiguous: false };
    const nearest = list.filter(e => e.date === list[0].date);
    return { event: nearest.length === 1 ? nearest[0] : null, ambiguous: nearest.length > 1 };
  }
  function boardMatches(b, e) {
    if (!usableBoard(b)) return false;
    if (b.fffFixtureKey || e.fff?.key) return !!b.fffFixtureKey && b.fffFixtureKey === e.fff?.key;
    return 'match:' + b.documentId === e.id;
  }
  function reportMatches(r, e) {
    if (!r || !reportValid(r) || !coachTeamOwns(r) || r.eventType === 'training') return false;
    if (r.agendaSourceKey) return r.agendaSourceKey === eventKey(e);
    const b = boards().find(b => b.documentId === r.preparation?.sourceCompositionId);
    if (b) return boardMatches(b,e);
    // Legacy reports may be adopted only on a unique, fully matching encounter.
    const opponent = e.fff?.opponent || agendaEventBoard(e)?.matchPreparation?.opponent;
    return !!opponent && r.info.date === e.date && normalize(r.info.opponent) === normalize(opponent);
  }
  function findEvent(kind, payload) {
    const all = events();
    const key = kind === 'causerie' ? payload.fffFixtureKey : payload.agendaSourceKey;
    if (key) return all.find(e => eventKey(e) === key) || null;
    const matches = all.filter(e => kind === 'causerie' ? boardMatches(payload,e) : reportMatches(payload,e));
    return matches.length === 1 ? matches[0] : null;
  }
  function sourceFor(e) {
    const rows = boards().filter(b => boardMatches(b,e));
    const ids = new Set(rows.map(b => b.documentId || 'draft'));
    return ids.size === 1 ? rows[0] : null;
  }
  function reportsFor(e) {
    const unique = new Map();
    for (const r of [currentReport,...reportLibrary])
      if (reportMatches(r,e) && !(typeof reportIsRecoveryCopy === 'function' && reportIsRecoveryCopy(r)))
        unique.set(r.id,unique.get(r.id)||r);
    return [...unique.values()];
  }
  function reportPayload(e) {
    if (new Set(boards().filter(b=>boardMatches(b,e)).map(b=>b.documentId||'draft')).size > 1) return null;
    const existing = reportsFor(e);
    if (existing.length > 1) return null;
    if (existing.length === 1) return structuredClone(existing[0]);
    const next = newReport(), b = sourceFor(e), f = e.fff;
    next.players = []; delete next.preparation;
    next.agendaSourceKey = eventKey(e);
    next.title = ('Bilan · ' + e.title).slice(0,100);
    Object.assign(next.info, { date:e.date, time:e.time||'', opponent:f?.opponent||b?.matchPreparation?.opponent||'', team:f?.team||b?.team||activeCoachTeam.team||'', category:activeCoachTeam.category, conditions:'', formation:b?.formation||'', competition:f?.competition||'', stadium:e.location||f?.location||'', venue:f?.team&&f.away===f.team?'Extérieur':'Domicile' });
    // Only this encounter's saved preparation; never the currently displayed unrelated board.
    const saved = saves.map(s=>s.state).filter(usableBoard).find(s=>b?.documentId && s.documentId===b.documentId);
    if (saved && (!saved.documentCompletion || documentCompletionIsCompleted('causerie',saved))) {
      try { return reportCauserieContinuity.merge(saved,next); } catch { return null; }
    }
    return reportValid(next) ? next : null;
  }
  function autoEntry(kind) {
    if (kind === 'report' && currentReport.eventType === 'training') return null;
    const current = kind === 'causerie' ? getCompositionBoard() : currentReport;
    // Do not displace an explicitly created blank match or an unrelated working document.
    if (kind === 'causerie' && current.matchCreation === 'blank' && !current.fffFixtureKey) return null;
    const proposal = suggested(kind), e = proposal.event;
    if (!e) return null;
    const ownEvent = findEvent(kind,current);
    if (ownEvent && eventKey(ownEvent) === eventKey(e)) return current;
    if (kind === 'report' && (reportCauserieContinuity.hasWork(currentReport) || documentEntryMeaningful('report',currentReport))) return null;
    if (kind === 'causerie') {
      const safelySaved = documentCompletionIsCompleted('causerie',current) && saves.some(s=>s.state.documentId===current.documentId && documentEntrySignature(s.state)===documentEntrySignature(current));
      if (documentEntryMeaningful('causerie',current) && !safelySaved) return null;
      const candidates = boards().filter(b=>boardMatches(b,e));
      if (new Set(candidates.map(b=>b.documentId||'draft')).size > 1) return null;
      if (candidates.length) return candidates[0];
      if (!e.fff) return null;
      return newBlankMatch({key:e.fff.key,date:e.date,opponent:e.fff.opponent||e.title,match:e.fff.title||e.title,title:(e.fff.title||e.title).slice(0,100)});
    }
    return reportPayload(e);
  }
  function openEvent(kind,key) {
    const e = events().find(e=>eventKey(e)===key);
    if (!e || !workspaceNavigationCanLeave()) return notify('Le match ou votre équipe a changé. Rouvrez les repères du match.');
    if (kind === 'causerie') {
      // Existing archive/conflict safeguards remain in charge of document replacement.
      agendaEventCauserie(e,e.date);
    } else {
      const next = reportPayload(e);
      if (!next) return notify('Plusieurs préparations ou bilans existent. Choisissez le document dans votre bibliothèque.');
      if (currentReport.id !== next.id && !workspaceReplaceDraft('report',next)) return;
      if (currentReport.id === next.id && JSON.stringify(currentReport) !== JSON.stringify(next) && !workspaceReplaceDraft('report',next)) return;
      documentEntry.accept('report');
      documentEntry.perform(()=>workspaceNavigation.run('view-reports',()=>{reportTab='general';renderReportTabs();renderReportContent();}));
    }
  }
  let frame=0;
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);}
  function cue(kind,host,id) {
    if (!host) return;
    let root=$(id); if(!root){root=el('section','match-continuity-cue');root.id=id;root.setAttribute('aria-label','Match associé au document');host.prepend(root);}
    const current = kind === 'causerie' ? getCompositionBoard() : currentReport;
    if (kind === 'report' && current.eventType === 'training' || kind === 'causerie' && (terrainBoardKind !== 'composition' || document.body.classList.contains('simple-mode'))) { root.hidden=true;return; }
    root.hidden=false;
    const e=findEvent(kind,current), p=kind==='causerie'?current.matchPreparation:current.info, next=suggested(kind);
    const stamp=JSON.stringify([activeCoach.id,activeCoachTeam.id,activeCoachTeam.category,kind,kind==='causerie'?current.documentId:current.id,p?.date,p?.opponent,p?.match,e&&[eventKey(e),e.date,e.time,e.fff?.opponent],current.preparation?.imported,!!(e&&sourceFor(e)),next.ambiguous,next.event&&[eventKey(next.event),next.event.date,next.event.fff?.opponent,next.event.title]]);
    if(root.dataset.context===stamp)return;
    root.dataset.context=stamp;root.replaceChildren();
    const text=el('div','match-continuity-text'), label=el('strong');
    const opponent=e?.fff?.opponent||p?.match||p?.opponent?.split('\n')[0]||'';
    label.textContent=opponent ? activeCoachTeam.category+' · '+opponent : 'Votre match · '+activeCoachTeam.category;
    const details=el('p',''),day=e?.date||p?.date;
    details.textContent=[day&&trainingDateValid(day)?agendaCalendarDateLabel(day):'Date à renseigner',e?.time||'',e?'Lié à votre agenda':current.fffFixtureKey||current.agendaSourceKey?'Rendez-vous non retrouvé dans l’agenda':'Préparation manuelle'].filter(Boolean).join(' · ');
    text.append(label,details);
    if(e&&p?.date&&p.date!==e.date)text.append(el('p','match-continuity-warning','La date de l’agenda a changé. Votre document est conservé à sa date initiale.'));
    if(kind==='report'&&current.preparation?.imported)text.append(el('span','match-continuity-linked','Causerie de ce match retrouvée · composition et consignes reprises'));
    root.append(text);
    const controls=el('div','match-continuity-actions'),coach=activeCoach.id,team=activeCoachTeam.id;
    function button(label,run){const b=el('button','export',label);b.type='button';b.onclick=()=>{if(coach!==activeCoach.id||team!==activeCoachTeam.id)return;run();};controls.append(b);return b;}
    if(e){
      button('Voir dans l’agenda',()=>workspaceNavigation.run('view-coach-agenda',()=>{$('coach-agenda-month').value=e.date.slice(0,7);$('coach-agenda-week').value='';workspaceFlows.agenda.go(1);renderCoachAgenda();}));
      if(kind==='causerie')button('Bilan de ce match',()=>openEvent('report',eventKey(e)));
      else if(sourceFor(e))button('Revoir la causerie',()=>openEvent('causerie',eventKey(e)));
    }
    if(next.event&&(!e||eventKey(next.event)!==eventKey(e)))button((kind==='report'?'Bilan · ':'Causerie · ')+(next.event.fff?.opponent||next.event.title),()=>openEvent(kind,eventKey(next.event)));
    if(next.ambiguous)text.append(el('p','match-continuity-warning','Plusieurs matchs sont prévus le même jour : choisissez le rendez-vous dans l’agenda.'));
    if(controls.childElementCount)root.append(controls);
  }
  function paint(){frame=0;cue('causerie',document.querySelector('#terrain-page-0 .terrain-team-section'),'match-continuity-composition');cue('causerie',$('task-causerie'),'match-continuity-causerie');cue('report',$('after-match'),'match-continuity-report');}
  window.matchContinuity={autoEntry,events,suggested,findEvent,sourceFor,reportPayload,reportMatches,openEvent,refresh:schedule,boardKey};
  document.addEventListener('DOMContentLoaded',()=>{
    for(const name of ['renderMatchPreparation','renderReportContent','renderSaves','renderReportLibrary','renderCoachAgenda']) {
      // Top-level classic-script function bindings are also window properties.
      const previous=window[name];if(typeof previous!=='function')continue;
      window[name]=function(...args){const result=previous.apply(this,args);schedule();return result;};
    }
    document.addEventListener('workspace-draft-changed',schedule);
    document.addEventListener('document-completed',schedule);
    document.addEventListener('club-session-ready',schedule);
    document.addEventListener('change',schedule);
    new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
    schedule();
  });
})();
