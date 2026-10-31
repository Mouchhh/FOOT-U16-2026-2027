from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))");page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaEventEdits==='function' && window.trainingWizard")
 def agenda():
  page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');month=page.locator('#coach-agenda-month');month.fill('2026-11');month.dispatch_event('change')
 agenda();chip=page.locator('[data-date="2026-11-07"] .agenda-calendar-event');source=page.evaluate('JSON.stringify(clubFixtureSchedules)');chip.click(button='right');assert chip.count()==1
 menu=page.locator('#agenda-event-menu');assert menu.is_visible();assert menu.get_by_role('menuitem',name='Modifier l’événement',exact=True).count()==1
 assert menu.get_by_role('menuitem',name='Préparer la causerie',exact=True).count()==1
 menu.get_by_role('menuitem',name='Modifier l’événement',exact=True).click();d=page.locator('#agenda-event-edit');d.get_by_label('Titre',exact=True).fill('Match reprogrammé');d.get_by_label('Date',exact=True).fill('2026-11-08');d.get_by_label('Heure',exact=True).fill('17:15');d.get_by_label('Lieu',exact=True).fill('Terrain principal');d.get_by_role('button',name='Enregistrer les modifications').click()
 assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==0
 moved=page.locator('[data-date="2026-11-08"] .agenda-calendar-event');assert '17:15' in moved.inner_text();assert 'Match reprogrammé' in moved.inner_text()
 assert page.evaluate('JSON.stringify(clubFixtureSchedules)')==source
 page.reload();page.wait_for_function("typeof agendaEventEdits==='function'");agenda();moved=page.locator('[data-date="2026-11-08"] .agenda-calendar-event');assert moved.count()==1
 moved.click(button='right');menu.get_by_role('menuitem',name='Préparer la causerie',exact=True).click();assert page.evaluate('getCompositionBoard().matchPreparation.date')=='2026-11-08';assert page.locator('#task-causerie').is_visible()
 agenda();page.locator('[data-date="2026-11-08"] .agenda-calendar-event').click(button='right');menu.get_by_role('menuitem',name='Créer ou ouvrir le bilan',exact=True).click();assert page.evaluate('currentReport.info.date')=='2026-11-08';assert page.evaluate('currentReport.info.time')=='17:15';assert page.evaluate('currentReport.info.opponent')=='MÉRAL COSSÉ US';assert page.evaluate('reportValid(currentReport)')
 report_id=page.evaluate('currentReport.id');agenda();page.locator('[data-date="2026-11-08"] .agenda-calendar-event').click(button='right');menu.get_by_role('menuitem',name='Créer ou ouvrir le bilan',exact=True).click();assert page.evaluate('currentReport.id')==report_id
 agenda();page.locator('[data-date="2026-11-08"] .agenda-calendar-event').click(button='right');menu.get_by_role('menuitem',name='Créer une séance',exact=True).click();assert page.evaluate('currentTraining.date')=='2026-11-08';assert page.evaluate('currentTraining.blocks.length')==0
 # Blank future day offers creation directly and uses that date.
 agenda();page.locator('[data-date="2026-11-20"]').click(button='right');menu.get_by_role('menuitem',name='Créer une séance',exact=True).click();assert page.evaluate('currentTraining.date')=='2026-11-20'
 # Generic training/report cards and chips are actionable too.
 page.evaluate("()=>{currentTraining.title='Séance enregistrée';saveTrainingDraft();trainingLibrary=[structuredClone(currentTraining)];reportLibrary=[structuredClone(currentReport)];renderCoachAgenda()}")
 agenda();training=page.locator('[data-date="2026-11-20"] .agenda-calendar-event');training.click(button='right');assert menu.get_by_role('menuitem',name='Ouvrir la séance',exact=True).count()==1;page.keyboard.press('Escape');assert not menu.count()
 page.locator('[data-agenda-day="2026-11-20"]').click();page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='Actions de cet événement',exact=True).click();assert menu.is_visible();assert menu.bounding_box()['x']>=0;page.screenshot(path='/tmp/agenda-context-mobile.png',full_page=False);page.keyboard.press('Escape')
 page.set_viewport_size({'width':1366,'height':900});training.click(button='right');menu.get_by_role('menuitem',name='Supprimer de mon agenda',exact=True).click();assert page.locator('[data-date="2026-11-20"] .agenda-calendar-event').count()==0;assert page.evaluate('trainingLibrary.length')==1
 page.locator('#agenda-matches-restore').click();assert page.locator('[data-date="2026-11-20"] .agenda-calendar-event').count()==1
 # Quota rollback leaves a fixture visible, and source data is still intact.
 page.evaluate("()=>{window.agendaWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-agenda-removed-matches')throw Error('quota');return agendaWriter(k,v)}}")
 page.locator('[data-date="2026-11-14"] .agenda-calendar-event').click(button='right');menu.get_by_role('menuitem',name='Supprimer de mon agenda',exact=True).click();assert page.locator('[data-date="2026-11-14"] .agenda-calendar-event').count()==1;page.evaluate('()=>{coachStorageSet=agendaWriter}')
 assert page.evaluate('JSON.stringify(clubFixtureSchedules)')==source
 # Independent coach profile has no edits or deletions from Enzo's agenda.
 other=b.new_context();other.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Hugo Mottais'}]))");peer=other.new_page();peer.goto('http://127.0.0.1:3016/?mode=local');peer.wait_for_function("typeof agendaEventEdits==='function'");assert peer.evaluate('agendaEventEdits().length')==0;assert peer.evaluate('agendaRemovedMatches().length')==0;assert peer.evaluate("agendaCalendarEvents().filter(e=>e.kind==='match').length")==31
 assert not errors,errors
 other.close();ctx.close();b.close();print('Context menus, edits/reload, causerie, report reuse, new sessions, generic events, mobile, deletion/restore, quota and coach isolation passed')
