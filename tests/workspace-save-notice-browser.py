"""Document status follows actual local content, never the global cloud green light."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_selector('#workspace-save-open',state='attached')
 assert page.locator('#workspace-save-open').is_hidden()
 page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();page.locator('#match-plan-context').fill('Pressing à la perte')
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Brouillon local'")
 page.locator('#workspace-save-open').click();page.locator('#workspace-save-action').click()
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Enregistré ici'")
 assert 'propre état' in page.locator('#workspace-save-dialog').inner_text()
 page.locator('#workspace-save-dialog').get_by_role('button',name='Fermer',exact=True).click()
 page.locator('#match-plan-context').fill('Protéger l’axe')
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Modifications à enregistrer'")
 # A global saved status must not turn an edited draft into an uploaded document.
 page.evaluate("clubSaveStatus('saved','Documents partagés')")
 assert page.locator('#workspace-save-open').inner_text()=='Modifications à enregistrer'
 page.locator('#task-match-tactics').click();page.locator('#workspace-save-open').click();page.locator('#workspace-save-action').click()
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Enregistré ici'")
 page.locator('#workspace-save-dialog').get_by_role('button',name='Fermer',exact=True).click()
 page.locator('#task-match-composition').click()
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Modifications à enregistrer'")
 page.locator('#view-training').click();page.evaluate('trainingWizard.go(0)')
 page.locator('#training-team').fill('Équipe essai')
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Saisie en cours'")
 page.locator('#training-team').blur();page.locator('#workspace-save-open').click();page.locator('#workspace-save-action').click()
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Enregistré ici'")
 page.locator('#workspace-save-dialog').get_by_role('button',name='Fermer',exact=True).click()
 # Failed write must remain visibly unconfirmed and leave the draft available.
 page.evaluate("window.noticeWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-training-draft'||k==='vestiaire-training-library')throw Error('full');return noticeWriter(k,v)}")
 page.evaluate("currentTraining.notes='Ne pas perdre';syncTrainingForm();saveTrainingDraft()")
 page.locator('#workspace-save-open').click();page.locator('#workspace-save-action').click()
 assert page.locator('#workspace-save-open').inner_text()=='Conservation à vérifier'
 assert page.evaluate('currentTraining.notes')=='Ne pas perdre'
 page.evaluate('coachStorageSet=noticeWriter');page.locator('#workspace-save-action').click()
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Enregistré ici'")
 page.get_by_role('button',name='Retrouver un brouillon remplacé',exact=True).click();assert page.locator('#workspace-recovery-dialog').is_visible();page.keyboard.press('Escape')
 page.evaluate('trainingWizard.go(2)');page.locator('#training-players').fill('');page.locator('#training-players').blur()
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Saisie à vérifier'")
 page.locator('#training-players').fill('14');page.locator('#training-players').blur()
 page.locator('#view-reports').click();page.locator('#workspace-save-open').click();page.locator('#workspace-save-action').click()
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Enregistré ici'")
 page.locator('#workspace-save-dialog').get_by_role('button',name='Fermer',exact=True).click()
 page.evaluate("currentReport.plan.priority='Nouvelle priorité';flushReportDraft()")
 page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Modifications à enregistrer'")
 page.reload();page.wait_for_function("document.querySelector('#workspace-save-open')?.textContent==='Modifications à enregistrer'")
 for w,h in [(320,740),(390,844),(844,390),(1280,720)]:
  page.set_viewport_size({'width':w,'height':h});page.locator('#workspace-save-open').click()
  r=page.locator('#workspace-save-dialog').bounding_box();assert r['x']>=0 and r['x']+r['width']<=w+1 and r['height']<=h+1,(w,h,r)
  page.locator('#workspace-save-dialog').get_by_role('button',name='Fermer',exact=True).click()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h)
 assert not errors,errors
 b.close()
print('PASS local draft/saved/edited states, global cloud separation, ongoing input, storage failure/retry, recovery access, report reload and responsive dialog.')
