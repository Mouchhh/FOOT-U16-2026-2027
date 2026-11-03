"""Four airy metrics, contextual management and accessible season detail."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof playerStatsDecorateCards==="function"')
 page.evaluate("()=>{squadSave(Array.from({length:6},(_,i)=>({id:'clean-'+i,name:['Alex Martin','Noah Bernard','Maxime Petit','Lucas Moreau','Gabriel Thomas','Louis Robert'][i],number:i+1,position:i===0?'Gardien':'Milieu',foot:'Droit',photo:''})));}")
 page.locator('#workspace-squad-entry').click();card=page.locator('[data-player-id=clean-0]')
 assert card.locator('.player-stat-badges>.player-stat-metric').count()==4
 assert not card.get_by_role('button',name='Modifier Alex Martin',exact=True).is_visible()
 card.locator('.player-stat-manage summary').click();assert card.get_by_role('button',name='Modifier Alex Martin',exact=True).is_visible()
 card.locator('.player-stat-manage summary').click();assert not page.locator('#player-stats-dialog').count()
 for width in [1440,768,390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert card.locator('.player-stat-badges').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==2
  card.locator('.player-stat-profile-link').click();dialog=page.locator('#player-stats-dialog');assert dialog.is_visible()
  assert dialog.get_by_text('Présences aux séances',exact=True).is_visible()
  assert dialog.locator('[data-stat=yellowCards]').count()==1
  close=dialog.get_by_role('button',name='Fermer le bilan du joueur',exact=True);assert close.evaluate("e=>e.classList.contains('external-modal-close')")
  assert close.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');close.click()
 page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/tmp/squad-clean-desktop.png')
 assert not errors,errors
 b.close()
print('Four metric groups, contextual actions, player detail, external red cross and responsive grid passed')
