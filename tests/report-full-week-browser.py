from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.reportAttendanceInline')
 page.locator('#view-reports').click()
 page.evaluate('''()=>{
 playerStatsNow=()=>({day:'2026-11-04',time:'23:00'});
 squadSave([{id:'whole-a',name:'Alex',number:8,photo:'',position:'Milieu'}]);
 coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-11-01',to:'2026-11-30',category:'U17',statuses:{},slots:[1,3,5].map(day=>({id:'whole-'+day,day,type:'training',time:'19:00',title:'Entraînement',status:'pending'}))}));
 currentReport.info.date='2026-11-08';reportTab='general';renderReportContent();
 }''')
 selects=page.locator('.report-minute-line .report-row-day select');assert selects.count()==3
 assert 'à venir' in page.locator('.report-minute-line .report-row-day').nth(2).inner_text()
 assert page.evaluate("playerAttendanceSessions.events({year:2026,from:'2026-11-02',cutoff:'2026-11-08'}).length")==2
 selects.nth(2).select_option('present')
 assert page.evaluate("trainingLibrary[0].date")=='2026-11-06'
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('whole-a').attendance.entries.length")==0
 selects.nth(0).select_option('present')
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('whole-a').attendance.entries.length")==1
 panel=page.locator('#report-attendance-inline');panel.locator(':scope > summary').click()
 assert panel.locator('.report-attendance-day').count()==3
 assert 'à venir' in panel.locator('.report-attendance-day').nth(2).inner_text()
 page.evaluate("playerStatsNow=()=>({day:'2026-11-07',time:'23:00'})")
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('whole-a').attendance.entries.length")==2
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('All three weekly slots visible and selectable, pending preparation accepted, future labels, no premature attendance totals and mobile passed')
