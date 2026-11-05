from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.reportAttendanceInline')
 page.locator('#view-reports').click()
 page.evaluate('''()=>{
 squadSave([{id:'row-a',name:'Alex',number:8,photo:'',position:'Milieu'}]);
 coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-09-01',to:'2026-09-30',category:'U17',statuses:{},slots:[1,3,5].map(day=>({id:'weekday-'+day,day,type:'training',time:'19:00',title:'Entraînement',status:'pending'}))}));
 currentReport.info.date='2026-09-13';reportTab='general';renderReportContent();
 }''')
 line=page.locator('.report-minute-line').first
 assert line.locator('.report-row-day').count()==3
 line.get_by_label('Minutes jouées · Alex',exact=True).fill('75')
 line.get_by_label('Cartons jaunes · Alex',exact=True).fill('1')
 assert page.evaluate('currentReport.players.length')==1
 assert page.evaluate('currentReport.players[0].minutes')=='75'
 line.locator('.report-row-day select').first.select_option('present')
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('row-a').attendance.rate")==100
 page.evaluate("()=>{reportTab='players';renderReportContent()}")
 assert page.locator('#report-moments-panel').is_visible()
 assert page.locator('#report-content .report-minute-line').count()==0
 page.evaluate("()=>{reportTab='general';renderReportContent()}")
 line=page.locator('.report-minute-line').first
 assert line.get_by_label('Minutes jouées · Alex',exact=True).input_value()=='75'
 assert line.get_by_label('Cartons jaunes · Alex',exact=True).input_value()=='1'
 assert line.locator('.report-row-attendance select').first.input_value()=='present'
 line.locator('.report-row-attendance select').nth(1).select_option('absent')
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('row-a').attendance.rate")==50
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 assert not errors,errors
 b.close()
print('Compact player rows, direct minutes/cards, weekday attendance, preserved advanced details, no duplicated player and mobile passed')
