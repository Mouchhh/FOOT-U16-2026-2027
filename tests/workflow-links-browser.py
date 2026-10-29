"""Cross-space handoffs preserve sources and stop when persistence fails."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_selector('#workflow-match-report',state='attached')
 page.evaluate("currentReport.plan.priority='Ancien bilan à garder';flushReportDraft();getCompositionBoard().matchPreparation=newMatchPreparation();getCompositionBoard().matchPreparation.date='2026-11-01';getCompositionBoard().matchPreparation.opponent='Laval';getCompositionBoard().matchPreparation.context='Terrain humide';getCompositionBoard().matchPreparation.objectives=['Garder la largeur','Communiquer','',''];renderMatchPreparation()")
 source=page.evaluate('JSON.stringify(getCompositionBoard())');old=page.evaluate('currentReport.id')
 page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();page.locator('#workflow-match-report').click()
 assert page.locator('#workflow-match-dialog').is_visible()
 page.evaluate("window.savedStorageSet=coachStorageSet;coachStorageSet=(key,value)=>{if(key==='vestiaire-report-draft')throw Error('full');return savedStorageSet(key,value)}")
 page.locator('#workflow-create-report').click()
 assert page.evaluate('currentReport.id')==old
 assert page.locator('#workflow-match-dialog').is_visible()
 page.evaluate('coachStorageSet=savedStorageSet')
 page.locator('#workflow-create-report').click()
 assert page.locator('#after-match').is_visible()
 assert page.evaluate("currentReport.preparation.plan.context")=='Terrain humide'
 assert page.evaluate("currentReport.preparation.objectives.map(o=>o.text)")==['Garder la largeur','Communiquer']
 assert page.evaluate("workspaceRecoveryEntries().report.payload.id")==old
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==source
 report_id=page.evaluate('currentReport.id')
 # Reopening the same match offers the current report without resetting observations.
 page.evaluate("currentReport.plan.priority='Jouer large';flushReportDraft()")
 page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();page.locator('#workflow-match-report').click()
 page.get_by_role('button',name='Reprendre le bilan existant · Laval',exact=True).click()
 assert page.evaluate('currentReport.id')==report_id
 assert page.evaluate('currentReport.plan.priority')=='Jouer large'
 # Existing report-to-session engine, exposed by the new entry.
 page.locator('#workflow-report-links button').click();assert page.locator('#report-to-training').is_visible()
 page.locator('#report-to-training').click();assert page.locator('#report-training-dialog').is_visible()
 page.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
 page.get_by_role('button',name='Ajouter à ma préparation',exact=True).click()
 assert page.locator('#workflow-training-links').is_visible()
 session=page.evaluate('currentTraining.id');assert page.locator(f'#workflow-training-links [data-report-id="{report_id}"]').count()==1
 page.locator(f'#workflow-training-links [data-report-id="{report_id}"]').click()
 assert page.evaluate('currentReport.id')==report_id and page.evaluate('reportTab')=='plan'
 page.locator('#report-session-followup').get_by_role('button',name='Ouvrir cette séance',exact=True).click()
 assert page.evaluate('currentTraining.id')==session
 # Filters from an earlier agenda visit must not hide this saved session.
 page.evaluate("document.querySelector('#coach-agenda-month').value='2020-01'")
 page.locator('#workflow-training-agenda').click()
 assert page.locator('#coach-agenda').is_visible()
 assert page.locator(f'.coach-agenda-card[data-session-id="{session}"]').is_visible()
 assert page.evaluate('trainingLibrary.some(s=>s.id===currentTraining.id)')
 assert page.locator('#coach-agenda-week').input_value()==page.evaluate('currentTraining.date')
 # Failed save must never navigate to the agenda or claim a successful handoff.
 page.locator('#view-training').click();page.evaluate('trainingWizard.go(3)')
 page.evaluate("window.originalCoachStorageSet=coachStorageSet;coachStorageSet=(key,value)=>{if(key==='vestiaire-training-library')throw Error('full');return originalCoachStorageSet(key,value)}")
 page.locator('#workflow-training-agenda').click();assert page.locator('#training-step-3').is_visible()
 page.evaluate('coachStorageSet=originalCoachStorageSet')
 # Linked source missing: retain provenance but do not open an unrelated report.
 page.evaluate("currentTraining.blocks[0].matchSource.reportId='missing';renderTrainingBlocks()")
 assert 'Bilan d’origine indisponible' in page.locator('#workflow-training-links').inner_text()
 for w,h in [(320,740),(390,844),(844,390),(1280,720)]:
  page.set_viewport_size({'width':w,'height':h})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h)
  page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();page.locator('#workflow-match-report').click()
  r=page.locator('#workflow-match-dialog').bounding_box();assert r['x']>=0 and r['x']+r['width']<=w+1 and r['height']<=h+1,(w,h,r)
  page.locator('#workflow-match-dialog').get_by_role('button',name='Fermer',exact=True).click()
 assert not errors,errors
 b.close()
print('PASS Match → bilan → séance → bilan/agenda, exact preparation, recovery, duplicate reuse, missing source, failed save and responsive dialog.')
