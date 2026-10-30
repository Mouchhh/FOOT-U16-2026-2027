"""A real squad destination preserves the previous session and browser history."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.taskWorkspace')
 page.locator('#view-training').click();page.locator('#training-title').fill('Travail conservé');page.locator('#training-title').blur();before=page.evaluate('JSON.stringify(saves)')
 page.locator('#workspace-squad-entry').click();page.wait_for_function("document.querySelector('#workspace-squad-entry').getAttribute('aria-current')==='page'")
 squad=page.locator('#coach-squad-dialog');assert squad.is_visible();assert squad.evaluate("e=>e.tagName==='SECTION'");assert page.locator('#training-space').is_hidden();assert not page.locator('dialog[open]').count();assert page.evaluate('JSON.stringify(saves)')==before
 page.go_back();page.wait_for_function("document.body.classList.contains('training-mode')");assert page.locator('#training-title').input_value()=='Travail conservé'
 page.go_forward();page.wait_for_function("document.body.classList.contains('squad-mode')");page.reload();page.wait_for_function("document.body.classList.contains('squad-mode')");assert squad.is_visible()
 for w,h in [(320,740),(390,844),(1280,720)]:
  page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.locator('#workspace-squad-entry').is_visible();assert squad.locator('.squad-composition-row').count()==page.evaluate('getCompositionBoard().players.length')
 squad.get_by_role('button',name='Ouvrir l’espace Match',exact=True).click();assert squad.is_hidden();assert page.locator('#terrain-page-0').is_visible()
 assert not errors,errors
 b.close()
print('PASS full squad page, preserved session, Back/Forward, reload, no modal and mobile.')
