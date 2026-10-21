"""Real menus and history: preserve searches/drafts, restore pages, guard invalid fields."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof workspaceNavigation==='object'")
 def select(parent,label):
  page.locator('#'+parent).click();page.locator('#'+parent+'-submenu').get_by_role('menuitem',name=label,exact=True).click();page.wait_for_timeout(100)
 select('view-training','Groupe, date & rendez-vous');page.locator('#training-notes').fill('Objectif à conserver dans mon brouillon');page.locator('#training-notes').blur()
 select('view-training','La Bible de l’éduc');page.locator('#training-search').fill('rondo');page.locator('#training-search').blur();page.wait_for_timeout(100);assert page.evaluate("history.state.clubNavigation.page.panel==='bible'")
 select('view-reports','Plan d’action');page.wait_for_timeout(100);assert page.evaluate('reportTab')=='plan';page.go_back();page.wait_for_function("document.body.classList.contains('training-mode')");assert page.locator('#training-catalogue-drawer').is_visible();assert page.locator('#training-search').input_value()=='rondo';assert page.evaluate('currentTraining.notes')=='Objectif à conserver dans mon brouillon'
 page.go_forward();page.wait_for_function("document.body.classList.contains('reports-mode')");assert page.evaluate('reportTab')=='plan'
 select('view-coach-agenda','Mon calendrier et mes séances');page.locator('#coach-agenda-month').fill('2026-12');page.locator('#coach-agenda-month').blur();page.wait_for_timeout(100)
 page.reload();page.wait_for_function("document.body.classList.contains('coach-agenda-mode')");assert page.locator('#agenda-page-1').is_visible();assert page.locator('#coach-agenda-month').input_value()=='2026-12'
 select('view-training','La Bible de l’éduc');assert page.locator('#training-search').input_value()=='rondo'
 select('view-training','Groupe, date & rendez-vous');page.locator('#training-players').fill('');select('view-reports','Le match');assert page.locator('#training-step-2').is_visible();assert page.locator('#training-players').input_value()=='';assert page.locator('#after-match').is_hidden()
 page.locator('#training-players').fill('14');page.locator('#training-players').blur();select('view-reports','Le match');assert page.locator('#report-quick-panel').is_visible()
 # Back is also guarded; browser position is restored when a required field is incomplete.
 select('view-training','Groupe, date & rendez-vous');page.locator('#training-players').fill('');page.go_back();page.wait_for_timeout(250);assert page.locator('#training-step-2').is_visible();assert page.evaluate("history.state.clubNavigation.page.view==='training'");page.locator('#training-players').fill('14');page.locator('#training-players').blur()
 # Keyboard switches adjacent menus without navigating; Tab leaves the popup predictably.
 page.locator('#view-training').focus();page.keyboard.press('ArrowDown');page.keyboard.press('ArrowRight');assert page.locator('#view-coach-agenda-submenu').is_visible();page.keyboard.press('Tab');assert page.locator('#view-reports').evaluate('e=>e===document.activeElement');assert page.locator('#view-coach-agenda-submenu').is_hidden()
 select('view-pitch','Mes joueurs enregistrés');page.go_back();page.wait_for_timeout(250);assert page.locator('#coach-squad-dialog').is_visible();assert page.evaluate("history.state.clubNavigation.page.view==='terrain'"),page.evaluate("({state:history.state,body:document.body.className,toast:document.querySelector('#toast').textContent})");page.get_by_role('button',name='Fermer mes joueurs',exact=True).click();assert page.locator('#view-pitch').evaluate('e=>e===document.activeElement')
 assert 'Stade Mayennais' in page.title();assert page.locator('.app-navigation [aria-current=page]').count()==1
 # Menus fit a short landscape viewport too.
 page.set_viewport_size({'width':844,'height':390})
 for parent in ['view-home','view-pitch','view-training','view-coach-agenda','view-reports']:
  page.locator('#'+parent).click();box=page.locator('#'+parent+'-submenu').bounding_box();assert box and box['y']>=0 and box['y']+box['height']<=391,(parent,box);page.keyboard.press('Escape')
 assert not errors,errors;b.close();print('PASS history back/forward/reload, draft and filter retention, invalid-field guard, keyboard menu switching, modal return focus and landscape menus.')
