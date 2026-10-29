"""Optional guide resumes existing work and stays usable at common screen sizes."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_selector('#coach-quickstart-open',state='attached')
 assert page.locator('#coach-quickstart-dialog').count()==0
 page.evaluate("getCompositionBoard().notes='Match à garder';persistTerrainWorkspace();currentTraining.notes='Séance à garder';syncTrainingForm();saveTrainingDraft();currentReport.plan.priority='Bilan à garder';flushReportDraft()")
 ids=page.evaluate('[currentTraining.id,currentReport.id]')
 for w,h in [(1280,720),(1366,768),(1920,1080),(390,844),(320,740),(844,390)]:
  page.set_viewport_size({'width':w,'height':h})
  for parent,visible in [('view-training','#training-step-0'),('view-pitch','#terrain-page-0'),('view-reports','#report-content'),('view-coach-agenda','#agenda-page-1')]:
   page.locator('#view-home').click();page.locator('#coach-quickstart-open').click();guide=page.locator('#coach-quickstart-dialog')
   r=guide.bounding_box();assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,(w,h,r)
   guide.locator(f'[data-destination="{parent}"]').click();assert page.locator(visible).is_visible()
   assert page.evaluate("getCompositionBoard().notes==='Match à garder'&&currentTraining.notes==='Séance à garder'&&currentReport.plan.priority==='Bilan à garder'")
   assert page.evaluate('[currentTraining.id,currentReport.id]')==ids
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,parent)
  page.locator('#view-home').click();page.locator('#coach-quickstart-open').click();page.keyboard.press('Escape');page.wait_for_function("!document.querySelector('#coach-quickstart-dialog')")
  assert page.locator('#coach-quickstart-open').evaluate('e=>document.activeElement===e')
 assert not errors,errors
 b.close()
print('PASS optional guide: four real destinations, document identity/content retained, six viewports, keyboard dismissal and focus return.')
