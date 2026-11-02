from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=b.new_context(viewport={'width':1366,'height':900},timezone_id='America/New_York',reduced_motion='reduce')
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof agendaRecurringConfigure==="function" && window.externalModalClose')
    page.locator('#view-coach-agenda').click();month=page.locator('#coach-agenda-month');month.fill('2026-11');month.dispatch_event('change')
    before=page.evaluate('JSON.stringify(currentTraining)')
    page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template')
    d.get_by_label('Catégorie / équipe',exact=True).fill('U17')
    for day,kind,time,state in [('2','training','18:30','pending'),('4','video','19:00','confirmed')]:
        d.get_by_role('button',name='+ Ajouter un créneau',exact=True).click();row=d.locator('.recurring-slot').last
        row.locator('[name=day]').select_option(day);row.locator('[name=type]').select_option(kind);row.locator('[name=time]').fill(time);row.locator('[name=status]').select_option(state)
    assert '8 rendez-vous' in d.inner_text()
    cross=d.locator('.external-modal-close');cross.wait_for()
    assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
    d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();d.wait_for(state='detached')
    assert page.evaluate('trainingLibrary.length')==0
    assert page.evaluate('JSON.stringify(currentTraining)')==before
    assert page.evaluate('agendaCalendarEvents().filter(e=>e.recurring).length')==8
    event_id=page.evaluate("agendaCalendarEvents().find(e=>e.recurring&&e.date==='2026-11-03').id")
    chip=page.locator(f'.agenda-calendar-event[data-agenda-event="{event_id}"]')
    assert chip.get_attribute('data-event-status')=='pending'
    chip.click();detail=page.locator('#agenda-recurring-event')
    detail.get_by_role('button',name='Confirmer ce rendez-vous',exact=True).click()
    assert page.locator(f'.agenda-calendar-event[data-agenda-event="{event_id}"]').get_attribute('data-event-status')=='confirmed'
    detail.get_by_role('button',name='Fermer',exact=True).click();detail.wait_for(state='detached')
    page.reload();page.wait_for_function('window.externalModalClose');page.locator('#view-coach-agenda').click();month=page.locator('#coach-agenda-month');month.fill('2026-11');month.dispatch_event('change')
    assert page.evaluate('(id)=>agendaCalendarEvents().find(e=>e.id===id).status',event_id)=='confirmed'
    assert page.evaluate('agendaCalendarEvents().filter(e=>e.recurring).length')==8
    # A real saved session replaces the placeholder without changing the weekly configuration.
    page.evaluate("()=>{const s=newTraining();s.title='Séance réelle';s.date='2026-11-03';s.time='18:30';s.category='U17';s.coach=activeCoach.name;trainingLibrary=[s];coachStorageSet('vestiaire-training-library',JSON.stringify(trainingLibrary));renderCoachAgenda()}")
    assert page.evaluate("agendaCalendarEvents().filter(e=>e.kind==='training'&&e.date==='2026-11-03').length")==1
    assert page.evaluate("agendaCalendarEvents().find(e=>e.kind==='training'&&e.date==='2026-11-03').recurring||null") is None
    # Native event deletion affects one occurrence, not the series.
    video_id=page.evaluate("agendaCalendarEvents().find(e=>e.recurring&&e.kind==='video').id")
    page.locator(f'[data-agenda-event="{video_id}"]').first.click(button='right')
    page.get_by_role('menuitem',name='Supprimer de mon agenda',exact=True).click()
    assert not page.evaluate('(id)=>agendaCalendarEvents().some(e=>e.id===id)',video_id)
    assert len(page.evaluate('agendaRecurringRead().slots'))==2
    # A single edited appointment keeps its stable series/date identity and prepares the edited date.
    moved_id=page.evaluate("agendaCalendarEvents().find(e=>e.recurring&&e.date==='2026-11-10').id")
    page.locator(f'.agenda-calendar-event[data-agenda-event="{moved_id}"]').click(button='right')
    page.get_by_role('menuitem',name='Modifier l’événement',exact=True).click()
    edit=page.locator('#agenda-event-edit');edit.get_by_label('Date',exact=True).fill('2026-11-11');edit.get_by_label('Heure',exact=True).fill('19:15');edit.get_by_role('button',name='Enregistrer les modifications',exact=True).click();edit.wait_for(state='detached')
    assert page.evaluate('(id)=>agendaCalendarEvents().find(e=>e.id===id).date',moved_id)=='2026-11-11'
    page.locator(f'.agenda-calendar-event[data-agenda-event="{moved_id}"]').click()
    detail=page.locator('#agenda-recurring-event');detail.get_by_role('button',name='Préparer la séance',exact=True).click()
    assert page.evaluate('currentTraining.date')=='2026-11-11' and page.evaluate('currentTraining.time')=='19:15'
    assert page.evaluate('trainingLibrary.length')==1
    page.locator('#view-coach-agenda').click()
    # Year season and DST: local start times remain literal, including spring/autumn transitions.
    page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template')
    d.get_by_label('Période',exact=True).select_option('season')
    assert d.get_by_label('Du',exact=True).input_value()=='2026-07-01'
    assert d.get_by_label('Au',exact=True).input_value()=='2027-06-30'
    d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();d.wait_for(state='detached')
    assert page.evaluate("agendaRecurringOccurrences().filter(e=>e.kind==='training').every(e=>e.time==='18:30')")
    assert page.evaluate('agendaRecurringOccurrences().length')==104 # 52 Tuesdays and 52 Thursdays.
    assert page.evaluate("agendaRecurringOccurrences().some(e=>e.date==='2027-03-30'&&e.time==='18:30')")
    # Leap date generation is stable and scoped storage belongs to the active coach.
    assert page.evaluate("()=>{const x=structuredClone(agendaRecurringRead());x.from='2028-02-01';x.to='2028-02-29';x.slots=[{...x.slots[0],day:2}];return agendaRecurringOccurrences(x).length}")==5
    # Quota failures retain the previous configuration; no phantom entries appear.
    raw=page.evaluate('coachStorageGet(agendaRecurringKey)')
    page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template');d.locator('.recurring-slot [name=time]').first.fill('20:00')
    page.evaluate("()=>{window.realRecurringSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k===agendaRecurringKey)throw Error('quota');return realRecurringSet(k,v)}}")
    d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();assert d.is_visible()
    assert page.evaluate('coachStorageGet(agendaRecurringKey)')==raw
    page.evaluate('coachStorageSet=realRecurringSet');d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    # Pause suppresses generated entries while preserving real sessions and recurring settings.
    page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template');d.get_by_label('Activer la récurrence',exact=True).uncheck();d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();d.wait_for(state='detached')
    assert page.evaluate('agendaRecurringOccurrences().length')==0 and page.evaluate('trainingLibrary.length')==1
    assert page.locator('.agenda-calendar-legend [data-recurring-legend]').count()==2
    assert page.evaluate("""()=>{const original=agendaEventBoard;const saved=structuredClone(getCompositionBoard());saved.documentId='status-fixture';saves.push({state:saved});try{agendaEventBoard=()=>structuredClone(saved);const same=agendaRecurringState({kind:'match',draft:true});const edited=structuredClone(saved);edited.notes='Changed';agendaEventBoard=()=>edited;return [same,agendaRecurringState({kind:'match',draft:true})]}finally{saves.pop();agendaEventBoard=original}}""")==['confirmed','pending']
    # Invalid/duplicated rules are rejected; stale configuration editors cannot overwrite changes.
    assert page.evaluate("()=>{const x=structuredClone(agendaRecurringRead());x.enabled=true;x.slots=[x.slots[0],{...x.slots[0],id:'other-rule'}];return agendaRecurringValid(x)}") is False
    page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template')
    page.evaluate("()=>{const x=agendaRecurringRead();x.revision++;coachStorageSet(agendaRecurringKey,JSON.stringify(x))}")
    revision=page.evaluate('agendaRecurringRead().revision')
    d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click()
    assert 'a changé' in d.inner_text() and page.evaluate('agendaRecurringRead().revision')==revision
    d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    # Touch-sized editor and external red close at small widths.
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844});page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template')
        d.locator('.external-modal-close').wait_for()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
        page.screenshot(path=f'/tmp/agenda-week-template-{width}.png')
        d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    # Another local coach has no access to this template; page identities stay frozen.
    page.evaluate("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([coachLegacyProfile,{id:'recurring-other',name:'Autre coach'}]))")
    page.evaluate("localStorage.setItem('vestiaire-active-coach','recurring-other')")
    other=page.context.new_page();other.goto('http://127.0.0.1:3016/?mode=local');other.wait_for_function('typeof agendaRecurringRead==="function"')
    assert other.evaluate('activeCoach.id')=='recurring-other' and other.evaluate('agendaRecurringRead()') is None
    other.close();page.evaluate("localStorage.setItem('vestiaire-active-coach',activeCoach.id)")
    assert not errors,errors
    b.close()
print('Weekly/month/season recurrence, DST/leap dates, personal persistence, states, real-session deduplication, individual deletion, quota, pause and mobile closes passed')
