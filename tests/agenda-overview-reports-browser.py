"""Monthly overview: scheduled is not completed, recurring dedup, reports and PDF."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('!!window.agendaOverviewReports')
 page.evaluate('''()=>{
 window.testMonth=agendaCalendarMonth(agendaCalendarToday().slice(0,7),-1);
 const a=newTraining();a.date=testMonth+'-05';a.title='Séance pointée';a.attendance={version:1,source:'manual',date:a.date,time:a.time,validatedAt:new Date().toISOString(),rows:[{id:'p',name:'Joueur',status:'present',keeper:false,included:true}]};
 const b=newTraining();b.date=testMonth+'-07';b.title='Séance préparée uniquement';trainingLibrary=[a,b];
 const r=newReport();r.info.date=testMonth+'-09';r.agendaSourceKey='match:fixture';r.title='Match joué';r.documentCompletion={version:1,kind:'report',at:new Date().toISOString(),fingerprint:documentCompletionFingerprint(r)};reportLibrary=[r];
 window.testOriginalEvents=agendaCalendarAllEvents;
 agendaCalendarAllEvents=()=>[
 {id:'a',kind:'training',date:a.date,time:a.time,title:a.title,session:a},
 {id:'repeat',kind:'training',date:a.date,time:a.time,title:a.title,recurring:{}},
 {id:'b',kind:'training',date:b.date,time:b.time,title:b.title,session:b},
 {id:'match:fixture',kind:'match',date:r.info.date,title:r.title},
 ];
 $('agenda-overview-month').value=testMonth;workspaceNavigation.run('view-coach-agenda',()=>workspaceFlows.agenda.go(0));agendaOverviewReports.render();
 }''')
 s=page.evaluate('(()=>{const s=agendaOverviewReports.snapshot(testMonth);return {rate:s.rate,elapsed:s.elapsed.length,done:s.done.length,rows:s.rows.length,volume:s.documentedMinutes,planned:s.plannedMinutes}})()')
 assert s=={'rate':67,'elapsed':3,'done':2,'rows':3,'volume':90,'planned':180},s
 assert page.locator('.agenda-overview-event').count()==3
 assert page.locator('#agenda-overview-export').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(228, 31, 40)'
 page.evaluate('window.savedCompletion=reportLibrary[0].documentCompletion;delete reportLibrary[0].documentCompletion;')
 assert page.evaluate('agendaOverviewReports.snapshot(testMonth).rate')==33
 page.evaluate('reportLibrary[0].documentCompletion=savedCompletion')
 assert page.get_by_role('button',name='Consulter le Rapport →',exact=True).count()==1
 page.evaluate('()=>{window.print=()=>{window.printContent=document.getElementById("agenda-overview-print").innerText;};}')
 page.locator('#agenda-overview-export').click();assert 'Rapport mensuel' in page.evaluate('printContent');page.evaluate('window.dispatchEvent(new Event("afterprint"))');assert not page.locator('#agenda-overview-print').count()
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000});page.screenshot(path=f'/tmp/agenda-overview-{width}.png')
  assert page.locator('#agenda-overview-reports').evaluate('e=>e.scrollWidth<=e.clientWidth')
 page.get_by_role('button',name='Consulter le Rapport →',exact=True).click();assert page.evaluate('currentReport.title')=='Match joué'
 page.evaluate('agendaCalendarAllEvents=testOriginalEvents;trainingLibrary=[];reportLibrary=[];agendaOverviewReports.render()');assert page.evaluate('agendaOverviewReports.snapshot(testMonth).rate') is None
 assert not errors,errors;b.close();print('PASS: monthly rates, no prepared/completed confusion, recurring dedup, report access, PDF and mobile.')
