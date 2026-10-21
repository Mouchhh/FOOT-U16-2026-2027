"""Personal variants are sequence/group scoped and persist in real session documents."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof openBibleDiagramEditor==='function'")
 page.evaluate("()=>{Object.assign(currentTraining,{players:8,keepers:1,space:'full'});openBibleSheet(trainingExercises.find(e=>e.id==='freegame'))}")
 sheet=page.locator('#bible-sheet-dialog');sheet.locator('.bible-personalise').click();editor=page.locator('#bible-diagram-editor');assert editor.is_visible()
 editor.get_by_label('Nom de ma variante',exact=True).fill('Mon jeu de relance')
 select=editor.get_by_label('Joueur ou ballon sélectionné');player_id=select.locator('option').nth(1).get_attribute('value');select.select_option(player_id)
 canvas=editor.locator('canvas.bible-personal-editable');canvas.scroll_into_view_if_needed()
 point=page.evaluate('''()=>{const e=trainingExercises.find(e=>e.id==='freegame'),g=document.querySelector('#bible-sheet-dialog .bible-detail').bibleContext.plan.groups[0],board=bibleEditableBoard(e,g),p=board.frames[0].objects.find(o=>['blue','red','keeper'].includes(o.type)),canvas=document.querySelector('#bible-diagram-editor canvas'),r=canvas.getBoundingClientRect(),v=canvas.bibleView;return {x:r.left+(p.x*12-v.x)/v.w*r.width,y:r.top+(p.y*7.5-v.y)/v.h*r.height,original:p.x}}''')
 page.mouse.move(point['x'],point['y']);page.mouse.down();page.mouse.move(point['x']+24,point['y'],steps=5);page.mouse.up();canvas.focus();page.keyboard.press('ArrowRight');editor.get_by_role('button',name='Ballon au joueur',exact=True).click()
 editor.get_by_role('button',name='+ Étape',exact=True).click();select.select_option(player_id);canvas.focus();page.keyboard.press('ArrowRight');page.keyboard.press('ArrowDown');editor.get_by_label('Nom de cette étape',exact=True).fill('Conduire pour fixer')
 editor.get_by_role('button',name='▶ Tester mon animation',exact=True).click();editor.locator('.bible-personal-preview').get_by_role('button',name='▶ Lire',exact=True).click();page.wait_for_timeout(250)
 editor.get_by_role('button',name='Valider ma variante',exact=True).click();assert editor.is_hidden();assert sheet.locator('.bible-personal-preview').count()==1
 value=page.evaluate("biblePreviewState(trainingExercises.find(e=>e.id==='freegame')).variant");assert value['title']=='Mon jeu de relance';assert len(value['diagramEdits'])==1;assert len(value['diagramEdits'][0]['board']['frames'])==2
 moved=next(o for o in value['diagramEdits'][0]['board']['frames'][0]['objects'] if o['id']==player_id);assert moved['x']>point['original']+.8
 assert page.evaluate("bibleVariantValid(biblePreviewState(trainingExercises.find(e=>e.id==='freegame')).variant)")
 assert page.evaluate('''value=>{const b=structuredClone(value.diagramEdits[0].board);for(const f of b.frames)f.owner=null;const a=b.frames[0].objects.find(o=>o.type==='ball'),z=b.frames[1].objects.find(o=>o.type==='ball'),now=biblePersonalObjects(b,.25).find(o=>o.id===a.id);return Math.abs(now.x-(a.x+(z.x-a.x)*.25))<.0001&&Math.abs(now.y-(a.y+(z.y-a.y)*.25))<.0001}''',value)
 assert page.evaluate('''value=>{const b=value.diagramEdits[0].board,objects=biblePersonalObjects(b,.25),owner=objects.find(o=>o.id===b.frames[0].owner),ball=objects.find(o=>o.type==='ball');return owner&&Math.abs(ball.x-owner.x-2.1)<.001&&Math.abs(ball.y-owner.y-1.1)<.001}''',value)

 # Cancel is non-destructive; source catalogue and other sequences are untouched.
 before=page.evaluate("JSON.stringify(biblePreviewState(trainingExercises.find(e=>e.id==='freegame')).variant)")
 sheet.locator('.bible-personalise').click();editor.get_by_label('Point de départ de ma variante').select_option('mirror');editor.get_by_role('button',name='Annuler',exact=True).click()
 assert page.evaluate("JSON.stringify(biblePreviewState(trainingExercises.find(e=>e.id==='freegame')).variant)")==before
 sheet.locator('.bible-personalise').click();editor.get_by_label('Point de départ de ma variante').select_option('mirror');editor.get_by_role('button',name='Valider ma variante',exact=True).click()
 mirrored=page.evaluate("biblePreviewState(trainingExercises.find(e=>e.id==='freegame')).variant.diagramEdits[0].board")
 for original in value['diagramEdits'][0]['board']['frames'][0]['objects']:
  if original['type'] in ['goal','mini']:
   actual=next(o for o in mirrored['frames'][0]['objects'] if o['id']==original['id']);assert actual['rotation']==(540-original['rotation'])%360
 assert page.evaluate('''()=>{const good=biblePreviewState(trainingExercises.find(e=>e.id==='freegame')).variant.diagramEdits[0];return [e=>e.steps=[],e=>e.signature='',e=>e.board.frames[0].owner='absent',e=>e.board.frames[0].objects[0].x=Infinity].every(change=>{const copy=structuredClone(good);change(copy);return !bibleDiagramEditValid(copy)})}''')
 sheet.locator('.bible-sequence-tabs button').nth(1).click();assert sheet.locator('.bible-personal-preview').count()==0
 sheet.locator('.bible-sequence-tabs button').first.click();assert sheet.locator('.bible-personal-preview').count()==1
 page.evaluate("addBibleExercise(trainingExercises.find(e=>e.id==='freegame'))")
 assert page.evaluate('validTraining(currentTraining)') if page.evaluate("typeof validTraining==='function'") else page.evaluate('trainingValid(currentTraining)')
 # Print and serialization keep the custom first frame.
 assert page.evaluate("(()=>{const d=JSON.parse(JSON.stringify(currentTraining));return d.blocks.at(-1).bibleVariant.diagramEdits[0].title==='Mon jeu de relance'})()")
 page.get_by_role('button',name='Fermer',exact=True).click()
 page.evaluate("openBibleSheet(trainingExercises.find(e=>e.id==='wall-pass'))")
 sheet.locator('.bible-personalise').click();editor.get_by_label('Point de départ de ma variante').select_option('example');assert editor.locator('.bible-personal-steps button').count()>=6;editor.get_by_role('button',name='Valider ma variante',exact=True).click();assert sheet.locator('.bible-personal-preview').count()==1
 page.get_by_role('button',name='Fermer',exact=True).click()
 # A custom diagram in the second workshop must appear in print even when the first is selected.
 assert page.evaluate('''()=>{const e=trainingExercises.find(e=>e.id==='freegame'),s={...currentTraining,players:14,keepers:2},plan=biblePlan(e,s,{organisation:'stations',groups:2}),g=plan.groups[1],edit={sequence:0,group:g.index,signature:bibleDiagramEditKey(e,g),title:'Atelier deux',board:bibleEditableBoard(e,g),steps:['Départ']},root=bibleDiagram(e,s,{plan,diagramEdits:[edit],animation:false});const ok=root.querySelectorAll('.training-diagram-print canvas').length===1&&!root.querySelector('.training-diagram-screen canvas');root.bibleDispose();return ok}''')
 # Profile mismatch preserves the old edit without applying it to the wrong roles.
 assert page.evaluate("()=>{const e=trainingExercises.find(e=>e.id==='freegame'),v=biblePreviewState(e).variant,g=biblePlan(e,{...currentTraining,players:10},{organisation:'single'}).groups[0];return !bibleFindDiagramEdit(e,g,{diagramEdits:v.diagramEdits})}")
 page.set_viewport_size({'width':390,'height':844});page.evaluate("openBibleSheet(trainingExercises.find(e=>e.id==='freegame'))");sheet.locator('.bible-personalise').click();assert editor.evaluate('e=>e.scrollWidth<=e.clientWidth+2');editor.screenshot(path='/tmp/personal-diagram-mobile.png');editor.get_by_role('button',name='Annuler',exact=True).click()
 editor.get_by_role('button',name='Annuler',exact=True).click() if editor.is_visible() else None
 page.evaluate("coachStorageSet('vestiaire-training-library',JSON.stringify([currentTraining]))")
 page.reload();page.wait_for_function("typeof bibleDiagramEditValid==='function'")
 assert page.evaluate('currentTraining.blocks.some(b=>b.bibleVariant?.diagramEdits?.length)'), 'personal diagram lost on reload'
 assert page.evaluate('trainingValid(currentTraining)'), 'reloaded session rejected'
 assert page.evaluate('trainingLibrary.some(s=>s.blocks.some(b=>b.bibleVariant?.diagramEdits?.length))'), 'saved library lost personal variant'
 # A failed draft save must leave the editor open with a truthful status.
 page.evaluate('''()=>{const block=currentTraining.blocks.find(b=>b.bibleVariant?.diagramEdits?.length);window.testBlockDialog=document.createElement('dialog');testBlockDialog.id='test-block-dialog';testBlockDialog.append(trainingExerciseDetail(trainingExerciseForBlock(block),currentTraining,{blockId:block.id,variant:block.bibleVariant}));document.body.append(testBlockDialog);testBlockDialog.showModal();window.realDraftSave=saveTrainingDraft;saveTrainingDraft=()=>false;}''')
 parent=page.locator('#test-block-dialog');parent.locator('.bible-personalise').click();editor.get_by_role('button',name='Conserver dans le brouillon',exact=True).click();assert editor.is_visible();assert 'échoué' in editor.inner_text()
 page.evaluate('saveTrainingDraft=realDraftSave');editor.get_by_role('button',name='Conserver dans le brouillon',exact=True).click();assert editor.is_hidden();assert parent.locator('.bible-personal-preview').count()==1
 page.evaluate('bibleDisposeDiagrams(testBlockDialog);testBlockDialog.close();testBlockDialog.remove()')
 assert not errors,errors
 print('PASS: drag keyboard, attached ball, animation steps, named variant, cancel, sequence isolation, session serialization, reference combination and mobile.')
 b.close()
