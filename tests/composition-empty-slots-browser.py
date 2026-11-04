from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.documentEntry && window.compositionPlayerPicker')
 page.locator('#view-pitch').click();page.locator('#match-new').click()
 page.evaluate("()=>{squadSave([{id:'slot-a',name:'Alex',number:9,photo:'',position:'Attaquant'}]);render()}")
 assert page.evaluate('state.players.length')==0
 assert page.locator('#players .player-empty-slot').count()==11
 assert page.locator('#players .player-empty-slot').all_text_contents()==['']*11
 page.locator('#formation').select_option('4-4-2')
 assert page.locator('#players .player-empty-slot').first.evaluate('e=>e.style.left')=='35%'
 page.locator('#players .player-empty-slot').first.click()
 dialog=page.locator('#composition-player-picker');dialog.get_by_label('Numéro pour ce match',exact=True).fill('17')
 dialog.get_by_role('button',name='Sélectionner Alex',exact=True).click()
 assert page.evaluate('state.players.length')==1
 assert page.evaluate('state.players[0].number')==17
 assert page.evaluate('state.players[0].x')==35
 assert page.locator('#players .player-empty-slot').count()==10
 assert page.evaluate('squadPlayers()[0].number')==9
 page.locator('#players .player:not(.player-empty-slot)').click()
 dialog.get_by_label('Numéro pour ce match',exact=True).fill('21');dialog.get_by_role('button',name='Enregistrer le numéro',exact=True).click()
 assert page.evaluate('state.players[0].number')==21 and page.evaluate('squadPlayers()[0].number')==9
 page.locator('#formation').select_option('4-2-3-1')
 assert page.locator('#players .player').count()==11
 page.reload();page.wait_for_function('window.documentEntry');
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 page.locator('#view-pitch').click()
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 assert page.locator('#players .player-empty-slot').count()==10
 assert page.evaluate('state.players[0].number')==21
 page.locator('#match-new').click();assert page.evaluate('state.players.length')==0
 assert page.locator('#players .player-empty-slot').count()==11
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('Anonymous formation slots, player selection, match-only number edits, shape changes, reload/reset and mobile passed')
