from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.reportAttendanceInline');page.locator('#view-reports').click()
 page.evaluate('''()=>{
 playerStatsNow=()=>({day:'2026-11-04',time:'23:00'});
 squadSave([{id:'badge-b',name:'Basile',number:8,photo:'',position:'Milieu'},{id:'badge-t',name:'Tobias',number:9,photo:'',position:'Attaquant'}]);
 coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-10-01',to:'2026-11-30',category:'U17',statuses:{},slots:[1,3,5].map(day=>({id:'badge-'+day,day,type:'training',time:'19:00',title:'Entraînement',status:'pending'}))}));
 currentReport.info.date='2026-11-08';reportTab='general';renderReportContent();
 }''')
 rows=page.locator('.report-minute-line');assert rows.count()==2
 badges=rows.first.locator('.report-presence-badge');assert badges.all_text_contents()==['L','M','V']
 assert badges.nth(2).get_attribute('data-upcoming')=='true'
 badges.first.click();assert badges.first.get_attribute('data-status')=='present'
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('badge-b').attendance.rate")==100
 assert rows.nth(1).locator('.report-presence-badge').first.get_attribute('data-status')=='uncertain'
 badges.first.click();assert badges.first.get_attribute('data-status')=='absent'
 badges.first.click();assert badges.first.get_attribute('data-status')=='uncertain'
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('badge-b').attendance.rate") is None
 # Saving a future response keeps the future session outside current season totals.
 badges.nth(2).click();assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('badge-b').attendance.entries.length")==1
 # Failed persistence leaves the badge at its previous value.
 page.evaluate("()=>{window.badgeWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-training-library')throw Error('quota');return badgeWriter(k,v)}}")
 rows.nth(1).locator('.report-presence-badge').first.click();assert rows.nth(1).locator('.report-presence-badge').first.get_attribute('data-status')=='uncertain'
 page.evaluate('coachStorageSet=badgeWriter')
 page.locator('#report-content input[type=date]').first.fill('2026-10-25')
 assert '19/10/2026' in page.locator('.report-row-period').inner_text()
 assert '19 octobre 2026' in badges.first.get_attribute('title')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 assert not errors,errors
 b.close()
print('Day badges on both players, three-state cycle, isolated attendance, future exclusion, failed-save rollback, date refresh and mobile passed')
