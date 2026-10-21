"""Bible additions validate every sequence, preserve edits, and handle storage failure."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof addBibleExercise==='function'")
 page.evaluate("document.querySelector('#view-training').click();Object.assign(currentTraining,{category:'U17',players:6,keepers:0,space:'full',level:'discovery'});syncTrainingForm();trainingWizard.openCatalogue();renderBibleCatalogue()")
 assert 'U17' in page.locator('#bible-group-context').inner_text()
 assert 'Découverte' in page.locator('#bible-group-context').inner_text()
 result=page.evaluate('''()=>{
 const e=trainingExercises.find(e=>e.id==='passes'),v=structuredClone(biblePreviewState(e).variant),count=currentTraining.blocks.length;
 // A later sequence must be checked too; the first sequence alone fits.
 v.sequenceSettings=[{}, {players:80,keepers:0}];
 const bad=addBibleExercise(e,v);return !bad&&currentTraining.blocks.length===count;
 }''');assert result
 assert 'Séquence 2' in page.locator('#toast').inner_text()
 assert page.evaluate('''()=>{const e=trainingExercises.find(e=>e.id==='passes'),v=structuredClone(biblePreviewState(e).variant),before=JSON.stringify(currentTraining.blocks);v.restSeconds=300;return !addBibleExercise(e,v,1)&&before===JSON.stringify(currentTraining.blocks)}''')
 assert page.evaluate('''()=>{const e=trainingExercises.find(e=>e.id==='passes'),writer=coachStorageSet,before=JSON.stringify(currentTraining.blocks);coachStorageSet=()=>{throw Error('quota')};try{return !addBibleExercise(e)&&before===JSON.stringify(currentTraining.blocks)}finally{coachStorageSet=writer}}''')
 assert 'non ajouté' in page.locator('#toast').inner_text()
 page.evaluate("openBibleSheet(trainingExercises.find(e=>e.id==='passes'))")
 sheet=page.locator('#bible-sheet-dialog')
 add=sheet.get_by_role('button',name='+ Ajouter à la séance',exact=True)
 box=add.bounding_box();assert box and box['y']>=0 and box['y']+box['height']<768
 # Select a demonstration and add exactly that variant through the real button.
 sheet.get_by_label('Variante de l’exercice',exact=True).select_option('2')
 count=page.evaluate('currentTraining.blocks.length');add.click()
 assert page.evaluate('currentTraining.blocks.length')==count+1
 assert page.evaluate('currentTraining.blocks.at(-1).bibleVariant.designChoices[0]')==2
 page.reload();page.wait_for_function("typeof addBibleExercise==='function'")
 assert page.evaluate('currentTraining.blocks.at(-1).bibleVariant.designChoices[0]')==2
 page.evaluate("document.querySelector('#view-training').click();trainingWizard.openCatalogue();openBibleSheet(trainingExercises.find(e=>e.id==='passes'))")
 page.screenshot(path='/tmp/bible-final-desktop.png')
 page.set_viewport_size({'width':390,'height':844})
 assert sheet.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
 assert add.bounding_box()['height']>=38
 page.screenshot(path='/tmp/bible-final-mobile.png')
 assert not errors,errors
 b.close();print('PASS Bible: profile shown, all sequences validated, time checks, failed write without added block, direct actions, chosen demonstration saved/reloaded, mobile.')
