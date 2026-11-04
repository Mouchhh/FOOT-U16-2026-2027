"""Finish closes the workspace only after durable save; completed entries stay quiet."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce');page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    def ready():page.wait_for_function('window.documentEntry && window.externalModalClose && typeof documentCompletionFinish==="function"')
    page.goto('http://127.0.0.1:3016/?mode=local');ready();page.locator('#view-reports').click()
    page.evaluate("()=>{currentReport.title='Bilan terminé';currentReport.info.date='2026-11-07';currentReport.info.opponent='Adversaire A';currentReport.analysis.topAttack='Solidarité';currentReport.plan.priority='Protéger notre axe';reportTab='preview';renderReportTabs();renderReportContent();}")
    first=page.evaluate('currentReport.id');page.locator('#report-next').click()
    assert page.evaluate("document.body.classList.contains('home-mode')")
    assert page.evaluate("documentCompletionIsCompleted('report',currentReport)")
    assert page.evaluate("()=>{const copy=structuredClone(currentReport);copy.clubReference=true;copy.clubApproval={version:1};return documentCompletionIsCompleted('report',copy)}")
    assert page.evaluate('reportLibrary[0].analysis.topAttack')=='Solidarité'
    assert not page.evaluate("homeWorkingCopies().some(w=>w.key==='report')")
    page.locator('#view-reports').click();assert page.locator('#document-entry-dialog').count()==0
    assert page.locator('#document-completion-report').is_visible() and not page.locator('#report-content').is_visible()
    assert not page.locator('#task-section-navigation').is_visible()
    page.reload();ready();assert page.locator('#document-entry-dialog').count()==0 and page.locator('#document-completion-report').is_visible()
    page.locator('#document-completion-report').get_by_role('button',name='Relire / modifier',exact=True).click()
    assert page.locator('#report-content').is_visible() and page.evaluate('currentReport.id')==first
    assert page.evaluate('currentReport.plan.priority')=='Protéger notre axe'
    # A failed save keeps the editor and its content visible, with no completion marker applied.
    page.evaluate("()=>{currentReport.analysis.topAttack='À conserver malgré quota';window.completionSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-reports')throw Error('quota');return completionSet(k,v)}}")
    page.locator('#report-finish').click();assert page.locator('#report-content').is_visible()
    assert page.evaluate("document.body.classList.contains('reports-mode')")
    assert page.evaluate('currentReport.analysis.topAttack')=='À conserver malgré quota'
    page.evaluate('()=>{coachStorageSet=completionSet}');page.locator('#report-finish').click();assert page.evaluate('reportLibrary.length')==1
    page.locator('#view-reports').click();landing=page.locator('#document-completion-report')
    landing.get_by_role('button',name='Créer un nouveau bilan',exact=True).click()
    assert page.locator('#document-entry-dialog').count()==0
    assert page.evaluate('currentReport.id')!=first and page.locator('#report-content').is_visible()
    assert page.evaluate('reportLibrary[0].analysis.topAttack')=='À conserver malgré quota'
    # Saving an unfinished document remains an ordinary save; only Finish closes it.
    page.evaluate("()=>{currentReport.title='Bilan suivant';currentReport.info.opponent='Adversaire B';currentReport.info.date='2026-11-14';renderReportContent()}")
    page.locator('#report-save').click();assert page.evaluate("document.body.classList.contains('reports-mode')")
    assert not page.evaluate("documentCompletionIsCompleted('report',currentReport)")
    page.locator('#report-finish').click();assert page.evaluate('reportLibrary.length')==2
    # Causerie validation preserves the entire composition and closes both inline/modal presentations.
    page.locator('#view-pitch').click()
    if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
    page.locator('#task-match-causerie').click();page.locator('#match-plan-defensive').fill('Bloc compact et distances courtes');page.locator('#match-plan-opponent').fill('Adversaire C');page.locator('#match-plan-date').fill('2026-11-21')
    page.evaluate("()=>{getCompositionBoard().players[0].name='Capitaine';render();}")
    before=page.evaluate('JSON.stringify(getCompositionBoard().players)');page.locator('#match-plan-form button[type=submit]').click()
    assert page.evaluate("document.body.classList.contains('home-mode')")
    assert page.evaluate("documentCompletionIsCompleted('causerie',getCompositionBoard())")
    assert page.evaluate('JSON.stringify(saves[0].state.players)')==before
    assert page.evaluate('saves[0].state.matchPreparation.defensive')=='Bloc compact et distances courtes'
    assert not page.evaluate("homeWorkingCopies().some(w=>w.key==='composition')")
    page.locator('#view-pitch').click();assert page.locator('#document-entry-dialog').count()==0
    assert page.evaluate('workspaceFlows.terrain.index()')==0
    page.locator('#task-match-causerie').click();assert page.locator('#document-completion-causerie').is_visible()
    page.reload();ready();assert page.locator('#document-entry-dialog').count()==0
    page.locator('#task-match-causerie').click();page.locator('#document-completion-causerie').get_by_role('button',name='Relire / modifier',exact=True).click()
    assert page.locator('#match-plan-form').is_visible()
    # A failed causerie library write does not close the editor or lose the entered notes.
    page.locator('#match-plan-defensive').fill('Révision à conserver')
    page.evaluate("()=>{window.completionSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-saves')throw Error('quota');return completionSet(k,v)}}")
    page.locator('#match-plan-form button[type=submit]').click();assert page.locator('#match-plan-form').is_visible()
    assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='Révision à conserver'
    page.evaluate('()=>{coachStorageSet=completionSet}');page.locator('#match-plan-form button[type=submit]').click()
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844});page.locator('#view-reports').click()
        if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
        assert page.locator('#document-completion-report').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=f'/tmp/document-completed-{width}.png');page.locator('#view-home').click()
    assert not errors,errors
    browser.close()
print('Finish/save contracts, auto-close/home, completed-entry suppression/reload, explicit history/new work, quota retention, full causerie content and mobile passed')
