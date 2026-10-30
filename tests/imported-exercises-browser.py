from pathlib import Path
from hashlib import sha256
from playwright.sync_api import sync_playwright
# Only a stylesheet link may differ: exercise data and functional scripts stay byte-identical.
original=Path('imported-exercises-view.html').read_text().replace('<link rel="stylesheet" href="imported-exercises-theme.css?v=moments-146">\n','')
assert sha256(original.encode()).hexdigest()=="84e007bb3da94fe7114e5297dfc38bd2938de8575198c9cc24d89fc6fde23fcb"
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof suppliedExerciseIds!=="undefined"')
 page.locator('#view-training').click();page.locator('#task-training-bible').click()
 frame=page.frame_locator('#supplied-exercises-frame');frame.locator('.b-list a').first.wait_for()
 assert frame.locator('.b-list a').count()==7
 native=next(f for f in page.frames if 'imported-exercises-view.html' in f.url)
 native.evaluate("""()=>{const colors={ludique:'rgb(112, 65, 166)',possede:'rgb(40, 85, 162)',perd:'rgb(180, 83, 9)',recupere:'rgb(36, 115, 66)',nepossede:'rgb(185, 38, 53)'};for(const [moment,color] of Object.entries(colors)){const e=EXOS.find(e=>e.moment===moment)||{...EXOS[0],moment};const card=renderFiche(e);document.body.append(card);if(getComputedStyle(card.querySelector('.f-top')).backgroundColor!==color)throw Error('Incorrect color: '+moment);card.remove();}}""")
 assert page.locator('.training-catalogue-card').count()==0
 frame.locator('.b-list a').first.click();assert frame.locator('.f-card').is_visible()
 assert frame.locator('.xs-board svg').count()>0
 page.screenshot(path='/tmp/exercises-theme-desktop.png',full_page=True)
 frame.locator('.view-play').click();frame.locator('.view-play').click()
 frame.get_by_role('tab',name='Coaching',exact=True).click();assert frame.locator('.f-posture').is_visible()
 frame.get_by_role('button',name='Adapter',exact=True).click();assert frame.locator('#sim-players').is_visible()
 before=frame.locator('.f-info').inner_text();frame.locator('#sim-players').fill('18');assert frame.locator('.f-info').inner_text()!=before
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert frame.locator('.f-card').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('#supplied-exercises-frame').evaluate('(f)=>f.contentDocument.documentElement.scrollWidth<=f.contentWindow.innerWidth')
 frame.get_by_role('button',name='Retour aux exos',exact=True).click();frame.locator('.b-home').wait_for()
 assert frame.locator('.b-list a').count()==7
 page.screenshot(path='/tmp/exercises-theme-mobile.png',full_page=True)
 assert not errors,errors
 b.close();print('Original upload hash, seven native links, sheet, coaching, adaptation, back and mobile passed')
