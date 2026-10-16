"""Functional checks for tactical tool tabs and numbered 11v11. Local-only, no account or API."""
from playwright.sync_api import sync_playwright
import sys,subprocess
URL=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3016')+'/?mode=local'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(URL)
 assert page.locator('.tactic-tabs [role=tab]').count()==3
 page.locator('#tactic-opponents-tab').click();assert page.locator('#opponents-controls').is_visible();assert page.locator('#opponents .player').count()==11;assert page.evaluate('mode')=='move'
 page.select_option('#opponents-formation','3-5-2');assert page.evaluate('state.opponents.formation')=='3-5-2'
 page.locator('#arrow').click();assert page.locator('#tactic-panel-arrow').is_visible();assert not page.locator('#opponents-controls').is_visible();assert page.locator('#opponents .player').count()==11;assert page.evaluate('mode')=='arrow'
 page.locator('#pitch').scroll_into_view_if_needed();pitch=page.locator('#pitch').bounding_box();page.mouse.move(pitch['x']+pitch['width']*.35,pitch['y']+pitch['height']*.5);page.mouse.down();page.mouse.move(pitch['x']+pitch['width']*.6,pitch['y']+pitch['height']*.4);page.mouse.up();assert page.evaluate('state.arrows.length')==1
 page.locator('#erase').click();assert page.evaluate('state.arrows.length')==0
 page.locator('#move').click();assert page.locator('#tactic-panel-move').is_visible();assert page.evaluate('mode')=='move'
 page.locator('#move').focus();page.keyboard.press('ArrowRight');assert page.locator('#arrow').get_attribute('aria-selected')=='true';page.keyboard.press('End');assert page.locator('#tactic-opponents-tab').get_attribute('aria-selected')=='true'
 original=page.evaluate('JSON.stringify(state)');page.locator('#mode-simple').click();page.locator('#simple-eleven').click()
 for side in ['own','away']:
  tokens=page.locator('.simple-token.'+side);assert tokens.count()==11;assert sorted(map(int,tokens.all_inner_texts()))==list(range(1,12))
 assert page.locator('.simple-token.ball').count()==1;assert page.evaluate('simpleValid(simpleState)');assert page.locator('.animation-controls').is_hidden();assert page.locator('#export-video').is_hidden()
 token=page.locator('.simple-token.own').first;before=page.evaluate('simpleState.tokens[0].x');token.focus();page.keyboard.press('ArrowRight');assert page.evaluate('simpleState.tokens[0].x')==before+1
 page.locator('#simple-opponents').click();assert page.locator('.simple-token.away').count()==0;page.locator('#simple-opponents').click();assert page.locator('.simple-token.away').count()==11
 page.locator('#simple-own').click();assert page.locator('.simple-token.own').count()==12;assert page.evaluate("simpleState.tokens.filter(t=>t.side==='own').at(-1).label")=='12';page.locator('#simple-remove').click();assert page.locator('.simple-token.own').count()==11
 with page.expect_download() as png:page.locator('#export-image').click()
 assert png.value.suggested_filename.endswith('.png')
 page.evaluate('window.print=()=>{}');page.locator('#simple-pdf').click();page.emulate_media(media='print');page.pdf(path='/tmp/tactique-11-contre-11.pdf',prefer_css_page_size=True,print_background=True);text=subprocess.check_output(['pdftotext','/tmp/tactique-11-contre-11.pdf','-'],text=True);assert '11 contre 11' in text;page.emulate_media(media='screen')
 page.reload();page.locator('#mode-simple').click();assert page.locator('.simple-token.own').count()==11;assert page.locator('.simple-token.away').count()==11
 page.locator('#landscape-toggle').click();assert page.locator('.simple-token.own').count()==11;assert page.evaluate('simpleValid(simpleState)')
 page.select_option('#simple-scenario','build');assert page.locator('.animation-controls').is_visible();assert page.locator('#export-video').is_visible();assert page.locator('.simple-token.own').count()==4
 page.select_option('#animation-speed','2');page.locator('#animation-play').click();page.wait_for_function("document.querySelector('#animation-status').textContent==='Séquence terminée'",timeout=12000);assert page.evaluate('simpleState.ball.y')==53
 page.locator('#simple-eleven').click();assert page.locator('.simple-token.own').count()==11;assert page.locator('.animation-controls').is_hidden();assert page.evaluate('JSON.stringify(state)')==original
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.locator('#mode-team').click();assert page.locator('.tactic-tabs').is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: three independent tactical tabs, opponents and formation, drawing/erasing, accessible keyboard navigation, numbered 11v11 and goalkeepers, move/hide/add/remove, persistence, portrait/landscape/mobile, PNG/PDF, scenario animation and unchanged composition.')
 b.close()
