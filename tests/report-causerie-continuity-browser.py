"""Causerie -> report continues the saved encounter without duplicates or bleed."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.playerMonthlyReports')
 page.evaluate('''()=>{
 const make=(id,title,date,name)=>{const s=structuredClone(getCompositionBoard());s.documentId=id;s.title=title;s.players=s.players.slice(0,1);Object.assign(s.players[0],{id,name,number:1,role:'starter'});s.matchPreparation={...newMatchPreparation(),date,opponent:'Adversaire '+id,offensive:'Consigne '+id,objectives:['Objectif '+id,'','','']};s.documentCompletion={version:1,kind:'causerie',at:new Date().toISOString(),fingerprint:documentCompletionFingerprint(s)};return s;};
 window.sourceA=make('link-a','Causerie A','2026-10-25','Alice');window.sourceB=make('link-b','Causerie B','2026-11-01','Basile');
 saves=[{date:new Date().toISOString(),state:sourceA},{date:new Date().toISOString(),state:sourceB}];
 currentReport=newReport();currentReport.info.date='';currentReport.info.opponent='';delete currentReport.preparation;workspaceNavigation.run('view-reports');reportTab='general';renderReportTabs();renderReportContent();
 }''')
 page.locator('#report-causerie-source').select_option('board:link-a')
 assert page.evaluate('currentReport.preparation.sourceCompositionId')=='link-a'
 assert page.evaluate('currentReport.info.date')=='2026-10-25'
 assert page.evaluate('currentReport.players[0].name')=='Alice'
 assert page.evaluate('currentReport.preparation.plan.offensive')=='Consigne link-a'
 # A fresh link can change without leaking players or inherited priority from A.
 page.locator('#report-causerie-source').select_option('board:link-b')
 assert page.evaluate('currentReport.players.map(p=>p.name)')==['Basile']
 assert page.evaluate('currentReport.plan.priority')=='Objectif link-b'
 assert page.evaluate('currentReport.info.date')=='2026-11-01'
 # A saved report for this encounter is resumed, retaining score/minutes/facts.
 page.evaluate('''()=>{currentReport.info.goalsFor='2';currentReport.info.goalsAgainst='1';currentReport.players[0].minutes='75';window.savedId=currentReport.id;reportLibrary=[structuredClone(currentReport)];currentReport=newReport();currentReport.info.date='';currentReport.info.opponent='';delete currentReport.preparation;renderReportContent();}''')
 page.locator('#report-causerie-source').select_option('board:link-b')
 assert page.evaluate('currentReport.id===savedId')
 assert page.evaluate('currentReport.players[0].minutes')=='75'
 assert page.evaluate('currentReport.info.goalsFor')=='2'
 before=page.evaluate('JSON.stringify(currentReport)')
 page.locator('#report-causerie-source').select_option('board:link-a')
 assert page.evaluate('JSON.stringify(currentReport)')==before
 assert 'autre match' in page.locator('.report-causerie-status').inner_text()
 # All fourteen remembered players fit in a short three-column desktop group.
 page.evaluate('''()=>{currentReport.players=Array.from({length:14},(_,i)=>({id:'p'+i,name:'Joueur '+(i+1),number:String(i+1),role:i<11?'Titulaire':'Impacteur / Finisseur',minutes:'45',score:'',note:'',objective:'',goals:'0',assists:'0'}));currentReport.preparation.roster=[];reportTab='preview';renderReportTabs();renderReportContent();}''')
 assert page.locator('.report-summary-group').evaluate('(e)=>e.getBoundingClientRect().height')<400
 assert page.locator('.report-summary-roster li').count()==14
 assert page.locator('.report-summary-priority').count()==0
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors;b.close()
print('PASS: saved causerie selection imports immediately, fresh switches reset inherited roster, saved report resumes, populated reports protected, compact 14-player group and responsive.')
