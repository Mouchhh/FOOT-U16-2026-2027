"""Actual projection: aerial delivery, late arrival, unchanged print and real restart."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bibleExerciseDesign==='function'")
 page.evaluate("()=>{Object.assign(currentTraining,{players:10,keepers:1,space:'full'});openBibleSheet(trainingExercises.find(e=>e.id==='cpa-attack'))}")
 result=page.evaluate('''()=>{const figure=document.querySelector('#bible-sheet-dialog .bible-diagram'),controller=figure.bibleAnimation,step=controller.plan.steps.find(s=>s.delivery==='aerial'),flight=step.motions.find(m=>m.kind==='ball'),before=figure.querySelector('.training-diagram-print').innerHTML;controller.seek(step.start+flight.delay+flight.duration/2);const state=bibleAnimationState(controller.plan,controller.state.time),shadow=figure.querySelector('[data-feature=flight-shadow]'),samePrint=before===figure.querySelector('.training-diagram-print').innerHTML;return {height:state.ball.height,shadow:Number(shadow.getAttribute('opacity')),shadowX:Number(shadow.getAttribute('cx')),groundX:state.ball.x,samePrint};}''')
 assert result['height']>2 and result['shadow']>0 and abs(result['shadowX']-result['groundX'])<.001 and result['samePrint'],result
 page.locator('#bible-sheet-dialog .training-diagram-screen svg').screenshot(path='/tmp/bible-aerial-corner.png')
 page.evaluate("document.querySelector('#bible-sheet-dialog .bible-diagram').bibleAnimation.reset()")
 assert page.locator('#bible-sheet-dialog [data-feature=flight-shadow]').first.get_attribute('opacity')=='0'
 page.evaluate("()=>{document.querySelector('#bible-sheet-dialog').close();openBibleSheet(trainingExercises.find(e=>e.id==='far-post'))}")
 result=page.evaluate('''()=>{const figure=document.querySelector('#bible-sheet-dialog .bible-diagram'),c=figure.bibleAnimation,step=c.plan.steps.find(s=>s.action==='pass'),run=step.motions.find(m=>m.kind==='player'&&m.id===step.to),t=step.start+run.delay+run.duration*.5;c.seek(t);const state=bibleAnimationState(c.plan,t),receiver=state.players.find(p=>p.number===step.to),distanceToArrival=Math.hypot(receiver.x-run.to.x,receiver.y-run.to.y)/c.plan.field.scale,end=bibleAnimationState(c.plan,step.end),arrival=end.players.find(p=>p.number===step.to);return {delay:run.delay,distanceToArrival,controlled:Math.hypot(end.ball.x-arrival.x,end.ball.y-arrival.y)<c.plan.playerRadius+14};}''')
 assert result['delay']>0 and result['distanceToArrival']>1 and result['controlled'],result
 page.evaluate("()=>{document.querySelector('#bible-sheet-dialog').close();openBibleSheet(trainingExercises.find(e=>e.id==='press-goalkick'))}")
 assert page.evaluate("()=>{const s=document.querySelector('#bible-sheet-dialog .training-diagram-screen svg').bibleScene,k=s.tokens.find(p=>p.keeper&&!p.rotation);return k.team==='blue'&&s.goals.find(g=>g.type==='full').side==='left'&&s.goals.filter(g=>g.type==='mini'&&g.side==='right').length===2&&s.balls[0].owner===k.number}")
 sheet=page.locator('#bible-sheet-dialog');sheet.get_by_label('Variante de l’exercice',exact=True).select_option('1')
 assert sheet.locator('.bible-animation').count()==1
 page.set_viewport_size({'width':390,'height':844});assert sheet.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
 sheet.locator('.bible-animation-play').scroll_into_view_if_needed();sheet.locator('.bible-animation-play').click();page.wait_for_timeout(300)
 assert sheet.locator('.bible-diagram').evaluate('e=>e.bibleAnimation.state.time')>0
 assert not errors,errors
 print('PASS: visible aerial height and ground shadow, late receiver arrival, unchanged print, real goalkeeper restart, selectable variants and mobile playback.')
 b.close()
