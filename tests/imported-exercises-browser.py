from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof clubImportedExercises!=='undefined'")
 page.locator('#view-training').click();page.locator('#task-training-bible').click();assert page.locator('[data-imported-exercise]').count()==7
 results=page.evaluate('''()=>{const out=[];for(const e of clubImportedExercises.exercises)for(const players of [6,11,13,16,18,24,40])for(const keepers of [0,1,2]){const c={players,keepers,category:'U17',level:'dev',space:[68,105]},p=clubImportedExercises.adapt(e,c),m=clubImportedExercises.buildExerciseModel(p),b=importedExerciseBoard(m);if(!validExerciseBoard(b))throw Error('Invalid board '+e.id);if(p.groups.reduce((n,g)=>n+g.n,0)!==players)throw Error('Lost player');out.push(e.id);}return out.length}''');print('adaptations',results)
 page.evaluate("currentTraining.players=18;currentTraining.keepers=2;currentTraining.category='U17';syncTrainingForm()")
 for i in range(7):
  page.locator('[data-imported-exercise] > button.primary').nth(i).click();d=page.locator('#imported-exercise-dialog');d.get_by_role('spinbutton',name='Nombre de groupes',exact=True).fill('2');d.get_by_role('spinbutton',name='Nombre de groupes',exact=True).press('Tab');d.locator('input[type=checkbox]').check();d.get_by_role('button',name='Ajouter à ma séance',exact=True).click();assert not d.count(),page.locator('#toast').inner_text()
 assert page.evaluate('currentTraining.blocks.length')==7
 assert page.evaluate('trainingValid(currentTraining)')
 assert page.evaluate('currentTraining.blocks.every(b=>b.custom.adaptation.groups.reduce((s,g)=>s+g.players,0)===18)')
 assert page.evaluate('currentTraining.blocks.every(b=>b.custom.board.frames.length>1)')
 page.reload();page.wait_for_function('typeof clubImportedExercises!=="undefined"');assert page.evaluate('currentTraining.blocks.length')==7
 page.locator('#view-training').click();page.locator('#task-training-bible').click();page.locator('#bible-bmf-category').select_option('ball');assert page.locator('[data-imported-exercise]').count()==2
 page.locator('#training-filter').select_option('ball-build');assert page.locator('[data-imported-exercise]').count()==1
 page.locator('#bible-bmf-category').select_option('ludic');assert page.locator('[data-imported-exercise]').count()==1
 page.set_viewport_size({'width':390,'height':844});page.locator('[data-imported-exercise] > button.primary').click();d=page.locator('#imported-exercise-dialog');assert d.is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/imported-exercises-mobile.png',full_page=True)
 assert not errors,errors
 d.get_by_role('button',name='Fermer',exact=True).click()
 page.evaluate("()=>{window.originalImportedBlock=structuredClone(currentTraining.blocks[0]);window.originalImportedSession=structuredClone(currentTraining);currentTraining.players=14;currentTraining.keepers=1;syncTrainingForm();trainingReuseExercise(originalImportedBlock,originalImportedSession,'Autre éducateur')}")
 d=page.locator('#imported-exercise-dialog');assert '14 joueurs' in d.inner_text()
 d.get_by_role('spinbutton',name='Nombre de groupes',exact=True).fill('2');d.get_by_role('spinbutton',name='Nombre de groupes',exact=True).press('Tab')
 d.get_by_role('spinbutton',name='Groupe 1 · Joueurs',exact=True).fill('6');d.get_by_role('spinbutton',name='Groupe 1 · Joueurs',exact=True).press('Tab');assert 'Corrigez la répartition' in d.inner_text()
 d.get_by_role('spinbutton',name='Groupe 2 · Joueurs',exact=True).fill('8');d.get_by_role('spinbutton',name='Groupe 2 · Joueurs',exact=True).press('Tab')
 assert 'Groupe 1 : 6 joueurs' in d.inner_text();assert 'Groupe 2 : 8 joueurs' in d.inner_text()
 d.locator('input[type=checkbox]').check()
 page.evaluate("()=>{window.originalCoachSet=coachStorageSet;coachStorageSet=()=>{throw new Error('quota')}}")
 d.get_by_role('button',name='Ajouter à ma séance',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==7;assert d.is_visible()
 page.evaluate('()=>{coachStorageSet=originalCoachSet}');d.get_by_role('button',name='Ajouter à ma séance',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==8
 assert page.evaluate('currentTraining.blocks.at(-1).custom.adaptation.players')==14
 assert page.evaluate('JSON.stringify(originalImportedBlock)===JSON.stringify(originalImportedSession.blocks[0])')
 assert not errors,errors
 print('Seven imports, filters, exact/unequal groups, animation snapshots, reload, reuse, quota and mobile passed');b.close()
