"""A new animation/reset starts clean; saved animations and the match remain intact."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.tacticalAnimationLibrary')
 page.locator('#view-pitch').click();page.locator('#match-new').click();page.locator('#task-match-tactics').click()
 match=page.evaluate('JSON.stringify(getCompositionBoard())')
 page.locator('#simple-sequence-name').fill('Animation A à conserver')
 page.evaluate("""()=>{const t=simpleState.tokens[0];t.label='Ancien joueur';t.x=15;t.y=20;simpleState.ball={x:21,y:23};simpleState.customBase={tokens:structuredClone(simpleState.tokens),ball:structuredClone(simpleState.ball)};simpleState.customSteps=[[{id:t.id,x:70,y:30,type:'move'}],[{id:'ball',x:80,y:40,type:'pass'}]];saveSimple();renderSimple()}""")
 page.locator('#simple-sequence-save').click();saved=page.evaluate('JSON.stringify(simpleLibrary)');oldid=page.evaluate('simpleState.sequenceId')
 page.locator('#tactical-animation-new').click()
 def check_clean():
  assert page.evaluate('simpleState.step')==0
  assert page.evaluate('simpleState.customSteps')==[[]]
  assert page.evaluate('simpleState.sequenceId||""')==''
  assert page.locator('#simple-sequence-name').input_value()==''
  assert page.evaluate('simpleState.tokens[0].label')=='1'
  assert page.evaluate('simpleState.tokens[0].x')==50
  assert page.evaluate('simpleState.tokens[0].y')==90
  assert page.evaluate('simpleState.ball')=={'x':57,'y':50}
  assert page.locator('#simple-lines g line').count()==0
  assert page.evaluate('animationStart===null && animationRun===null')
  assert page.locator('#simple-library').input_value()==''
  assert page.evaluate('simpleValid(simpleState)')
 check_clean();assert page.evaluate('JSON.stringify(simpleLibrary)')==saved
 # Make B different from A and simulate an active playback, then cancel/confirm reset.
 page.locator('#simple-sequence-name').fill('Animation B')
 page.evaluate("""()=>{const t=simpleState.tokens[0];t.x=25;t.y=65;simpleState.customBase.tokens[0].x=25;simpleState.customBase.tokens[0].y=65;simpleState.customSteps=[[{id:t.id,x:60,y:40,type:'move'}],[{id:'ball',x:65,y:45,type:'pass'}]];saveSimple();renderSimple()}""")
 before=page.evaluate('JSON.stringify(simpleState)');page.once('dialog',lambda d:d.dismiss());page.locator('#simple-reset').click();assert page.evaluate('JSON.stringify(simpleState)')==before
 page.locator('#animation-play').click();page.wait_for_timeout(100)
 page.once('dialog',lambda d:d.accept());page.locator('#simple-reset').click();check_clean()
 assert page.evaluate('JSON.stringify(simpleLibrary)')==saved
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==match
 # Save the new draft independently instead of overwriting A.
 page.locator('#simple-sequence-name').fill('Animation C')
 page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==2
 assert page.evaluate('simpleState.sequenceId')!=oldid
 assert page.evaluate('(id)=>JSON.stringify(simpleLibrary.find(e=>e.id===id))',oldid)==__import__('json').dumps(__import__('json').loads(saved)[0],ensure_ascii=False,separators=(',',':'))
 # Open the saved A through the current library disclosure, then replay both steps.
 page.locator('.tactical-library-more > summary').click()
 page.locator('#simple-library').select_option(oldid)
 page.once('dialog',lambda d:d.accept());page.locator('#simple-sequence-open').click()
 assert page.locator('#simple-sequence-name').input_value()=='Animation A à conserver'
 assert page.evaluate('simpleState.customSteps.length')==2
 assert page.evaluate('simpleState.tokens[0].x')==15
 page.locator('#animation-speed').select_option('2');page.locator('#animation-play').click()
 page.wait_for_function('document.getElementById("animation-status").textContent==="Séquence terminée"',timeout=10000)
 assert page.evaluate('simpleState.tokens[0].x')==70
 assert page.evaluate('simpleState.ball.x')==80
 # The deliberate conversion tool still starts from the board being converted.
 page.evaluate("()=>{loadSimple('press');simpleState.tokens[0].x=19;createCustomSequence()}")
 assert page.evaluate('simpleState.customBase.tokens[0].x')==19
 assert not errors,errors;b.close()
print('PASS: fresh animation, cancel/confirm reset during playback, cleared state/UI, independent save, preserved saved animation/match and intentional conversion')
