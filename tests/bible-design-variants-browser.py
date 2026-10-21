"""Actual scenario selection, reload, separate personal drawings, source geometry and mobile."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof openBibleDiagramEditor==='function'")
 page.evaluate("()=>{Object.assign(currentTraining,{players:11,keepers:0,space:'full'});openBibleSheet(trainingExercises.find(e=>e.id==='possession-quadrants'))}")
 sheet=page.locator('#bible-sheet-dialog');select=sheet.get_by_label('Variante de l’exercice',exact=True)
 assert select.locator('option').count()==3
 assert not sheet.locator('.bible-depth-panel').get_attribute('open')
 assert sheet.locator('[data-feature=quadrant-lines]').count()>=1
 assert sheet.locator('[data-feature=protected-neutral]').count()>=1
 signatures=[]
 for index in range(3):
  select.select_option(str(index));signatures.append(page.evaluate("JSON.stringify(document.querySelector('#bible-sheet-dialog .bible-diagram').bibleAnimation.plan.steps.map(s=>s.motions))"))
  assert sheet.locator('.bible-design-rule').inner_text()
 assert len(set(signatures))==3
 variant=page.evaluate("document.querySelector('#bible-sheet-dialog .bible-detail').bibleVariant()")
 assert variant['designChoices'][0]==2
 assert page.evaluate('v=>bibleVariantValid(v)',variant)
 page.evaluate("document.querySelector('#bible-sheet-dialog').close()")
 page.evaluate("openBibleSheet(trainingExercises.find(e=>e.id==='possession-quadrants'))")
 assert sheet.get_by_label('Variante de l’exercice',exact=True).input_value()=='2'
 # Drawings are not silently reused on another problem, but survive returning to their variant.
 sheet.locator('.bible-personalise').click();editor=page.locator('#bible-diagram-editor');editor.get_by_label('Nom de ma variante',exact=True).fill('Ma sortie par le soutien');editor.get_by_role('button',name='Valider ma variante',exact=True).click()
 assert sheet.locator('.bible-personal-preview').count()==1
 select=sheet.get_by_label('Variante de l’exercice',exact=True);select.select_option('0');assert sheet.locator('.bible-personal-preview').count()==0
 select.select_option('2');assert sheet.locator('.bible-personal-preview').count()==1
 # Sequential choices, not a destructive global setting.
 sheet.locator('.bible-sequence-tabs button').nth(1).click();assert select.input_value()=='0'
 sheet.locator('.bible-sequence-tabs button').nth(0).click();assert select.input_value()=='2'
 # All source models, diagram-to-player matching, bounded counts.
 results=page.evaluate('''()=>{
 const failures=[];let playable=0;
 for(const exercise of trainingExercises){const n=exercise.id==='rondo-expand'?13:exercise.id==='possession-quadrants'?11:bibleExerciseKnowledge(exercise).format.ideal;
 const session={...currentTraining,players:n,keepers:['duel-renforts','keeper-duel','keeper-distribute'].includes(exercise.id)?1:0,space:'full'};
 const plan=biblePlan(exercise,session,{organisation:'auto'});for(let designIndex=0;designIndex<3;designIndex++)for(const group of plan.groups){
 const svg=bibleDiagramSVG(exercise,group,{designIndex}),scene=svg.bibleScene;if(!scene)continue;
 const animation=bibleAnimationPlan(exercise,group,{designIndex,scene});if(!animation.available)continue;playable++;
 if(animation.initial.players.length!==group.players)failures.push(exercise.id+' count');
 const board=bibleEditableBoard(exercise,group,{designIndex});if(!board||!validExerciseBoard(board))failures.push(exercise.id+' board');
 for(const actor of scene.tokens){const p=animation.initial.players.find(p=>p.number===actor.number);if(!p||Math.hypot(actor.x-p.x,actor.y-p.y)>.001)failures.push(exercise.id+' layout');}
 }}return {failures,playable};}''')
 assert page.evaluate('''()=>{for(const id of ['rondo-expand','possession-quadrants'])for(const players of [2,3,7,10,11,12,13,14,26,40,80])for(const keepers of [0,Math.min(2,players-2)]){const e=trainingExercises.find(e=>e.id===id),s={...currentTraining,players,keepers,space:'full'},plan=biblePlan(e,s,{organisation:'single'});for(const g of plan.groups){const svg=bibleDiagramSVG(e,g,{designIndex:2});if(!svg)throw Error(id+' no invalid feedback');if(players!==(id==='rondo-expand'?13:11)&&g.pedagogyFits)throw Error('Canonical shape falsely compatible');}}return true;}''')
 assert not results['failures'],results
 assert results['playable']>=170,results
 page.set_viewport_size({'width':390,'height':844});assert select.is_visible();assert sheet.locator('.bible-design-controls').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2')
 # Actual persisted session JSON, not just a preview retained in memory.
 assert page.evaluate("()=>{const v=biblePreviewState(trainingExercises.find(e=>e.id==='possession-quadrants')).variant;currentTraining.blocks.push({id:crypto.randomUUID(),exerciseId:'possession-quadrants',duration:12,notes:'',bibleVariant:structuredClone(v)});return saveTrainingDraft()}")
 page.reload();page.wait_for_function("typeof openBibleDiagramEditor==='function'")
 assert page.evaluate("()=>{const block=currentTraining.blocks.at(-1);return trainingValid(currentTraining)&&block.bibleVariant.designChoices[0]===2&&block.bibleVariant.diagramEdits[0].title==='Ma sortie par le soutien'}")
 assert page.evaluate("()=>{const block=currentTraining.blocks.at(-1),e=trainingExercises.find(e=>e.id===block.exerciseId),root=bibleExerciseDetail(e,currentTraining,{variant:block.bibleVariant,printing:true});const ok=root.querySelector('.bible-design-label select').value==='2'&&root.querySelectorAll('.training-diagram-print canvas').length>0&&root.textContent.includes('Revenir pour progresser');root.bibleDispose();return ok}")
 assert not errors,errors
 print('PASS browser: 3 distinct choices, per-sequence persistence, separate personal diagrams, source sectors, mobile;',results)
 b.close()
