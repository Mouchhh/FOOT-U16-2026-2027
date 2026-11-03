"""Actual scoped library deletion, cancellation, failures, and composition preservation."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.documentDeletion && window.externalModalClose')
    page.locator('#view-reports').click()
    page.evaluate('''()=>{
      currentReport.title='À supprimer';currentReport.analysis.topAttack='Bilan précis';saveReport();
      const other=newReport();other.title='À conserver';reportLibrary.push(other);coachStorageSet('vestiaire-reports',JSON.stringify(reportLibrary));
      coachStorageSet('vestiaire-recovery',JSON.stringify({report:{at:new Date().toISOString(),payload:structuredClone(currentReport)}}));
      coachStorageSet('vestiaire-document-versions',JSON.stringify([{id:'version-1',kind:'report',at:new Date().toISOString(),payload:structuredClone(currentReport)}]));
    }''')
    page.evaluate("()=>{currentReport.documentCompletion={version:1,kind:'report',at:new Date().toISOString(),fingerprint:documentCompletionFingerprint(currentReport)};documentCompletionRefresh();}")
    assert page.locator('#report-delete').is_visible()
    assert page.locator('#report-delete').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(228, 31, 40)'
    target=page.evaluate('currentReport.id');page.locator('#report-delete').click();dialog=page.locator('#document-delete-dialog');assert dialog.is_visible()
    cross=dialog.get_by_role('button',name='Fermer la confirmation de suppression');assert cross.evaluate("e=>e.classList.contains('external-modal-close')")
    assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
    dialog.get_by_role('button',name='Annuler',exact=True).click();assert page.evaluate('reportLibrary.length')==2
    # Simulated durable-library failure: editor remains, draft and earlier writes roll back.
    page.evaluate("()=>{window.deletionStorageOriginal=coachStorageSet;coachStorageSet=(key,value)=>{if(key==='vestiaire-reports')throw Error('test');return window.deletionStorageOriginal(key,value);};}")
    page.locator('#report-delete').click();dialog.get_by_role('button',name='Oui, supprimer',exact=True).click();assert dialog.is_visible()
    assert page.evaluate('currentReport.id')==target and page.evaluate('reportLibrary.length')==2
    assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-report-draft')).id")==target
    page.evaluate('()=>{coachStorageSet=window.deletionStorageOriginal;}');dialog.get_by_role('button',name='Annuler',exact=True).click()
    page.locator('#report-delete').click();dialog.get_by_role('button',name='Oui, supprimer',exact=True).click();assert not dialog.is_visible()
    assert page.evaluate('reportLibrary.map(r=>r.title)')==['À conserver']
    assert page.evaluate('currentReport.id')!=target
    assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-report-draft')).id")!=target
    assert page.evaluate("workspaceRecoveryEntries().report===undefined")
    assert page.evaluate('documentEntryArchives().length')==0
    # Refuse to delete a different report after confirmation was opened.
    page.locator('#report-delete').click();page.evaluate('currentReport=newReport()');dialog.get_by_role('button',name='Oui, supprimer',exact=True).click()
    assert dialog.is_visible() and 'changé' in dialog.locator('[role=alert]').inner_text()
    dialog.get_by_role('button',name='Annuler',exact=True).click()
    # Causerie content is cleared, never the squad or composition.
    page.evaluate('''()=>{
      state=getCompositionBoard();state.documentId='talk-delete-test';state.notes='Consigne de composition conservée';
      state.matchPreparation={...newMatchPreparation(),date:'2026-11-07',opponent:'Laval',defensive:'Bloc compact',offensive:'Largeur',objectives:['Priorité','','','']};
      state.documentCompletion={version:1,kind:'causerie',at:new Date().toISOString(),fingerprint:'x'};
      saves=[{date:new Date().toISOString(),state:structuredClone(state)}];coachStorageSet('vestiaire-saves',JSON.stringify(saves));render();persist();
    }''')
    players=page.evaluate('JSON.stringify(getCompositionBoard().players)')
    page.evaluate("documentEntry.perform(()=>{workspaceNavigation.run('view-pitch',()=>workspaceFlows.terrain.go(1));})")
    page.locator('#causerie-delete').click();dialog.get_by_role('button',name='Oui, supprimer',exact=True).click()
    assert not dialog.is_visible()
    assert page.evaluate('getCompositionBoard().matchPreparation.defensive')==''
    assert page.evaluate('getCompositionBoard().matchPreparation.offensive')==''
    assert page.evaluate('getCompositionBoard().matchPreparation.date')=='2026-11-07'
    assert page.evaluate('saves[0].state.matchPreparation.defensive')==''
    assert page.evaluate('getCompositionBoard().notes')=='Consigne de composition conservée'
    assert page.evaluate('JSON.stringify(getCompositionBoard().players)')==players
    assert page.evaluate('getCompositionBoard().documentCompletion===undefined')
    page.locator('#causerie-delete').click()
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert dialog.get_by_role('button',name='Oui, supprimer',exact=True).bounding_box()['height']>=44
    dialog.get_by_role('button',name='Annuler',exact=True).click()
    assert not errors,errors
    browser.close()
print('Deletion: custom confirmation, cancellation, rollback, document guard, report cleanup, preserved composition and mobile passed')
