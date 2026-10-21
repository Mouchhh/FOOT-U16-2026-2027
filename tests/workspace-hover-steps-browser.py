"""Mouse hover, safe pointer crossing, touch toggling and sequential page controls."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("document.body.classList.contains('dropdown-navigation')")
 original=page.evaluate('document.body.className');trigger=page.locator('#view-training');menu=page.locator('#view-training-submenu')
 trigger.hover();assert menu.is_visible();assert page.evaluate('document.body.className')==original
 box=trigger.bounding_box();page.mouse.move(box['x']+15,box['y']+box['height']+4);page.wait_for_timeout(100);assert menu.is_visible()
 menu.get_by_role('menuitem',name='Groupe, date & rendez-vous',exact=True).hover();page.wait_for_timeout(350);assert menu.is_visible()
 page.mouse.move(1100,700);page.wait_for_timeout(350);assert menu.is_hidden()
 trigger.hover();page.locator('#view-reports').hover();page.wait_for_timeout(350);assert page.locator('#view-reports-submenu').is_visible() and menu.is_hidden()
 page.locator('#view-reports-submenu').get_by_role('menuitem',name='Suivi sportif',exact=True).click();assert page.evaluate('reportTab')=='sport'
 def select(parent,label):
  page.locator('#'+parent).hover();page.locator('#'+parent+'-submenu').get_by_role('menuitem',name=label,exact=True).click()
 select('view-home','Mon tableau de bord');page.locator('#home-next').click();assert page.locator('#home-page-1').is_visible();page.locator('#home-previous').click();assert page.locator('#home-page-0').is_visible()
 select('view-pitch','Compositions & plans de jeu');board=page.evaluate('JSON.stringify(getCompositionBoard())');page.locator('#terrain-next').click();assert page.locator('#terrain-page-1').is_visible();page.locator('#terrain-next').click();assert page.locator('#terrain-page-2').is_visible();page.locator('#terrain-previous').click();assert page.locator('#terrain-page-1').is_visible();assert page.evaluate('JSON.stringify(getCompositionBoard())')==board
 select('view-training','Mon équipe · catégorie et niveau');page.locator('#training-title').fill('Séance avec étapes');page.locator('#training-next').click();assert page.locator('#training-step-1').is_visible();page.locator('#training-next').click();assert page.locator('#training-step-2').is_visible();page.locator('#training-next').click();assert page.locator('#training-step-3').is_visible();page.locator('#training-previous').click();assert page.locator('#training-step-2').is_visible();assert page.evaluate('currentTraining.title')=='Séance avec étapes'
 select('view-coach-agenda','Vue d’ensemble de mon espace');page.locator('#agenda-next').click();assert page.locator('#agenda-page-1').is_visible();page.locator('#agenda-previous').click();assert page.locator('#agenda-page-0').is_visible()
 select('view-reports','Le match');page.locator('#report-next').click();assert page.evaluate('reportTab')=='sport';page.locator('#report-next').click();assert page.evaluate('reportTab')=='human';page.locator('#report-previous').click();assert page.evaluate('reportTab')=='sport'
 page.evaluate("()=>{clubNetworkBound=()=>true;clubNetworkQueueSync=()=>Promise.resolve();clubNetworkSession={user:{id:'coach-test'}};clubNetworkMember={user_id:'coach-test',display_name:'Coach test'};document.querySelector('#club-network-connected').hidden=false;}")
 select('view-club-network','Les éducateurs du club');page.locator('#club-next').click();assert page.locator('#club-page-1').is_visible();page.locator('#club-next').click();assert page.locator('#club-page-2').is_visible();page.locator('#club-previous').click();assert page.locator('#club-page-1').is_visible()
 # Desktop click after a hover must not immediately hide the menu just opened.
 page.locator('#view-training').click();assert menu.is_visible();page.keyboard.press('Escape');assert menu.is_hidden()
 touch=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);phone=touch.new_page();phone.goto('http://127.0.0.1:3016/?mode=local');phone.wait_for_function("document.body.classList.contains('dropdown-navigation')")
 phone.locator('#view-training').tap();assert phone.locator('#view-training-submenu').is_visible();phone.locator('#view-training').tap();assert phone.locator('#view-training-submenu').is_hidden()
 phone.locator('#view-training').tap();phone.locator('#view-training-submenu').get_by_role('menuitem',name='Mon équipe · catégorie et niveau',exact=True).tap();assert phone.locator('#training-next').is_visible();phone.locator('#training-next').tap();assert phone.locator('#training-step-1').is_visible()
 phone.screenshot(path='/tmp/workspace-hover-touch.png',animations='disabled')
 assert not errors,errors
 b.close();print('PASS: hover without click, gap crossing, delayed close, switching menus, desktop click, six sequential flows, preserved data and real touch context.')
