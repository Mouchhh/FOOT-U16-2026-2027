"""Direct drawing, crop coordinates, persistence and narrow-screen layout."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local',wait_until='domcontentloaded')
 page.wait_for_function('typeof openCustomTrainingExercise === "function"')
 page.evaluate('openCustomTrainingExercise()')
 assert page.locator('#exercise-studio-board').is_visible()
 assert page.locator('#exercise-studio-sheet').is_hidden()
 assert page.locator('.tactical-tools>button').count()==9
 canvas=page.locator('#exercise-board-canvas')
 page.locator('#exercise-palette [data-tool=blue]').click();canvas.click(position={'x':100,'y':100})
 assert page.evaluate('exerciseDraft.frames[0].objects.length')==1
 page.locator('[data-tool=pass]').click();r=canvas.bounding_box()
 page.mouse.move(r['x']+120,r['y']+100);page.mouse.down();page.mouse.move(r['x']+220,r['y']+180);page.mouse.up()
 assert page.evaluate('exerciseDraft.drawings[0].type')=='pass'

 page.locator('#exercise-field-view').evaluate("e=>{e.value='half';e.dispatchEvent(new Event('change'));}")
 page.locator('#exercise-palette [data-tool=red]').click();canvas.click(position={'x':100,'y':100})
 assert page.evaluate('exerciseDraft.frames[0].objects[1].x')>50
 assert page.evaluate('validExerciseBoard(serializeExerciseBoard())')
 assert not page.evaluate('validExerciseBoard({...serializeExerciseBoard(),drawings:[{type:"pass"}]})')
 for key in ['goal','mini','cone','disc','pole','dummy','ladder']:
  page.locator('#exercise-palette [data-tool='+key+']').click();canvas.click(position={'x':150,'y':100})
  assert page.evaluate('exerciseDraft.frames[0].objects.at(-1).type')==key
 canvas.evaluate('e=>{const d=new DataTransfer();d.setData("application/x-exercise-equipment","mini");const r=e.getBoundingClientRect();e.dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:d,clientX:r.x+60,clientY:r.y+60}));}')
 assert page.evaluate('exerciseDraft.frames[0].objects.at(-1).type')=='mini'
 snapshot=page.evaluate('serializeExerciseBoard()')
 page.evaluate('(board)=>openCustomTrainingExercise({custom:{title:"Test",goal:"",organisation:"",instructions:"",material:"",success:"",kind:"game",width:40,length:60,board},duration:15})',snapshot)
 assert page.evaluate('exerciseDraft.drawings.length')==1
 assert page.locator('#exercise-field-view').input_value()=='half'
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.locator('#custom-training-dialog').evaluate('e=>e.scrollWidth<=e.clientWidth && e.scrollHeight<=e.clientHeight'),width
  r=canvas.bounding_box();assert r['height']>0 and r['y']+r['height']<=844
  r=page.locator('#exercise-studio-next').bounding_box();assert r['y']+r['height']<=844
 page.screenshot(path='/tmp/exercise-tactical-mobile.png')
 page.locator('#exercise-studio-next').click();assert page.locator('#exercise-studio-sheet').is_visible()
 assert not errors,errors
 b.close()
 print('PASS: direct editor, tools, drawings, half-field positions, schema persistence, desktop/mobile.')
