"""The existing library exercise uses the continuous player, not a second demo link."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local')
 page.evaluate("()=>{Object.assign(currentTraining,{players:14,keepers:1,space:'full',category:'U17',level:'developing'});openBibleSheet(trainingExercises.find(e=>e.id==='wall-pass'));}")
 sheet=page.locator('#bible-sheet-dialog');diagram=sheet.locator('.reference-library-diagram');assert diagram.count()==1
 iframe=diagram.locator('iframe');iframe.wait_for(state='visible');frame=iframe.element_handle().content_frame();frame.wait_for_function('window.referencePreview!==undefined')
 assert frame.evaluate('referencePreview.plan.players')<=8
 assert frame.locator('[data-equipment="pole"]').count()==6
 assert frame.locator('[data-equipment="ladder"]').count()==1
 assert frame.locator('[data-equipment="hurdle"]').count()==3
 assert frame.locator('[data-ball="active"]').count()==1
 assert not diagram.locator('.bible-animation-host').count()
 iframe.scroll_into_view_if_needed();page.wait_for_timeout(300);frame.locator('#reference-play').click();frame.wait_for_timeout(400);assert frame.evaluate('referencePreview.time')>.1
 diagram.locator('select').first.select_option('1');iframe=diagram.locator('iframe');iframe.wait_for(state='visible');frame=iframe.element_handle().content_frame();frame.wait_for_function('window.referencePreview!==undefined')
 assert frame.evaluate('referencePreview.time')==0
 assert diagram.locator('.training-diagram-print [data-player]').count()==14
 # Free editor copy must contain the actual six poles and agility material.
 result=page.evaluate("()=>{const e=trainingExercises.find(e=>e.id==='wall-pass'),g=biblePlan(e,currentTraining,{organisation:'auto'}).groups[0],board=bibleEditableBoard(e,g);return {valid:validExerciseBoard(board),types:board.frames[0].objects.map(o=>o.type),material:g.material};}")
 assert result['valid'];assert result['types'].count('pole')==6 and result['types'].count('hurdle')==3 and result['types'].count('ladder')==1
 assert result['material']['activeBalls']==1 and result['material']['balls']==1 and result['material']['discs']==2
 page.get_by_role('button',name='Fermer',exact=True).click()
 # Existing oversized variants remain intact, with an explicit adaptation message.
 page.evaluate("()=>{Object.assign(currentTraining,{players:14,keepers:1});window.largeReference=bibleDiagram(trainingExercises.find(e=>e.id==='wall-pass'),currentTraining,{plan:biblePlan(trainingExercises.find(e=>e.id==='wall-pass'),currentTraining,{organisation:'single'})});document.body.append(largeReference);}")
 assert page.locator('.reference-library-diagram').last.locator('iframe').count()==0
 assert '3 à 8 joueurs' in page.locator('.reference-library-diagram').last.inner_text()
 page.evaluate('largeReference.bibleDispose();largeReference.remove()')
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate("()=>{Object.assign(currentTraining,{players:6,keepers:0});openBibleSheet(trainingExercises.find(e=>e.id==='wall-pass'));}")
 iframe=page.locator('#bible-sheet-dialog iframe');iframe.wait_for(state='visible');assert sheet.evaluate('(e)=>e.scrollWidth<=e.clientWidth+2')
 iframe.scroll_into_view_if_needed();page.screenshot(path='/tmp/reference-library-mobile.png')
 page.get_by_role('button',name='Fermer',exact=True).click()
 assert not errors,errors
 print('PASS: replaced library animation, adapted workshops, one ball and real material, print/player counts, editable copy, legacy variant warning, lifecycle and mobile.')
 b.close()
