"""Cross-menu continuity on desktop, tablet and phone; club search participates in history."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof workspaceNavigation==='object'")
 def connect():
  page.evaluate("()=>{clubNetworkSession={user:{id:'final-coach'}};clubNetworkMember={user_id:'final-coach',display_name:'Coach test',active:true};clubNetworkBound=()=>Boolean(clubNetworkSession&&clubNetworkMember);clubNetworkQueueSync=()=>{};clubNetworkRenderState();}")
 def select(parent,label):
  page.locator('#'+parent).click();page.locator('#'+parent+'-tools').click();page.locator('#'+parent+'-submenu').get_by_role('menuitem',name=label,exact=True).click();page.wait_for_timeout(100)
 connect();select('view-club-network','Documents partagés')
 assert page.locator('#club-document-title').evaluate('e=>document.activeElement===e')
 page.locator('#club-document-title').fill('Pressing du mardi');page.locator('#club-document-title').blur();page.wait_for_timeout(100)
 select('view-reports','Le match');page.go_back();page.wait_for_function("document.body.classList.contains('club-network-mode')")
 assert page.locator('#club-document-title').input_value()=='Pressing du mardi'
 select('view-home','Mon tableau de bord');page.reload();page.wait_for_function("typeof workspaceNavigation==='object'");connect()
 select('view-club-network','Documents partagés');assert page.locator('#club-document-title').input_value()=='Pressing du mardi'
 # Existing document values must survive repeated view/size changes, including report fields.
 page.evaluate("()=>{getCompositionBoard().notes='Placement à conserver';persistTerrainWorkspace();currentTraining.notes='Séance à conserver';syncTrainingForm();saveTrainingDraft();currentReport.plan.priority='Bilan à conserver';flushReportDraft();}")
 for width,height in [(1366,768),(1024,768),(390,844)]:
  page.set_viewport_size({'width':width,'height':height})
  for parent,label in [('view-pitch','Compositions & plans de jeu'),('view-training','Groupe, date & rendez-vous'),('view-reports','Le match'),('view-coach-agenda','Mon calendrier et mes séances'),('view-home','Mon tableau de bord')]:
   select(parent,label)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(width,label)
   assert page.locator('.app-navigation [aria-current=page]').count()==1
   assert page.evaluate("getCompositionBoard().notes==='Placement à conserver'&&currentTraining.notes==='Séance à conserver'&&currentReport.plan.priority==='Bilan à conserver'")
  assert page.evaluate("()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length}")
 # A narrow screen must not pop a menu over content just because the mouse crosses it.
 page.locator('#view-training').hover();assert page.locator('#view-training-submenu').is_hidden()
 page.locator('#view-training').click();assert page.locator('#view-training-submenu').is_hidden();page.locator('#view-training-tools').click();assert page.locator('#view-training-submenu').is_visible();page.keyboard.press('Escape')
 page.set_viewport_size({'width':1366,'height':768});select('view-pitch','Mes joueurs enregistrés')
 page.locator('#view-training').dispatch_event('pointerenter',{'pointerType':'mouse'})
 assert page.locator('#view-training-submenu').is_hidden()
 page.get_by_role('button',name='Fermer mes joueurs',exact=True).click()
 assert not errors,errors
 b.close();print('PASS cross-site: club-search focus/history/reload, desktop/tablet/phone routes, preserved composition/session/report, current-page indicator, no horizontal overflow or duplicate IDs.')
