"""Validated compositions, reusable causeries and the existing team-scoped club outbox."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.locator('#causerie-archive-select').wait_for(state='attached')
 page.locator('#view-pitch').click()
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 page.locator('#task-match-causerie').click()
 page.locator('#match-plan-date').fill('2026-11-08');page.locator('#match-plan-opponent').fill('Adversaire A');page.locator('#match-plan-objective-0').fill('Presser ensemble');page.locator('#match-plan-defensive').fill('Bloc compact')
 page.evaluate('()=>{beforeTactic=structuredClone(state);editing=state.players[0].id;mode="arrow";}')
 page.locator('#match-plan-form button[type=submit]').click()
 assert page.evaluate("document.body.classList.contains('home-mode')")
 saved=page.evaluate('getCompositionBoard().documentId');original=page.evaluate('(id)=>JSON.stringify(saves.find(s=>s.state.documentId===id).state)',saved)
 assert page.evaluate('beforeTactic===null && editing===null && mode==="move"')
 assert page.locator(f'#causerie-archive-select option[value="{saved}"]').count()==1
 assert page.evaluate("[...document.getElementById('club-network-source').options].some(o=>o.textContent.startsWith('Causerie ·'))")
 # A stale form control cannot reappear when returning to the validated composition.
 page.evaluate("()=>{document.getElementById('match-plan-defensive').value='Résidu DOM non enregistré'}")
 page.locator('#view-pitch').click()
 assert page.locator('#causerie-validated-status').is_visible()
 assert page.locator('#match-plan-defensive').input_value()=='Bloc compact'
 assert page.locator('#terrain-page-0 .workspace').evaluate('e=>e.inert')
 assert not page.locator('#document-entry-dialog').count()
 # Reuse creates a clean, independent next match, without changing the archive.
 page.locator('#causerie-archive-reuse').click()
 assert page.evaluate('getCompositionBoard().documentId')!=saved
 assert page.evaluate('getCompositionBoard().matchPreparation.date')==''
 assert page.evaluate('getCompositionBoard().matchPreparation.opponent')==''
 assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='Bloc compact'
 assert page.evaluate('getCompositionBoard().matchPreparation.objectives[0]')=='Presser ensemble'
 assert not page.locator('#causerie-validated-status').is_visible()
 assert not page.locator('#terrain-page-0 .workspace').evaluate('e=>e.inert')
 assert page.evaluate('(id)=>JSON.stringify(saves.find(s=>s.state.documentId===id).state)',saved)==original
 assert not page.locator('dialog[open]').count()
 page.locator('#causerie-archive-select').select_option(saved);page.locator('#causerie-archive-resume').click()
 assert page.evaluate('getCompositionBoard().documentId')==saved
 assert page.locator('#causerie-validated-status').is_visible()
 # Quota cannot replace the selected document or create a half-reset copy.
 page.evaluate("()=>{window.archiveSet=coachStorageSet;coachStorageSet=()=>{throw Error('quota')}}")
 page.locator('#causerie-archive-reuse').click();assert page.evaluate('getCompositionBoard().documentId')==saved
 page.evaluate('()=>{coachStorageSet=archiveSet}')
 page.locator('#causerie-composition-edit').click()
 assert not page.locator('#terrain-page-0 .workspace').evaluate('e=>e.inert')
 # Reload restores the durable validated record, not the transient editing UI.
 page.reload();page.locator('#causerie-archive-select').wait_for(state='attached');page.locator('#view-pitch').click()
 assert page.locator('#causerie-validated-status').is_visible()
 # Foreign team documents cannot enter the picker.
 page.evaluate("()=>{const foreign=structuredClone(getCompositionBoard());foreign.documentId='foreign-causerie';foreign.teamContext={id:'team-foreign',label:'Autre',category:'U15',team:'Club'};saves.push({date:new Date().toISOString(),state:foreign});document.body.classList.toggle('archive-test-refresh');}")
 assert page.locator('#causerie-archive-select option[value=foreign-causerie]').count()==0
 page.evaluate("()=>{saves=saves.filter(s=>s.state.documentId!=='foreign-causerie');renderSaves()}")
 # Saving reuses the authenticated club library/outbox contract, with active team metadata.
 page.locator('#causerie-archive-reuse').click()
 page.evaluate("()=>{state.matchPreparation.date='2026-11-15';state.matchPreparation.opponent='Adversaire B';render();window.archiveBound=clubNetworkBound;window.archiveQueue=clubNetworkQueueSync;clubNetworkBound=()=>true;clubNetworkQueueSync=()=>{};window.archiveSaved=saveNamedComposition();clubNetworkBound=archiveBound;clubNetworkQueueSync=archiveQueue;}")
 assert page.evaluate('archiveSaved')
 assert page.evaluate("clubNetworkPendingJobs().some(j=>j.kind==='composition'&&j.id===getCompositionBoard().documentId&&j.teamId===activeCoachTeam.id)")
 assert page.evaluate("clubNetworkSource('composition',getCompositionBoard()).title.startsWith('Causerie ·')")
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.locator('#causerie-archive-select').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('Clean validated composition/reload, immediate causerie selector, independent next-match copy, scoped archive/outbox, quota retention and mobile passed')
