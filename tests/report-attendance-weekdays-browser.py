from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.reportAttendanceInline')
 page.locator('#view-reports').click()
 page.evaluate('''()=>{
 squadSave([{id:'weekday-a',name:'Alex',number:8,photo:'',position:'Milieu'}]);
 coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-09-01',to:'2026-09-30',category:'U17',statuses:{},slots:[1,3,5].map(day=>({id:'weekday-'+day,day,type:'training',time:'19:00',title:'Entraînement',status:'pending'}))}));
 currentReport.info.date='2026-09-13';reportTab='general';renderReportContent();
 }''')
 panel=page.locator('#report-attendance-inline');panel.locator(':scope > summary').click()
 buttons=panel.locator('.report-attendance-day')
 assert buttons.all_text_contents()==['Séance lundi · 19:00','Séance mercredi · 19:00','Séance vendredi · 19:00']
 assert not panel.get_by_label('Présences du',exact=True).is_visible()
 buttons.nth(0).click();panel.get_by_role('radio',name='Présent · Alex',exact=True).check()
 assert page.evaluate("trainingLibrary[0].date")=='2026-09-07'
 buttons.nth(1).click();panel.get_by_role('radio',name='Absent · Alex',exact=True).check()
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('weekday-a').attendance.rate")==50
 buttons.nth(0).click();assert panel.get_by_role('radio',name='Présent · Alex',exact=True).is_checked()
 assert buttons.nth(0).get_attribute('aria-pressed')=='true'
 panel.get_by_role('button',name='Semaine de présence précédente',exact=True).click()
 assert '2026-09-02' in buttons.nth(0).get_attribute('data-occurrence')
 panel.get_by_role('button',name='Semaine du bilan',exact=True).click()
 assert buttons.nth(0).get_attribute('data-occurrence').startswith('2026-09-07')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('Agenda weekday shortcuts, inferred actual dates, saved roll calls, live rates, week navigation and mobile passed')
