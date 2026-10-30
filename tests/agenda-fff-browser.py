from playwright.sync_api import sync_playwright
URL='https://epreuves.fff.fr/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/saison'
ICS='''BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:journee-1
SEQUENCE:1
DTSTART:20261107T170000Z
SUMMARY:SMFC - Laval
LOCATION:Stade municipal
CATEGORIES:Championnat U17
END:VEVENT
END:VCALENDAR'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaFFFParse==='function' && window.trainingWizard")
 assert page.evaluate('(u)=>agendaFFFURL(u)',URL)==URL
 assert page.evaluate("agendaFFFURL('https://epreuves.fff.fr.evil.example/competition/club/1/equipe/2/saison')")==''
 parsed=page.evaluate('([t,u])=>agendaFFFParse(t,u)',[ICS,URL]);assert parsed[0]['time']=='18:00'
 assert page.evaluate("agendaFFFDate('20260705T230000Z').date")=='2026-07-06'
 assert page.evaluate("agendaFFFDate('20261107').time")==''
 assert page.evaluate("(u)=>agendaFFFParse('date;heure;adversaire;lieu;competition;id\\n08/11/2026;14:00;Dinan;Stade;U17;j2',u)[0].date",URL)=='2026-11-08'
 assert page.evaluate("([t,u])=>{try{agendaFFFParse(t.replace('END:VEVENT','RRULE:FREQ=WEEKLY\\nEND:VEVENT'),u);return false}catch{return true}}",[ICS,URL])
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.locator('#agenda-fff-panel>summary').click()
 assert page.locator('#agenda-fff-url').input_value()==URL
 page.locator('#agenda-fff-category').fill('U17');page.get_by_role('button',name='Enregistrer mon équipe',exact=True).click()
 def upload(content):
  page.locator('#agenda-fff-file').set_input_files({'name':'saison.ics','mimeType':'text/calendar','buffer':content.encode()})
  page.locator('#agenda-fff-confirm').wait_for()
 upload(ICS);assert page.evaluate('agendaFFFRead().fixtures.length')==0
 page.locator('#agenda-fff-confirm').click();assert page.evaluate('agendaFFFRead().fixtures.length')==1
 upload(ICS);page.locator('#agenda-fff-confirm').click();assert page.evaluate('agendaFFFRead().fixtures.length')==1
 moved=ICS.replace('SEQUENCE:1','SEQUENCE:2').replace('20261107T170000Z','20261114T160000Z')
 upload(moved);page.locator('#agenda-fff-confirm').click();assert page.evaluate('agendaFFFRead().fixtures[0].date')=='2026-11-14'
 upload(ICS);page.locator('#agenda-fff-confirm').click();assert page.evaluate('agendaFFFRead().fixtures[0].date')=='2026-11-14'
 page.reload();page.wait_for_function("typeof agendaFFFParse==='function'");assert page.evaluate('agendaFFFRead().fixtures.length')==1
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.locator('#coach-agenda-month').fill('2026-11');page.locator('#coach-agenda-month').dispatch_event('change');assert page.locator('[data-date="2026-11-14"] .agenda-calendar-event[aria-label*="SMFC - Laval"]').count()==1
 previous=page.evaluate('JSON.stringify(getCompositionBoard())');page.once('dialog',lambda d:d.accept());page.locator('[data-date="2026-11-14"] .agenda-calendar-event[aria-label*="SMFC - Laval"]').click()
 assert page.evaluate('getCompositionBoard().matchPreparation.date')=='2026-11-14';assert page.evaluate('getCompositionBoard().category')=='U17'
 assert page.evaluate("workspaceRecoveryEntries().composition.payload.matchPreparation?.date||''")!= '2026-11-14'
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');assert page.locator('[data-date="2026-11-14"] .agenda-calendar-event[aria-label*="SMFC - Laval"]').count()==1
 page.locator('#agenda-fff-panel>summary').click();cancelled=moved.replace('END:VEVENT','STATUS:CANCELLED\nEND:VEVENT').replace('SEQUENCE:2','SEQUENCE:3');upload(cancelled);page.locator('#agenda-fff-confirm').click();assert page.evaluate('agendaFFFEvents().length')==0
 assert page.evaluate("agendaCalendarEvents().some(e=>e.title.startsWith('ANNULÉ'))")
 before=page.evaluate("coachStorageGet('vestiaire-fff-calendar')");upload(moved.replace('SEQUENCE:2','SEQUENCE:4'))
 page.evaluate("()=>{window.fffWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-fff-calendar')throw Error('quota');return fffWriter(k,v)}}");page.locator('#agenda-fff-confirm').click();assert page.evaluate("coachStorageGet('vestiaire-fff-calendar')")==before;page.evaluate('()=>{coachStorageSet=fffWriter}')
 page.evaluate("()=>{window.originalFFFReader=coachStorageGet;coachStorageGet=k=>k==='vestiaire-fff-calendar'?null:originalFFFReader(k)}");assert page.evaluate('agendaFFFRead().fixtures.length')==0;page.evaluate('coachStorageGet=originalFFFReader')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2');page.screenshot(path='/tmp/agenda-fff-mobile.png',full_page=True)
 page.once('dialog',lambda d:d.accept());page.locator('#agenda-fff-remove').click();assert page.evaluate('agendaFFFRead().fixtures.length')==0;assert page.evaluate("getCompositionBoard().matchPreparation.date")=='2026-11-14'
 assert not errors,errors
 b.close();print('FFF link, ICS/CSV dates, preview, UID dedup/report/cancel, preparation recovery, reload, quota and mobile passed')
