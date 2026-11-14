"""Existing SMFC editors: exact agenda -> saved causerie -> matching report, without UI replacement."""
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))")
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.matchContinuity && window.documentEntry')
 page.evaluate("()=>{window.continuityNow=homeClubNow;homeClubNow=()=>({day:'2026-11-05',minutes:Date.parse('2026-11-05T19:00:00Z')/60000});}")
 assert page.evaluate("matchContinuity.suggested('causerie').event.fff.opponent")=='MÉRAL COSSÉ US'
 page.locator('#view-pitch').click()
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 assert page.evaluate("getCompositionBoard().fffFixtureKey").startswith('club:')
 fixture=page.evaluate('getCompositionBoard().fffFixtureKey')
 page.locator('#task-match-causerie').click()
 assert 'MÉRAL COSSÉ US' in page.locator('#match-continuity-causerie').inner_text()
 assert page.locator('#match-plan-date').input_value()=='2026-11-07'
 # All original editors/export controls stay present.
 assert page.locator('.causerie-clean-card').count()==7
 assert page.locator('#causerie-download').count()==1
 assert page.locator('[data-causerie-export]').count()>0
 page.locator('#match-plan-context').fill('Contexte à préserver intégralement')
 page.locator('#match-plan-defensive').fill('Fermer l’axe puis accompagner le pressing.')
 page.evaluate("()=>updateMatchPreparation('objectives','Réagir ensemble à la perte',0)")
 page.locator('#match-plan-form button[type=submit]').click()
 source_id=page.evaluate('getCompositionBoard().documentId')
 original=page.evaluate('JSON.stringify(saves.find(s=>s.state.documentId===getCompositionBoard().documentId).state)')
 page.reload();page.wait_for_function('window.matchContinuity')
 page.evaluate("()=>{homeClubNow=()=>({day:'2026-11-08',minutes:Date.parse('2026-11-08T18:00:00Z')/60000});}")
 page.locator('#view-reports').click()
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 assert page.evaluate('currentReport.agendaSourceKey')==fixture
 assert page.evaluate('currentReport.preparation.sourceCompositionId')==source_id
 assert page.evaluate('currentReport.preparation.plan.defensive')=='Fermer l’axe puis accompagner le pressing.'
 assert page.evaluate('currentReport.preparation.objectives[0].text')=='Réagir ensemble à la perte'
 assert 'MÉRAL COSSÉ US' in page.locator('#match-continuity-report').inner_text()
 # Record an analysis, then change active composition to another fixture. Bilan remains exact.
 page.evaluate("()=>{currentReport.info.goalsFor='2';currentReport.info.goalsAgainst='1';currentReport.analysis.topAttack='Analyse du bon match';flushReportDraft();window.linkedReportId=currentReport.id;}")
 page.locator('#view-home').click()
 page.evaluate("()=>{const next=newBlankMatch({date:'2026-11-14',key:'other-fixture',opponent:'Autre adversaire',match:'Autre match'});matchWorkspaceInstall(next);}")
 page.locator('#view-reports').click()
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 assert page.evaluate('currentReport.id===linkedReportId')
 assert page.evaluate('currentReport.preparation.sourceCompositionId')==source_id
 assert page.evaluate('currentReport.info.goalsFor')=='2'
 assert page.evaluate('currentReport.info.opponent')=='MÉRAL COSSÉ US'
 # Explicit opening from cue targets exact source and does not replace another match silently.
 page.locator('#match-continuity-report').get_by_role('button',name='Revoir la causerie').click()
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 assert page.evaluate('getCompositionBoard().documentId')==source_id
 assert page.evaluate('getCompositionBoard().matchPreparation.context')=='Contexte à préserver intégralement'
 # Stable ID after rescheduling; neither archive nor actual author text is modified by a cue.
 page.evaluate("""()=>{const e=matchContinuity.events().find(e=>e.fff?.key===getCompositionBoard().fffFixtureKey);coachStorageSet('vestiaire-agenda-event-edits',JSON.stringify([{keys:agendaMatchKeys(e),title:e.title,date:'2026-11-09',time:'17:15',location:'Terrain principal'}]));matchContinuity.refresh();}""")
 page.wait_for_function("document.querySelector('#match-continuity-causerie').textContent.includes('9 novembre')")
 assert page.evaluate('JSON.stringify(saves.find(s=>s.state.documentId===getCompositionBoard().documentId).state)')==original
 assert page.evaluate("getCompositionBoard().matchPreparation.date")=='2026-11-07'
 # Two different games on nearest date must not be selected automatically.
 page.evaluate("""()=>{window.realCalendar=agendaCalendarAllEvents;agendaCalendarAllEvents=()=>[{id:'test-a',kind:'match',date:'2026-11-09',time:'12:00',title:'A',category:activeCoachTeam.category,fff:{key:'test-a',category:activeCoachTeam.category,status:'confirmed'}},{id:'test-b',kind:'match',date:'2026-11-09',time:'15:00',title:'B',category:activeCoachTeam.category,fff:{key:'test-b',category:activeCoachTeam.category,status:'confirmed'}}];}""")
 assert page.evaluate("matchContinuity.suggested('causerie').ambiguous")
 assert page.evaluate("matchContinuity.autoEntry('causerie')") is None
 page.evaluate('()=>{agendaCalendarAllEvents=realCalendar}')
 # A fixture with same date/adversary but a conflicting stable key is never merged.
 assert not page.evaluate("()=>{const r=structuredClone(currentReport),s=structuredClone(saves.find(s=>s.state.documentId===currentReport.preparation.sourceCompositionId).state);r.agendaSourceKey='another-stable-id';return reportCauserieContinuity.matches(r,s)}")
 # An explicitly started blank match stays blank, even with a scheduled match nearby.
 page.evaluate('()=>startBlankMatch()')
 assert page.evaluate('getCompositionBoard().matchPreparation.date')==''
 assert page.evaluate("matchContinuity.autoEntry('causerie')") is None
 # Small cues fit mobile without displacing the existing UI horizontally.
 for width in [1440,390,320]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 # Another team gets no automatically borrowed fixture.
 page.evaluate("()=>{window.ownedCalendar=agendaCalendarAllEvents;agendaCalendarAllEvents=()=>[{id:'foreign',kind:'match',date:'2026-11-09',time:'15:00',title:'U15 foreign',category:'U15',fff:{key:'foreign',category:'U15',status:'confirmed'}}];}")
 assert page.evaluate('matchContinuity.events().length')==0
 page.evaluate('()=>{agendaCalendarAllEvents=ownedCalendar}')
 # A failed automatic installation keeps the actual draft exactly as it was.
 quota=b.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 quota.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))")
 q=quota.new_page();q.goto('http://127.0.0.1:3016/?mode=local');q.wait_for_function('window.matchContinuity')
 q.evaluate("()=>{homeClubNow=()=>({day:'2026-11-05',minutes:Date.parse('2026-11-05T19:00:00Z')/60000});window.beforeAuto=JSON.stringify(getCompositionBoard());window.autoSet=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};}")
 q.locator('#view-pitch').click()
 assert q.evaluate('JSON.stringify(getCompositionBoard())===beforeAuto')
 assert q.evaluate("getCompositionBoard().matchPreparation?.date||''")==''
 quota.close()
 assert not errors,errors
 b.close()
print('PASS: current SMFC UI retained; agenda-selected causerie, reload -> exact saved preparation in report, retained score/analysis, reschedule identity, ambiguity, conflicting keys, explicit blank and responsive cues.')
