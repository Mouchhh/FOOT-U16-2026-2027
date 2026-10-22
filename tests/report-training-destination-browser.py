"""Explicit destination, cancellation, stale previews and protected next-session creation."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof openReportTraining==='function'")
 page.evaluate("()=>{currentTraining={...newTraining(),title:'Séance passée',date:'2026-10-20',players:10,keepers:1,space:'full',notes:'Ne pas perdre',blocks:[{id:'warm',exerciseId:'warm',duration:8,notes:'Conserver'}],attendance:{version:1,source:'manual',date:'2026-10-20',time:'18:30',validatedAt:'2026-10-20T16:00:00Z',rows:[{id:'test',name:'Joueur test',status:'present',keeper:false,included:true}]}};syncTrainingForm();saveTrainingDraft();currentReport=newReport();currentReport.info.date='2026-10-24';currentReport.info.opponent='Adversaire';currentReport.plan.priority='Offrir une couverture';currentReport.plan.success='Fermer l’axe';window.destinationOriginal=structuredClone(currentTraining);}")
 def open_new():
  page.evaluate('openReportTraining()');d=page.locator('#report-training-dialog');d.get_by_label('Destination de la séance',exact=True).select_option('new');return d
 def propose(d):d.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
 def close(d):d.get_by_role('button',name='Fermer',exact=True).click()
 d=open_new();d.get_by_label('Date de la prochaine séance',exact=True).fill('2026-10-23');propose(d)
 assert d.locator('.report-training-proposal').count()==0
 d.get_by_label('Date de la prochaine séance',exact=True).fill('2026-10-27');propose(d);close(d)
 assert page.evaluate('JSON.stringify(currentTraining)===JSON.stringify(destinationOriginal)')
 # Stale report under the same ID cannot apply the old diagnosis.
 d=open_new();propose(d);page.evaluate("currentReport.plan.priority='Nouvelle observation'")
 d.get_by_role('button',name='Ajouter à ma préparation',exact=True).click();assert 'a changé pendant' in d.inner_text()
 assert page.evaluate('currentTraining.id===destinationOriginal.id');close(d)
 # Same session ID, modified notes or blocks: no stale overwrite.
 d=open_new();propose(d);page.evaluate("currentTraining.blocks[0].notes='Changé pendant l’aperçu'")
 d.get_by_role('button',name='Ajouter à ma préparation',exact=True).click();assert 'a changé pendant' in d.inner_text();close(d)
 page.evaluate('currentTraining=structuredClone(destinationOriginal)')
 # Failure to checkpoint the old draft blocks replacement and preserves it exactly.
 d=open_new();propose(d);page.evaluate("()=>{window.destinationWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-recovery')throw new DOMException('Quota','QuotaExceededError');return destinationWriter(k,v)}}")
 d.get_by_role('button',name='Ajouter à ma préparation',exact=True).click();assert 'Aucun exercice ajouté' in d.inner_text()
 assert page.evaluate('JSON.stringify(currentTraining)===JSON.stringify(destinationOriginal)')
 page.evaluate('coachStorageSet=destinationWriter');d.get_by_role('button',name='Ajouter à ma préparation',exact=True).click()
 assert not page.locator('#report-training-dialog').count()
 assert page.evaluate("currentTraining.id!==destinationOriginal.id&&!currentTraining.attendance&&currentTraining.blocks.length===1&&currentTraining.blocks[0].id!=='warm'&&currentTraining.blocks[0].matchSource.success==='Fermer l’axe'&&workspaceRecoveryEntries().training.payload.id===destinationOriginal.id")
 assert page.evaluate('trainingLibrary.length')==0
 page.reload();page.wait_for_function("typeof openReportTraining==='function'")
 assert page.evaluate("currentTraining.blocks.length===1&&!currentTraining.attendance&&workspaceRecoveryEntries().training.payload.title==='Séance passée'")
 page.set_viewport_size({'width':390,'height':844});d=open_new();assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2');close(d)
 assert not errors,errors
 b.close();print('PASS destination: future date, cancel, stale report/session, checkpoint quota, independent identity, no copied attendance, retained old draft, reload and mobile.')
