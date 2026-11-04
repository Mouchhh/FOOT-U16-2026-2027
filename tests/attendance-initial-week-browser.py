from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof agendaRecurringCompleteInitialWeek==="function"')
 page.evaluate('''()=>{
 agendaCalendarToday=()=> '2026-11-04';playerStatsNow=()=>({day:'2026-11-05',time:'23:59'});
 squadSave([{id:'monday-a',name:'Alex',number:8,photo:'',position:'Milieu'}]);
 const slots=[1,3].map(day=>({id:crypto.randomUUID(),day,type:'training',time:'19:00',title:'Entraînement',status:'pending',location:''}));
 const plan=agendaRecurringReplace(null,slots,'2026-11-04',true,'U17');agendaRecurringCommit(plan,0);
 currentReport.info.date='2026-11-08';reportTab='general';renderReportContent();
 }''')
 page.locator('#view-reports').click()
 assert page.locator('.report-minute-line .report-row-day').count()==1
 assert page.evaluate('agendaRecurringCompleteInitialWeek()')
 assert page.locator('.report-minute-line .report-row-day').count()==2
 controls=page.locator('.report-minute-line .report-row-day select')
 assert '2026-11-02' in controls.nth(0).get_attribute('aria-label')
 assert page.evaluate('trainingLibrary.length')==0
 controls.nth(0).select_option('present')
 assert page.evaluate('trainingLibrary[0].date')=='2026-11-02'
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('monday-a').attendance.rate")==100
 assert not page.evaluate('agendaRecurringCompleteInitialWeek()')
 # Changing the template while the report is open refreshes the rows without clearing minutes.
 page.locator('.report-minute-line').get_by_label('Minutes jouées · Alex',exact=True).fill('60')
 page.evaluate('''()=>{const p=agendaRecurringRead();const wed=p.slots.find(s=>s.day===3);p.exceptions['recurring:'+wed.id+':2026-11-04']={deleted:true};agendaRecurringCommit(p,p.revision);}''')
 assert controls.count()==1
 assert page.locator('.report-minute-line').get_by_label('Minutes jouées · Alex',exact=True).input_value()=='60'
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('Initial-week Monday restored, pending slots pointable without prepared session, live recurrence refresh, deleted occurrences respected and mobile passed')
