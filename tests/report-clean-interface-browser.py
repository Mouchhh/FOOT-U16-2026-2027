from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);s=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];s.on('pageerror',lambda e:errors.append(str(e)))
 s.goto('http://127.0.0.1:3016/?mode=local');s.wait_for_function('window.documentEntry && window.workspaceSheets');s.locator('#view-reports').click()
 s.evaluate("()=>{const a=newReport();a.title='Bilan officiel';a.info.date='2026-11-01';const b=structuredClone(a);b.id='recovery-a';b.title='Copie locale avant ouverture · Bilan officiel';reportLibrary=[a,b];coachStorageSet('vestiaire-reports',JSON.stringify(reportLibrary));renderReportLibrary();}")
 options=s.locator('#report-library-select option');assert options.count()==2
 assert 'Copie locale avant ouverture' not in options.all_text_contents()
 assert s.evaluate('reportLibrary.length')==2
 assert s.locator('#report-delete').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(228, 31, 40)'
 for selector in ['#task-section-navigation','#club-profile','#report-save','#report-finish','#report-quick-validate','#report-library-drawer','#report-previous']:
  assert not s.locator(selector).is_visible(),selector
 for tab in ['general','sport','players','plan','preview']:
  s.evaluate('(tab)=>{reportTab=tab;renderReportTabs();renderReportContent()}',tab)
  assert s.locator('#report-next').inner_text()=='Valider le bilan'
  assert s.locator('#report-next').is_visible()
  assert s.locator('#report-pdf').is_visible()==(tab=='preview')
  if tab=='preview':assert s.locator('#report-pdf').inner_text()=='Exporter le bilan'
 # A failed write stays in the editor; the single validation performs the existing durable save.
 s.evaluate("()=>{currentReport.info.date='2026-11-02';currentReport.info.opponent='Adversaire';window.cleanSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-reports')throw Error('quota');return cleanSet(k,v)}}")
 s.locator('#report-next').click();assert s.evaluate("document.body.classList.contains('reports-mode')")
 assert s.evaluate('currentReport.info.opponent')=='Adversaire'
 s.evaluate('()=>{coachStorageSet=cleanSet}');s.locator('#report-next').click()
 assert s.evaluate("document.body.classList.contains('home-mode')")
 assert s.evaluate("reportLibrary.some(r=>r.info.opponent==='Adversaire')")
 # Responsive active form and one validation button above the mobile navigation.
 for width in [390,320]:
  s.set_viewport_size({'width':width,'height':844})
  s.evaluate("()=>{currentReport=newReport();documentEntry.perform(()=>document.getElementById('view-reports').click())}")
  assert s.locator('#report-next').is_visible()
  assert s.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),s.evaluate('()=>[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).display!=="none").slice(0,12).map(e=>[e.id,e.className,e.getBoundingClientRect().width,e.getBoundingClientRect().left,e.getBoundingClientRect().right,innerWidth])')
  assert not s.locator('#club-profile').is_visible()
 assert not errors,errors
 b.close()
print('Clean report header, saved-only nontechnical list, backups retained, one validation, preview export, quota retention, save and mobile passed')
