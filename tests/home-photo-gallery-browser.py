"""All twelve club photographs rotate in the home background, without legacy tools."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install()
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('homeSlideImages.length===12 && window.documentEntry');page.locator('#view-home').click()
 assert page.locator('#home-backdrop').is_visible()
 assert page.locator('#home-backdrop img').count()==12
 assert not page.locator('#home-photo-gallery').count()
 assert not page.locator('#home-tools').is_visible()
 assert not page.locator('#coach-quickstart-open').is_visible()
 first=page.evaluate('homeSlideIndex');page.clock.run_for(6100);assert page.evaluate('homeSlideIndex')==(first+1)%12
 seen=set([page.evaluate('homeSlideIndex')])
 for _ in range(11):
  page.clock.run_for(6000);seen.add(page.evaluate('homeSlideIndex'))
 assert len(seen)==12
 assert page.locator('#home-backdrop img.active').count()==1
 for width in [1366,390,320]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.locator('#home-backdrop').is_visible()
  assert page.locator('#home-backdrop img').evaluate_all('imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0&&getComputedStyle(i).objectFit==="cover")')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.locator('#view-reports').click();paused=page.evaluate('homeSlideIndex');page.clock.run_for(13000);assert page.evaluate('homeSlideIndex')==paused
 page.locator('#view-home').click();page.clock.run_for(6100);assert page.evaluate('homeSlideIndex')!=paused
 page.evaluate("()=>coachAccountSaveSection('preferences',{...coachAccountRead().preferences,reducedMotion:true})");paused=page.evaluate('homeSlideIndex');page.clock.run_for(13000);assert page.evaluate('homeSlideIndex')==paused
 page.evaluate("()=>coachAccountSaveSection('preferences',{...coachAccountRead().preferences,reducedMotion:false})");page.clock.run_for(6100);assert page.evaluate('homeSlideIndex')!=paused
 assert not errors,errors
 b.close()
print('All 12 background photos rotate, responsive cover cropping, tools stay hidden, rotation pauses outside home and respects motion preferences')
