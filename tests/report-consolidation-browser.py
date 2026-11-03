"""Consolidated report UI: legacy content, actual save/clipboard, scoped removal."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=b.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce',permissions=['clipboard-read','clipboard-write'])
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof reportRenderPlan==="function"');page.locator('#view-reports').click()
 page.evaluate("""()=>{currentReport=newReport();currentReport.title='Bilan consolidé';currentReport.analysis.firstHalf='Note antérieure exacte';currentReport.plan.session1='Ancienne séance conservée';currentReport.plan.success='Ancien repère conservé';currentReport.plan.owner='Ancienne attribution';reportTab='sport';renderReportTabs();renderReportContent();}""")
 assert page.get_by_role('heading',name='Top Offensivement (Avec le ballon)',exact=True).is_visible()
 assert page.get_by_role('heading',name='Top Défensif (Sans le ballon)',exact=True).is_visible()
 assert page.get_by_label('Analyse de la première période',exact=True).count()==0
 attack=page.locator('[data-report-analysis=topAttack]');defence=page.locator('[data-report-analysis=topDefence]')
 attack.get_by_label('Points forts',exact=True).fill('Utiliser toute la largeur — texte exact')
 attack.get_by_label('À améliorer',exact=True).fill('Proposer un appui')
 defence.get_by_label('Points forts',exact=True).fill('Fermer l’axe ensemble')
 page.locator('.report-previous-notes summary').click();assert 'Note antérieure exacte' in page.locator('.report-previous-notes').inner_text()
 page.locator('#report-tabs [data-report-tab=plan]').click()
 sessions=page.locator('#report-session-plan');assert sessions.locator('textarea').count()==2
 sessions.get_by_label('Objectif',exact=True).fill('Progresser par les côtés')
 sessions.get_by_label('Exercice prévu',exact=True).fill('Jeu dirigé avec deux couloirs')
 for label in ['Critères observables de réussite','Responsable(s) du suivi','Séance 1 · objectif et exercice prévu']:
  assert page.get_by_label(label,exact=True).count()==0,label
 message='Ensemble du début à la fin.\nSolidarité et disponibilité !'
 page.locator('#report-group-message-text').fill(message);page.locator('#report-group-message-copy').click();page.wait_for_function("document.querySelector('#report-group-message [role=status]').textContent==='Message copié.'")
 assert page.evaluate('navigator.clipboard.readText()')==message
 assert page.evaluate('reportValid(currentReport)')
 # Historical records without the new optional keys are still valid.
 assert page.evaluate("()=>{const old=structuredClone(currentReport);delete old.plan.sessionObjective;delete old.plan.sessionExercise;return reportValid(old)}")
 assert not page.evaluate("()=>{const bad=structuredClone(currentReport);bad.plan.sessionExercise={};return reportValid(bad)}")
 assert page.evaluate('saveReport()')
 report_id=page.evaluate('currentReport.id')
 page.reload();page.wait_for_function('currentReport.title==="Bilan consolidé"')
 if page.locator('#document-entry-dialog').is_visible():page.locator('#document-entry-resume').click()
 assert page.evaluate("currentReport.plan.sessionExercise==='Jeu dirigé avec deux couloirs'&&currentReport.analysis.topDefence==='Fermer l’axe ensemble'")
 text=page.evaluate('buildReportDocument().textContent')
 for value in [message,'Note antérieure exacte','Ancienne séance conservée','Ancien repère conservé','Ancienne attribution','Progresser par les côtés','Jeu dirigé avec deux couloirs']:assert value in text,value
 # Clipboard denial gives manual selection, without inventing a successful copy.
 page.evaluate("()=>{reportTab='plan';renderReportContent();window.realClipboardWrite=navigator.clipboard.writeText;navigator.clipboard.writeText=async()=>{throw Error('denied')};}")
 page.locator('#report-group-message-copy').click();page.wait_for_function("document.querySelector('#report-group-message [role=status]').textContent.includes('sélectionné')")
 assert page.locator('#report-group-message-text').evaluate('e=>e.selectionEnd-e.selectionStart')==len(message)
 page.evaluate('()=>{navigator.clipboard.writeText=realClipboardWrite;}')
 # Removing a report row must never delete the player directory or composition.
 page.evaluate("""()=>{const player={id:'player-test',name:'Joueur fictif',number:8,photo:'',position:'Milieu',foot:'Droit'};squadSave([player]);currentReport.players=[{id:player.id,name:player.name,number:'8',role:'Titulaire',minutes:'70',score:'4',note:'Observation',objective:'Disponibilité'}];window.beforeSquad=JSON.stringify(squadPlayers());window.beforeComposition=JSON.stringify(getCompositionBoard());reportTab='players';renderReportContent();}""")
 page.once('dialog',lambda d:d.dismiss());page.get_by_role('button',name='Retirer Joueur fictif du suivi individuel').click();assert page.evaluate('currentReport.players.length')==1
 page.once('dialog',lambda d:d.accept());page.get_by_role('button',name='Retirer Joueur fictif du suivi individuel').click();assert page.evaluate('currentReport.players.length')==0
 assert page.evaluate('JSON.stringify(squadPlayers())===beforeSquad&&JSON.stringify(getCompositionBoard())===beforeComposition')
 for width in [1366,390,320]:
  page.set_viewport_size({'width':width,'height':900});page.evaluate("reportTab='sport';renderReportTabs();renderReportContent()")
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
  a=page.locator('[data-report-analysis=topAttack]').bounding_box();d=page.locator('[data-report-analysis=topDefence]').bounding_box()
  assert (d['x']>a['x']) if width>800 else (d['y']>a['y'])
  if width!=320:page.screenshot(path=f'/tmp/report-consolidation-{width}.png')
 assert not errors,errors;b.close()
print('PASS: two tactical blocks, unified session fields, real clipboard/fallback, save/reload/print, legacy preservation and confirmed report-only deletion, desktop/mobile.')
