from pathlib import Path
from hashlib import sha256
import re
from playwright.sync_api import sync_playwright
# Original file: only presentation asset links differ from the coach's upload.
original=Path('imported-exercises-view.html').read_text().replace('<script src="imported-exercises-classification.js?v=folders-148"></script>\n','').replace('<link rel="stylesheet" href="imported-exercises-theme.css?v=folders-148">\n','')
assert sha256(original.encode()).hexdigest()=="84e007bb3da94fe7114e5297dfc38bd2938de8575198c9cc24d89fc6fde23fcb"
# Namespaced engine contains the exact supplied functions; only autostart is omitted.
script=re.search(r'<script>([\s\S]*?)</script>',original).group(1)
script=script[:script.index("if (typeof EXOS !== 'undefined') renderBundle")]
assert script in Path('supplied-exercise-engine.js').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof suppliedExerciseEngine!=="undefined"')
 page.locator('#view-training').click();page.locator('#task-training-bible').click()
 assert page.locator('#supplied-exercises-frame').count()==0
 assert page.locator('.supplied-exercise-card').count()==3
 assert page.locator('#training-search').is_visible()
 assert page.locator('#bible-bmf-category').is_visible()
 assert page.evaluate('suppliedExerciseEngine.exercises.length')==7
 assert page.evaluate('trainingAvailableExercises().length')==0
 for axis,count in [('ball',2),('loss',1),('win',1),('off',2),('ludic',1)]:
  page.locator('#bible-bmf-category').select_option(axis)
  assert page.locator('.supplied-exercise-card').count()==count
 page.locator('#bible-bmf-category').select_option('ball');page.locator('#training-filter').select_option('ball-build')
 assert page.locator('[data-exercise="banide-appuis"]').count()==1
 page.locator('[data-exercise="banide-appuis"] .bible-card-picture').click()
 d=page.locator('#bible-sheet-dialog');assert d.is_visible()
 assert d.locator('.f-title').inner_text()=='Banide avec appuis'
 assert d.locator('.xs-board svg').count()>0
 d.get_by_role('tab',name='Coaching',exact=True).click();assert d.locator('.f-posture').is_visible()
 d.get_by_role('button',name='Adapter',exact=True).click();assert d.locator('#sim-players').is_visible()
 d.locator('#sim-players').fill('18');assert '18'==d.locator('#sim-players').input_value()
 d.locator('.view-play').click();d.locator('.view-play').click()
 page.screenshot(path='/tmp/restored-bible-sheet-desktop.png',full_page=True)
 d.get_by_role('button',name='+ Ajouter à la séance',exact=True).click()
 assert page.evaluate('currentTraining.blocks.length')==1
 assert page.evaluate('trainingValid(currentTraining)')
 assert page.evaluate("currentTraining.blocks[0].duration===suppliedExerciseEngine.exercises.find(e=>e.id==='banide-appuis').duration")
 assert page.evaluate('currentTraining.blocks[0].custom.board.frames.length>1')
 page.reload();page.wait_for_function('typeof suppliedExerciseEngine!=="undefined"');assert page.evaluate('currentTraining.blocks.length')==1
 page.locator('#view-training').click();page.locator('#task-training-bible').click()
 page.locator('#bible-bmf-category').select_option('');page.locator('#training-filter').select_option('')
 page.locator('#training-search').fill('contre-attaque');assert page.locator('[data-exercise="banide-contre"]').count()==1
 page.locator('#training-search').fill('');assert page.locator('.supplied-exercise-card').count()==3
 page.locator('#bible-more').click();assert page.locator('.supplied-exercise-card').count()==3
 page.locator('#bible-more').click();assert page.locator('.supplied-exercise-card').count()==1
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('.supplied-exercise-card').count()==1
  page.locator('.supplied-exercise-card .bible-card-picture').click();assert page.locator('#bible-sheet-dialog').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#bible-sheet-dialog').get_by_role('button',name='Fermer',exact=True).click()
 page.screenshot(path='/tmp/restored-bible-mobile.png',full_page=True)
 assert not errors,errors
 b.close();print('Original exercise engine, restored cards/filters/pagination/sheets, animations, add/save/reload and mobile passed')
