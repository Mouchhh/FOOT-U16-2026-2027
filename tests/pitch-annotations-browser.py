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
 # Zones & passes are only offered in Animations (not in Placement tactique).
 page.locator('#view-pitch').click();page.evaluate("document.getElementById('document-entry-resume')?.click()")
 page.locator('#task-match-tactics').click();page.get_by_role('button',name='Placement tactique',exact=True).click()
 assert page.locator('#annotate').count()==0
 def drag(x1,y1,x2,y2,host):
  page.mouse.move(host['x']+host['width']*x1,host['y']+host['height']*y1);page.mouse.down()
  page.mouse.move(host['x']+host['width']*x2,host['y']+host['height']*y2,steps=6);page.mouse.up()
 # Animations: zone from a token, kept through steps, playback restart, library save/open; new animation is empty.
 page.get_by_role('button',name='Animations',exact=True).click()
 page.evaluate("createCustomSequence({fresh:true})");page.locator('.tactic-fs-open-button:visible').click()
 page.locator('#simple-annotation-zone-rect').click()
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
 assert not errors,errors;b.close();print('PASS: zones and pass lines in Animations only, steps, library, mobile.')
