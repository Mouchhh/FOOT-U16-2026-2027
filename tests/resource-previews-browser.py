from pathlib import Path
from hashlib import sha256
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.coachResources && window.workspaceSheets');page.locator('#view-resources').click()
 cards=page.locator('.resource-card');assert cards.count()==7
 assert 'Fiche HTML' not in page.locator('#resources-grid').inner_text()
 assert page.locator('.resource-illustration').count()==6
 arts=page.locator('.resource-illustration > svg').evaluate_all('nodes=>nodes.map(n=>n.innerHTML)');assert len(set(arts))==6
 assert page.locator('.resource-card .eyebrow > svg').count()==7
 assert page.locator('[data-resource=progression-crm-foot] .resource-preview img').count()==1
 for card in cards.all():
  assert card.get_by_role('button',name='Consulter',exact=True).is_visible()
  assert card.locator('.resource-actions a[download]').count()==1
 first=page.locator('[data-resource=coups-de-pied-arretes]')
 first.locator('.resource-preview').click();viewer=page.locator('#resource-viewer');viewer.wait_for(state='visible')
 assert viewer.locator('iframe').get_attribute('src').startswith('assets/resources/coups-de-pied-arretes.html')
 with page.expect_download() as download:
  viewer.get_by_role('link',name='Télécharger le document',exact=True).click()
 assert sha256(Path(download.value.path()).read_bytes()).digest()==sha256(Path('assets/resources/coups-de-pied-arretes.html').read_bytes()).digest()
 viewer.locator('.external-modal-close').click()
 page.locator('#resources-search').fill('physique');assert cards.count()==1 and cards.first.get_attribute('data-resource')=='preparation-physique'
 page.locator('#resources-search').fill('')
 for width in [1440,900,390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert cards.count()==7
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert page.locator('.resource-illustration > svg').evaluate_all('nodes=>nodes.every(n=>n.getBoundingClientRect().height>100&&n.getBoundingClientRect().width>150)')
  page.screenshot(path=f'/tmp/resource-previews-{width}.png',full_page=True)
 assert not errors,errors
 b.close()
print('Six distinct illustrations, category icons, no HTML badges, unchanged PDF, exact HTML download, viewer, search and responsive cards passed')
