"""Board history: independent contexts, failed writes, real keys and faithful PDF geometry."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof terrainHistoryMove==='function'");page.evaluate("document.querySelector('#view-pitch').click();workspaceFlows.terrain.go(0)")
 page.evaluate("state.players[0].x=31;persist();state.players[0].x=44;persist()")
 page.locator('.board-toolbar [data-terrain-history] button').first.click();assert page.evaluate('state.players[0].x')==31
 page.locator('.board-toolbar [data-terrain-history] button').last.click();assert page.evaluate('state.players[0].x')==44
 assert page.evaluate("()=>{const writer=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};const result=terrainHistoryMove(-1);coachStorageSet=writer;return !result&&state.players[0].x===44}")
 page.evaluate("document.querySelector('#mode-focus').click()");page.evaluate('state.players[0].x=60;persist()');page.locator('.board-toolbar [data-terrain-history] button').first.click();assert page.evaluate('state.players[0].x')==44
 page.evaluate("document.querySelector('#mode-team').click()");assert page.evaluate('state.players[0].x')==44
 page.locator('#players .player').first.focus();page.keyboard.press('Control+z');assert page.evaluate('state.players[0].x')==31
 page.evaluate("document.querySelector('#mode-simple').click()");page.evaluate('simpleState.tokens[0].x=35;saveSimple();simpleState.tokens[0].x=55;saveSimple()');page.locator('.simple-toolbar [data-terrain-history] button').first.click();assert page.evaluate('simpleState.tokens[0].x')==35
 page.locator('.simple-toolbar [data-terrain-history] button').last.click();assert page.evaluate('simpleState.tokens[0].x')==55
 page.evaluate("document.querySelector('#mode-team').click()");assert page.evaluate('state.players[0].x')==31
 page.evaluate("document.querySelector('#composition-export').click()")
 page.wait_for_function('compositionCanvas!==null');assert page.evaluate('compositionCanvas.width/compositionCanvas.height')>1
 assert page.evaluate("async()=>{const before=JSON.stringify(state),blob=await compositionPDF(compositionCanvas),text=await blob.text();return before===JSON.stringify(state)&&text.startsWith('%PDF-1.4')&&text.includes('/Count 1');}")
 assert not errors,errors;b.close();print('PASS terrain history, independent boards, quota failure and one-page PDF.')
