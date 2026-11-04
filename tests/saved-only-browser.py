"""Unregistered drafts stay in the editor, out of match/report selectors and agenda."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.documentEntry && window.reportEntryBanner')
 page.locator('#view-pitch').click()
 page.evaluate("()=>{state.documentId='unsaved-match';state.matchPreparation={...newMatchPreparation(),date:'2026-11-20',opponent:'Adversaire',defensive:'Brouillon non enregistré'};persist();render();currentReport.info.date='2026-11-20';currentReport.info.opponent='Adversaire';currentReport.analysis.topAttack='Bilan non enregistré';reportAutosave();}")
 page.locator('#view-home').click();page.locator('#view-pitch').click()
 assert not page.locator('#document-entry-dialog').count()
 assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='Brouillon non enregistré'
 assert not page.locator('#causerie-archive-select option[value=unsaved-match]').count()
 assert not page.locator('#document-versions-causerie,#document-versions-report').count()
 page.locator('#view-reports').click()
 assert not page.locator('#report-entry-banner').count()
 assert page.evaluate('currentReport.analysis.topAttack')=='Bilan non enregistré'
 assert page.locator('#report-causerie-source option').count()==1
 assert not page.evaluate("agendaCalendarAllEvents({from:'2026-11-20',to:'2026-11-20'}).some(e=>e.id==='match:unsaved-match')")
 # An explicit new report still creates a distinct blank report, even with no saved candidates.
 previous=page.evaluate('currentReport.id');page.locator('#report-new').click()
 assert page.evaluate('currentReport.id')!=previous
 assert page.evaluate('currentReport.analysis.topAttack')==''
 # Explicit registration makes a match available, while pending edits stay out of the list.
 page.evaluate("()=>{saveNamedComposition();currentReport.info.date='2026-11-20';currentReport.info.opponent='Adversaire';saveReport();state.matchPreparation.defensive='Modification en cours';persist();renderSaves();}")
 assert page.locator('#report-causerie-source option').count()==2
 assert page.locator('#causerie-archive-select option[value=unsaved-match]').count()==1
 assert page.evaluate("agendaCalendarAllEvents({from:'2026-11-20',to:'2026-11-20'}).filter(e=>e.id==='match:unsaved-match').length")==1
 assert page.evaluate("agendaCalendarAllEvents({from:'2026-11-20',to:'2026-11-20'}).find(e=>e.id==='match:unsaved-match').draft")==False
 page.locator('#view-home').click();page.locator('#view-pitch').click()
 dialog=page.locator('#document-entry-dialog');dialog.wait_for(state='visible')
 assert 'Brouillon en cours' not in dialog.inner_text()
 assert 'Version précédente ·' not in dialog.inner_text()
 dialog.locator('#document-entry-resume').click()
 assert page.evaluate('getCompositionBoard().matchPreparation.defensive')=='Modification en cours'
 assert not errors,errors
 b.close()
print('Unsaved match/report drafts excluded from entry choices, selectors and agenda; active work retained; explicit saving and new report work passed')
