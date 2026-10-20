"""A coach reviews match priorities before appending adapted exercises to a draft."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local')
 page.evaluate('''()=>{
  currentTraining=newTraining();Object.assign(currentTraining,{team:'U17 A',category:'U17',players:10,keepers:1,space:'full',notes:'Objectif déjà saisi',blocks:[{id:'existing',exerciseId:'warm',duration:6,notes:'À conserver'}]});syncTrainingForm();saveTrainingDraft();
  currentReport=newReport();Object.assign(currentReport.info,{team:'U17 A',opponent:'Equipe visiteuse',date:'2026-10-18'});currentReport.analysis.improveAttack='Sortir par le pivot sans forcer la passe';currentReport.analysis.improveDefence='Protéger derrière le premier défenseur';reportTab='plan';setReportView(true);renderReportContent();
 }''')
 page.locator('#report-to-training').click()
 page.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
 assert page.locator('.report-training-proposal').count()==2
 assert page.locator('.report-training-proposal .training-diagram').count()==2
 page.screenshot(path='/tmp/report-training-desktop.png')
 assert 'Ajout : 24 min' in page.locator('#report-training-dialog').inner_text()
 before=page.evaluate('({id:currentTraining.id,date:currentTraining.date,notes:currentTraining.notes,blocks:currentTraining.blocks.length})')
 page.get_by_role('button',name='Ajouter à ma préparation',exact=True).click()
 assert not page.locator('#report-training-dialog').count()
 after=page.evaluate('({id:currentTraining.id,date:currentTraining.date,notes:currentTraining.notes,blocks:currentTraining.blocks,valid:trainingValid(currentTraining),library:trainingLibrary.length})')
 assert before['id']==after['id'] and before['date']==after['date']
 assert len(after['blocks'])==3 and after['blocks'][0]['id']=='existing'
 assert after['notes'].startswith('Objectif déjà saisi') and 'Equipe visiteuse' in after['notes']
 assert after['valid'] and after['library']==0
 assert page.evaluate('trainingWizard.step()')==3
 page.reload()
 assert page.evaluate('currentTraining.blocks.length')==3
 assert page.evaluate('currentTraining.notes.includes("Equipe visiteuse")')
 # An open preview cannot append to a document selected later.
 page.evaluate('''()=>{currentReport.analysis.improveAttack='Préparer la prochaine passe';currentReport.analysis.improveDefence='Rester en couverture';reportTab='plan';setReportView(true);renderReportContent();}''')
 page.locator('#report-to-training').click();page.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
 page.evaluate("window.originalTraining=currentTraining.id;currentTraining.id='another-document'")
 page.get_by_role('button',name='Ajouter à ma préparation',exact=True).click()
 assert page.locator('#report-training-dialog').is_visible()
 assert 'actif a changé' in page.locator('#report-training-dialog').inner_text()
 assert page.evaluate('currentTraining.blocks.length')==3
 page.evaluate('currentTraining.id=originalTraining')
 page.get_by_role('button',name='Fermer',exact=True).click()
 # Every suggested workshop remains within the exercise's participant guidance.
 checks=page.evaluate('''()=>{let count=0;for(const n of [6,14,40])for(const keepers of [0,1,2]){const session={...currentTraining,players:n,keepers,space:'full'};for(const {options} of reportTrainingSuggestions([{theme:'Relance',text:'Relancer'},{theme:'Défense',text:'Couvrir'}],session))for(const o of options){if(!o.plan.groups.every(g=>g.players<=g.format.max))throw Error('Overcrowded recommendation');count++;}}return count;}''')
 assert checks>0
 # Empty report offers a blank, explicit objective; no invented diagnosis.
 page.evaluate('''()=>{currentReport=newReport();reportTab='plan';renderReportContent();}''')
 page.set_viewport_size({'width':390,'height':844})
 page.locator('#report-to-training').click()
 page.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
 assert 'renseignez leur objectif' in page.locator('#report-training-dialog').inner_text()
 assert page.locator('#report-training-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2')
 page.screenshot(path='/tmp/report-training-mobile.png')
 page.get_by_role('button',name='Fermer',exact=True).click()
 # A quota failure must not leave an apparently added exercise in memory.
 page.evaluate("currentReport.analysis.improveAttack='Trouver un soutien libre';renderReportContent()")
 page.locator('#report-to-training').click();page.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
 original=page.evaluate('JSON.stringify(currentTraining)')
 page.evaluate("()=>{window.realSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(String(k).includes('vestiaire-training-draft'))throw new DOMException('Quota test','QuotaExceededError');return realSetItem.call(this,k,v)};}")
 page.get_by_role('button',name='Ajouter à ma préparation',exact=True).click()
 assert page.locator('#report-training-dialog').is_visible()
 assert 'Aucun exercice ajouté' in page.locator('#report-training-dialog').inner_text()
 assert page.evaluate('JSON.stringify(currentTraining)')==original
 page.evaluate('()=>{Storage.prototype.setItem=realSetItem;}')
 page.get_by_role('button',name='Fermer',exact=True).click()
 page.evaluate('''()=>{const profiles=[...coachProfiles,{id:'second-coach-test',name:'Autre éducateur'}];localStorage.setItem('vestiaire-coach-profiles',JSON.stringify(profiles));localStorage.setItem('vestiaire-active-coach','second-coach-test');}''')
 page.reload()
 assert page.evaluate('activeCoach.id')=='second-coach-test'
 assert page.evaluate('currentTraining.blocks.length')==0
 assert page.evaluate('currentTraining.notes')==''
 assert not errors,errors
 print('PASS: report priorities, compatible previews, explicit append, existing blocks/date/notes retained, draft reload, coach isolation, empty report, storage failure rollback and mobile.')
 b.close()
