"""Zones & pass lines on Placement tactique and Animations: drawing, eraser, persistence, steps, library, export, mobile."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof pitchAnnotationsValid==="function"')
 # Model.
 assert page.evaluate("pitchAnnotationsValid(undefined)&&pitchAnnotationsValid({zones:[],passes:[]})")
 assert not page.evaluate("pitchAnnotationsValid({zones:[{id:'a',shape:'rect',x:90,y:0,w:20,h:5,color:'red'}],passes:[]})")
 assert not page.evaluate("pitchAnnotationsValid({zones:[],passes:[{id:'p',x1:0,y1:0,x2:10,y2:10,color:'pink'}]})")
 # Placement tactique: draw from a token, the token does not move.
 page.locator('#view-pitch').click();page.evaluate("document.getElementById('document-entry-resume')?.click()")
 page.locator('#task-match-tactics').click();page.get_by_role('button',name='Placement tactique',exact=True).click()
 page.locator('#annotate').click();assert page.evaluate('mode')=='annotate'
 before=page.evaluate('JSON.stringify(state.players.map(p=>[p.x,p.y]))')
 box=page.locator('#pitch').bounding_box()
 def drag(x1,y1,x2,y2,host=box):
  page.mouse.move(host['x']+host['width']*x1,host['y']+host['height']*y1);page.mouse.down()
  page.mouse.move(host['x']+host['width']*x2,host['y']+host['height']*y2,steps=6);page.mouse.up()
 tok=page.evaluate("state.players[0]");drag(tok['x']/100,tok['y']/100,0.8,0.5)
 page.locator('#tactic-annotation-zone-ellipse').click();page.locator('#tactic-panel-annotate .pitch-annotation-swatch[data-color=red]').click();drag(0.2,0.6,0.5,0.8)
 page.locator('#tactic-annotation-pass').click();drag(0.5,0.85,0.8,0.3)
 a=page.evaluate('state.annotations');assert len(a['zones'])==2 and len(a['passes'])==1,a
 assert [z['shape'] for z in a['zones']]==['rect','ellipse'] and a['zones'][1]['color']=='red'
 assert page.evaluate('JSON.stringify(state.players.map(p=>[p.x,p.y]))')==before
 assert page.locator('#zones .pitch-zone').count()==2 and page.locator('#zones .pitch-pass').count()==1
 # Eraser.
 page.locator('#tactic-annotation-erase').click();z=a['zones'][1];page.mouse.click(box['x']+box['width']*(z['x']+z['w']/2)/100,box['y']+box['height']*(z['y']+z['h']/2)/100)
 assert len(page.evaluate('state.annotations.zones'))==1
 # Persistence and export option.
 page.reload();page.wait_for_function('typeof pitchAnnotationsValid==="function"')
 assert page.evaluate('state.annotations.zones.length')==1 and page.evaluate('state.annotations.passes.length')==1
 page.evaluate("state.arrows=[];document.getElementById('composition-export').click()");assert page.locator('#composition-export-arrows').is_checked()
 page.evaluate("document.getElementById('composition-export-dialog').close()")
 # Animations: zone from a token, kept through steps, playback restart, library save/open; new animation is empty.
 page.locator('#view-pitch').click();page.locator('#task-match-tactics').click();page.get_by_role('button',name='Animations',exact=True).click()
 page.evaluate("createCustomSequence({fresh:true})");page.locator('#simple-annotation-zone-rect').click()
 sbox=page.locator('#simple-pitch').bounding_box();t=page.evaluate("simpleState.tokens[0]");drag(t['x']/100,t['y']/100,0.6,0.7,sbox)
 assert page.evaluate('simpleState.annotations.zones.length')==1 and page.evaluate("simpleState.customSteps.every(s=>s.length===0)")
 page.locator('#custom-step-add').click();assert page.evaluate('simpleState.annotations.zones.length')==1
 page.evaluate("loadSimple('build',0)");page.evaluate("loadSimple('build',1)");assert page.evaluate('simpleState.annotations.zones.length')==1
 page.locator('#simple-sequence-name').fill('Zones test');page.locator('#simple-sequence-save').click()
 assert page.evaluate("simpleLibrary[0].state.annotations.zones.length")==1
 page.locator('#tactical-animation-new').click();assert page.evaluate('simpleState.annotations.zones.length')==0
 page.evaluate("const s=document.getElementById('simple-library');s.value=simpleLibrary[0].id;s.dispatchEvent(new Event('change'))");page.locator('#simple-sequence-open').click()
 assert page.evaluate('simpleState.annotations.zones.length')==1 and page.locator('#simple-zones .pitch-zone').count()==1
 # Mobile.
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors;b.close();print('PASS: zones and pass lines on both boards, eraser, persistence, steps, library, export, mobile.')
