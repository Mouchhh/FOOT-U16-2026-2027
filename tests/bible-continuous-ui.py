"""Use the real library, including sequence changes, playback and print copies."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof openBibleSheet==='function'")
 ids=page.evaluate('trainingExercises.map(e=>e.id)');count=0
 for id in ids:
  page.evaluate("id=>{const e=trainingExercises.find(e=>e.id===id);Object.assign(currentTraining,{players:bibleKnowledge[id].format.ideal||8,keepers:1,space:'full',age:17,category:'U17',level:'developing'});openBibleSheet(e)}",id)
  sheet=page.locator('#bible-sheet-dialog');diagram=sheet.locator('.bible-diagram').last
  if id=='wall-pass':
   assert diagram.locator('iframe').count()==1
  else:
   assert diagram.locator('.bible-animation').count()==1,id
   controller=diagram.evaluate('(e)=>Boolean(e.bibleAnimation?.plan.available)')
   if controller:
    count+=1
    static=diagram.locator('.training-diagram-print').inner_html()
    diagram.evaluate('(e)=>e.bibleAnimation.seek(e.bibleAnimation.plan.duration*.45)')
    assert diagram.locator('.training-diagram-print').inner_html()==static,id
    assert diagram.locator('[data-renderer="numbered-token"]').count()>0,id
    if id in ['rondo','passes','cutback','cpa-defence','keeper-duel','transition','build','freegame']:
     diagram.locator('.training-diagram-screen svg').screenshot(path='/tmp/continuous-'+id+'.png')
    # Replacing a sequence releases the prior clock and creates a fresh one.
    diagram.evaluate('(e)=>{window.lastClock=e.bibleAnimation;e.bibleSetSequence(2)}')
    assert diagram.evaluate('(e)=>e.bibleAnimation!==lastClock&&e.bibleAnimation.state.time===0'),id
  page.get_by_role('button',name='Fermer',exact=True).click()
 assert count>=50,count
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate("()=>{Object.assign(currentTraining,{players:6,keepers:1});openBibleSheet(trainingExercises.find(e=>e.id==='cutback'))}")
 sheet=page.locator('#bible-sheet-dialog');diagram=sheet.locator('.bible-diagram').last
 assert sheet.evaluate('(e)=>e.scrollWidth<=e.clientWidth+2')
 diagram.locator('.bible-animation-play').scroll_into_view_if_needed();diagram.locator('.bible-animation-play').click();page.wait_for_timeout(400)
 assert diagram.evaluate('(e)=>e.bibleAnimation.state.time')>0
 diagram.locator('.bible-animation-play').click();page.screenshot(path='/tmp/continuous-library-mobile.png')
 page.get_by_role('button',name='Fermer',exact=True).click()
 assert not errors,errors
 print(f'PASS: {len(ids)} real library sheets, {count} playable scenarios; sequence disposal, unchanged print, numbered tokens and mobile playback.')
 b.close()
