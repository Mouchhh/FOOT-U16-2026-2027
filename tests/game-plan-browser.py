"""Composition and tactical plan keep separate, persisted documents and tool settings."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1100});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local')
 page.evaluate("state.players[0].number=27;state.players[0].x=31;state.players[0].y=42;state.arrows=[[20,20,30,30]];render();persist()")
 page.locator('#tactic-opponents-tab').click();page.select_option('#opponents-formation','3-5-2')
 original=page.evaluate('JSON.stringify(state)');starters=page.evaluate("state.players.filter(p=>p.role!=='sub')")
 page.locator('#mode-plan').click()
 assert page.evaluate('state.boardKind')=='plan'
 assert page.evaluate('state.players')==starters
 assert page.evaluate('state.arrows')==[]
 assert page.locator('#opponents .player').count()==0
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==original
 page.locator('#tactic-opponents-tab').click();page.select_option('#opponents-formation','4-4-2')
 away_x=page.evaluate('state.opponents.players[0].x');page.locator('#opponents .player').first.focus();page.keyboard.press('ArrowRight');assert page.evaluate('state.opponents.players[0].x')==away_x+1
 page.locator('#arrow').click();pitch=page.locator('#pitch');pitch.scroll_into_view_if_needed();box=pitch.bounding_box()
 page.mouse.move(box['x']+box['width']*.35,box['y']+box['height']*.5);page.mouse.down();page.mouse.move(box['x']+box['width']*.6,box['y']+box['height']*.4);page.mouse.up()
 assert page.evaluate('state.arrows.length')==1
 page.locator('#move').click();page.locator('#players .player').first.focus();page.keyboard.press('ArrowRight');assert page.evaluate('state.players[0].x')==32
 plan=page.evaluate('JSON.stringify(state)')
 page.locator('#mode-team').click();assert page.evaluate('JSON.stringify(state)')==original
 page.locator('#mode-plan').click();assert page.evaluate('JSON.stringify(state)')==plan
 page.reload();assert page.evaluate('state.boardKind')=='plan';assert page.evaluate('JSON.stringify(state)')==plan
 assert page.evaluate("coachStorageGet('vestiaire-draft')")==original
 page.locator('#mode-team').click();page.evaluate('state.players[0].number=29;state.players[0].x=37;render();persist()')
 changed=page.evaluate('JSON.stringify(state)')
 page.locator('#mode-plan').click();assert page.evaluate('state.players[0].number')==27
 arrows=page.evaluate('state.arrows');opponents=page.evaluate('state.opponents')
 page.locator('#game-plan-sync').click();assert page.evaluate('state.players[0].number')==29;assert page.evaluate('state.players[0].x')==37
 assert page.evaluate('state.arrows')==arrows;assert page.evaluate('state.opponents')==opponents
 page.locator('#game-plan-title').fill('Pressing en 4-3-3');page.locator('#game-plan-save').click()
 assert page.evaluate("saves.filter(s=>s.state.boardKind==='plan').length")==1
 page.locator('#mode-team').click();assert page.evaluate('JSON.stringify(state)')==changed
 page.locator('#save').click();assert page.evaluate('saves.length')==2
 assert page.evaluate('new Set(saves.map(s=>s.state.documentId)).size')==2
 before=page.evaluate('JSON.stringify(state)')
 page.evaluate('applyTactic(tacticsCatalogue[0])')
 assert page.evaluate('state.boardKind')=='plan';assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 page.locator('#mode-simple').click();assert page.locator('#simple-board').is_visible()
 page.locator('#mode-plan').click();assert page.evaluate('state.boardKind')=='plan';assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 page.locator('#game-plan-export').click();page.wait_for_function('compositionCanvas!==null');assert page.locator('#composition-export-arrows').is_checked()
 with page.expect_download() as png:page.locator('#composition-export-png').click()
 assert png.value.suggested_filename.endswith('.png')
 with page.expect_download() as pdf:page.locator('#composition-export-pdf').click()
 assert pdf.value.suggested_filename.endswith('.pdf');page.locator('#composition-export-close').click()
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: separate composition/plan arrows, opponents, positions; retained 11 identities/numbers; explicit refresh; independent documents, reload, catalog and simple board; mobile.')
 b.close()
