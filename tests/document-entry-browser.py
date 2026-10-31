from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.documentEntry')
 # Empty report opens directly, with no transition and no archive.
 page.locator('#view-reports').click();assert not page.locator('#document-entry-dialog').count();assert page.locator('#after-match').is_visible()
 # Existing written report: show a choice before leaving the previous workspace.
 page.evaluate("()=>{currentReport.info.date='2026-11-07';currentReport.info.opponent='Adversaire A';currentReport.analysis.topAttack='Conserver ce constat';currentReport.plan.priority='Conserver cette priorité';flushReportDraft()}")
 report_id=page.evaluate('currentReport.id');page.locator('#view-home').click();page.locator('#view-reports').click();d=page.locator('#document-entry-dialog');assert d.is_visible();assert '7 novembre 2026' in d.inner_text();assert page.evaluate('documentEntry.getState().phase')=='choice'
 assert page.evaluate('currentReport.analysis.topAttack')=='Conserver ce constat'
 d.locator('#document-entry-resume').click();assert page.evaluate('currentReport.id')==report_id;assert page.evaluate('currentReport.analysis.topAttack')=='Conserver ce constat'
 page.wait_for_function("history.state?.clubNavigation?.page?.view==='report'");page.reload();page.wait_for_function('!!window.documentEntry');assert d.is_visible();d.locator('#document-entry-resume').click();assert page.evaluate('currentReport.id')==report_id
 # Moving inside the same report does not ask again.
 page.locator('#report-tabs [data-report-tab=plan]').click();assert not d.count()
 page.locator('#view-home').click();page.locator('#view-reports').click();d.locator('#document-entry-create').click()
 assert page.evaluate('currentReport.id')!=report_id;assert page.evaluate('currentReport.analysis.topAttack')=='';assert page.evaluate('currentReport.plan.priority')=='';assert page.evaluate('currentReport.info.date')=='2026-11-07';assert page.evaluate('currentReport.info.opponent')=='Adversaire A'
 assert page.evaluate("documentEntryArchives().some(r=>r.kind==='report'&&r.payload.id==='"+report_id+"'&&r.payload.analysis.topAttack==='Conserver ce constat')")
 page.locator('#document-versions-report').click();page.locator('#document-version-history').get_by_role('button',name='Reprendre cette version',exact=True).first.click();assert page.evaluate('currentReport.id')==report_id
 # Causerie: blank context metadata is not treated as an already-written talk.
 page.evaluate("()=>{const board=structuredClone(getCompositionBoard());board.matchPreparation={...newMatchPreparation(),date:'2026-11-14',match:'Match B',opponent:'Adversaire B'};workspaceReplaceDraft('composition',board)}")
 page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();assert not d.count();assert page.locator('#task-causerie').is_visible()
 page.evaluate("()=>{state.matchPreparation.defensive='Bloc compact à conserver';state.matchPreparation.objectives[0]='Se parler';persist();renderMatchPreparation()}")
 board_id=page.evaluate('getCompositionBoard().documentId||"draft"');page.locator('#task-match-composition').click();page.locator('#task-match-causerie').click();assert d.is_visible();d.locator('#document-entry-resume').click();assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='Bloc compact à conserver'
 # Match → Bilans uses the match context, not an unrelated report left open earlier.
 page.locator('#view-reports').click();assert not d.count();assert page.evaluate('currentReport.info.opponent')=='Adversaire B';assert page.evaluate('currentReport.analysis.topAttack')==''
 page.locator('#view-pitch').click();assert d.is_visible();d.locator('#document-entry-resume').click();assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='Bloc compact à conserver'
 page.locator('#task-match-composition').click();page.locator('#task-match-causerie').click();d.locator('#document-entry-create').click();assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='';assert page.evaluate('getCompositionBoard().matchPreparation.objectives[0]')=='';assert page.evaluate('getCompositionBoard().matchPreparation.opponent')=='Adversaire B';assert page.evaluate('getCompositionBoard().matchPreparation.date')=='2026-11-14'
 assert page.evaluate("documentEntryArchives().some(r=>r.kind==='causerie'&&r.payload.matchPreparation.defensive==='Bloc compact à conserver')")
 # New creation is blocked if the previous version cannot be archived.
 page.evaluate("()=>{state.matchPreparation.offensive='Ne pas perdre ce texte';persist();renderMatchPreparation()}")
 page.locator('#task-match-composition').click();page.locator('#task-match-causerie').click();assert d.is_visible()
 page.evaluate("()=>{window.entryWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-document-versions')throw Error('quota');return entryWriter(k,v)}}")
 d.locator('#document-entry-create').click();assert d.is_visible();assert page.evaluate('getCompositionBoard().matchPreparation.offensive')=='Ne pas perdre ce texte';assert 'Impossible de conserver' in d.inner_text();page.evaluate('()=>{coachStorageSet=entryWriter}');d.get_by_role('button',name='Retour',exact=True).click()
 # Archive may succeed while the new draft fails: the live document must still survive.
 page.locator('#task-match-causerie').click();assert d.is_visible()
 page.evaluate("()=>{coachStorageSet=(k,v)=>{if(k==='vestiaire-draft')throw Error('quota draft');return entryWriter(k,v)}}")
 d.locator('#document-entry-create').click();assert d.is_visible();assert page.evaluate('getCompositionBoard().matchPreparation.offensive')=='Ne pas perdre ce texte';page.evaluate('()=>{coachStorageSet=entryWriter}');d.get_by_role('button',name='Retour',exact=True).click()
 # Stale choices cannot overwrite a document changed while the transition was open.
 page.locator('#task-match-causerie').click();page.evaluate("()=>{state.matchPreparation.specific='Modification arrivée entre-temps';persist()}");d.locator('#document-entry-create').click();assert 'Le compte ou le document a changé' in d.inner_text();assert page.evaluate('getCompositionBoard().matchPreparation.specific')=='Modification arrivée entre-temps';d.get_by_role('button',name='Retour',exact=True).click()
 # Mobile choice remains usable without horizontal overflow.
 page.set_viewport_size({'width':390,'height':844});page.locator('#task-match-causerie').click();assert d.is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/document-entry-mobile.png',full_page=True);d.get_by_role('button',name='Retour',exact=True).click()
 # A different explicit match context does not offer an unrelated report.
 page.evaluate("()=>documentEntry.request('report',()=>{}, {context:{id:'other',date:'2026-12-01',opponent:'Autre adversaire',team:'',category:''}})")
 assert not d.count();assert page.evaluate('currentReport.info.opponent')=='Autre adversaire';assert page.evaluate('currentReport.analysis.topAttack')==''
