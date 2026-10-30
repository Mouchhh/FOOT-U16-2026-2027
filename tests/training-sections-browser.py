from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof trainingReuseExercise==='function' && window.trainingWizard")
 page.locator('#view-training').click();assert page.locator('#training-library-page').is_visible()
 page.locator('#task-training-bible').click();assert page.locator('.training-exercises-page').is_visible();assert page.locator('#training-catalogue-drawer').is_visible()
 assert page.locator('#training-custom-add').is_visible()
 page.screenshot(path='/tmp/training-sections-desktop.png',full_page=True)
 page.locator('#training-custom-add').click();assert page.locator('#custom-training-dialog').is_visible()
 page.locator('#custom-training-title').fill('Conserver avec appuis');page.locator('#custom-training-form button[type=submit]').click()
 page.evaluate("()=>{window.reuseSource=structuredClone(currentTraining);window.reuseBlock=structuredClone(currentTraining.blocks[0]);currentTraining.players=18;currentTraining.keepers=2;currentTraining.space='half';syncTrainingForm();trainingReuseExercise(reuseBlock,reuseSource,'Collègue · source')} ")
 d=page.locator('#exercise-reuse-dialog');assert d.is_visible()
 d.get_by_label('Nombre de groupes',exact=True).fill('2')
 assert 'Groupe 1 : 9 joueurs dont 1 gardien' in d.inner_text();assert 'Groupe 2 : 9 joueurs dont 1 gardien' in d.inner_text()
 d.get_by_role('button',name='Ajouter la copie adaptée').click();assert page.evaluate('currentTraining.blocks.length')==1
 d.get_by_label('Rôles et rotations adaptés',exact=True).fill('Deux ateliers : 4 contre 4 et un gardien. Changer les équipes à chaque série.')
 d.locator('input[type=checkbox]').check();d.get_by_role('button',name='Ajouter la copie adaptée').click()
 assert page.evaluate('currentTraining.blocks.length')==2
 assert page.evaluate('JSON.stringify(reuseBlock)===JSON.stringify(reuseSource.blocks[0])')
 assert page.evaluate("currentTraining.blocks[1].notes.includes('Groupe 2 : 9 joueurs')")
 page.evaluate("()=>{clubNetworkPreview={kind:'training',owner_id:'colleague',title:'Partage',payload:structuredClone(reuseSource)};document.querySelector('#club-network-preview-content').replaceChildren(document.createElement('p'));document.querySelector('#club-network-preview').showModal()}")
 page.locator('.exercise-reuse-shared button').first.click();assert d.is_visible();d.get_by_role('button',name='Annuler',exact=True).click();page.locator('#club-network-preview').evaluate('e=>e.close()')
 page.reload();page.wait_for_function("typeof trainingReuseExercise==='function' && window.trainingWizard");assert page.evaluate('currentTraining.blocks[1].custom.adaptation.groups.length')==2
 page.locator('#view-training').click()
 page.locator('#task-training-library').click();assert page.locator('#training-library-page').is_visible()
 page.locator('#training-create-session').click();assert page.locator('#training-step-0').is_visible()
 assert page.evaluate("trainingPersonalExercises().some(e=>e.block.custom.title==='Conserver avec appuis')")
 page.set_viewport_size({'width':390,'height':844});page.locator('#task-training-bible').click()
 assert page.locator('#training-custom-add').is_visible()
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
 page.screenshot(path='/tmp/training-sections-mobile.png',full_page=True)
 assert not errors,errors
 b.close();print('Session/exercise navigation, custom creation, independent adaptation and mobile passed')
