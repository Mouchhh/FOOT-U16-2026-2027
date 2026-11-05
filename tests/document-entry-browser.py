"""Entry choice once per in-progress document, compact gating and F5 home."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('!!window.documentEntry');page.locator('#view-home').click()
 page.evaluate("()=>{getCompositionBoard().documentId='lifecycle-test';getCompositionBoard().players[0].name='Capitaine';getCompositionBoard().notes='Saisie en cours';persistTerrainWorkspace();saves.unshift({date:new Date().toISOString(),state:structuredClone(getCompositionBoard())});}")
 page.locator('#view-pitch').click();d=page.locator('#document-entry-dialog');assert d.is_visible()
 rect=d.bounding_box();assert rect['width']<=622 and rect['height']<850 and rect['x']>200,rect
 assert page.locator('.document-entry-backdrop').count()==1
 assert page.evaluate('document.body.classList.contains("workspace-panel-open")')
 for w,h in [(1366,900),(390,844),(320,568)]:
  page.set_viewport_size({'width':w,'height':h});r=d.bounding_box();assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,r
 page.screenshot(path='/tmp/document-entry-compact.png')
 d.locator('#document-entry-resume').click();assert not d.count();assert page.locator('.document-entry-backdrop').count()==0
 # Leaving the module does not forget that this document was already started.
 for _ in range(2):
  page.locator('#view-home').click();page.locator('#view-pitch').click();assert not d.count()
 page.locator('#task-match-causerie').click();page.wait_for_function('history.state?.clubNavigation?.page?.view==="terrain"')
 page.reload();page.wait_for_function('!!window.documentEntry');page.wait_for_function('document.body.classList.contains("home-mode")')
 assert not d.count();assert not page.locator('dialog[open]').count()
 page.locator('#view-pitch').click();assert not d.count();assert page.evaluate('getCompositionBoard().notes')=='Saisie en cours'
 page.evaluate('document.dispatchEvent(new Event("club-session-ready"))');page.wait_for_timeout(100)
 assert not page.evaluate('document.body.classList.contains("home-mode")')
 # Report acceptance follows the same lifecycle and persists across a reload.
 page.locator('#view-reports').click()
 banner=page.locator('#report-entry-banner')
 if d.count():d.locator('#report-entry-open').click()
 page.evaluate("()=>{currentReport.analysis.withBall='Observation à conserver';flushReportDraft();}")
 report_id=page.evaluate('currentReport.id')
 for _ in range(2):
  page.locator('#view-home').click();page.locator('#view-reports').click();assert not banner.count();assert not d.count()
 page.reload();page.wait_for_function('!!window.documentEntry');page.wait_for_function('document.body.classList.contains("home-mode")')
 assert not banner.count();assert not d.count()
 page.locator('#view-reports').click();assert not banner.count();assert page.evaluate('currentReport.id')==report_id
 assert page.evaluate('currentReport.analysis.withBall')=='Observation à conserver'
 # Explicit requests still get a choice; cancelling does not replace data.
 before=page.evaluate('JSON.stringify(currentReport)')
 page.evaluate('saves.unshift({date:new Date().toISOString(),state:structuredClone(getCompositionBoard())});documentEntry.request("causerie",()=>{}, {force:true})')
 assert d.is_visible();d.get_by_role('button',name='Fermer',exact=True).click()
 assert page.evaluate('JSON.stringify(currentReport)')==before
 # Successful completion clears the active acceptance marker (saved data remains).
 page.evaluate('document.dispatchEvent(new CustomEvent("document-completed",{detail:{kind:"report"}}))')
 assert page.evaluate('(()=>{const key="vestiaire-document-entry-active:"+activeCoach.id+":"+activeCoachTeam.id;return JSON.parse(sessionStorage.getItem(key)).report===null})()')
 assert not errors,errors;b.close()
print('PASS: compact accessible Match choice, backdrop cleanup, no repeated entry while editing, Match and Report survive navigation/reload, F5 always home, forced choice/cancel and completion lifecycle.')
