"""Navigation targets, compact screens, touch, keyboard and reduced motion.
Use CLUB_TEST_ENGINE=firefox or webkit when those Playwright browsers are installed.
WebKit emulation is not a test of a physical iPhone or Safari.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/club-visual-compatibility');OUT.mkdir(exist_ok=True)
engine=os.environ.get('CLUB_TEST_ENGINE','chromium')
with sync_playwright() as p:
 browser=getattr(p,engine).launch(**({'executable_path':'/usr/bin/chromium','args':['--no-sandbox']} if engine=='chromium' else {}))
 for width,height,touch in [(1366,768,False),(1280,720,False),(320,740,True),(390,844,True),(844,390,True)]:
  context=browser.new_context(viewport={'width':width,'height':height},has_touch=touch,reduced_motion='reduce',accept_downloads=True)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("document.body.classList.contains('dropdown-navigation')")
  def select(parent,label):
   trigger=page.locator('#'+parent)
   if touch:trigger.tap()
   else:trigger.hover()
   menu=page.locator('#'+parent+'-submenu');menu.wait_for(state='visible')
   assert menu.evaluate('e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}')
   button=menu.get_by_role('menuitem',name=label,exact=True)
   button.tap() if touch else button.click()
   page.wait_for_timeout(120)
  for parent,label in [('view-training','Mon équipe · catégorie et niveau'),('view-training','La Bible de l’éduc'),('view-pitch','Compositions & plans de jeu'),('view-reports','Le match'),('view-coach-agenda','Vue d’ensemble de mon espace')]:
   select(parent,label)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(width,height,label)
  # Direct shortcuts must focus their actual section, not reset to the page heading.
  for parent,label,target in [('view-pitch','Impacteurs / Finisseurs','terrain-bench-drawer'),('view-reports','Mes rapports enregistrés','report-library-drawer')]:
   select(parent,label)
   assert page.locator('#'+target).evaluate('e=>e.open&&e.contains(document.activeElement)'),(width,label)
   assert page.locator('#'+target+' > summary').evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}'),(width,label)
  if not touch:
   page.locator('#view-training').focus();page.keyboard.press('ArrowDown')
   assert page.locator('#view-training-submenu').is_visible()
   page.keyboard.press('End');assert page.evaluate("document.activeElement.textContent==='Créer mon exercice'")
   page.keyboard.press('Escape');assert page.locator('#view-training').evaluate('e=>document.activeElement===e')
  page.screenshot(path=str(OUT/f'{engine}-{width}x{height}.png'),animations='disabled')
  assert not errors,errors
  context.close()
 browser.close()
print('PASS',engine,': 5 screen sizes, touch/keyboard, menu bounds, direct section focus and no horizontal overflow. Physical devices and Canva import not tested.')
