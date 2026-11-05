"""Compact summary: remembered roster, chronological facts, all sections and print."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('typeof reportSummaryDashboard === "function"');page.evaluate("workspaceNavigation.run('view-reports')")
 page.evaluate('''()=>{currentReport=newReport();currentReport.title='Synthèse complète test';currentReport.info.goalsFor='2';currentReport.info.goalsAgainst='1';currentReport.info.opponent='Adversaire test';currentReport.info.duration='90';currentReport.info.halfFor='1';currentReport.info.halfAgainst='0';currentReport.info.conditions='Terrain humide';
 currentReport.preparation.roster=[{name:'Joueur 5',number:5,role:'starter'}];
 currentReport.players=[14,2,1,11].map(n=>({id:'p'+n,name:'Joueur '+n,number:String(n),role:n>11?'Impacteur / Finisseur':'Titulaire',minutes:'45',score:'',note:'',objective:''}));
 currentReport.events=[{minute:'70',type:'Changement',detail:'Changement décisif'},{minute:'12',type:'But pour',detail:'Buteur test'},{minute:'',type:'Carton',card:'red',detail:'Expulsion test'},{minute:'8',type:'But contre',detail:'But adverse test'}];
 currentReport.analysis.withBall='Circulation rapide';currentReport.analysis.withoutBall='Bloc resserré';currentReport.analysis.transitions='Réagir ensemble à la perte';currentReport.analysis.setPieces='Défendre les corners';currentReport.analysis.improveDefence='Protéger la profondeur';currentReport.plan.priority='Travailler le repli';currentReport.plan.sessionObjective='Réagir à la perte';currentReport.plan.summary='Solidarité collective';currentReport.ratings.physical.score='4';
 currentReport.players[0].goals='2';currentReport.players[0].assists='1';currentReport.players[1].goals='0';currentReport.players[1].assists='0';window.originalPlayers=JSON.stringify(currentReport.players);reportTab='preview';renderReportTabs();renderReportContent();}''')
 assert page.locator('.report-summary-card').count()==2
 assert page.locator('#report-tabs [data-report-tab=plan]').count()==0
 assert page.locator('.report-summary-match-banner').is_visible()
 assert page.locator('.report-summary-conclusion').count()==0
 assert page.locator('.report-summary-priority').count()==0
 assert '90 min' in page.locator('.report-summary-match-recap').inner_text()
 assert 'Terrain humide' in page.locator('.report-summary-match-recap').inner_text()
 for value in ['Circulation rapide','Bloc resserré','Réagir ensemble à la perte','Défendre les corners','4 / 5']:
  assert value in page.locator('.report-summary-analysis').inner_text()
 assert page.locator('.report-summary-grid>.report-summary-card').count()==1
 assert page.locator('.report-summary-score').inner_text()=='2 – 1'
 assert page.locator('.report-summary-roster li').evaluate_all('els=>els.map(e=>e.dataset.summaryNumber)')==['1','2','5','11','14']
 assert page.locator('.report-summary-event time').all_inner_texts()==['8′','12′','70′','—']
 assert page.locator('.report-summary-event.is-goal').count()==1
 player14=page.locator('[data-summary-number="14"]')
 assert player14.locator('[data-contribution=goals]').text_content()=='⚽2'
 assert player14.locator('[data-contribution=assists]').text_content()=='👟1'
 assert page.locator('[data-summary-number="2"] [data-contribution=goals]').get_attribute('aria-label')=='Buts : 0'
 assert page.locator('[data-summary-number="5"] [data-contribution=assists]').get_attribute('aria-label')=='Passes décisives : non renseigné'
 for text in ['Circulation rapide','Protéger la profondeur','Solidarité collective']:
  assert text in page.locator('.report-summary-dashboard').inner_text()
 assert page.evaluate('JSON.stringify(currentReport.players)===originalPlayers')
 assert page.evaluate('reportValid(currentReport)')
 page.evaluate('()=>{window.print=()=>{window.printHTML=document.getElementById("report-summary-print").outerHTML;};}')
 page.get_by_role('button',name='Imprimer / Exporter la Synthèse Complète (PDF)',exact=True).click()
 assert 'Joueur 14' in page.evaluate('printHTML') and 'Changement décisif' in page.evaluate('printHTML')
 page.emulate_media(media='print');page.pdf(path='/tmp/synthese-complete-test.pdf',print_background=True,prefer_css_page_size=True);page.emulate_media(media='screen')
 page.evaluate('window.dispatchEvent(new Event("afterprint"))');assert page.locator('#report-summary-print').count()==0
 for w in [1440,390]:
  page.set_viewport_size({'width':w,'height':1000});page.wait_for_timeout(100)
  assert page.locator('.report-summary-dashboard').evaluate('e=>e.scrollWidth<=e.clientWidth')
  page.screenshot(path=f'/tmp/report-summary-{w}.png')
 page.evaluate("currentReport.plan.priority='Nouvelle priorité';reportTab='plan';renderReportTabs();renderReportContent()")
 assert page.evaluate('reportTab')=='sport'
 assert page.locator('.report-next-session').is_visible()
 assert page.locator('.report-next-session-fields textarea').count()==2
 page.locator('[data-analysis-field=sessionExercise]').fill('Jeu de repli collectif')
 assert page.evaluate('currentReport.plan.sessionObjective')=='Réagir à la perte'
 assert 'Réagir à la perte' in page.locator('.report-next-session .report-previous-notes').evaluate('e=>e.textContent')
 page.evaluate("reportTab='preview';renderReportContent()")
 assert page.locator('.report-summary-priority').count()==0
 assert page.evaluate('currentReport.plan.sessionExercise')=='Jeu de repli collectif'
 assert not errors,errors;b.close();print('PASS: compact summary, removed Plan tab, next-session fields, preserved historical data, numeric roster, chronology, PDF and mobile.')
