"""Round token direct color controls, frame consistency and reopening."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('typeof openCustomTrainingExercise === "function"');page.evaluate('openCustomTrainingExercise()')
 canvas=page.locator('#exercise-board-canvas');page.locator('#exercise-palette [data-tool=blue]').click();canvas.click(position={'x':300,'y':220})
 page.wait_for_selector('.exercise-token-colors:not([hidden])')
 page.evaluate('exerciseDraft.frames.push(structuredClone(exerciseDraft.frames[0]))')
 page.locator('[data-token-color="#e41f28"]').click();assert page.evaluate('exerciseDraft.frames.every(f=>f.objects[0].color==="#e41f28")')
 page.locator('input[aria-label="Couleur personnalisée du pion"]').evaluate('e=>{e.value="#36a781";e.dispatchEvent(new Event("input"));}')
 assert page.evaluate('exerciseDraft.frames.every(f=>f.objects[0].color==="#36a781")')
 assert page.evaluate('validExerciseBoard(serializeExerciseBoard())')
 saved=page.evaluate('serializeExerciseBoard()');page.locator('.exercise-token-color-close').click();assert not page.locator('.exercise-token-colors').is_visible()
 canvas.click(position={'x':300,'y':220});assert page.locator('.exercise-token-colors').is_visible()
 page.set_viewport_size({'width':390,'height':844});assert not page.locator('.exercise-token-colors').is_visible()
 page.evaluate('(board)=>openCustomTrainingExercise({duration:15,custom:{title:"Pions",goal:"",organisation:"",instructions:"",material:"",success:"",kind:"game",width:40,length:60,board}})',saved)
 assert page.evaluate('exerciseDraft.frames[0].objects[0].color')=='#36a781'
 o=page.evaluate('exerciseDraft.frames[0].objects[0]');r=canvas.bounding_box();canvas.click(position={'x':r['width']*o['x']/100,'y':r['height']*o['y']/100})
 box=page.locator('.exercise-token-colors').bounding_box();assert box and box['x']>=0 and box['x']+box['width']<=390 and box['y']+box['height']<=844
 page.screenshot(path='/tmp/exercise-token-colors-mobile.png');assert not errors,errors;b.close();print('PASS: direct token color, custom color, all frames, persistence and mobile bounds.')
