"""The coaching scene remains readable in both orientations and during playback."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local')
 page.evaluate('''()=>{Object.assign(currentTraining,{players:9,keepers:1,category:'U17',level:'developing',space:'full'});openBibleSheet(trainingExercises.find(e=>e.id==='duel-renforts'));}''')
 figure=page.locator('#bible-sheet-dialog .bible-diagram');screen=figure.locator('.training-diagram-screen')
 assert screen.locator('svg').get_attribute('data-orientation')=='portrait'
 assert screen.locator('[data-renderer="football-figurine"]').count()==9
 assert screen.locator('[data-feature="goal-frame"]').count()==3
 assert screen.locator('[data-equipment="miniGoal"][data-side="top"]').count()==1
 assert screen.locator('[data-equipment="miniGoal"][data-side="bottom"]').count()==1
 assert screen.locator('[data-feature="mowing-stripe"]').count()==6
 # A portrait scene keeps the goal above the playing area and jersey numbers upright.
 check=screen.evaluate('''e=>{const svg=e.querySelector('svg'),g=svg.querySelector('[data-equipment="goal"]'),player=svg.querySelector('.bible-player'),m=player.querySelector('.bible-player-model').getScreenCTM(),angle=Math.atan2(m.b,m.a)*180/Math.PI;return {angle,goalY:g.getBoundingClientRect().y,playerY:player.getBoundingClientRect().y}}''')
 assert abs(check['angle']+10)<.1,check
 assert check['goalY']<check['playerY'],check
 screen.screenshot(path='/tmp/bible-scene-portrait.png')
 first=screen.locator('svg').get_attribute('viewBox')
 for _ in range(3):
  figure.locator('.bible-diagram-orientation').click()
  assert screen.locator('svg').get_attribute('data-orientation')=='landscape'
  figure.locator('.bible-diagram-orientation').click()
  assert screen.locator('svg').get_attribute('viewBox')==first
 assert screen.locator('.bible-display-world').count()==1
 figure.locator('.bible-animation-next').click()
 figure.locator('.bible-animation-next').click()
 check=screen.locator('.bible-player-model').first.evaluate('(e)=>{const m=e.getScreenCTM();return Math.atan2(m.b,m.a)*180/Math.PI}')
 assert abs(check+10)<.1
 figure.locator('.bible-animation-reset').click()
 assert not figure.locator('.training-diagram-print .bible-display-world').count()
 page.set_viewport_size({'width':390,'height':844})
 assert page.locator('#bible-sheet-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2')
 screen.screenshot(path='/tmp/bible-scene-mobile.png')
 page.get_by_role('button',name='Fermer',exact=True).click()
 assert not errors,errors
 print('PASS: detailed figurines/nets/grass, portrait goal direction, upright numbers during playback, stable toggles, print and mobile.')
 b.close()
