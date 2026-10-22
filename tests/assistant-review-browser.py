"""Assistant provenance, stale proposals, atomic application, imported response and report drafting."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof crakitoOpenReportProposal==='function'")
 assert page.evaluate("crakitoFind('Comment exporter ma composition PDF pour Canva ?').title==='Exporter pour votre présentation'")
 assert page.evaluate("crakitoFind('Comment lire les pouces WhatsApp des présences ?').title==='Valider les présences'")
 assert page.evaluate("crakitoFind('Qui peut valider les repères de mon pôle ?').title==='Repères proposés et validés'")
 # Free objective is retained in the preview and mapped transparently to the matching theme.
 page.locator('#club-assistant-open').click();page.get_by_role('button',name='Préparer une séance',exact=True).click();page.get_by_role('button',name='M’aider à préparer une séance',exact=True).click();page.locator('.crakito-session input').fill('Ressortir le ballon sous pression');page.get_by_role('button',name='Préparer une proposition',exact=True).click()
 assert page.evaluate("localCoachProposal.themes.includes('Relance')&&localCoachProposal.summary.includes('Ressortir le ballon sous pression')")
 before=page.evaluate('JSON.stringify(currentTraining.blocks)')
 # Any intervening edit (including blocks or document ID) must prevent applying an old proposal.
 page.evaluate("currentTraining.id=crypto.randomUUID();document.querySelector('#local-coach-use').click()")
 assert page.evaluate('JSON.stringify(currentTraining.blocks)')==before;assert page.locator('#local-coach-dialog').is_visible()
 page.locator('#local-coach-close').click();page.evaluate('openLocalCoachProposal()');old=page.evaluate('JSON.stringify(currentTraining)')
 assert page.evaluate("()=>{const writer=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};try{document.querySelector('#local-coach-use').click();return JSON.stringify(currentTraining)==="+repr(old)+"}finally{coachStorageSet=writer}}")
 assert page.locator('#local-coach-dialog').is_visible()
 page.locator('#local-coach-use').click();assert page.evaluate('currentTraining.blocks.length>0&&workspaceRecoveryEntries().training.payload.blocks.length===0')
 # Imported reference belongs to the coach's storage and is not presented as official approval.
 page.evaluate("()=>{manualAISetReference({version:1,title:'Document fourni',sourceSha256:'a'.repeat(64),sections:[{id:'collectif',title:'Projet collectif',page:2,text:'Occupation de la largeur et soutien.'}]});manualAIPrepare();}")
 assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-club-reference')).title==='Document fourni'")
 assert 'pas une instruction système' in page.locator('#manual-ai-prompt').input_value()
 page.evaluate("()=>{document.querySelector('#manual-ai-answer').value=JSON.stringify({title:'Proposition externe',summary:'Travail collectif proposé',adaptation:'Adapter les distances',citations:[{sectionId:'collectif',page:2,explanation:'Renvoi à relire'}],blocks:[{exerciseId:'warm',duration:10,notes:''},{exerciseId:'passes',duration:currentTraining.duration-15,notes:''},{exerciseId:'cool',duration:5,notes:''}]});manualAIReview();}")
 assert not page.locator('#manual-ai-apply').is_disabled()
 assert 'leur interprétation' in page.locator('#manual-ai-preview').text_content()
 old=page.evaluate('JSON.stringify(currentTraining)')
 assert page.evaluate("()=>{const writer=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};try{document.querySelector('#manual-ai-apply').click();return JSON.stringify(currentTraining)==="+repr(old)+"}finally{coachStorageSet=writer}}")
 assert not page.locator('#manual-ai-apply').is_disabled()
 page.evaluate("currentTraining.id=crypto.randomUUID();document.querySelector('#manual-ai-apply').click()")
 assert page.evaluate("currentTraining.title!=='Proposition externe'")
 # Invalid citations are refused; a freshly reviewed valid proposal can be applied safely.
 page.evaluate("manualAIPrepare();const reply=JSON.parse(document.querySelector('#manual-ai-answer').value);reply.citations[0].page=99;document.querySelector('#manual-ai-answer').value=JSON.stringify(reply);manualAIReview()")
 assert page.locator('#manual-ai-apply').is_disabled()
 page.evaluate("const reply2=JSON.parse(document.querySelector('#manual-ai-answer').value);reply2.citations[0].page=2;document.querySelector('#manual-ai-answer').value=JSON.stringify(reply2);manualAIReview();document.querySelector('#manual-ai-apply').click()")
 assert page.evaluate("currentTraining.title==='Proposition externe'&&currentTraining.notes.includes('Document fourni')&&workspaceRecoveryEntries().training!==undefined")
 # Report draft uses only the supplied observations, with visible before/after review.
 page.evaluate("()=>{currentReport=newReport();currentReport.analysis.withBall='Ancien constat';currentReport.plan.success='Critère existant';crakitoOpenReportProposal();}")
 d=page.locator('#crakito-report-proposal');d.get_by_label('Avec le ballon',exact=True).fill('Deux solutions de soutien trouvées');d.get_by_label('Priorité à travailler',exact=True).fill('Conserver les distances')
 assert page.evaluate("currentReport.analysis.withBall==='Ancien constat'")
 d.get_by_role('button',name='Voir la proposition',exact=True).click();assert 'Ancien constat' in d.inner_text()
 old=page.evaluate('JSON.stringify(currentReport)')
 assert page.evaluate("()=>{const writer=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};try{document.querySelector('#crakito-report-proposal .primary[type=button]').click();return JSON.stringify(currentReport)==="+repr(old)+"}finally{coachStorageSet=writer}}")
 assert 'Application impossible' in d.inner_text()
 d.get_by_role('button',name='Appliquer à mon brouillon de rapport',exact=True).click()
 assert page.evaluate("currentReport.analysis.withBall==='Deux solutions de soutien trouvées'&&currentReport.plan.success==='Critère existant'&&currentReport.info.goalsFor===''&&workspaceRecoveryEntries().report.payload.analysis.withBall==='Ancien constat'")
 page.evaluate('crakitoOpenReportProposal()');d=page.locator('#crakito-report-proposal');d.get_by_label('Sans le ballon',exact=True).fill('Bloc à resserrer');d.get_by_role('button',name='Voir la proposition',exact=True).click();page.evaluate("currentReport.info.opponent='Autre match'");d.get_by_role('button',name='Appliquer à mon brouillon de rapport',exact=True).click();assert 'obsolète' in d.inner_text()
 d.get_by_role('button',name='Fermer',exact=True).click()
 # Revocation clears the chat, documents in previews and proposal material.
 page.locator('#club-assistant-open').click();page.locator('#crakito-question').fill('Comment faire un bilan confidentiel ?');page.locator('#crakito-form button').click();page.evaluate('clubNetworkClear()')
 assert page.locator('#crakito-messages').text_content()=='' and page.evaluate('manualAIReference===null&&manualAIProposal===null&&localCoachProposal===null')
 assert page.locator('#manual-ai-prompt').input_value()==''
 page.set_viewport_size({'width':390,'height':844});page.locator('#club-assistant-open').click();assert page.locator('#club-assistant').evaluate('e=>e.scrollWidth<=e.clientWidth');page.locator('#crakito-close').click();page.evaluate('crakitoOpenReportProposal()');assert page.locator('#crakito-report-proposal').evaluate('e=>e.scrollWidth<=e.clientWidth')
 assert not errors,errors
 b.close();print('PASS assistant review: truthful guides, free objective, stale/changed document guards, quota rollback, recovery, scoped reference, imported citations, user-only report facts, revocation cleanup and mobile.')
