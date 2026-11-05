"""Airy analysis cards, non-destructive migration, suggestions and quick ratings."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('typeof reportAnalysisWorkshopSuggestions === "function"');page.evaluate("workspaceNavigation.run('view-reports')")
 page.evaluate('''()=>{currentReport=newReport();currentReport.title='Analyse moderne';currentReport.analysis.topAttack='Point fort conservé';currentReport.analysis.firstHalf='Note ancienne intacte';currentReport.ratings.physical.score='2.5';currentReport.ratings.physical.note='Observation conservée';reportTab='sport';renderReportTabs();renderReportContent();}''')
 assert page.locator('.report-analysis-card').count()==2
 assert not page.locator('.report-analysis-extras').get_attribute('open')
 assert page.locator('[data-analysis-field=transitions]').is_visible()
 page.locator('[data-analysis-field=transitions]').fill('Réagir à la perte et récupérer ensemble')
 page.locator('[data-analysis-field=improveAttack]').fill('Finition et conservation sous pression')
 page.locator('[data-analysis-field=priority]').fill('Mieux finir les occasions')
 assert 'Finition' in page.locator('.report-workshop-tags').inner_text()
 assert 'Conservation sous pression' in page.locator('.report-workshop-tags').inner_text()
 assert page.evaluate('currentReport.plan.sessionObjective')==''
 page.locator('.report-analysis-extras>summary').click()
 assert page.locator('.report-analysis-rating-heading output').last.inner_text()=='2.5 / 5'
 page.get_by_role('button',name='État physique global : 4 sur 5',exact=True).click()
 assert page.evaluate('currentReport.ratings.physical.score')=='4'
 assert page.evaluate('currentReport.ratings.physical.note')=='Observation conservée'
 page.locator('.report-analysis-extras>summary').click()
 page.evaluate('flushReportDraft()');assert page.evaluate('reportValid(currentReport)')
 assert page.evaluate('currentReport.analysis.topAttack')=='Point fort conservé'
 assert 'Note ancienne intacte' in page.evaluate('reportSportDocument().textContent')
 for w in [1440,390]:
  page.set_viewport_size({'width':w,'height':1000});page.wait_for_timeout(100)
  assert page.locator('.report-analysis-modern').evaluate('e=>e.scrollWidth<=e.clientWidth')
  assert page.locator('#report-next').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(228, 31, 40)'
  page.screenshot(path=f'/tmp/report-analysis-modern-{w}.png')
 page.reload(wait_until='domcontentloaded');page.wait_for_function('typeof reportAnalysisWorkshopSuggestions === "function"')
 assert page.evaluate('currentReport.analysis.improveAttack')=='Finition et conservation sous pression'
 assert page.evaluate('currentReport.ratings.physical.score')=='4'
 assert not errors,errors;b.close();print('PASS: two cards, live suggestions, no automatic plan edits, legacy values/half ratings, save/reload and mobile.')
