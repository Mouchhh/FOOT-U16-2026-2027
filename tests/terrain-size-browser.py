"""Pitch remains usable and stable after repeated mode and page switches."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':768})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local')
 def terrain_menu(label):
  page.locator('#view-pitch').click();page.locator('#view-pitch-submenu').get_by_role('menuitem',name=label,exact=True).click()
 terrain_menu('Compositions & plans de jeu')
 sizes={}
 for round in range(4):
  for mode,pitch in [('mode-team','pitch'),('mode-focus','pitch'),('mode-simple','simple-pitch')]:
   label={'mode-team':'Compositions & plans de jeu','mode-focus':'Vue épurée des joueurs','mode-simple':'Explications · pions et animations'}[mode]
   terrain_menu(label);page.wait_for_timeout(220)
   width=page.locator('#'+pitch).bounding_box()['width']
   assert width>=300,(mode,width)
   if mode in sizes:assert abs(width-sizes[mode])<3,(mode,sizes[mode],width)
   sizes[mode]=width
   terrain_menu('Préparation du match & réglages');terrain_menu(label)
   page.wait_for_timeout(200)
   assert abs(page.locator('#'+pitch).bounding_box()['width']-width)<3
   token=page.locator('#'+pitch+(' .simple-token' if mode=='mode-simple' else ' .player .token')).first
   assert token.bounding_box()['width']>=28
 assert not errors,errors
 page.screenshot(path='/tmp/terrain-size.png',full_page=True)
 print('PASS stable usable pitch sizes',sizes)
 b.close()
