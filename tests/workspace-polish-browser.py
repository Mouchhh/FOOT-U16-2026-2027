"""Wide library, visual search, full sheets, unchanged preparation and tab access."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1050});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof trainingWizard==='object'");page.locator('#view-training').click()
 page.locator('#training-bible-tab').click();drawer=page.locator('#training-catalogue-drawer');assert drawer.is_visible()
 sizes=page.evaluate("()=>{const d=document.querySelector('#training-catalogue-drawer').getBoundingClientRect(),l=document.querySelector('.training-drawer-layout').getBoundingClientRect();return {drawer:d.width,layout:l.width,columns:getComputedStyle(document.querySelector('#training-catalogue')).gridTemplateColumns.split(' ').length};}")
 assert sizes['drawer']>=sizes['layout']*.95 and sizes['columns']==3,sizes
 assert page.locator('#training-catalogue .bible-card').count()==3
 assert page.locator('#training-catalogue .bible-card-picture svg').count()==3
 assert page.locator('#training-catalogue .bible-animation').count()==0
 first=page.locator('#training-catalogue .bible-card').first.get_attribute('data-exercise');page.locator('#bible-more').click();assert page.locator('#training-catalogue .bible-card').count()==3;assert page.locator('#training-catalogue .bible-card').first.get_attribute('data-exercise')!=first;page.locator('#bible-previous').click()
 page.screenshot(path='/tmp/workspace-bible-desktop.png',full_page=True,animations='disabled')
 phase=page.locator('#bible-phase-shortcuts button[data-phase=ball]');phase.click();assert phase.get_attribute('aria-pressed')=='true'
 assert page.evaluate("[...document.querySelectorAll('#training-catalogue .bible-card')].every(c=>bibleKnowledge[c.dataset.exercise].phase==='ball')")
 page.locator('#bible-reset').click();page.locator('#training-search').fill('rondo');card=page.locator('[data-exercise=rondo]');card.locator('.bible-card-picture').click();sheet=page.locator('#bible-sheet-dialog');assert sheet.is_visible();assert sheet.locator('.bible-animation').count()==1
 sheet.get_by_role('button',name='Fermer',exact=True).click();assert page.locator('#training-search').input_value()=='rondo'
 card.locator('.bible-card-preview>summary').click();card.locator('.bible-detail').wait_for(state='visible')
 # Adding from the catalogue still updates the prepared session; closing restores it.
 before=page.evaluate('currentTraining.blocks.length');card.locator('.bible-card-actions').first.get_by_role('button',name='+ Ajouter à la séance',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==before+1
 page.locator('#training-catalogue-close').click();assert drawer.is_hidden();assert page.locator('#training-blocks').is_visible()
 for id in ['view-pitch','view-coach-agenda','view-reports','view-training']:
  page.locator('#'+id).click();assert page.locator('#'+id).get_attribute('aria-pressed')=='true'
 # Mobile uses a single column and keeps search and closing reachable.
 page.locator('#training-bible-tab').click();page.locator('#bible-reset').click();page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert page.evaluate("getComputedStyle(document.querySelector('#training-catalogue')).gridTemplateColumns.split(' ').length===1")
 page.screenshot(path='/tmp/workspace-bible-mobile.png',full_page=True,animations='disabled')
 page.locator('#training-search').fill('rondo');page.locator('[data-exercise=rondo] .bible-card-picture').click();assert sheet.is_visible()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 sheet.get_by_role('button',name='Fermer',exact=True).click();page.locator('#training-catalogue-close').click()
 page.locator('#training-bible-tab').click();page.locator('#training-library-tab').click();assert page.locator('#training-library-page').is_visible();assert page.locator('#training-space>.reports-heading').is_visible();page.locator('#training-prepare-tab').click();assert drawer.is_hidden()
 # The initial result page and its next button fit without scrolling at common sizes.
 for width,height in [(1440,900),(1366,768),(390,844)]:
  page.set_viewport_size({'width':width,'height':height});page.locator('#training-bible-tab').click()
  if page.locator('#bible-reset').is_visible():page.locator('#bible-reset').click()
  page.wait_for_timeout(250)
  metrics=page.evaluate("()=>{const r=document.querySelector('#bible-more').getBoundingClientRect(),s=document.querySelector('#training-search').getBoundingClientRect(),p=document.querySelector('#training-step-3').getBoundingClientRect();return {bottom:r.bottom,search:s.top,pane:p.bottom,scroll:document.querySelector('#training-step-3').scrollTop}}")
  metrics.update({'width':width,'height':height});page.screenshot(path='/tmp/workspace-measure-'+str(width)+'.png',animations='disabled')
  assert metrics['bottom']<=height and metrics['bottom']<=metrics['pane']+1 and metrics['search']>=0 and metrics['scroll']==0,metrics
  if width in [1366,390]:
   fits=page.evaluate('''()=>{const failures=[],size=innerWidth>=1500?4:innerWidth>=1100?3:innerWidth>=650?2:1;for(let i=0;i<Math.ceil(trainingExercises.length/size);i++){bibleCataloguePage=i;renderBibleCatalogue();const next=document.querySelector('#bible-more'),bottom=next?.getBoundingClientRect().bottom;if(bottom>innerHeight)failures.push({page:i+1,bottom});}return failures;}''')
   assert not fits,fits
  page.locator('#training-catalogue-close').click()
 assert not errors,errors
 b.close();print('PASS: full-width library, 3/1-column visual cards, lazy readers, phase search, enlarged sheet, inline reading, adding, preserved draft, main tabs and mobile.')
