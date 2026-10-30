from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))");page=ctx.new_page();errors=[];dialogs=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaRemovedMatches==='function' && window.trainingWizard")
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');month=page.locator('#coach-agenda-month');month.fill('2026-11');month.dispatch_event('change')
 chip=page.locator('[data-date="2026-11-07"] .agenda-calendar-event');assert chip.count()==1
 source=page.evaluate('JSON.stringify(clubFixtureSchedules)');draft=page.evaluate('JSON.stringify(getCompositionBoard())');chip.click(button='right');assert chip.count()==0
 assert page.evaluate('agendaClubFixtureEvents().length')==9;assert page.evaluate("agendaCalendarEvents().filter(e=>e.kind==='match').length")==8
 assert page.evaluate('JSON.stringify(clubFixtureSchedules)')==source;assert page.evaluate('JSON.stringify(getCompositionBoard())')==draft
 assert not dialogs;assert page.locator('#agenda-matches-restore').is_visible()
 page.reload();page.wait_for_function("typeof agendaRemovedMatches==='function'");assert page.evaluate("agendaCalendarEvents().filter(e=>e.kind==='match').length")==8
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.locator('#agenda-matches-restore').click();assert page.evaluate("agendaCalendarEvents().filter(e=>e.kind==='match').length")==9
 # A saved preparation uses the same source key, and its notes/library survive removal.
 page.evaluate("()=>{const f=agendaClubFixtures().find(f=>f.round===6),board=structuredClone(getCompositionBoard());board.documentId=crypto.randomUUID();board.fffFixtureKey=f.key;board.title='Préparation conservée';board.notes='Consignes à garder';board.matchPreparation={...newMatchPreparation(),date:f.date,match:f.title};workspaceReplaceDraft('composition',board)}")
 page.locator('#view-pitch').click();page.locator('#save').click();library=page.evaluate('JSON.stringify(saves)');page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');month.fill('2026-11');month.dispatch_event('change');page.locator('[data-date="2026-11-07"] .agenda-calendar-event').click(button='right')
 assert page.evaluate('getCompositionBoard().notes')=='Consignes à garder';assert page.evaluate('JSON.stringify(saves)')==library
 assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==0
 page.locator('#agenda-matches-restore').click();page.locator('[data-agenda-day="2026-11-07"]').click();page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='Supprimer cette rencontre de mon agenda',exact=True).click();assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==0
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 # Failed persistence never removes the event from the calendar.
 page.evaluate("()=>{window.matchWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-agenda-removed-matches')throw Error('quota');return matchWriter(k,v)}}")
 page.locator('[data-date="2026-11-14"] .agenda-calendar-event').click(button='right');assert page.locator('[data-date="2026-11-14"] .agenda-calendar-event').count()==1;page.evaluate('()=>{coachStorageSet=matchWriter}')
 # A manual draft remains removed after saving it gives it a document id.
 page.evaluate("()=>{const board=structuredClone(getCompositionBoard());delete board.documentId;delete board.fffFixtureKey;board.title='Match amical';board.matchPreparation={...newMatchPreparation(),date:'2026-11-10',match:'Match amical',opponent:'Club test'};workspaceReplaceDraft('composition',board)}")
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');month.fill('2026-11');month.dispatch_event('change');page.locator('[data-date="2026-11-10"] .agenda-calendar-event').click(button='right');assert page.locator('[data-date="2026-11-10"] .agenda-calendar-event').count()==0
 page.locator('#view-pitch').click();page.locator('#save').click();page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');assert page.locator('[data-date="2026-11-10"] .agenda-calendar-event').count()==0
 # Hugo's separate calendars remain complete.
 other=b.new_context();other.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Hugo Mottais'}]))");p2=other.new_page();p2.goto('http://127.0.0.1:3016/?mode=local');p2.wait_for_function("typeof agendaRemovedMatches==='function'");assert p2.evaluate('agendaCalendarEvents().filter(e=>e.kind===\"match\").length')==31
 assert not dialogs;assert not errors,errors
 other.close();ctx.close();b.close();print('Direct right-click removes immediately, no menu/dialog, persistent coach scope, restore, saved preparation preserved, mobile and quota passed')
