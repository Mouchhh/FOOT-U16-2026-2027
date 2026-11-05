"""Half-time score below final score, four equal centered report tabs."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('typeof reportSummaryDashboard === "function"');page.evaluate("workspaceNavigation.run('view-reports')")
 page.evaluate("currentReport=newReport();currentReport.info.goalsFor='2';currentReport.info.goalsAgainst='1';reportTab='general';renderReportTabs();renderReportContent()")
 page.get_by_label('Buts marqués à la pause',exact=True).fill('0');page.get_by_label('Buts encaissés à la pause',exact=True).fill('1')
 assert page.evaluate('currentReport.info.halfFor')=='0'
 score=page.locator('.report-scoreboard').bounding_box();half=page.locator('.report-halftime-score').bounding_box();assert half['y']>=score['y']+score['height']
 page.evaluate('flushReportDraft()')
 for w in [1440,768,390]:
  page.set_viewport_size({'width':w,'height':1000});page.wait_for_timeout(100)
  rects=page.locator('#report-tabs>button').evaluate_all('els=>els.map(e=>e.getBoundingClientRect().toJSON())')
  assert len(rects)==4 and max(r['width'] for r in rects)-min(r['width'] for r in rects)<1
  tabs=page.locator('#report-tabs').bounding_box();assert abs(rects[0]['x']-tabs['x']-(tabs['x']+tabs['width']-rects[-1]['x']-rects[-1]['width']))<1
  if w>700:assert max(r['y'] for r in rects)-min(r['y'] for r in rects)<1
  else:assert rects[0]['y']==rects[1]['y'] and rects[2]['y']>rects[0]['y']
  assert page.locator('#after-match').evaluate('e=>e.scrollWidth<=e.clientWidth')
 page.evaluate("reportTab='preview';renderReportTabs();renderReportContent()")
 assert page.locator('.report-summary-halftime').inner_text()=='Mi-temps : 0 – 1'
 score=page.locator('.report-summary-score').bounding_box();half=page.locator('.report-summary-halftime').bounding_box();assert half['y']>=score['y']+score['height']
 page.reload(wait_until='domcontentloaded');page.wait_for_function('typeof reportSummaryDashboard === "function"');assert page.evaluate('currentReport.info.halfFor')=='0';assert page.evaluate('currentReport.info.halfAgainst')=='1'
 assert not errors,errors;b.close();print('PASS: half-time entry below final score, zero preserved, summary half-time and balanced four-tab grid at desktop/tablet/mobile widths.')
