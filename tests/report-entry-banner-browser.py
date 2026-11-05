"""The former report strip is replaced by one compact entry decision per document."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.documentEntry')
 page.evaluate("()=>{currentReport=newReport();currentReport.title='Bilan en cours';currentReport.info.date='2026-11-01';currentReport.info.opponent='Adversaire';currentReport.analysis.withBall='Conserver';flushReportDraft();reportLibrary=[structuredClone(currentReport)];coachStorageSet('vestiaire-reports',JSON.stringify(reportLibrary));}")
 page.locator('#view-reports').click();d=page.locator('#document-entry-dialog');assert d.is_visible();assert d.get_attribute('data-entry-kind')=='report'
 assert page.locator('#report-entry-banner').count()==0
 for width,height in [(1366,900),(390,844),(320,568)]:
  page.set_viewport_size({'width':width,'height':height});r=d.bounding_box();assert r['width']<=622 and r['x']>=0 and r['y']>=0 and r['y']+r['height']<=height+1
 d.locator('#report-entry-open').click();assert not d.count()
 report_id=page.evaluate('currentReport.id')
 for _ in range(2):
  page.locator('#view-home').click();page.locator('#view-reports').click();assert not d.count()
 page.reload();page.wait_for_function('window.documentEntry');page.wait_for_function('document.body.classList.contains("home-mode")')
 assert not d.count();page.locator('#view-reports').click();assert not d.count();assert page.evaluate('currentReport.id')==report_id
 assert page.evaluate('currentReport.analysis.withBall')=='Conserver'
 assert page.evaluate('documentCompletionFinish("report")')
 assert page.evaluate('document.body.classList.contains("home-mode")')
 assert page.evaluate('(()=>{const key="vestiaire-document-entry-active:"+activeCoach.id+":"+activeCoachTeam.id;return JSON.parse(sessionStorage.getItem(key)).report===null})()')
 assert page.evaluate('reportLibrary.some(r=>r.id===currentReport.id&&r.analysis.withBall==="Conserver")')
 assert page.locator('.document-entry-backdrop').count()==0
 assert not errors,errors;b.close()
print('PASS: compact report decision, no repeat across navigation and F5, Home on reload, actual report validation clears cycle without losing saved observations, desktop/mobile.')
