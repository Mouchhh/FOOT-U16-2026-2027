import base64
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.compositionPlayerPicker')
 page.locator('#view-pitch').click();page.wait_for_function("document.body.classList.contains('composition-slot-editing')")
 assert page.locator('#terrain-roster-drawer').is_visible();assert page.locator('#roster').is_hidden();assert page.locator('.roster-heading').is_hidden()
 for id in ['team','composition-title','composition-copy','count']:assert page.locator('#'+id).is_visible()
 page.evaluate("window.headerNodes=['team','composition-title','composition-copy','count'].map(id=>document.getElementById(id))")
 page.locator('#team').fill('Équipe de test');page.locator('#composition-title').fill('Composition de test')
 first_id=page.evaluate('state.players[0].id');second_id=page.evaluate('state.players[1].id');xy=page.evaluate('state.players.slice(0,2).map(p=>[p.x,p.y])')
 page.locator('#players .player').first.click();d=page.locator('#composition-player-picker');assert d.is_visible();assert 'Aucun joueur enregistré' in d.inner_text()
 d.get_by_role('tab',name='Créer un joueur',exact=True).click();d.get_by_label('Prénom',exact=True).fill('Enzo');d.get_by_label('Nom',exact=True).fill('Test');d.get_by_label('Numéro',exact=True).fill('12')
 png=page.evaluate("()=>{const c=document.createElement('canvas');c.width=c.height=50;const x=c.getContext('2d');x.fillStyle='#2855a2';x.fillRect(0,0,50,50);return c.toDataURL('image/png').split(',')[1]}")
 d.get_by_label('Photo du joueur (facultatif)',exact=True).set_input_files({'name':'portrait.png','mimeType':'image/png','buffer':base64.b64decode(png)})
 page.wait_for_function("!document.querySelector('#composition-picker-create button[type=submit]').disabled")
 d.get_by_role('button',name='Enregistrer et placer le joueur',exact=True).click();expect(d).to_have_count(0)
 assert page.evaluate('squadPlayers().length')==1;assert page.evaluate('squadPlayers()[0].name')=='Enzo Test';assert page.evaluate('state.players[0].name')=='Enzo Test';assert page.evaluate('state.players[0].photo===squadPlayers()[0].photo');assert page.evaluate('state.players[0].photo.startsWith("data:image/jpeg")')
 assert page.evaluate('state.players[0].id')==first_id;assert page.evaluate('state.players.slice(0,2).map(p=>[p.x,p.y])')==xy
 assert page.locator('#team').input_value()=='Équipe de test';assert page.locator('#composition-title').input_value()=='Composition de test';assert page.evaluate("headerNodes.every(n=>document.getElementById(n.id)===n)")
 # Registered player is visible in the real global Effectif page.
 page.locator('#workspace-squad-entry').click();assert page.locator('#coach-squad-dialog').is_visible();assert 'Enzo Test' in page.locator('#coach-squad-dialog .squad-list').inner_text()
 page.locator('#view-pitch').click();page.locator('#document-entry-resume').click()
 page.locator('#players .player').nth(1).click();assert d.is_visible();d.get_by_label('Rechercher dans votre effectif',exact=True).fill('enzo');d.get_by_role('button',name='Échanger avec Enzo Test',exact=True).click()
 assert page.evaluate('state.players[1].squadPlayerId===squadPlayers()[0].id');assert page.evaluate('state.players.filter(p=>p.squadPlayerId===squadPlayers()[0].id).length')==1;assert page.evaluate('state.players.slice(0,2).map(p=>[p.x,p.y])')==xy
 # Dragging and keyboard movement remain available; a drag must not open a picker.
 token=page.locator('#players .player').nth(1);token.scroll_into_view_if_needed();box=token.bounding_box();x,y=box['x']+box['width']/2,box['y']+box['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+35,y+25,steps=6);page.mouse.up();expect(d).to_have_count(0);assert page.evaluate('state.players[1].x')!=xy[1][0]
 token=page.locator('#players .player').first;token.focus();token.press('Enter');assert d.is_visible();d.get_by_role('button',name='Autres réglages du pion',exact=True).click();assert page.locator('#editor').is_visible();page.locator('#close').click()
 # A directory write failure cannot alter the composition or create a phantom record.
 page.locator('#players .player').first.click();d.get_by_role('tab',name='Créer un joueur',exact=True).click();d.get_by_label('Prénom',exact=True).fill('Hugo');d.get_by_label('Nom',exact=True).fill('Test');before=page.evaluate('JSON.stringify(state.players)')
 page.evaluate("()=>{window.playerWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-saves')throw Error('quota');return playerWriter(k,v)}}")
 d.get_by_role('button',name='Enregistrer et placer le joueur',exact=True).click();assert d.is_visible();assert page.evaluate('squadPlayers().length')==1;assert page.evaluate('JSON.stringify(state.players)')==before
 # If only placement fails, retain the directory record and offer a duplicate-free retry.
 page.evaluate("()=>{coachStorageSet=(k,v)=>{if(k==='vestiaire-draft')throw Error('quota draft');return playerWriter(k,v)}}")
 d.get_by_role('button',name='Enregistrer et placer le joueur',exact=True).click();assert page.evaluate('squadPlayers().length')==2;assert page.evaluate('JSON.stringify(state.players)')==before;assert 'enregistré dans Votre effectif' in d.inner_text()
 page.evaluate('()=>{coachStorageSet=playerWriter}');d.get_by_role('button',name='Réessayer le placement',exact=True).click();expect(d).to_have_count(0);assert page.evaluate('squadPlayers().length')==2;assert page.evaluate('state.players[0].name')=='Hugo Test'
 page.reload();page.wait_for_function('!!window.compositionPlayerPicker');page.locator('#document-entry-resume').click();assert page.evaluate('state.players[0].name')=='Hugo Test';assert page.evaluate('squadPlayers().length')==2
 # Mobile controls and the original Vestiaire header remain visible.
 page.set_viewport_size({'width':390,'height':844});assert page.locator('#roster').is_hidden()
 for id in ['team','composition-title','composition-copy','count']:assert page.locator('#'+id).is_visible()
 page.locator('#players .player').first.click();assert d.is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/composition-player-picker-mobile.png',full_page=True)
 # A changed target cannot be overwritten from a stale picker.
 page.evaluate("()=>{state.players[0].name='Modification distante';persist()}");d.get_by_role('button',name='Sélectionner Hugo Test',exact=True).click();assert 'La composition ou le compte a changé' in d.inner_text();assert page.evaluate('state.players[0].name')=='Modification distante'
 assert not errors,errors
 ctx.close();b.close();print('Header identity, no roster list, single click, photo registration/global Effectif, slot swap, drag/keyboard, quota/retry, reload, mobile and stale-slot protection passed')
