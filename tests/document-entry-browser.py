from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.documentEntry');d=page.locator('#document-entry-dialog')
 # Blank document entrances are fluid.
 page.locator('#view-reports').click();assert not d.count()
 page.evaluate("()=>{currentReport.info.date='2026-11-07';currentReport.info.opponent='Adversaire A';currentReport.analysis.topAttack='Constat A';flushReportDraft()}")
 report_id=page.evaluate('currentReport.id');page.locator('#view-home').click();page.locator('#view-reports').click();assert d.is_visible();d.locator('#document-entry-resume').click();assert page.evaluate('currentReport.id')==report_id
 page.locator('#report-tabs [data-report-tab=plan]').click();assert not d.count()
 page.locator('#view-home').click();page.locator('#view-reports').click();d.locator('#document-entry-create').click();assert page.evaluate('currentReport.id')!=report_id;assert page.evaluate('currentReport.analysis.topAttack')=='';assert page.evaluate('currentReport.info.opponent')=='Adversaire A'
 assert page.evaluate("documentEntryArchives().some(r=>r.kind==='report'&&r.payload.analysis.topAttack==='Constat A')")
 # The Match choice belongs to Composition, including a roster-only preparation.
 page.locator('#view-home').click();page.locator('#view-pitch').click();assert not d.count();assert page.evaluate('workspaceFlows.terrain.index()')==0
 page.evaluate("()=>{state.players[0].name='Capitaine';state.matchPreparation={...newMatchPreparation(),date:'2026-11-14',match:'Match B',opponent:'Adversaire B',defensive:'Bloc compact'};state.notes='Anciennes notes';persist();renderMatchPreparation()}")
 before=page.evaluate('JSON.stringify(getCompositionBoard())');players=page.evaluate('JSON.stringify(getCompositionBoard().players)')
 page.locator('#view-home').click();page.locator('#view-pitch').click();assert d.is_visible();assert page.evaluate('workspaceFlows.terrain.index()')==0;assert 'préparation de match' in d.inner_text();assert d.get_by_role('button',name='Créer un nouveau match',exact=False).count()==1
 d.locator('#document-entry-resume').click();assert page.evaluate('workspaceFlows.terrain.index()')==0;assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 # Causerie is freely available after choosing the Match, with no second decision.
 page.locator('#task-match-causerie').click();assert not d.count();assert page.evaluate('workspaceFlows.terrain.index()')==1;assert page.locator('#task-causerie').is_visible()
 page.locator('#task-match-composition').click();assert not d.count();assert page.evaluate('workspaceFlows.terrain.index()')==0
 # New Match is independent and archives the full previous preparation.
 page.locator('#view-home').click();page.locator('#view-pitch').click();d.locator('#document-entry-create').click();assert page.evaluate('workspaceFlows.terrain.index()')==0
 assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='';assert page.evaluate('getCompositionBoard().notes')=='';assert page.evaluate('JSON.stringify(getCompositionBoard().players)')==players
 assert page.evaluate("documentEntryArchives().some(r=>r.kind==='causerie'&&r.payload.matchPreparation.defensive==='Bloc compact')")
 assert page.locator('#document-versions-causerie').evaluate("e=>!!e.closest('#terrain-page-0')")
 page.locator('#document-versions-causerie').click();page.locator('#document-version-history').get_by_role('button',name='Reprendre cette version',exact=True).first.click();assert page.evaluate('workspaceFlows.terrain.index()')==0;assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='Bloc compact'
 # Reload also places the decision on Composition, even when leaving from Causerie.
 page.locator('#task-match-causerie').click();assert not d.count();page.wait_for_function("history.state?.clubNavigation?.page?.view==='terrain' && history.state.clubNavigation.page.index===1")
 page.reload();page.wait_for_function('!!window.documentEntry');assert d.is_visible();assert page.evaluate('workspaceFlows.terrain.index()')==0;d.locator('#document-entry-resume').click()
 # Storage and stale-document protections remain active.
 page.evaluate("()=>{state.notes='Nouvelle note à conserver';persist()}");page.locator('#view-home').click();page.locator('#view-pitch').click()
 page.evaluate("()=>{window.entryWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-document-versions')throw Error('quota');return entryWriter(k,v)}}")
 d.locator('#document-entry-create').click();assert d.is_visible();assert page.evaluate('getCompositionBoard().notes')=='Nouvelle note à conserver';assert 'Impossible de conserver' in d.inner_text();page.evaluate('()=>{coachStorageSet=entryWriter}');d.get_by_role('button',name='Retour',exact=True).click()
 page.locator('#view-home').click();page.locator('#view-pitch').click();page.evaluate("()=>{state.notes='Modifié pendant le choix';persist()}");d.locator('#document-entry-create').click();assert 'Le compte ou le document a changé' in d.inner_text();d.get_by_role('button',name='Retour',exact=True).click()
 # Mobile choice is located on Composition and remains readable.
 page.set_viewport_size({'width':390,'height':844});page.locator('#view-home').click();page.locator('#view-pitch').click();assert d.is_visible();assert page.evaluate('workspaceFlows.terrain.index()')==0;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/composition-entry-choice-mobile.png',full_page=True);d.locator('#document-entry-resume').click()
 # Report context is still derived from the active match and does not reuse A.
 page.locator('#view-reports').click();assert not d.count();assert page.evaluate('currentReport.info.opponent')=='Adversaire B';assert page.evaluate('currentReport.analysis.topAttack')==''
 assert not errors,errors
 ctx.close();b.close();print('Composition entry choice, exact resume, new match/archive, free Causerie, history/reload, quotas, stale choices, mobile and unchanged report contexts passed')
