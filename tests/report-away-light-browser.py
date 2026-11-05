"""Actual J6 away fixture, score orientation, single facts editor and light player controls."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('typeof reportMatchLocation==="function"')
 page.evaluate('''()=>{
 const schedule=clubFixtureSchedules[0],j6=schedule.fixtures.find(f=>f.round===6);window.testFixture={...j6,key:'test:j6',team:schedule.team,opponent:j6.home,location:'À l’extérieur',competition:schedule.competition};
 const original=agendaCalendarAllEvents;agendaCalendarAllEvents=range=>[...original(range),{kind:'match',date:testFixture.date,fff:testFixture,title:'J6',time:testFixture.time}];
 squadSave([{id:'light-a',name:'Alex',number:8,photo:'',position:'Milieu'}]);
 const source=structuredClone(getCompositionBoard());source.documentId='away-prep';source.title='J6';source.fffFixtureKey=testFixture.key;source.players=source.players.slice(0,1);Object.assign(source.players[0],{id:'light-a',name:'Alex',number:8,role:'starter'});source.matchPreparation={...newMatchPreparation(),date:j6.date,opponent:j6.home,objectives:['Jouer ensemble','','','']};saves=[...saves.filter(s=>s.state.squadDirectory),{date:new Date().toISOString(),state:source}];
 coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-11-01',to:'2026-11-30',category:'U17',statuses:{},slots:[1,3,5].map(day=>({id:'light-'+day,day,type:'training',time:'19:00',title:'Entraînement',status:'pending'}))}));
 currentReport=newReport();currentReport.info.date=j6.date;currentReport.info.opponent=j6.home;currentReport.info.team=schedule.team;workspaceNavigation.run('view-reports');reportTab='general';renderReportTabs();renderReportContent();
 currentReport.info.goalsFor='2';currentReport.info.goalsAgainst='1';currentReport.info.halfFor='0';currentReport.info.halfAgainst='1';currentReport.events=[{minute:'20',type:'Autre',detail:'Fait conservé'}];renderReportContent();
 }''')
 assert page.evaluate('currentReport.info.venue')=='Extérieur'
 assert page.locator('.report-venue-badge').inner_text()=='Extérieur'
 assert page.locator('#report-quick-result').inner_text()=='1 — 2 · Victoire'
 assert page.locator('.report-score-side strong').all_inner_texts()==['MÉRAL COSSÉ US','MAYENNE STADE FC 2']
 assert page.locator('.report-score-side input').evaluate_all('rows=>rows.map(r=>r.value)')==['1','2']
 assert page.locator('.report-halftime-score input').evaluate_all('rows=>rows.map(r=>r.value)')==['1','0']
 assert page.locator('#report-quick-panel [data-event-index]').count()==0
 line=page.locator('.report-minute-line').first;assert line.locator('.report-presence-badge').count()==3
 line.get_by_label('Minutes jouées · Alex',exact=True).fill('75');line.get_by_label('Cartons jaunes · Alex',exact=True).fill('1')
 assert page.evaluate('currentReport.players[0].minutes')=='75'
 assert page.evaluate('currentReport.players[0].yellowCards')=='1'
 for w in [1440,820,390,320]:
  page.set_viewport_size({'width':w,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),w
  page.screenshot(path=f'/tmp/report-away-light-{w}.png',full_page=True)
 page.evaluate("reportTab='players';renderReportTabs();renderReportContent()")
 assert page.locator('[data-event-index="0"]').is_visible()
 page.evaluate("reportTab='preview';renderReportTabs();renderReportContent()")
 assert page.locator('.report-summary-score').inner_text()=='1 – 2'
 assert page.locator('.report-summary-halftime').inner_text()=='Mi-temps : 1 – 0'
 page.evaluate("reportTab='general';renderReportContent()")
 page.locator('#report-quick-panel').get_by_label('Lieu du match',exact=True).select_option('Terrain neutre')
 assert page.evaluate('currentReport.info.venue')=='Terrain neutre'
 assert page.locator('.report-score-side input').evaluate_all('rows=>rows.map(r=>r.value)')==['2','1']
 assert page.evaluate('currentReport.events[0].detail')=='Fait conservé'
 assert not errors,errors;b.close()
print('PASS: real J6 away fixture resolves from causerie, home/away and halftime ordering without data inversion, editable venue, facts only in Moments, minutes/cards and three weekday badges retained, desktop/mobile.')
