"""Portrait editing maps visible gestures to existing saved coordinates."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':768});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local')
 page.evaluate("document.querySelector('#view-training').click();trainingWizard.go(3)")
 page.locator('#training-custom-add').click();page.locator('#studio-tab-board').click()
 assert not page.locator('.studio-tools').evaluate('(e)=>e.open')
 assert not page.locator('.studio-inspector').evaluate('(e)=>e.open')
 page.locator('.studio-tools summary').click();page.get_by_role('button',name='Ajouter : Joueur bleu',exact=True).click();page.locator('.studio-tools summary').click()
 canvas=page.locator('#exercise-board-canvas');canvas.focus();page.keyboard.press('ArrowRight')
 before=page.evaluate('({...exerciseDraft.frames[0].objects[0]})')
 assert before['x']==50 and before['y']==51
 page.keyboard.press('ArrowUp');after=page.evaluate('({...exerciseDraft.frames[0].objects[0]})');assert after['x']==51 and after['y']==51
 r=canvas.bounding_box();assert r['height']>r['width'];assert r['y']>=0 and r['y']+r['height']<768
 # Drag to the right in the portrait view changes saved y, not saved x.
 x=r['x']+after['y']/100*r['width'];y=r['y']+(100-after['x'])/100*r['height']
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+r['width']*.1,y);page.mouse.up()
 end=page.evaluate('({...exerciseDraft.frames[0].objects[0]})');assert abs(end['y']-61)<1 and abs(end['x']-51)<1
 page.locator('.studio-inspector summary').click();page.locator('#exercise-label').fill('Capitaine');page.locator('#exercise-label').dispatch_event('change');page.locator('.studio-inspector summary').click()
 assert page.evaluate('exerciseDraft.frames[0].objects[0].label')=='Capitaine'
 # Laptop and desktop layouts reserve enough space for a usable full portrait pitch.
 for width,height in [(1280,720),(1366,768),(1440,900),(1920,1080)]:
  page.set_viewport_size({'width':width,'height':height});page.locator('#custom-training-dialog').evaluate('(e)=>e.scrollTop=0')
  r=canvas.bounding_box();footer=page.locator('.studio-footer').bounding_box()
  assert r['height']>=height*.65,(width,height,r)
  assert r['y']+r['height']<=footer['y'],(width,height,r,footer)
 for width in [320,390,768,1366]:
  page.set_viewport_size({'width':width,'height':900})
  assert page.locator('#custom-training-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth'),width
  page.locator('.studio-tools summary').click();assert page.get_by_role('button',name='Ajouter : Ballon',exact=True).is_visible();page.locator('.studio-tools summary').click()
 assert not errors,errors
 b.close()
print('PASS portrait gestures, dropdowns, usable pitch size on 1280×720 / 1366×768 / 1440×900 / 1920×1080 and responsive widths.')
