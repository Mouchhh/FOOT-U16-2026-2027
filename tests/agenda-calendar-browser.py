"""Saved sessions populate the calendar; dates, document links and day preparation stay safe."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':768},timezone_id='America/New_York',reduced_motion='reduce');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaCalendarEvents==='function'")
 page.locator('#view-training').click();page.locator('#training-create-session').click();page.locator('#training-title').fill('Conservation');page.locator('#training-step-link-2').click();page.locator('#training-date').fill('2026-10-30');page.locator('#training-date').blur();page.locator('#training-time').fill('18:30');page.locator('#training-time').blur();page.locator('#training-save').click();session=page.evaluate('currentTraining.id')
 page.locator('#view-coach-agenda').click();month=page.locator('#coach-agenda-month');month.fill('2026-10');month.dispatch_event('change')
 assert page.locator('.agenda-calendar-weekday').all_text_contents()==['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
 assert page.locator('.agenda-calendar-day').first.get_attribute('data-date')=='2026-09-28';assert page.locator('.agenda-calendar-day').last.get_attribute('data-date')=='2026-11-01'
 page.get_by_role('button',name='Séance · 18:30 · Conservation',exact=True).click();assert page.locator('#training-step-3').is_visible();assert page.evaluate('currentTraining.id')==session
 page.locator('#training-step-link-2').click();page.locator('#training-date').fill('2026-11-02');page.locator('#training-date').blur();page.locator('#training-save').click();page.locator('#view-coach-agenda').click();month.fill('2026-10');month.dispatch_event('change');assert page.locator('[data-date="2026-10-30"] .agenda-calendar-event').count()==0
 page.locator('#agenda-month-next').click();assert month.input_value()=='2026-11';assert page.locator('[data-date="2026-11-02"] .agenda-calendar-event').count()==1
 # Save a real dated match. Its draft and saved copy make one fixture.
 page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();page.locator('#match-plan-date').fill('2026-11-03');page.locator('#match-plan-opponent').fill('Laval');page.locator('#save').click()
 page.locator('#view-reports').click();page.locator('#report-new').click();quick=page.locator('#report-quick-panel');quick.get_by_label('Date',exact=True).fill('2026-11-03');quick.get_by_label('Adversaire',exact=True).fill('Laval');quick.get_by_label('Titre du bilan',exact=True).fill('Bilan Laval');page.locator('#report-save').click()
 page.locator('#view-coach-agenda').click();month.fill('2026-11');month.dispatch_event('change');events=page.evaluate('agendaCalendarEvents().map(e=>({kind:e.kind,date:e.date}))');assert len([e for e in events if e['kind']=='match' and e['date']=='2026-11-03'])==1
 assert page.locator('[data-date="2026-11-03"] .agenda-calendar-event').count()==2
 page.get_by_role('button',name='Bilan · Bilan Laval',exact=True).click();page.locator('#document-entry-resume').click();assert page.locator('#after-match').is_visible();assert page.evaluate('currentReport.title')=='Bilan Laval'
 page.locator('#view-coach-agenda').click();page.locator('[data-agenda-day="2026-11-05"]').click();page.get_by_role('button',name='+ Séance ce jour',exact=True).click();assert page.locator('#training-date').input_value()=='2026-11-05';assert page.evaluate('workspaceRecoveryEntries().training.payload.id')==session
 assert page.evaluate('trainingLibrary.length')==1;page.locator('#training-step-link-0').click();page.locator('#training-title').fill('Séance du jeudi');page.locator('#training-save').click();page.locator('#view-coach-agenda').click();month.fill('2026-11');month.dispatch_event('change');assert page.locator('[data-date="2026-11-05"] .agenda-calendar-event').count()==1
 month.fill('2026-12');month.dispatch_event('change');page.locator('#agenda-month-next').click();assert month.input_value()=='2027-01';page.locator('#agenda-month-previous').click();assert month.input_value()=='2026-12'
 assert page.evaluate("agendaCalendarAdd('2028-02-28',1)==='2028-02-29'&&agendaCalendarAdd('2026-03-28',1)==='2026-03-29'&&homeClubNow(new Date('2026-10-30T23:30:00Z')).day==='2026-10-31'")
 page.locator('#coach-agenda-all').click();assert page.locator('.coach-agenda-card').count()==2;assert page.locator('.agenda-event-card').count()==2
 page.locator('#agenda-mode-month').click();month.fill('2026-11');month.dispatch_event('change')
 for w,h in [(320,740),(390,844),(844,390),(1366,768)]:
  page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h);assert page.locator('.agenda-calendar-grid').evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(w,h)
  if w in [390,1366]:page.screenshot(path=f'/tmp/agenda-calendar-{w}.png',full_page=True)
 page.reload();page.wait_for_function("typeof agendaCalendarEvents==='function'");assert page.evaluate('trainingLibrary.length')==2;assert len(page.evaluate("agendaCalendarEvents().filter(e=>e.kind==='training')"))==2
 assert not errors,errors;b.close()
print('PASS real session save/move, Monday calendar, deduplicated match, report link, dated preparation with recovery, no auto-save, year/leap/Paris dates, list fallback, reload and responsive layout.')
