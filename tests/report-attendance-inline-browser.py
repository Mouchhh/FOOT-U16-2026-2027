"""Pointage from a blank/unlinked match report, directly on the page, with live rates."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.reportAttendanceInline && window.playerAttendanceSessions')
 page.locator('#view-reports').click()
 page.evaluate('''()=>{
  squadSave([{id:'inline-a',name:'Alex',number:8,position:'Milieu',photo:''},{id:'inline-b',name:'Noé',number:9,position:'Attaquant',photo:''}]);
  coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-09-01',to:'2026-09-30',category:'U17',statuses:{},slots:[{id:'inline-slot',day:2,type:'training',time:'19:00',title:'Entraînement récurrent',status:'pending'}]}));
  currentReport.info.date='';currentReport.players=[];reportTab='general';renderReportTabs();renderReportContent();
 }''')
 panel=page.locator('#report-attendance-inline');panel.locator(':scope > summary').click();panel.get_by_label('Enregistrement immédiat',exact=True).uncheck()
 assert page.locator('dialog[open]').count()==0
 panel.locator('.report-attendance-advanced > summary').click()
 panel.get_by_label('Présences du',exact=True).fill('2026-09-01');panel.get_by_label('Présences du',exact=True).dispatch_event('change')
 panel.get_by_label('Présences au',exact=True).fill('2026-09-30');panel.get_by_label('Présences au',exact=True).dispatch_event('change')
 select=panel.get_by_label('Séance de l’agenda',exact=True);assert select.locator('option').count()==5
 alex=panel.locator('[data-attendance-player="inline-a"]');noe=panel.locator('[data-attendance-player="inline-b"]')
 assert alex.locator('.report-attendance-rate').inner_text()=='—'
 alex.get_by_role('radio',name='Présent · Alex',exact=True).check();assert alex.locator('.report-attendance-rate').inner_text()=='100 %'
 assert noe.locator('.report-attendance-rate').inner_text()=='—'
 assert select.is_disabled()
 panel.get_by_role('checkbox',name='Confirmer le pointage de cette séance',exact=True).check()
 page.evaluate("()=>{window.inlineWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-training-library')throw Error('quota');return window.inlineWriter(k,v);};}")
 panel.get_by_role('button',name='Enregistrer le pointage',exact=True).click();assert alex.get_by_role('radio',name='Présent · Alex',exact=True).is_checked();assert page.evaluate('trainingLibrary.length')==0
 page.evaluate('()=>{coachStorageSet=window.inlineWriter;}');panel.get_by_role('button',name='Enregistrer le pointage',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==1 and page.evaluate('currentReport.players.length')==0
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('inline-a').attendance.rate")==100
 assert page.locator('dialog[open]').count()==0
 # Pick the next real date, mark absence; preview is immediate and persistence is canonical.
 select.select_option(index=1);alex.get_by_role('radio',name='Absent · Alex',exact=True).check();assert alex.locator('.report-attendance-rate').inner_text()=='50 %'
 panel.get_by_role('checkbox',name='Confirmer le pointage de cette séance',exact=True).check();panel.get_by_role('button',name='Enregistrer le pointage',exact=True).click()
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('inline-a').attendance.rate")==50
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('inline-b').attendance.rate") is None
 # Correction, no duplicate session, and pending selections survive a report rerender.
 alex.get_by_role('radio',name='Présent · Alex',exact=True).check();page.evaluate('renderReportContent()')
 assert alex.get_by_role('radio',name='Présent · Alex',exact=True).is_checked() and alex.locator('.report-attendance-rate').inner_text()=='100 %'
 panel.get_by_role('checkbox',name='Confirmer le pointage de cette séance',exact=True).check();panel.get_by_role('button',name='Enregistrer le pointage',exact=True).click();assert page.evaluate('trainingLibrary.length')==2
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('inline-a').attendance.rate")==100
 # A concurrent pointage cannot be overwritten silently.
 noe.get_by_role('radio',name='Présent · Noé',exact=True).check();page.evaluate("()=>{trainingLibrary[0].updatedAt='2026-11-04T12:00:00Z';}")
 panel.get_by_role('checkbox',name='Confirmer le pointage de cette séance',exact=True).check();panel.get_by_role('button',name='Enregistrer le pointage',exact=True).click()
 assert 'changé ailleurs' in panel.locator('[role=status]').inner_text()
 panel.get_by_role('button',name='Annuler les modifications',exact=True).click()
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert alex.get_by_role('radio',name='Présent · Alex',exact=True).locator('..').locator('span').bounding_box()['height']>=44
 assert not errors,errors
 b.close()
print('Inline recurrence selection without date/link prerequisite, collective radios, live rate, failed save, correction, draft survival, concurrency and mobile passed')
