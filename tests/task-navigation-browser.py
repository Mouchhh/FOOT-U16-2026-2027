"""Task navigation preserves drafts, guards, history, filters and every original control."""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("document.body.classList.contains('task-navigation')")
 assert page.locator('#home-page-0').is_visible()
 assert page.locator('#workspace-navigation>button').all_text_contents()==['Accueil','Match','Séances','Agenda','Bilans','Votre effectif','Club']
 saved=page.evaluate('JSON.stringify(saves)');page.locator('#workspace-squad-entry').click();assert page.locator('#coach-squad-dialog').is_visible();assert page.locator('#coach-squad-title').inner_text()=='Votre effectif';assert page.locator('#coach-squad-dialog').evaluate("e=>e.tagName==='SECTION'&&!e.closest('dialog')");assert page.locator('#club-home').is_hidden()
 page.locator('#coach-squad-dialog').get_by_role('button',name='Ouvrir l’espace Match',exact=True).click();assert page.evaluate('JSON.stringify(saves)')==saved
 page.wait_for_function("!document.body.classList.contains('squad-mode')")
 page.locator('#view-pitch').click();assert page.locator('#terrain-page-0').is_visible();assert not page.locator('.workspace-submenu:not([hidden])').count()
 page.locator('#task-match-causerie').click();page.locator('#match-plan-context').fill('Terrain humide, garder des appuis.');assert page.locator('#personal-canva').is_visible()
 page.locator('#task-match-composition').click();composition=page.evaluate('JSON.stringify(getCompositionBoard().players)')
 page.locator('#task-match-tactics').click();assert page.evaluate('terrainBoardKind')=='plan';assert page.evaluate('JSON.stringify(getCompositionBoard().players)')==composition
 page.get_by_role('button',name='Pions & animations',exact=True).click();assert page.locator('#simple-board').is_visible()
 page.locator('#task-match-causerie').click();assert page.locator('#match-plan-context').input_value()=='Terrain humide, garder des appuis.'
 page.reload();page.wait_for_selector('#task-match-causerie');assert page.locator('#match-plan-form').is_visible();assert page.locator('#match-plan-context').input_value()=='Terrain humide, garder des appuis.'
 page.locator('#view-training').click();assert page.locator('#training-space').is_visible();assert page.locator('.training-progress').is_visible()
 page.locator('#task-training-bible').click();page.locator('#bible-bmf-category').select_option('finish');page.locator('#training-filter').select_option('Finition');page.wait_for_timeout(100)
 page.locator('#view-coach-agenda').click();assert page.locator('#agenda-page-1').is_visible();page.wait_for_timeout(100);page.go_back();page.wait_for_function("document.body.classList.contains('training-mode')");assert page.locator('#training-filter').input_value()=='Finition';assert page.locator('#bible-bmf-category').input_value()=='finish'
 page.locator('#task-training-prepare').click();page.locator('#training-step-link-2').click();page.locator('#training-players').fill('');page.locator('#workspace-squad-entry').click();assert not page.locator('#coach-squad-dialog').is_visible();page.locator('#view-reports').click();assert page.locator('#training-step-2').is_visible();assert page.locator('#after-match').is_hidden()
 page.locator('#training-players').fill('14');page.locator('#training-players').blur();page.locator('#view-reports').click();assert page.locator('#after-match').is_visible();page.locator('#report-tabs [data-report-tab=plan]').click();assert page.evaluate('reportTab')=='plan'
 page.locator('#view-pitch').click();page.locator('#view-pitch-tools').click();page.locator('#view-pitch-submenu').get_by_role('menuitem',name='Enregistrer, ouvrir & exporter',exact=True).click();assert page.locator('#terrain-page-2').is_visible()
 page.locator('#view-pitch-tools').focus();page.keyboard.press('ArrowDown');assert page.locator('#view-pitch-submenu').is_visible();page.keyboard.press('Escape');assert page.locator('#view-pitch-tools').evaluate('e=>e===document.activeElement');assert page.locator('#workspace-navigation').is_visible()
 page.locator('#view-home').click();assert page.locator('#home-page-0').is_visible();page.locator('#club-assistant-open').click();assert page.locator('#club-assistant').is_visible();page.locator('#crakito-close').click()
 for w,h in [(320,800),(390,844),(844,390),(1366,768)]:
  page.set_viewport_size({'width':w,'height':h});page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();assert page.locator('#match-plan-form').is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h)
  page.locator('#view-pitch-tools').click();box=page.locator('#view-pitch-submenu').bounding_box();assert box and box['x']>=0 and box['x']+box['width']<=w+1 and box['y']>=0 and box['y']+box['height']<=h+1,(w,h,box);page.keyboard.press('Escape')
  if w in [390,1366]:page.screenshot(path=f'/tmp/task-navigation-{w}.png')
  page.locator('#workspace-squad-entry').click();d=page.locator('#coach-squad-dialog');assert d.is_visible();box=d.bounding_box();assert box and box['x']>=0 and box['x']+box['width']<=w+1
  d.get_by_role('button',name='Ouvrir l’espace Match',exact=True).click()
 ids=re.findall(r'\bid="([^"]+)"',Path('index.html').read_text());assert page.evaluate('(ids)=>ids.every(id=>document.getElementById(id))',ids)
 assert page.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(e=>e.id);return ids.length===new Set(ids).size})()')
 assert not errors,errors
 b.close()
print('PASS task navigation: home entry, direct sections, three Match tabs, inline causerie/Canva, independent boards, guards, history/category filters, tools, assistant, all IDs and responsive layouts.')
