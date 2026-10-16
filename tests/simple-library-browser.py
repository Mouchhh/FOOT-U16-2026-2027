"""Named board and animated sequence persistence through the real UI."""
import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local')
 original=page.evaluate('JSON.stringify(state)');page.locator('#mode-simple').click()
 page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==0
 page.locator('.simple-token.own').first.focus();page.keyboard.press('ArrowRight');page.locator('#simple-label').fill('27');page.locator('#simple-opponents').click()
 page.locator('#simple-sequence-name').fill('Pressing U18');page.locator('#simple-sequence-save').click();saved=page.evaluate('structuredClone(simpleLibrary[0])');assert page.locator('#simple-title').inner_text()=='Pressing U18';assert saved['state']['tokens'][0]['label']=='27';assert saved['state']['showOpponents']==False
 page.locator('#simple-sequence-name').fill('Pressing seniors');page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==1;assert page.evaluate('simpleLibrary[0].title')=='Pressing seniors'
 with page.expect_download() as png:page.locator('#export-image').click()
 assert png.value.suggested_filename=='Pressing seniors.png'
 page.locator('#simple-sequence-copy').click();assert page.evaluate('simpleLibrary.length')==2
 page.reload();page.locator('#mode-simple').click();page.select_option('#simple-library',saved['id']);page.locator('#simple-sequence-open').click();assert page.locator('#simple-sequence-name').input_value()=='Pressing seniors';assert page.evaluate('simpleState.tokens')==saved['state']['tokens'];assert page.locator('.simple-token.away').count()==0
 page.select_option('#simple-scenario','build');page.select_option('#animation-speed','2');page.select_option('#animation-choice','back');page.locator('#simple-sequence-name').fill('Relance gardien')
 start=page.evaluate('JSON.stringify(simpleState.tokens)');page.locator('#animation-play').click();page.wait_for_function("document.querySelector('#animation-status').textContent==='Séquence terminée'",timeout=12000)
 page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==3;animated_id=page.evaluate('simpleLibrary[0].id');assert page.evaluate('JSON.stringify(simpleLibrary[0].state.tokens)')==start
 page.reload();page.locator('#mode-simple').click();page.select_option('#simple-library',animated_id);page.locator('#simple-sequence-open').click();assert page.evaluate('simpleState.step')==0;assert page.locator('#animation-speed').input_value()=='2';assert page.locator('#animation-choice').input_value()=='back'
 page.locator('#animation-play').click();page.wait_for_function("document.querySelector('#animation-status').textContent==='Séquence terminée'",timeout=12000);assert page.evaluate('simpleState.ball.y')==86
 assert page.locator('#coach-backup').count()==0;assert page.evaluate('simpleLibrary.length')==3
 page.locator('#simple-sequence-delete').click();assert page.evaluate('simpleLibrary.length')==2;assert page.locator('#simple-sequence-name').input_value()=='Relance gardien'
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==original
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.evaluate("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([coachLegacyProfile,{id:'another',name:'Autre coach'}]));localStorage.setItem('vestiaire-active-coach','another')");page.reload();assert page.evaluate('simpleLibrary.length')==0
 assert not errors,errors
 print('PASS: named sequences, update/rename/copy/open/delete, preserved tokens and visibility, replay from saved start with settings, reload, coach isolation, mobile and unchanged composition.')
 b.close()
