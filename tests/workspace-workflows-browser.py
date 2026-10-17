"""Every workspace keeps its controls and data while gaining sequential pages."""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local')
 static_ids=set(re.findall(r'\bid="([^"]+)"',Path('index.html').read_text()));missing=page.evaluate('(ids)=>ids.filter(id=>!document.getElementById(id))',list(static_ids));assert not missing,missing
 assert page.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(e=>e.id);return ids.length===new Set(ids).size})()')
 before=page.evaluate('JSON.stringify(state)');assert page.locator('#terrain-page-0').is_visible();page.locator('#terrain-roster-toggle').click();assert page.locator('#terrain-roster-drawer').is_hidden();page.locator('#terrain-roster-toggle').click();assert page.locator('#terrain-roster-drawer').is_visible()
 page.locator('#terrain-next').click();assert page.locator('#terrain-page-1').is_visible();page.locator('#terrain-bench-drawer>summary').click();assert page.locator('#add-sub').is_visible();page.locator('#terrain-bench-drawer>summary').click();page.locator('#match-plan-open').click();page.locator('#match-plan-objective-0').fill('Garder les distances');page.locator('#match-plan-form button[type=submit]').click();assert page.evaluate('state.matchPreparation.objectives[0]')=='Garder les distances'
 page.locator('#terrain-tactics-drawer>summary').click();assert page.locator('#open-tactics').is_visible();page.locator('#terrain-next').click();assert page.locator('#terrain-page-2').is_visible();page.locator('#composition-export').click();page.wait_for_function('compositionCanvas!==null');page.locator('#composition-export-close').click()
 # Independent tactical modes and sequence saving retain their original engine.
 composition=page.evaluate('JSON.stringify(getCompositionBoard())');page.locator('#mode-focus').click();assert page.locator('#terrain-page-0').is_visible();assert page.evaluate('state.boardKind')=='plan';page.locator('#mode-simple').click();assert page.locator('#simple-board').is_visible();page.locator('#terrain-step-link-2').click();page.locator('#simple-sequence-name').fill('Nouvelle séquence');page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==1;page.locator('#terrain-previous').click();assert page.locator('#simple-objective').is_visible();page.locator('#terrain-previous').click();assert page.locator('#simple-pitch').is_visible();assert page.evaluate('JSON.stringify(getCompositionBoard())')==composition
 page.locator('#view-reports').click();page.locator('#report-title').fill('Rapport avec parcours');assert page.locator('#report-previous').is_disabled()
 for i,key in enumerate(['general','sport','human','players','plan','preview']):
  assert page.evaluate('reportTab')==key
  if key=='general':page.locator('#report-content input').first.fill('Stade Mayennais')
  if i<5:page.locator('#report-next').click()
 page.locator('#report-next').click();assert page.evaluate('reportLibrary.length')==1;page.locator('#report-previous').click();assert page.evaluate('reportTab')=='plan';page.locator('#report-library-drawer>summary').click();assert page.locator('#report-library-select').is_visible()
 page.evaluate('window.print=()=>{}');page.locator('#report-pdf').click();page.emulate_media(media='print');page.pdf(path='/tmp/rapport-parcours.pdf',prefer_css_page_size=True,print_background=True)
 import subprocess
 assert 'Rapport avec parcours' in subprocess.check_output(['pdftotext','/tmp/rapport-parcours.pdf','-'],text=True);page.emulate_media(media='screen');page.evaluate('document.body.classList.remove("report-printing")')
 page.locator('#view-coach-agenda').click();assert page.locator('#agenda-page-0').is_visible();page.locator('#coach-agenda-counts').get_by_role('button',name='Voir mes rapports',exact=True).click();assert page.locator('#report-library-drawer').get_attribute('open') is not None;page.locator('#view-coach-agenda').click();page.locator('#agenda-next').click();assert page.locator('#coach-agenda-month').is_visible();page.locator('#agenda-previous').click();assert page.locator('#coach-agenda-counts').is_visible()
 page.locator('#view-home').click();assert page.locator('#home-page-0').is_visible();page.locator('#home-next').click();assert page.locator('#home-educators').is_visible();page.locator('#home-next').click();assert page.locator('#home-page-0').is_visible()
 # Keep every input reachable on mobile, without horizontal page overflow.
 page.set_viewport_size({'width':390,'height':844})
 for view,step in [('view-pitch','terrain-step-link-2'),('view-reports',None),('view-coach-agenda','agenda-step-link-1'),('view-home','home-step-link-1')]:
  page.locator('#'+view).click()
  if step:page.locator('#'+step).click()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),view
 assert not errors,errors
 print('PASS: all original IDs retained and unique, terrain/settings/export, independent boards, saved sequence, six report pages/save/library, agenda, home, mobile and no script errors.')
 b.close()
