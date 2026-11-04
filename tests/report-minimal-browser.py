"""Minimal first report screen retains direct events, minutes and durable validation."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.documentEntry && window.workspaceSheets')
 page.locator('#view-reports').click()
 page.evaluate("()=>{squadSave([{id:'minimal-a',name:'Alex',number:9,position:'Attaquant',photo:''},{id:'minimal-b',name:'Noé',number:8,position:'Milieu',photo:''}]);currentReport.info.date='2026-11-01';currentReport.analysis.topAttack='Ancienne analyse conservée';currentReport.plan.priority='Ancienne priorité';renderReportContent();}")
 root=page.locator('#report-content')
 for phrase in ['Les premiers enseignements','Renseigner tous les détails','Choisir les exercices pour','Le brouillon reste sur cet appareil','Suivi dans les séances','Aucune séance reliée','Du bilan au terrain','Renseignez vos observations','Choisir les priorités']:
  assert phrase not in root.inner_text(),phrase
 assert not root.locator('#report-session-followup,#workflow-report-links,.report-essential-followup').count()
 root.get_by_label('Buts marqués',exact=True).fill('1');root.get_by_label('Buts encaissés',exact=True).fill('0')
 root.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click()
 event=root.locator('[data-event-index="0"]');event.get_by_label('Buteur',exact=True).select_option('minimal-a');event.get_by_label('Passeur décisif',exact=True).select_option('minimal-b')
 assert root.locator('#report-players-panel').get_by_role('heading',name='Temps de jeu',exact=True).count()==1
 root.get_by_label('Minutes jouées · Alex',exact=True).fill('90');root.get_by_label('Minutes jouées · Noé',exact=True).fill('60')
 root.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click()
 event=root.locator('[data-event-index="1"]');event.get_by_label('Événement',exact=True).select_option('Carton');event.get_by_label('Joueur concerné',exact=True).select_option('minimal-b');event.get_by_label('Couleur du carton',exact=True).select_option('yellow')
 assert root.get_by_label('Minutes jouées · Alex',exact=True).input_value()=='90'
 assert page.locator('dialog[open]').count()==0
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert page.locator('#report-next').is_visible()
  page.screenshot(path=f'/tmp/report-minimal-{width}.png',full_page=True)
 page.locator('#report-next').click()
 assert page.evaluate("document.body.classList.contains('home-mode')")
 assert page.evaluate('reportLibrary[0].analysis.topAttack')=='Ancienne analyse conservée'
 assert page.evaluate('reportLibrary[0].plan.priority')=='Ancienne priorité'
 page.locator('#workspace-squad-entry').click()
 a=page.locator('[data-player-id=minimal-a]');n=page.locator('[data-player-id=minimal-b]')
 assert a.locator('[data-stat=minutes] strong').inner_text()=='90'
 assert a.locator('[data-stat=goals] strong').inner_text()=='1'
 assert n.locator('[data-stat=assists] strong').inner_text()=='1'
 assert n.locator('[data-stat=yellowCards] strong').inner_text()=='1'
 assert not errors,errors
 b.close()
print('Minimal report blocks removed, direct scorer/assist/card/minutes, validation, preserved history, roster statistics and mobile passed')
