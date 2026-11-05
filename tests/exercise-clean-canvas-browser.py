"""Minimal light exercise editor, equipment and working save journey."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded')
 page.wait_for_function('typeof openCustomTrainingExercise === "function"')
 page.evaluate('openCustomTrainingExercise()')
 assert page.locator('#exercise-studio-board').is_visible()
 for selector in ['.studio-tabs','.tactical-options','#exercise-five','#exercise-clear','.studio-animation']:
  assert not page.locator(selector).is_visible(),selector
 assert page.locator('.exercise-lines-compact').is_visible()
 canvas=page.locator('#exercise-board-canvas')
 for key in ['blue','red','keeper','ball','goal','mini','pole','ladder','dummy','disc','cone']:
  page.locator('#exercise-palette [data-tool='+key+']').click()
  canvas.click(position={'x':100,'y':100})
  assert page.evaluate('exerciseDraft.frames[0].objects.at(-1).type')==key
 assert page.evaluate('validExerciseBoard(serializeExerciseBoard())')
 page.locator('#exercise-lines').uncheck();assert not page.evaluate('exerciseDraft.lines')
 page.locator('#exercise-lines').check()
 for width,height in [(1440,900),(1366,768),(390,844)]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(100)
  assert page.locator('#custom-training-dialog').evaluate('e=>e.scrollHeight<=e.clientHeight && e.scrollWidth<=e.clientWidth')
  r=canvas.bounding_box();assert r['width']>100 and r['height']>50
  assert r['x']+r['width']<=width and r['y']+r['height']<=height
  r=page.locator('#exercise-studio-next').bounding_box();assert r['y']+r['height']<=height
  page.screenshot(path=f'/tmp/exercise-clean-{width}.png')
 page.locator('#exercise-studio-next').click();assert page.locator('#exercise-studio-sheet').is_visible()
 page.locator('#custom-training-title').fill('Atelier test épuré')
 page.locator('#custom-training-duration').fill('15')
 page.locator('#custom-training-form button[type=submit]').click()
 assert not page.locator('#custom-training-dialog').is_visible()
 assert not errors,errors
 b.close()
 print('PASS: clean light editor, full equipment, fixed pitch at 3 viewport sizes and next/save journey.')