# A saved agenda report must not replace another live report before the choice.
 old_report=page.evaluate('currentReport.id')
 target_id=page.evaluate("()=>{const r=newReport();r.info.date='2026-12-08';r.info.opponent='Adversaire sauvegardé';r.title='Bilan cible';r.analysis.topAttack='Texte cible à conserver';reportLibrary=[r];return r.id}")
 page.evaluate("id=>agendaCalendarEvents().find(e=>e.id==='report:'+id).open()",target_id)
 assert d.is_visible();assert page.evaluate('currentReport.id')==old_report
 d.get_by_role('button',name='Retour',exact=True).click();assert page.evaluate('currentReport.id')==old_report
 page.evaluate("id=>agendaCalendarEvents().find(e=>e.id==='report:'+id).open()",target_id)
 d.locator('#document-entry-create').click();assert page.evaluate('currentReport.id')!=target_id;assert page.evaluate('currentReport.info.opponent')=='Adversaire sauvegardé';assert page.evaluate('currentReport.analysis.topAttack')=='';assert page.evaluate('reportLibrary[0].analysis.topAttack')=='Texte cible à conserver'
 assert not errors,errors
 ctx.close();b.close();print('Empty/direct entry, explicit resume/create, report/causerie context, archives/restore, internal tabs, quota and mobile passed')
