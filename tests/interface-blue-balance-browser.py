"""Remove redundant moments inputs while preserving archives and semantic red."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('typeof reportRenderAnalysis === "function"');page.evaluate("workspaceNavigation.run('view-reports')")
 page.evaluate('''()=>{currentReport=newReport();currentReport.analysis.strongMoments='Ancien temps fort';currentReport.analysis.weakMoments='Ancien temps faible';currentReport.analysis.keyOpponentEvents='Ancien fait adverse';reportTab='players';renderReportTabs();renderReportContent();}''')
 for label in ['Temps forts','Temps faibles','Faits de jeu majeurs et événements clés de l’adversaire']:
  assert page.get_by_label(label,exact=True).count()==0
 assert 'Ancien temps fort' in page.evaluate('buildReportDocument().textContent')
 assert page.get_by_role('button',name='+ But pour nous',exact=True).is_visible()
 assert page.locator('#report-next').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(40, 85, 162)'
 assert page.locator('#report-delete').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(228, 31, 40)'
 page.evaluate("reportTab='sport';renderReportTabs();renderReportContent()")
 assert page.locator('#report-tabs button.active').evaluate('e=>getComputedStyle(e).boxShadow').find('40, 85, 162')>=0
 # Semantic red must still identify discipline/validation errors and close controls.
 assert page.evaluate('''()=>{const item=document.createElement('i');item.className='player-stat-card-symbol is-red';document.body.append(item);const c=getComputedStyle(item).backgroundColor;item.remove();return c;}''')=='rgb(228, 31, 40)'
 assert page.evaluate('''()=>{const item=document.createElement('p');item.className='report-goal-error';item.textContent='Buteur manquant';document.body.append(item);const c=getComputedStyle(item).color;item.remove();return c;}''')=='rgb(228, 31, 40)'
 page.screenshot(path='/tmp/interface-blue-balance.png')
 assert not errors,errors;b.close();print('PASS: removed moments inputs, preserved archived text, blue routine actions and red destructive/discipline/error signals.')
