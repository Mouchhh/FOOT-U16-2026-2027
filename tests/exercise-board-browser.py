"""Exercise equipment, independent animation, saved document and exports."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local');page.locator('#view-training').click();page.locator('#training-manual').click();before=page.evaluate('JSON.stringify(state)');page.locator('#training-custom-add').click();page.locator('#custom-training-title').fill('5 contre 5 serré');page.locator('#exercise-five').click();assert page.evaluate('exerciseDraft.frames[0].objects.length')==17
 page.locator('#exercise-add-frame').click();page.select_option('#exercise-object',page.evaluate('exerciseDraft.frames[0].objects[0].id'));page.locator('#exercise-board-canvas').focus();page.keyboard.press('ArrowRight');page.keyboard.press('ArrowDown');assert page.evaluate('exerciseDraft.frames[1].objects[0].x-exerciseDraft.frames[0].objects[0].x')==1

 for angle in [0,90,120,180]:
  page.locator('[data-exercise-angle="'+str(angle)+'"]').click();assert page.locator('#exercise-rotation').input_value()==str(angle);assert page.evaluate('exerciseDraft.frames.every(f=>f.objects.find(o=>o.id===exerciseSelected).rotation==='+str(angle)+')');assert page.locator('[data-exercise-angle="'+str(angle)+'"]').get_attribute('aria-pressed')=='true'
 page.locator('#exercise-rotation').fill('45');page.locator('#exercise-label').fill('9');page.locator('#exercise-seconds').fill('0.5');page.locator('#exercise-seconds').dispatch_event('change');page.locator('#exercise-play').click();page.wait_for_timeout(700);page.locator('#exercise-stop').click()
 assert page.locator('#exercise-palette .exercise-equipment-button canvas').count()==14
 with page.expect_download() as png:page.locator('#exercise-png').click()
 png.value.save_as('/tmp/exercice-hd.png')
 from PIL import Image
 assert Image.open('/tmp/exercice-hd.png').size==(2400,1500)
 with page.expect_download() as download:page.locator('#exercise-video').click()
 video=download.value;video.save_as('/tmp/exercice-video.'+video.suggested_filename.split('.')[-1]);assert video.failure() is None
 page.locator('#custom-training-form button[type=submit]').click();assert page.evaluate('trainingValid(currentTraining)');assert page.evaluate('currentTraining.blocks[0].custom.board.frames.length')==2;assert page.locator('#training-blocks .exercise-board-preview canvas').count()==1;assert page.evaluate('JSON.stringify(state)')==before
 page.locator('#training-save').click();saved=page.evaluate('structuredClone(currentTraining.blocks[0].custom.board)');page.reload();page.locator('#view-training').click();assert page.evaluate('currentTraining.blocks[0].custom.board')==saved
 assert page.evaluate('trainingDocument(currentTraining).querySelectorAll(".exercise-board-preview canvas").length')==1
 assert not page.evaluate('validExerciseBoard({...currentTraining.blocks[0].custom.board,seconds:-1})');assert not page.evaluate('validExerciseBoard({version:1,lines:true,seconds:2,frames:[null]})')
 page.evaluate('window.print=()=>{}');page.locator('#training-pdf').click();page.emulate_media(media='print');page.pdf(path='/tmp/exercice-terrain.pdf',prefer_css_page_size=True,print_background=True);page.emulate_media(media='screen');page.evaluate('document.body.classList.remove("training-printing")')
 page.locator('#training-blocks').get_by_role('button',name='Modifier mon exercice').click();assert page.locator('#exercise-board-enabled').is_checked();page.set_viewport_size({'width':390,'height':844});assert page.locator('#custom-training-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth');page.screenshot(path='/tmp/exercise-board-mobile.png');assert not errors,errors
 print('PASS: 5v5 equipment, editable numbered players, independent frames/movement, animation video, saved/reloaded schema, shared document rendering and mobile.')
 b.close()
