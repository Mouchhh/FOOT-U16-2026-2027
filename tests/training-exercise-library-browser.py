"""Create a real drawing, save it, reuse it independently, and protect unvalidated changes."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof trainingPersonalExercises==='function'")
 page.evaluate("document.querySelector('#view-training').click();trainingWizard.go(3);currentTraining.title='Séance source';syncTrainingForm()")
 page.locator('#training-custom-add').click();page.locator('#custom-training-title').fill('Circuit côté droit');page.locator('#custom-training-duration').fill('12')
 page.locator('#studio-tab-board').click();page.locator('#exercise-five').click();page.locator('#studio-tab-animation').click();page.locator('#exercise-add-frame').click()
 first=page.evaluate('exerciseDraft.frames[0].objects[0].id');page.locator('#exercise-object').select_option(first);page.locator('#exercise-board-canvas').focus();page.keyboard.press('ArrowRight');page.locator('[data-exercise-angle="120"]').click()
 page.locator('#custom-training-form button[type=submit]').click();page.locator('#training-save').click()
 source=page.evaluate('structuredClone(trainingLibrary.find(s=>s.id===currentTraining.id))');assert source['blocks'][0]['custom']['board']['frames'][1]['objects'][0]['x']!=source['blocks'][0]['custom']['board']['frames'][0]['objects'][0]['x']
 page.evaluate("()=>{const next=newTraining();next.title='Autre séance';workspaceReplaceDraft('training',next);trainingWizard.go(3)}")
 page.locator('#training-personal-exercises').click();d=page.locator('#training-personal-library');d.get_by_label('Chercher un exercice personnel',exact=True).fill('cote droit')
 assert d.get_by_role('button',name='Ajouter une copie',exact=True).count()==1
 d.get_by_role('button',name='Ajouter une copie',exact=True).click()
 copy=page.evaluate('structuredClone(currentTraining.blocks[0])');assert copy['id']!=source['blocks'][0]['id'] and copy['custom']==source['blocks'][0]['custom']
 page.locator('.training-block').first.get_by_role('button',name='Modifier mon exercice',exact=True).click();page.locator('#custom-training-title').fill('Ma variante du circuit')
 page.locator('#studio-tab-board').click();page.locator('#exercise-object').select_option(first);page.locator('#exercise-board-canvas').focus();page.keyboard.press('ArrowDown')
 # Refusing discard preserves the unsaved drawing; accepting leaves the saved block untouched.
 page.once('dialog',lambda dialog:dialog.dismiss());page.locator('#custom-training-close').click();assert page.locator('#custom-training-dialog').is_visible()
 page.once('dialog',lambda dialog:dialog.accept());page.locator('#custom-training-close').click();assert page.locator('#custom-training-dialog').is_hidden()
 assert page.evaluate('currentTraining.blocks[0].custom.title')=='Circuit côté droit'
 page.locator('.training-block').first.get_by_role('button',name='Modifier mon exercice',exact=True).click();page.locator('#custom-training-title').fill('Ma variante du circuit');page.locator('#custom-training-form button[type=submit]').click();page.locator('#training-save').click()
 assert page.evaluate("trainingLibrary.find(s=>s.title==='Séance source').blocks[0].custom.title")=='Circuit côté droit'
 page.reload();page.wait_for_function("typeof trainingPersonalExercises==='function'");assert page.evaluate('currentTraining.blocks[0].custom.title')=='Ma variante du circuit'
 assert page.evaluate('trainingPersonalExercises().length')==2
 # Failed copy leaves both the original and the current session unchanged.
 page.evaluate("document.querySelector('#view-training').click();trainingWizard.go(3)");page.locator('#training-personal-exercises').click()
 before=page.evaluate('JSON.stringify(currentTraining.blocks)');page.evaluate("()=>{window.exerciseRealWriter=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};}")
 d.get_by_role('button',name='Ajouter une copie',exact=True).first.click();assert page.evaluate('JSON.stringify(currentTraining.blocks)')==before
 assert 'non ajoutée' in d.inner_text();page.evaluate('coachStorageSet=exerciseRealWriter');d.get_by_role('button',name='Fermer',exact=True).click()
 # Shortest orientation interpolation must not rotate nearly a full turn through zero.
 assert page.evaluate("()=>{const board=structuredClone(currentTraining.blocks[0].custom.board);board.frames[0].objects[0].rotation=350;board.frames[1].objects[0].rotation=10;const r=exerciseInterpolated(board,.5)[0].rotation;return r<1||r>359}")
 page.set_viewport_size({'width':390,'height':844});page.locator('#training-personal-exercises').click();assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
 d.get_by_role('button',name='Fermer',exact=True).click()
 page.locator('.training-block').first.get_by_role('button',name='Modifier mon exercice',exact=True).click()
 page.evaluate('clubNetworkClear()');assert page.locator('#custom-training-dialog').is_hidden()
 assert not errors,errors
 b.close();print('PASS free creation: real drawing/rotation/frames, save and reuse across sessions, independent copy, discard guard, named variant, reload, failed copy rollback, short rotation and mobile.')
