"""Every main menu routes directly to its existing subpage, without copied forms."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("document.body.classList.contains('dropdown-navigation')")
 assert page.locator('#workspace-navigation>button').count()==6
 def select(parent,label):
  page.locator('#'+parent).click();page.locator('#'+parent+'-tools').click();menu=page.locator('#'+parent+'-submenu');assert menu.is_visible();menu.get_by_role('menuitem',name=label,exact=True).click();assert menu.is_hidden()
 # Opening a menu does not prematurely change the page.
 page.locator('#view-training').click();initial=page.evaluate('document.body.className');page.locator('#view-training-tools').click();assert page.evaluate('document.body.className')==initial;assert page.locator('#view-training-submenu').is_visible()
 page.keyboard.press('Escape');assert page.locator('#view-training-submenu').is_hidden();assert page.locator('#workspace-navigation').is_visible()
 select('view-home','Les éducateurs · connexion et activité');assert page.locator('#home-page-1').is_visible()
 select('view-home','Mon tableau de bord');assert page.locator('#home-page-0').is_visible()
 for label,body in [('Compositions & plans de jeu','!document.body.classList.contains("simple-mode")&&terrainBoardKind==="composition"'),('Vue épurée des joueurs','document.body.classList.contains("focus-mode")'),('Explications · pions et animations','document.body.classList.contains("simple-mode")')]:
  select('view-pitch',label);assert page.evaluate(body);assert page.locator('#terrain-page-0').is_visible()
 select('view-pitch','Préparation du match & réglages');assert page.locator('#terrain-page-1').is_visible()
 select('view-pitch','Impacteurs / Finisseurs');assert page.locator('#terrain-bench-drawer').get_attribute('open') is not None
 select('view-pitch','Enregistrer, ouvrir & exporter');assert page.locator('#terrain-page-2').is_visible()
 select('view-pitch','Mes joueurs enregistrés');assert page.locator('#coach-squad-dialog').is_visible();page.get_by_role('button',name='Fermer mes joueurs',exact=True).click()
 labels=['Mon équipe · catégorie et niveau','Thèmes & objectifs','Groupe, date & rendez-vous','Déroulé de ma séance']
 for i,label in enumerate(labels):select('view-training',label);assert page.locator('#training-step-'+str(i)).is_visible()
 select('view-training',labels[0]);page.locator('#training-title').fill('Mon brouillon conservé');page.locator('#training-title').blur()
 select('view-training','La Bible de l’éduc');assert page.locator('#training-catalogue-drawer').is_visible();assert page.locator('#training-search').is_visible()
 select('view-training','Mes séances enregistrées');assert page.locator('#training-library-page').is_visible()
 select('view-training','Créer mon exercice');assert page.locator('#custom-training-dialog').is_visible();page.locator('#custom-training-close').click()
 select('view-training',labels[0]);assert page.locator('#training-title').input_value()=='Mon brouillon conservé'
 for label,index in [('Vue d’ensemble de mon espace',0),('Mon calendrier et mes séances',1)]:select('view-coach-agenda',label);assert page.locator('#agenda-page-'+str(index)).is_visible()
 select('view-coach-agenda','Mes joueurs enregistrés');assert page.locator('#coach-squad-dialog').is_visible();page.get_by_role('button',name='Fermer mes joueurs',exact=True).click()
 for label,key in [('Le match','general'),('Suivi sportif','sport'),('Suivi humain','human'),('Joueurs & faits','players'),('Plan d’action','plan'),('Synthèse','preview')]:select('view-reports',label);assert page.evaluate('reportTab')==key;assert page.locator('#report-content').is_visible()
 select('view-reports','Mes rapports enregistrés');assert page.locator('#report-library-drawer').get_attribute('open') is not None
 # Only mock authenticated identity/transport for the private club routes.
 page.evaluate("()=>{clubNetworkBound=()=>true;clubNetworkQueueSync=()=>Promise.resolve();clubNetworkSession={user:{id:'coach-test'}};clubNetworkMember={user_id:'coach-test',display_name:'Coach test'};document.querySelector('#club-network-connected').hidden=false;}")
 for label,index in [('Les éducateurs du club',0),('Documents partagés',1),('Mon compte & mon partage',2)]:select('view-club-network',label);assert page.locator('#club-page-'+str(index)).is_visible()
 # Keyboard navigation and closing preserve the menu bar.
 page.locator('#view-training').click();page.locator('#view-training-tools').focus();page.keyboard.press('ArrowDown');assert page.locator('#view-training-submenu [role=menuitem]').first.evaluate('e=>e===document.activeElement')
 page.keyboard.press('End');assert page.locator('#view-training-submenu [role=menuitem]').last.evaluate('e=>e===document.activeElement')
 page.keyboard.press('Escape');assert page.locator('#view-training-tools').evaluate('e=>e===document.activeElement')
 # Real menus work on touch-size screens and stay within viewport bounds.
 page.set_viewport_size({'width':390,'height':844})
 for parent in ['view-home','view-pitch','view-training','view-coach-agenda','view-reports','view-club-network']:
  page.locator('#'+parent).click();page.locator('#'+parent+'-tools').click();menu=page.locator('#'+parent+'-submenu');box=menu.bounding_box();assert box and box['x']>=0 and box['x']+box['width']<=391 and box['y']+box['height']<=845,(parent,box)
  page.keyboard.press('Escape')
 select('view-training','La Bible de l’éduc');assert page.locator('#training-search').is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.locator('#view-training').click();page.screenshot(path='/tmp/workspace-dropdowns-mobile.png',animations='disabled');page.keyboard.press('Escape')
 # Internal route calls still support home shortcuts and keep DOM IDs unique.
 page.evaluate("document.querySelector('#view-pitch').click()");assert page.evaluate('document.body.classList.contains("terrain-workflow-active")')
 assert page.evaluate("()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length}")
 assert not errors,errors
 b.close();print('PASS: six dropdown menus, every subpage, preserved draft, private club routes, keyboard, Escape, mobile positioning and existing programmatic routes.')
