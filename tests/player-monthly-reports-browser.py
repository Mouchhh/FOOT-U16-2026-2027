"""Combined attendance, validated matches, monthly reviews and per-player PDF."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('!!window.playerMonthlyReports')
 page.evaluate('''()=>{
 window.testMonth=agendaCalendarMonth(playerStatsNow().day.slice(0,7),-1);
 const roster=[{id:'p1',name:'Alice',number:1,photo:'',position:'Milieu',foot:'Droit'},{id:'p2',name:'Basile',number:2,photo:'',position:'Attaquant',foot:'Gauche'}];squadSave(roster);
 function session(date,status){const s=newTraining();s.date=date;s.attendance={version:1,source:'manual',date:s.date,time:s.time,validatedAt:new Date().toISOString(),rows:[{id:'p1',name:'Alice',status,included:true,keeper:false},{id:'p2',name:'Basile',status:'uncertain',included:true,keeper:false}]};return s;}
 trainingLibrary=[session(testMonth+'-05','present'),session(testMonth+'-06','absent'),session(agendaCalendarMonth(testMonth,-1)+'-10','present'),session(agendaCalendarAdd(playerStatsNow().day,3),'present')];
 function match(date,minutes,presence,completed=true){const r=newReport();r.info.date=date;r.info.goalsFor='1';r.info.goalsAgainst='0';r.info.opponent='Club test';r.players=[{id:'p1',squadPlayerId:'p1',name:'Alice',number:'1',role:'Titulaire',minutes,score:'',note:'',objective:'',...(presence?{matchPresence:presence}:{})}];if(completed)r.documentCompletion={version:1,kind:'report',at:new Date().toISOString(),fingerprint:documentCompletionFingerprint(r)};return r;}
 reportLibrary=[match(testMonth+'-07','30',null),match(testMonth+'-08','0','present'),match(testMonth+'-09','90',null,false)];
 const first=reportLibrary[0];first.events=[{minute:'20',type:'But pour',playerId:'p1',playerName:'Alice',detail:''}];reportEventsApply(first,roster);first.documentCompletion.fingerprint=documentCompletionFingerprint(first);
 trainingLibrary.push({...structuredClone(trainingLibrary[0]),id:crypto.randomUUID()});
 reportLibrary.push(match(testMonth+'-10','',null));
 workspaceNavigation.run('workspace-squad-entry');$('player-monthly-month').value=testMonth;$('player-monthly-month').dispatchEvent(new Event('change'));
 }''')
 snapshot=page.evaluate('(()=>{const s=playerMonthlySnapshot(testMonth).get("p1");return {month:s.attendance.rate,present:s.attendance.present,known:s.attendance.known,season:s.season.rate,minutes:s.stats.totals.minutes}})()')
 assert snapshot=={'month':75,'present':3,'known':4,'season':80,'minutes':30},snapshot
 assert page.evaluate('playerMonthlySnapshot(testMonth).get("p2").attendance.rate') is None
 assert page.locator('[data-player-id=p1] .player-monthly-attendance').count()==2
 page.evaluate('()=>{window.print=()=>{window.directPrint=document.getElementById("player-monthly-print").textContent;};}')
 page.get_by_role('button',name='Bilan Mensuel (PDF) · Alice',exact=True).click()
 assert 'Présence du mois' in page.evaluate('directPrint')
 assert 'Buts : 1' in page.evaluate('directPrint')
 assert page.evaluate('squadPlayers()[0].monthlyReviews===undefined')
 page.evaluate('window.dispatchEvent(new Event("afterprint"))')
 assert '3/4' in page.locator('[data-player-id=p1] .player-monthly-row').inner_text()
 page.get_by_role('button',name='Appréciations mensuelles · Alice',exact=True).click()
 page.get_by_label('Appréciation du mois',exact=True).fill('Bonne implication collective')
 page.get_by_label('Axes de travail',exact=True).fill('Scanner avant de recevoir')
 page.get_by_role('button',name='Enregistrer les appréciations',exact=True).click()
 assert page.evaluate('squadPlayers()[0].monthlyReviews[testMonth].focus')=='Scanner avant de recevoir'
 # A normal profile update must not strip monthly notes.
 assert page.evaluate('(()=>{const p=squadPlayers().map(p=>({...p}));delete p[0].monthlyReviews;return squadSave(p)})()')
 assert page.evaluate('squadPlayers()[0].monthlyReviews[testMonth].appreciation')=='Bonne implication collective'
 page.evaluate('()=>{window.print=()=>{window.printText=document.getElementById("player-monthly-print").textContent;};}')
 page.get_by_role('button',name='Imprimer / Enregistrer en PDF',exact=True).click()
 text=page.evaluate('printText');assert 'Bonne implication collective' in text and '30 min' in text and '75 %' in text
 page.emulate_media(media='print');page.pdf(path='/tmp/bilan-mensuel-joueur-test.pdf',prefer_css_page_size=True,print_background=True);page.emulate_media(media='screen');page.evaluate('window.dispatchEvent(new Event("afterprint"))')
 for w in [1440,390]:
  page.set_viewport_size({'width':w,'height':1100});assert page.locator('#coach-squad-dialog').evaluate('e=>e.scrollWidth<=e.clientWidth');page.screenshot(path=f'/tmp/player-monthly-{w}.png')
 page.evaluate("workspaceNavigation.run('view-reports');currentReport=newReport();reportTab='general';renderReportTabs();renderReportContent()")
 control=page.get_by_label('Présence match · Alice',exact=True);assert control.is_visible();control.select_option('present')
 assert page.evaluate('currentReport.players.find(p=>p.squadPlayerId==="p1").matchPresence')=='present'
 assert page.evaluate('reportValid(currentReport)')
 assert not errors,errors;b.close();print('PASS: combined monthly/season attendance, validated-only matches, zero-minute presence, unknowns/future exclusions, review persistence, PDF and mobile.')
