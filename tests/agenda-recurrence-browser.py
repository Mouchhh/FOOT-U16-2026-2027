"""Unbounded rules, versioned future edits, exceptions and calendar integration."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1366,'height':900},timezone_id='America/New_York',reduced_motion='reduce')
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    def ready():
        page.wait_for_function('window.externalModalClose && typeof agendaRecurringChange==="function"')
        page.evaluate("agendaCalendarToday=()=>'2026-11-03'")
    def month(value):
        page.locator('#view-coach-agenda').click();page.locator('#coach-agenda-month').fill(value);page.locator('#coach-agenda-month').dispatch_event('change')
    def events(first,last):return page.evaluate('r=>agendaRecurringOccurrences(agendaRecurringRead(),r).map(({open,...e})=>e)',{'from':first,'to':last})
    def recurring_id(date):return page.evaluate('(day)=>agendaRecurringOccurrences(agendaRecurringRead(),{from:day,to:day}).find(e=>e.kind==="training").id',date)
    def edit(id,remove=False):
        page.evaluate('(x)=>agendaRecurringEdit(x.id,x.remove)',{'id':id,'remove':remove});d=page.locator('#agenda-recurring-edit');d.wait_for();return d
    page.goto('http://127.0.0.1:3016/?mode=local');ready();month('2026-11')
    before=page.evaluate('JSON.stringify(currentTraining)')
    page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template')
    assert d.get_by_label('Au',exact=True).count()==0
    d.get_by_label('À partir du',exact=True).fill('2026-10-01');d.get_by_label('Catégorie / équipe',exact=True).fill('U17')
    for day in ['2','4']:
        d.get_by_role('button',name='+ Ajouter un créneau',exact=True).click();row=d.locator('.recurring-slot').last
        row.locator('[name=day]').select_option(day);row.locator('[name=type]').select_option('training');row.locator('[name=time]').fill('19:00');row.locator('[name=title]').fill('Entraînement')
    d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();d.wait_for(state='detached')
    assert page.evaluate('agendaRecurringRead().version')==2 and page.evaluate('agendaRecurringRead().to') is None
    assert page.evaluate('trainingLibrary.length')==0 and page.evaluate('JSON.stringify(currentTraining)')==before
    assert len(events('2026-11-01','2026-11-30'))==8
    assert len(events('2040-11-01','2040-11-30'))>=8
    month('2040-11');assert page.locator('.agenda-calendar-event').count()>=8
    assert len(events('2028-02-01','2028-02-29'))==9
    assert all(e['time']=='19:00' for e in events('2027-03-20','2027-04-10'))
    page.reload();ready();month('2026-11');assert len(events('2040-11-01','2040-11-30'))>=8
    # Dragging a recurrence asks for scope before changing any appointment.
    drag_id=recurring_id('2026-11-05');chip=page.locator(f'.agenda-calendar-event[data-agenda-event="{drag_id}"]');transfer=page.evaluate_handle('new DataTransfer()')
    chip.dispatch_event('dragstart',{'dataTransfer':transfer});target=page.locator('.agenda-calendar-day[data-date="2026-11-06"]');target.dispatch_event('dragover',{'dataTransfer':transfer});target.dispatch_event('drop',{'dataTransfer':transfer})
    d=page.locator('#agenda-recurring-edit');assert d.get_by_label('Date',exact=True).input_value()=='2026-11-06';assert d.locator('#recurring-edit-scope').input_value()=='one'
    d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached');assert events('2026-11-05','2026-11-05')
    # A single moved occurrence keeps its original ID and is found in another month/year.
    one=recurring_id('2026-11-10');d=edit(one);d.get_by_label('Date',exact=True).fill('2026-11-11');d.get_by_label('Heure',exact=True).fill('20:00');d.get_by_role('button',name='Enregistrer les modifications',exact=True).click();d.wait_for(state='detached')
    assert any(e['id']==one and e['time']=='20:00' for e in events('2026-11-11','2026-11-11'))
    assert not events('2026-11-10','2026-11-10')
    far=recurring_id('2026-11-24');d=edit(far);d.get_by_label('Date',exact=True).fill('2041-02-15');d.get_by_role('button',name='Enregistrer les modifications',exact=True).click();d.wait_for(state='detached')
    assert sum(e['id']==far for e in events('2041-02-01','2041-02-28'))==1
    month('2041-02');assert page.locator(f'[data-agenda-event="{far}"]').count()>=1
    # Future scope only splits this series; past events and the other weekday remain unchanged.
    history=events('2026-10-01','2026-11-16');month('2026-11');future=recurring_id('2026-11-17');d=edit(future)
    d.locator('#recurring-edit-scope').select_option('future');d.get_by_label('Date',exact=True).fill('2026-11-18');d.get_by_label('Heure',exact=True).fill('21:00');d.get_by_role('button',name='Enregistrer les modifications',exact=True).click();d.wait_for(state='detached')
    assert events('2026-10-01','2026-11-16')==history
    assert not events('2026-11-17','2026-11-17')
    assert events('2026-11-18','2026-11-18')[0]['time']=='21:00'
    assert events('2026-11-19','2026-11-19')[0]['time']=='19:00'
    assert all(e['id']!=far for e in events('2041-02-01','2041-02-28'))
    # Confirmation preserves the dynamic status code; deletion offers both scopes.
    thursday=recurring_id('2026-11-12');page.evaluate('(id)=>agendaRecurringOpen(id)',thursday);detail=page.locator('#agenda-recurring-event');detail.get_by_role('button',name='Confirmer ce rendez-vous',exact=True).click()
    assert page.locator(f'.agenda-calendar-event[data-agenda-event="{thursday}"]').get_attribute('data-event-status')=='confirmed'
    detail.get_by_role('button',name='Fermer',exact=True).click();detail.wait_for(state='detached')
    chip=page.locator(f'.agenda-calendar-event[data-agenda-event="{thursday}"]');chip.click(button='right');page.locator('#agenda-event-menu').get_by_role('menuitem',name='Supprimer de mon agenda',exact=True).click();d=page.locator('#agenda-recurring-edit')
    d.get_by_role('button',name='Supprimer',exact=True).click();d.wait_for(state='detached');assert not events('2026-11-12','2026-11-12')
    page.locator('#agenda-matches-restore').click();assert events('2026-11-12','2026-11-12')[0]['status']=='confirmed'
    stop=recurring_id('2026-11-25');d=edit(stop,True);d.locator('#recurring-edit-scope').select_option('future');d.get_by_role('button',name='Supprimer',exact=True).click();d.wait_for(state='detached')
    assert events('2026-11-18','2026-11-18') and not events('2026-11-25','2026-11-25')
    assert events('2040-11-01','2040-11-30') and all(e['time']=='19:00' for e in events('2040-11-01','2040-11-30'))
    # A real saved session replaces its generated placeholder without creating blank documents.
    page.evaluate("()=>{const s=newTraining();s.title='Séance réelle';s.category='U17';s.date='2026-11-19';s.time='19:00';trainingLibrary=[s];coachStorageSet('vestiaire-training-library',JSON.stringify(trainingLibrary));renderCoachAgenda()}")
    assert page.evaluate("agendaCalendarEvents().filter(e=>e.kind==='training'&&e.date==='2026-11-19').length")==1
    # Quota and stale-editor failures preserve the previous rules.
    thursday=recurring_id('2026-11-26');d=edit(thursday);d.get_by_label('Heure',exact=True).fill('22:00');raw=page.evaluate('coachStorageGet(agendaRecurringKey)')
    page.evaluate("()=>{window.realRecurringSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k===agendaRecurringKey)throw Error('quota');return realRecurringSet(k,v)}}")
    d.get_by_role('button',name='Enregistrer les modifications',exact=True).click();assert d.is_visible() and page.evaluate('coachStorageGet(agendaRecurringKey)')==raw
    page.evaluate('()=>{coachStorageSet=realRecurringSet}');d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    d=edit(thursday);page.evaluate("()=>{const plan=agendaRecurringRead();plan.revision++;coachStorageSet(agendaRecurringKey,JSON.stringify(plan))}");revision=page.evaluate('agendaRecurringRead().revision');d.get_by_role('button',name='Enregistrer les modifications',exact=True).click();assert 'a changé' in d.inner_text() and page.evaluate('agendaRecurringRead().revision')==revision;d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    # Editing the complete week takes effect at a chosen boundary, never retroactively.
    old=events('2026-10-01','2026-11-30');page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template');d.get_by_label('À partir du',exact=True).fill('2026-12-01');d.locator('.recurring-slot [name=time]').last.fill('18:30');d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();d.wait_for(state='detached');assert events('2026-10-01','2026-11-30')==old
    assert any(e['time']=='18:30' for e in events('2040-11-01','2040-11-30'))
    # Reminder projection uses today's window even when the calendar is browsing 2040.
    month('2040-11');page.evaluate("coachAccountSaveSection('notifications',{training:true,match:false,lead:30,browser:false})")
    page.evaluate("()=>{const old=notify;window.recurringReminders=[];notify=x=>recurringReminders.push(x);try{coachAccountCheckReminders(new Date('2026-11-03T17:40:00Z'))}finally{notify=old}}")
    assert page.evaluate('recurringReminders.length')==1
    # Stopping the complete weekly rule preserves its past, and a manual restart stays unbounded.
    past=events('2026-10-01','2026-12-14');month('2026-11');page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template')
    d.get_by_label('À partir du',exact=True).fill('2026-12-15');d.get_by_label('Activer la récurrence',exact=True).uncheck();d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();d.wait_for(state='detached')
    assert events('2026-10-01','2026-12-14')==past and not events('2040-11-01','2040-11-30')
    assert page.evaluate('trainingLibrary.length')==1
    page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template');assert d.locator('.recurring-slot').count()>=1
    d.get_by_label('À partir du',exact=True).fill('2027-01-01');d.get_by_label('Activer la récurrence',exact=True).check();d.get_by_role('button',name='Enregistrer ma semaine type',exact=True).click();d.wait_for(state='detached')
    assert events('2040-11-01','2040-11-30') and not events('2026-12-15','2026-12-31')
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844});page.locator('#agenda-week-template-open').click();d=page.locator('#agenda-week-template');cross=d.locator('.external-modal-close');cross.wait_for()
        assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2') and page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=f'/tmp/agenda-persistent-{width}.png');d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
        target_id=events('2040-11-01','2040-11-30')[0]['id'];d=edit(target_id);d.locator('#recurring-edit-scope').select_option('future');cross=d.locator('.external-modal-close');cross.wait_for()
        assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2') and cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        page.screenshot(path=f'/tmp/agenda-persistent-edit-{width}.png');d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    # Old active month/season settings are upgraded without an arbitrary ending or mutation of their backup.
    page.evaluate("()=>{const old={version:1,scope:'month',revision:1,enabled:true,from:'2025-01-01',to:'2025-01-31',category:'U17',statuses:{},slots:[{id:'legacy-slot',day:2,type:'training',time:'19:00',title:'Ancien créneau',status:'pending'}]};coachStorageSet(agendaRecurringKey,JSON.stringify(old));}")
    assert page.evaluate('agendaRecurringRead().version')==2 and page.evaluate("JSON.parse(coachStorageGet(agendaRecurringKey)).version")==1
    assert len(events('2045-01-01','2045-01-31'))>=4
    page.evaluate("()=>{const old=JSON.parse(coachStorageGet(agendaRecurringKey));old.enabled=false;coachStorageSet(agendaRecurringKey,JSON.stringify(old));}")
    assert not events('2027-01-01','2027-01-31')
    # A future rule update cannot erase an occurrence already moved into the past.
    page.evaluate("""()=>{const p={version:1,scope:'month',revision:1,enabled:true,from:'2026-10-01',to:'2026-11-30',category:'U17',statuses:{},slots:[{id:'edge-series',day:2,type:'training',time:'19:00',title:'Historique',status:'pending'}]};coachStorageSet(agendaRecurringKey,JSON.stringify(p));let plan=agendaRecurringRead();agendaRecurringChange('recurring:edge-series:2026-11-24','one',{date:'2026-10-20',time:'18:00',title:'Déjà joué',location:''},plan.revision);plan=agendaRecurringRead();agendaRecurringChange('recurring:edge-series:2026-11-17','future',{date:'2026-11-17',time:'21:00',title:'Nouveau créneau',location:''},plan.revision);}""")
    assert any(e['id']=='recurring:edge-series:2026-11-24' and e['time']=='18:00' for e in events('2026-10-20','2026-10-20'))
    # For an occurrence moved far ahead, future scope begins at its displayed appointment date.
    page.evaluate("""()=>{let plan=agendaRecurringRead();agendaRecurringChange('recurring:edge-series:2026-10-13','one',{date:'2041-02-15',time:'19:00',title:'Report lointain',location:''},plan.revision);plan=agendaRecurringRead();agendaRecurringChange('recurring:edge-series:2026-10-13','future',null,plan.revision);}""")
    assert events('2030-01-01','2030-01-31') and not events('2042-01-01','2042-01-31')
    assert not any(e['id']=='recurring:edge-series:2026-10-13' for e in events('2041-02-01','2041-02-28'))
    # Advancing all future Tuesdays to Monday includes the chosen Monday, not the following week.
    page.evaluate("""()=>{coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-10-01',to:'2026-11-30',category:'U17',statuses:{},slots:[{id:'advance-series',day:2,type:'training',time:'19:00',title:'Avancer',status:'pending'}]}));agendaRecurringChange('recurring:advance-series:2026-11-17','future',{date:'2026-11-16',time:'19:00',title:'Lundi',location:''},agendaRecurringRead().revision);}""")
    assert events('2026-11-16','2026-11-16') and not events('2026-11-17','2026-11-17')
    assert events('2026-11-10','2026-11-10')
    assert not errors,errors
    browser.close()
print('Persistent years-ahead rules, migration, occurrence/future edit/delete, history, moved exceptions, states, deduplication, reminder window, quotas, stale edits and mobile passed')
