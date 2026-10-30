from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Hugo Mottais'}]))");page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaClubFixtures==='function' && window.trainingWizard")
 fixtures=page.evaluate('agendaClubFixtures(agendaClubSchedule())');assert len(fixtures)==23
 assert page.evaluate('agendaClubSchedules().length')==2
 assert page.evaluate('agendaClubFixtureEvents().length')==31
 u15=page.evaluate("agendaClubFixtures().filter(f=>f.category==='U15')");assert len(u15)==8
 assert [(f['date'],f['time']) for f in u15]==[('2026-09-19','15:30'),('2026-09-26','11:00'),('2026-10-03','16:00'),('2026-10-10','15:00'),('2026-10-17','16:30'),('2026-11-07','14:30'),('2026-11-14','11:00'),('2026-11-28','11:00')]
 assert [f.get('score') for f in u15[:5]]==[{'home':0,'away':2},{'home':8,'away':0},{'home':1,'away':1},{'home':3,'away':1},{'home':1,'away':2}]
 assert len({f['key'] for f in page.evaluate('agendaClubFixtures()')})==31
 assert page.evaluate('agendaClubSchedule().ownerCoachName')=='Hugo Mottais'
 assert all(f['team']=='MAYENNE STADE FC 3' for f in fixtures)
 assert len({f['key'] for f in fixtures})==23
 league=[f for f in fixtures if not f.get('id')];assert len(league)==22 and sorted(f['round'] for f in league)==list(range(1,23))
 assert [(f['date'],f['time']) for f in fixtures]==[('2026-09-20','12:30'),('2026-09-25','21:15'),('2026-10-04','15:00'),('2026-10-18','12:30'),('2026-11-01','15:00'),('2026-11-08','12:30'),('2026-11-15','15:00'),('2026-11-29','12:30'),('2026-12-06','12:30'),('2026-12-13','12:30'),('2027-01-24','15:00'),('2027-01-31','12:30'),('2027-02-07','15:00'),('2027-02-14','12:30'),('2027-03-07','15:00'),('2027-03-14','12:30'),('2027-03-21','15:00'),('2027-04-04','12:30'),('2027-04-11','15:00'),('2027-04-18','12:30'),('2027-05-02','15:00'),('2027-05-23','13:00'),('2027-05-30','12:30')]
 assert [f.get('score') for f in fixtures[:4]]==[{'home':3,'away':1},{'home':1,'away':1},{'home':1,'away':1},{'home':7,'away':2}]
 assert sum(bool(f.get('score')) for f in fixtures)==4
 cup=fixtures[1];assert cup['penalties']=={'home':5,'away':3};assert cup['home']=='AMBRIERES CIGNE F. 2';assert cup['roundLabel']=='1er Tour' and 'Poivre et Sel' in cup['competition']
 assert fixtures[10]['round']==1 and fixtures[10]['key']!=cup['key']
 assert not page.evaluate("agendaClubFixtureEvents().some(e=>e.id.includes('fc-2-u17'))")
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');month=page.locator('#coach-agenda-month');month.fill('2026-09');month.dispatch_event('change');page.locator('[data-agenda-day="2026-09-25"]').click();details=page.locator('#agenda-day-details');assert 'TAB 5–3' in details.inner_text();assert 'Tirs au but : AMBRIERES CIGNE F. 2 5–3 MAYENNE STADE FC 3' in details.inner_text()
 month.fill('2026-11');month.dispatch_event('change');assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==1;
 page.locator('#agenda-calendar-filters>summary').click();page.locator('#coach-agenda-category').select_option('Seniors');assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==0;page.locator('#coach-agenda-category').select_option('');assert page.locator('[data-date="2026-11-01"] .agenda-calendar-event').count()==1
 page.once('dialog',lambda d:d.accept());page.locator('[data-date="2026-11-01"] .agenda-calendar-event').click();assert page.evaluate('getCompositionBoard().team')=='MAYENNE STADE FC 3';assert page.evaluate('getCompositionBoard().coach')=='Hugo Mottais';assert page.evaluate('getCompositionBoard().matchPreparation.opponent')=='LANDIVY PONTMAIN FC'
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');assert page.locator('[data-date="2026-11-01"] .agenda-calendar-event').count()==1
 page.reload();page.wait_for_function("typeof agendaClubFixtures==='function'");assert page.evaluate('agendaClubFixtureEvents().length')==31
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2');page.screenshot(path='/tmp/agenda-hugo-mobile.png',full_page=True)
 # Enzo retains only the original U17 calendar. An unassigned educator receives neither calendar.
 enzo=b.new_context();enzo.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))");p2=enzo.new_page();p2.goto('http://127.0.0.1:3016/?mode=local');p2.wait_for_function("typeof agendaClubFixtures==='function'");assert p2.evaluate('agendaClubFixtureEvents().length')==9;assert p2.evaluate('agendaClubSchedule().team')=='MAYENNE STADE FC 2'
 other=b.new_context();p3=other.new_page();p3.goto('http://127.0.0.1:3016/?mode=local');p3.wait_for_function("typeof agendaClubFixtures==='function'");assert p3.evaluate('agendaClubFixtureEvents().length')==0
 p3.evaluate("()=>{const old=structuredClone(getCompositionBoard());old.documentId=crypto.randomUUID();old.fffFixtureKey='club:mayenne-stade-fc-3-seniors-d2-2026-2027:cup-reserves-r1';old.matchPreparation={...newMatchPreparation(),date:'2026-09-25',match:'Ancienne copie coupe'};workspaceReplaceDraft('composition',old)}");assert not p3.evaluate("agendaCalendarEvents().some(e=>e.kind==='match')")
 assert not errors,errors
 other.close();enzo.close();ctx.close();b.close();print('Hugo: 23 Seniors + 8 U15 fixtures, exact dates/scores, categories, cup and penalties, original dates/times, private agenda assignment, Enzo isolation, preparation, reload and mobile passed')
