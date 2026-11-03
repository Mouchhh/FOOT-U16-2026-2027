"""Match facts, quick/detailed continuity, safe report storage and retained planned exercise and safe empty suggestions."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof openReportTraining==='function'")
 page.locator('#view-reports').click()
 page.evaluate("()=>{getCompositionBoard().matchPreparation={...newMatchPreparation(),date:'2026-10-24',opponent:'Laval',context:'Terrain humide'};currentReport=newReport();reportTab='general';renderReportContent()}")
 quick=page.locator('#report-quick-panel');assert quick.get_by_label('Date',exact=True).input_value()=='2026-10-24'
 assert quick.get_by_label('Adversaire',exact=True).input_value()=='Laval'
 assert page.evaluate("currentReport.info.conditions==='Terrain humide'")
 quick.get_by_label('Buts marqués',exact=True).fill('2');quick.get_by_label('Buts encaissés',exact=True).fill('1')
 assert 'Victoire' in page.locator('#report-quick-result').inner_text()
 quick.get_by_label('Buts encaissés',exact=True).fill('-1');assert 'vérifier' in page.locator('#report-quick-result').inner_text()
 quick.get_by_label('Buts encaissés',exact=True).fill('1')
 quick.locator('.report-essential-followup > summary').click();quick.get_by_label('La priorité à travailler',exact=True).fill('Protéger l’axe à la perte')
 quick.get_by_label('Un point fort sans le ballon',exact=True).fill('Le premier défenseur ralentit pendant le repli des partenaires')
 page.evaluate("currentReport.plan.sessionExercise='Jeu de transition en deux équipes';reportAutosave()")
 quick.get_by_role('button',name='Renseigner tous les détails du match',exact=True).click()
 assert page.locator('#report-content').get_by_label('Adversaire',exact=True).input_value()=='Laval'
 page.locator('#report-quick-panel').get_by_role('button',name='Revenir au bilan essentiel',exact=True).click()
 page.wait_for_timeout(300)
 page.reload();page.wait_for_function("typeof openReportTraining==='function'")
 if page.locator('#document-entry-dialog').is_visible():page.locator('#document-entry-resume').click()
 assert page.evaluate("currentReport.info.goalsFor==='2'&&currentReport.plan.priority==='Protéger l’axe à la perte'")
 # Real save failure must preserve the saved report list, with an explicit error.
 assert page.evaluate("()=>{const before=JSON.stringify(reportLibrary),writer=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};try{saveReport();return JSON.stringify(reportLibrary)===before}finally{coachStorageSet=writer}}")
 assert 'Stockage plein' in page.locator('#toast').inner_text()
 page.evaluate("saveReport()")
 assert page.evaluate('reportLibrary.length')==1
 assert page.evaluate("buildReportDocument().textContent.includes('Terrain humide')&&buildReportDocument().textContent.includes('2 — 1')")
 page.evaluate("()=>{Object.assign(currentTraining,{players:10,keepers:1,space:'full',notes:'Conserver mon travail'});syncTrainingForm();openReportTraining();openReportTraining()}")
 assert page.locator('#report-training-dialog').count()==1
 d=page.locator('#report-training-dialog');d.get_by_label('Thème · Priorité de la semaine',exact=True).select_option('Transitions')
 d.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
 # The former exercise catalogue was retired: an empty compatible selection
 # must not invent a drill, discard the plan, or overwrite the current session.
 assert d.locator('.report-training-proposal').count()>=1
 assert 'Aucun exercice compatible' in d.inner_text()
 assert d.get_by_role('button',name='Ajouter à ma préparation',exact=True).is_hidden()
 assert page.evaluate("currentTraining.notes==='Conserver mon travail'&&currentReport.plan.sessionExercise==='Jeu de transition en deux équipes'")
 d.locator('.external-modal-close').click()
 page.evaluate("document.querySelector('#view-reports').click();reportTab='general';renderReportContent()")
 page.screenshot(path='/tmp/report-final-desktop.png')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 page.screenshot(path='/tmp/report-final-mobile.png')
 assert not errors,errors
 b.close();print('PASS reports: prepared match facts, live result, shared quick/detailed data, reload, failed save, saved report, print content and planned exercise retained and no invented suggestion.')
