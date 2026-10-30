from playwright.sync_api import sync_playwright
TEAM='mayenne-stade-fc-2-u17-d1-2026-2027'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaClubFixtureEvents==='function' && window.trainingWizard")
 assert page.evaluate('agendaClubSchedule()') is None
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.locator('#agenda-club-team').select_option(TEAM)
 events=page.evaluate('agendaClubFixtureEvents().map(e=>({date:e.date,time:e.time,score:e.fff.score,home:e.fff.home,away:e.fff.away,round:e.fff.round}))')
 assert len(events)==9
 assert [(e['date'],e['time']) for e in events]==[('2026-09-19','17:00'),('2026-09-26','17:00'),('2026-10-03','15:00'),('2026-10-10','17:00'),('2026-10-17','17:00'),('2026-11-07','10:30'),('2026-11-14','15:00'),('2026-11-28','15:00'),('2026-12-05','15:00')]
 assert [e.get('score') for e in events[:5]]==[{'home':1,'away':1},{'home':2,'away':3},{'home':2,'away':8},{'home':0,'away':2},{'home':2,'away':6}]
 assert events[4]['round']==1 and events[5]['home']=='MÉRAL COSSÉ US'
 assert sum(bool(e.get('score')) for e in events)==5
 page.locator('#coach-agenda-month').fill('2026-11');page.locator('#coach-agenda-month').dispatch_event('change')
 assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==1
 page.locator('[data-agenda-day="2026-11-07"]').click();detail=page.locator('#agenda-day-details');assert '10:30' in detail.inner_text() and 'À l’extérieur' in detail.inner_text()
 page.once('dialog',lambda d:d.accept());detail.get_by_role('button',name='Préparer ce match',exact=True).click()
 assert page.evaluate('getCompositionBoard().team')=='MAYENNE STADE FC 2'
 assert page.evaluate('getCompositionBoard().matchPreparation.opponent')=='MÉRAL COSSÉ US'
 assert page.evaluate('getCompositionBoard().matchPreparation.date')=='2026-11-07'
 assert page.evaluate('!!workspaceRecoveryEntries().composition')
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==1
 key=page.evaluate('agendaClubFixtures().find(f=>f.round===6).key');old_id=page.evaluate('getCompositionBoard().documentId')
 # A correction to the common data is visible without a second import, retaining its stable key.
 page.evaluate("clubFixtureSchedules[0].fixtures.find(f=>f.round===6).date='2026-11-08';renderCoachAgenda()")
 assert page.evaluate('agendaClubFixtures().find(f=>f.round===6).key')==key
 page.once('dialog',lambda d:d.accept());page.evaluate('agendaFFFPrepare(agendaClubFixtures().find(f=>f.round===6))')
 assert page.evaluate('getCompositionBoard().documentId')==old_id
 assert page.evaluate('getCompositionBoard().matchPreparation.date')=='2026-11-08'
 # Cancelling a schedule subscription preserves the coach's own preparation.
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.locator('#agenda-club-team').select_option('');assert page.evaluate('agendaClubFixtureEvents().length')==0
 assert page.evaluate('getCompositionBoard().documentId')==old_id
 page.locator('#agenda-club-team').select_option(TEAM);page.reload();page.wait_for_function("typeof agendaClubSchedule==='function'");assert page.evaluate('agendaClubSchedule().id')==TEAM
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2');page.screenshot(path='/tmp/agenda-club-fixtures-mobile.png',full_page=True)
 # Another coach/device sees the common season but receives no arbitrary team assignment.
 other=b.new_context();p2=other.new_page();p2.goto('http://127.0.0.1:3016/?mode=local');p2.wait_for_function("typeof agendaClubSchedule==='function'");assert p2.evaluate('agendaClubSchedule()') is None
 p2.evaluate("coachStorageSet('vestiaire-club-calendar-team','"+TEAM+"')");assert p2.evaluate('agendaClubFixtureEvents().length')==9
 assert not errors,errors
 other.close();ctx.close();b.close();print('Nine supplied fixtures, exact results, home/away, opt-in by coach, preparation/recovery, common correction, dedup, reload and mobile passed')
