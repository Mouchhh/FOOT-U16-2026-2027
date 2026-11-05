"""Minimal causerie keeps canonical persistence and exports behind lighter controls."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded')
 page.wait_for_function('document.querySelector(".causerie-clean-editor")')
 page.locator('#view-pitch').click();page.locator('#match-new').click();page.locator('#task-match-causerie').click()
 root=page.locator('#task-causerie')
 assert root.locator('.causerie-clean-actions button').all_text_contents()==['Télécharger en PPT','Valider','Fermer la causerie']
 assert not page.locator('#save').is_visible()
 assert not page.locator('#terrain-flow > .flow-footer').is_visible()
 assert root.locator('#match-plan-form > .section-heading .causerie-canva-badge').is_visible()
 assert root.locator('#match-plan-form > .section-heading .causerie-clean-actions').count()==0
 assert root.locator('.causerie-clean-card').count()==7
 assert root.locator('.causerie-clean-library').count()==4
 assert not root.locator('#match-plan-context').is_visible()
 assert page.locator('#workflow-match-links').count()==0
 assert page.locator('#causerie-demos-open').count()==0
 assert 'Gérer mes visuels' not in root.inner_text()
 page.evaluate("()=>{getCompositionBoard().matchPreparation.context='Contexte archivé';getCompositionBoard().matchPreparation.objectives=['Axe archivé','','',''];renderMatchPreparation();}")
 page.get_by_label('Information adversaire',exact=True).fill('Bloc médian compact')
 page.get_by_label('Animation Défensive · Consignes',exact=True).fill('Protéger l’axe')
 page.get_by_label('Transition OFF / DEF · Consignes',exact=True).fill('Réagir à la perte')
 assert page.evaluate('getCompositionBoard().matchPreparation.opponent')=='Bloc médian compact'
 assert page.evaluate('getCompositionBoard().matchPreparation.transitionOffDef')=='Réagir à la perte'
 assert page.evaluate('valid(getCompositionBoard())')
 for w in [1440,820,390,320]:
  page.set_viewport_size({'width':w,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),w
  assert root.locator('textarea:visible').evaluate_all('(rows)=>rows.every(r=>r.getBoundingClientRect().height>=200&&parseFloat(getComputedStyle(r).fontSize)>=16)')
  assert page.evaluate('(()=>{const actions=document.querySelector(".causerie-clean-actions"),last=document.querySelector("[data-phase=closingMessage]");return actions.getBoundingClientRect().top>=last.getBoundingClientRect().bottom})()')
  page.screenshot(path=f'/tmp/causerie-clean-{w}.png',full_page=True)
 page.get_by_label('Mot d’ordre final · Consignes',exact=True).scroll_into_view_if_needed()
 assert page.get_by_label('Mot d’ordre final · Consignes',exact=True).is_visible()
 page.get_by_role('button',name='Fermer la causerie',exact=True).click()
 assert not root.is_visible()
 page.locator('#task-match-causerie').click()
 assert page.get_by_label('Information adversaire',exact=True).input_value()=='Bloc médian compact'
 # Validation retains the existing confirmed-save path and closes the editor.
 page.get_by_role('button',name='Valider',exact=True).click()
 page.wait_for_function('documentCompletionIsCompleted("causerie",getCompositionBoard())')
 assert page.evaluate('saves.some(s=>s.state.matchPreparation.defensive==="Protéger l’axe")')
 assert page.evaluate('getCompositionBoard().matchPreparation.context')=='Contexte archivé'
 assert not errors,errors;b.close()
print('PASS: bottom actions, discreet header Canva, enlarged readable fields, seven sections, four integrated pickers, removed redundant UI, canonical fields/save, close and responsive widths.')
