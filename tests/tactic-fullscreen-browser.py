"""Tactique: compact pages without scrolling, large editor with zoom, zones only in Animations, Composition untouched."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.tacticFullscreen')
 page.locator('#view-pitch').click();page.evaluate("document.getElementById('document-entry-resume')?.click()")
 # Composition keeps its tools and has no compact bar.
 assert page.locator('#comfort-match-tools').is_visible()
 page.locator('#task-match-tactics').click();page.get_by_role('button',name='Placement tactique',exact=True).click();page.wait_for_timeout(700)
 assert page.locator('#annotate').count()==0  # zones & passes only in Animations
 assert page.evaluate("(()=>{const p=document.getElementById('terrain-page-0');return p.scrollHeight<=p.clientHeight+2})()")
 page.locator('.tactic-fs-open-button:visible').click();assert page.locator('.board.tactic-fs').is_visible() and page.locator('#comfort-match-tools').is_visible()
 h=page.locator('#pitch').bounding_box()['height'];page.get_by_role('button',name='Zoomer sur le terrain').click()
 assert page.locator('#pitch').bounding_box()['height']>h*1.4
 page.keyboard.press('Escape');assert page.locator('.tactic-fs').count()==0
 page.get_by_role('button',name='Animations',exact=True).click();page.wait_for_timeout(700)
 assert page.evaluate("(()=>{const p=document.getElementById('terrain-page-0');return p.scrollHeight<=p.clientHeight+2})()")
 assert not page.locator('.simple-annotation-box').is_visible()
 page.locator('.tactic-fs-open-button:visible').click();assert page.locator('#simple-board.tactic-fs').is_visible()
 assert page.locator('.simple-annotation-box').is_visible() and page.locator('#custom-arrow').is_visible()
 page.get_by_role('button',name='Fermer le grand écran').click();assert not page.locator('.tactic-fs-bar').is_visible()
 # Mobile: editor stacks pitch over tools without horizontal scroll.
 page.set_viewport_size({'width':390,'height':844});page.locator('.tactic-fs-open-button:visible').click()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors;b.close();print('PASS: compact Tactique pages, large editor with zoom, zones only in Animations, Composition unchanged, mobile.')
