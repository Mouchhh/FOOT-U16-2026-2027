"""Create a real multi-step sequence by drawing arrows, then save, replay and export it."""
from playwright.sync_api import sync_playwright
def terrain(page,index):page.locator('#terrain-step-link-'+str(index)).evaluate('e=>e.click()')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local');original=page.evaluate('JSON.stringify(state)');page.locator('#view-pitch').evaluate('e=>e.click()');page.locator('#mode-simple').evaluate('e=>e.click()');terrain(page,0);page.locator('#custom-arrow').click()
 assert page.evaluate('simpleState.scenario')=='custom';assert page.locator('.animation-controls').is_visible()
 own=page.evaluate("simpleState.tokens.find(t=>t.side==='own').id")
 def arrow(token_id,x,y):
  terrain(page,0);pitch=page.locator('#simple-pitch');pitch.scroll_into_view_if_needed();token=page.locator('.simple-token[data-id="'+token_id+'"]');rect=token.bounding_box();box=pitch.bounding_box();landscape=page.evaluate("document.body.classList.contains('landscape-mode')")
  dest=(box['x']+box['width']*((100-y) if landscape else x)/100,box['y']+box['height']*(x if landscape else y)/100)
  page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);page.mouse.down();page.mouse.move(*dest,steps=8);page.mouse.up()
 arrow(own,40,70);arrow('ball',45,65)
 assert page.evaluate('simpleState.customSteps[0].length')==2;assert page.locator('#simple-lines g line').count()==2;assert page.evaluate('simpleState.tokens[0].y')==90
 terrain(page,0);page.locator('#custom-step-add').click();assert page.evaluate('simpleState.step')==1;assert abs(page.evaluate('simpleState.tokens[0].x')-40)<.1;assert abs(page.evaluate('simpleState.tokens[0].y')-70)<.1
 arrow(own,30,50);arrow('ball',35,45)
 terrain(page,2);page.locator('#simple-sequence-name').fill('Relance inventée');terrain(page,2);page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==1;seq_id=page.evaluate('simpleLibrary[0].id');assert page.evaluate('simpleLibrary[0].state.step')==0;assert page.evaluate('simpleValid(simpleLibrary[0].state)')
 terrain(page,0);page.select_option('#animation-speed','2');terrain(page,0);page.locator('#animation-play').click();page.wait_for_function("document.querySelector('#animation-status').textContent==='Séquence terminée'",timeout=10000);assert abs(page.evaluate('simpleState.tokens[0].x')-30)<.1;assert abs(page.evaluate('simpleState.ball.y')-45)<.1
 page.reload();page.locator('#view-pitch').evaluate('e=>e.click()');page.locator('#mode-simple').evaluate('e=>e.click()');terrain(page,2);page.select_option('#simple-library',seq_id);terrain(page,2);page.locator('#simple-sequence-open').click();assert page.evaluate('simpleState.tokens[0].y')==90;assert page.evaluate('simpleState.customSteps.length')==2
 # Saved sequence can be changed and replayed; steps are not limited to the three preset steps.
 terrain(page,1);page.locator('#simple-steps button').nth(1).click();terrain(page,0);page.locator('#custom-step-add').click();terrain(page,0);page.locator('#custom-step-add').click();assert page.evaluate('simpleState.step')==3;arrow(own,25,40)
 terrain(page,2);page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==1;terrain(page,0);page.select_option('#animation-speed','2');terrain(page,0);page.locator('#animation-play').click();page.wait_for_function("document.querySelector('#animation-status').textContent==='Séquence terminée'",timeout=12000);assert abs(page.evaluate('simpleState.tokens[0].x')-25)<.1
 # The same four custom segments feed the video exporter.
 segments=page.evaluate('(()=>{const snapshot=structuredClone(simpleState);customRestoreSnapshot(snapshot,0);return exportSegments(snapshot,"forward")})()');assert len(segments)==4;assert abs(segments[-1]['end']['tokens'][0]['y']-40)<.1
 with page.expect_download(timeout=20000) as video:terrain(page,2);page.locator('#export-video').click()
 assert video.value.suggested_filename.startswith('Relance inventée.')
 # Landscape pointer coordinates and clearing the current step.
 page.locator('#landscape-toggle').click();terrain(page,1);page.locator('#simple-steps button').first.click();arrow(own,35,60);assert abs(page.evaluate('simpleState.customSteps[0].find(a=>a.id===simpleState.tokens[0].id).x')-35)<.1
 terrain(page,0);page.locator('#custom-clear').click();assert page.evaluate('simpleState.customSteps[0].length')==0
 # Reposition the initial layout, keep the numbered roster and preserve the composition.
 terrain(page,0);page.locator('#custom-move').click();page.locator('.simple-token.own').first.focus();before=page.evaluate('simpleState.tokens[0].y');page.keyboard.press('ArrowRight');assert page.evaluate('simpleState.customBase.tokens[0].y')==before-1
 assert page.evaluate('simpleValid(simpleState)');assert page.evaluate('JSON.stringify(getCompositionBoard())')==original
 assert not page.evaluate('(()=>{const bad=structuredClone(simpleState);bad.customSteps[0]=[{id:"unknown",x:20,y:20,type:"move"}];return simpleValid(bad)})()')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: draw player/ball arrows, chained custom steps, named save/load/edit, four-step playback, video export, landscape drawing, clearing, base layout changes, validation, mobile and preserved composition.')
 b.close()
