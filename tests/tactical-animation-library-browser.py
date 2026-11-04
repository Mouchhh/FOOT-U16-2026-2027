from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.tacticalAnimationLibrary');assert not errors,errors
 page.locator('#view-pitch').click();page.locator('#match-new').click();page.locator('#task-match-tactics').click()
 assert page.locator('#simple-board').is_visible()
 assert page.evaluate('simpleState.scenario')=='custom'
 assert page.locator('#simple-sequence-name').input_value()==''
 assert not page.locator('#simple-scenario').is_visible()
 page.locator('#simple-sequence-name').fill('Sortie de balle libre')
 page.evaluate("()=>{const t=simpleState.tokens[0];simpleState.customSteps=[[{id:t.id,x:50,y:40,type:'move'}]];saveSimple()}")
 page.locator('#simple-sequence-save').click();assert page.evaluate('simpleLibrary.length')==1
 assert page.locator('#club-animation-library .club-animation-row').count()==1
 entry=page.evaluate('JSON.stringify(simpleLibrary[0])')
 assert page.evaluate('causerieAnimations.frames(simpleLibrary[0]).steps.length')==1
 page.locator('#task-match-causerie').click()
 page.get_by_label('Animation à ajouter à la causerie',exact=True).select_option(index=1)
 page.locator('.tactical-animation-attach').get_by_role('button',name='Ajouter à la causerie',exact=True).click()
 assert page.evaluate('causerieAnimations.capture().sequences.length')==1
 assert page.evaluate('JSON.stringify(simpleLibrary[0])')==entry
 page.reload();page.wait_for_function('window.tacticalAnimationLibrary')
 assert page.evaluate('causerieAnimations.capture().sequences[0].title')=='Sortie de balle libre'
 page.evaluate('()=>startBlankMatch()')
 assert page.evaluate('causerieAnimations.capture().sequences.length')==0
 assert page.evaluate('simpleLibrary.length')==1
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 assert not errors,errors
 b.close()
print('Free-title tactical editor, canonical club animation library, unchanged movement engine, persisted causerie snapshots/reload, new match isolation and mobile passed')
