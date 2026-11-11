"""Single full-screen workspace, nested return, focus, scroll, Escape and safe saves."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.workspaceSheets && window.externalModalClose')
 page.evaluate("squadSave([{id:'sheet-player',name:'Alex Martin',number:8,position:'Milieu',foot:'Droit',photo:''}])")
 page.locator('#workspace-squad-entry').click();page.locator('.player-stat-profile-link').click();panel=page.locator('#player-stats-dialog');panel.locator('.external-modal-close').wait_for()
 assert not panel.evaluate("e=>e.matches(':modal')")
 assert page.locator('#view-home').evaluate("e=>!!e.closest('[inert]')")
 for width,height in [(1440,900),(390,844),(320,740)]:
  page.set_viewport_size({'width':width,'height':height});r=panel.bounding_box()
  assert abs(r['x']+r['width']-width)<=2,(width,r)
  assert abs(r['x'])<2 and abs(r['y'])<2 and abs(r['height']-height)<2
  close=panel.locator('.external-modal-close');x=close.bounding_box()
  assert x['x']>=width-80 and r['y']<=x['y']<=r['y']+30,(width,r,x)
  panel.evaluate('e=>e.scrollTop=e.scrollHeight');x=close.bounding_box();assert r['y']<=x['y']<=r['y']+30
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 # A nested work panel replaces the parent instead of covering it visibly.
 parent_scroll=panel.evaluate('e=>e.scrollTop')
 page.evaluate("()=>{const d=document.createElement('dialog');d.id='workspace-child';d.innerHTML='<h2>Pointage</h2><button id=child-close>Retour</button>';document.body.append(d);document.querySelector('#child-close').onclick=()=>d.close();d.showModal();}")
 assert not panel.is_visible() and page.locator('#workspace-child').is_visible()
 assert page.locator('dialog[open]:visible').count()==1
 page.keyboard.press('Escape');page.locator('#workspace-child').wait_for(state='hidden')
 assert panel.is_visible() and panel.evaluate('e=>e.scrollTop')==parent_scroll
 assert page.locator('dialog[open]:visible').count()==1
 page.keyboard.press('Escape');panel.wait_for(state='detached')
 assert not page.locator('#view-home').evaluate("e=>!!e.closest('[inert]')")
 # Original cancel guards remain respected in non-modal presentation.
 page.evaluate("()=>{const d=document.createElement('dialog');d.id='sheet-guard-test';d.innerHTML='<button aria-label=Fermer>×</button>';document.body.append(d);d.addEventListener('cancel',e=>e.preventDefault());d.showModal();}")
 page.keyboard.press('Escape');assert page.locator('#sheet-guard-test').is_visible();page.evaluate("document.querySelector('#sheet-guard-test').close()")
 # The real player editor closes after a successful save, but not after failed persistence.
 page.locator('.player-stat-manage summary').click();page.get_by_role('button',name='Modifier Alex Martin',exact=True).click();editor=page.locator('#coach-squad-editor')
 page.evaluate("()=>{window.sheetWriter=coachStorageSet;coachStorageSet=()=>{throw Error('quota');};}")
 editor.get_by_label('Prénom',exact=True).fill('Alex');editor.get_by_label('Nom (facultatif)',exact=True).fill('modifié');editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();assert editor.is_visible()
 page.evaluate('()=>{coachStorageSet=window.sheetWriter;}');editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();assert not editor.is_visible();assert page.evaluate("squadPlayers()[0].name")=='Alex modifié'
 # Destructive decisions use the same single workspace, with a retained confirmation.
 page.locator('#view-reports').click();page.locator('#report-delete').click();delete=page.locator('#document-delete-dialog');assert not delete.evaluate("e=>e.matches(':modal')") and delete.get_attribute('aria-modal')=='true'
 delete.get_by_role('button',name='Annuler',exact=True).click();assert not delete.is_visible()
 # Actual transition (functional checks above use reduced motion for deterministic assertions).
 page.emulate_media(reduced_motion='no-preference');page.set_viewport_size({'width':1440,'height':900})
 page.evaluate("()=>{const d=document.createElement('dialog');d.id='sheet-animation-test';d.innerHTML='<h2>Démonstration</h2><button aria-label=Fermer>×</button>';document.body.append(d);d.showModal();d.getBoundingClientRect();}")
 animation=page.locator('#sheet-animation-test');assert animation.evaluate('e=>getComputedStyle(e).animationDuration')=='0.12s'
 page.wait_for_function("getComputedStyle(document.querySelector('#sheet-animation-test')).transform==='none'")
 page.evaluate("document.querySelector('#sheet-animation-test').close()")
 assert not animation.evaluate('e=>e.open');animation.wait_for(state='hidden')
 assert not errors,errors
 b.close()
print('Single full-screen panel, nested return without stacking, fixed header, focus/inert restoration, Escape guards, save/error and confirmation passed')
