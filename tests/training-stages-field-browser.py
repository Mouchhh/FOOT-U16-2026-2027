"""Two distinct workshops share one clock, add resources and remain readable on phones."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof openTrainingField==='function'")
 page.locator('#view-training').click();page.evaluate("Object.assign(currentTraining,{players:18,keepers:2,space:'full',duration:30,themes:['Conservation','Défense'],notes:'Garder deux solutions et couvrir le proche.'});currentTraining.blocks=['rondo','cover'].map((id,i)=>({id:'stage-'+i,exerciseId:id,duration:12,setupMinutes:2-i,notes:'Consigne exacte du coach : rester disponible.\\nNe pas forcer.',bibleVariant:bibleInitialVariant(trainingExercises.find(e=>e.id===id),currentTraining,null,true)}));syncTrainingForm();saveTrainingDraft();trainingWizard.go(3);renderTrainingBlocks();")
 assert page.evaluate('trainingTotal()')==27
 page.get_by_role('button',name='En parallèle avec le précédent',exact=True).click()
 dialog=page.locator('#training-parallel-dialog');assert dialog.is_visible()
 assert dialog.get_by_label('Joueurs de l’atelier 1',exact=True).input_value()=='9'
 dialog.get_by_role('button',name='Appliquer ces ateliers',exact=True).click()
 assert page.evaluate('trainingTotal()')==14
 assert page.evaluate('trainingSessionStages(currentTraining).length')==1
 assert page.evaluate('trainingReview(currentTraining).material.balls')==6
 assert page.evaluate("trainingReview(currentTraining).issues.filter(i=>i.code==='off'||i.code==='parallel').length")==0
 assert page.locator('.training-parallel-label').count()==2
 assert page.locator('.training-block').first.locator('.training-diagram-screen .bible-player').count()==9
 assert page.evaluate("trainingBudget().setup+trainingBudget().parallel===14*60")
 # Shared clocks use maxima; sequential phases reuse equipment. Input stays unchanged.
 assert page.evaluate("(()=>{const s=structuredClone(currentTraining);s.blocks[0].duration=8;s.blocks.push({...structuredClone(s.blocks[0]),id:'after',parallelId:undefined,duration:5,setupMinutes:1});const stages=trainingSessionStages(s),r=trainingReview(s);return stages[0].minutes===14&&stages[1].start===14&&stages[1].end===20&&r.material.balls===6&&r.issues.some(i=>i.text.includes('Durées différentes'))})()")
 # Failed persistence must not change the session, even when separating a workshop.
 assert page.evaluate("(()=>{const before=JSON.stringify(currentTraining),write=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};let ok;try{ok=trainingCommitBlocks(blocks=>delete blocks[1].parallelId);}finally{coachStorageSet=write;}return !ok&&JSON.stringify(currentTraining)===before})()")
 # Detached/non-contiguous identifiers never merge distant blocks into one phase.
 assert page.evaluate("(()=>{const blocks=[{parallelId:'a'},{parallelId:'a'},{},{parallelId:'a'}];trainingNormalizeStages(blocks);return blocks[0].parallelId==='a'&&blocks[1].parallelId==='a'&&!blocks[3].parallelId})()")
 # Capacity and space are checked across exercises, not only inside each one.
 assert page.evaluate("(()=>{const s=structuredClone(currentTraining);s.blocks[0].bibleVariant.sequenceSettings.forEach(x=>x.players=12);return trainingReview(s).issues.some(i=>i.code==='parallel'&&i.text.includes('ensemble'))})()")
 assert page.evaluate("(()=>{const s=structuredClone(currentTraining);s.space='small';return trainingReview(s).issues.some(i=>i.code==='parallel'&&i.text.includes('emprises'))})()")
 page.locator('#training-save').click();page.reload();page.wait_for_function('currentTraining.blocks.length===2')
 assert page.evaluate('trainingTotal()')==14
 page.evaluate('trainingFitDuration()');assert page.evaluate('trainingTotal()')==30
 assert page.evaluate('currentTraining.blocks[0].duration===currentTraining.blocks[1].duration')
 # Read-only field view retains content and allows switching workshop/sequence.
 page.evaluate('applyTrainingForm()');before=page.evaluate("JSON.stringify({...currentTraining,updatedAt:''})")
 page.locator('#training-field-open').click();field=page.locator('#training-field-dialog')
 assert field.is_visible();assert 'Consigne exacte du coach' in field.inner_text()
 assert field.locator('.training-diagram-screen .bible-player').count()==9
 field.get_by_label('Exercice à consulter',exact=True).select_option('1')
 assert field.locator('h3').inner_text()=='Cadrer, couvrir et coulisser'
 field.get_by_label('Séquence de l’exercice',exact=True).select_option('1')
 for w,h in [(320,740),(390,844),(844,390),(1280,720)]:
  page.set_viewport_size({'width':w,'height':h});r=field.bounding_box();assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,(w,h,r)
  assert field.evaluate('e=>e.scrollWidth<=e.clientWidth'),(w,h)
  assert field.get_by_role('button',name='Fermer',exact=True).is_visible()
  if w in [390,1280]:page.screenshot(path=f'/tmp/training-field-{w}.png')
 field.get_by_role('button',name='Fermer',exact=True).click()
 assert page.evaluate("JSON.stringify({...currentTraining,updatedAt:''})")==before
 # Print reports the common interval; separating restores sequential accounting.
 assert page.evaluate("trainingDocument().textContent.includes('en parallèle')")
 page.set_viewport_size({'width':1366,'height':768});page.get_by_role('button',name='Remettre à la suite',exact=True).last.click()
 assert page.evaluate('trainingSessionStages(currentTraining).length')==2
 assert page.evaluate('!currentTraining.blocks.some(b=>b.parallelId)')
 # Choose unequal workshops explicitly, then extend to three distinct exercises.
 page.get_by_role('button',name='En parallèle avec le précédent',exact=True).click()
 allocation=page.locator('#training-parallel-dialog');allocation.get_by_label('Joueurs de l’atelier 1',exact=True).fill('11');allocation.get_by_label('Joueurs de l’atelier 2',exact=True).fill('7');allocation.get_by_role('button',name='Appliquer ces ateliers',exact=True).click()
 assert page.evaluate('trainingSessionStages(currentTraining)[0].blocks.map(b=>trainingStageBlockData(b,currentTraining).players).join(",")')=='11,7'
 page.evaluate("currentTraining.blocks.push({id:'stage-2',exerciseId:'passes',duration:10,notes:'Troisième atelier',bibleVariant:bibleInitialVariant(trainingExercises.find(e=>e.id==='passes'),currentTraining,null,true)});renderTrainingBlocks()")
 page.get_by_role('button',name='En parallèle avec le précédent',exact=True).click()
 allocation=page.locator('#training-parallel-dialog');assert allocation.locator('fieldset').count()==3
 allocation.get_by_role('button',name='Appliquer ces ateliers',exact=True).click()
 assert page.evaluate('trainingSessionStages(currentTraining).length===1&&trainingSessionStages(currentTraining)[0].blocks.length===3')
 assert page.evaluate('trainingStageReview(trainingSessionStages(currentTraining)[0],currentTraining).players')==18
 assert not errors,errors
 b.close()
print('PASS parallel clock, common material, participants/keepers/space checks, save/reload, fitted duration, field reading without data changes, print and separation.')
