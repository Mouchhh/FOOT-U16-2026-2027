"""Background carousel behavior with isolated fixture images; no Instagram requests."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
photo=Path('assets/club-logo.jpg').read_bytes()
def configure(context,slides):
 context.route('**/assets/home-slides.js?*',lambda r:r.fulfill(content_type='application/javascript',body='window.CLUB_HOME_SLIDES='+json.dumps(slides)+';'))
 context.route('**/assets/photos/*',lambda r:r.fulfill(status=404) if r.request.url.endswith('missing.jpg') else r.fulfill(content_type='image/jpeg',body=photo))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':1000});configure(context,[{'src':'assets/photos/one.jpg'},{'src':'assets/photos/two.jpg'},{'src':'assets/photos/missing.jpg'},{'src':'https://invalid.test/photo.jpg'}]);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.clock.install();page.goto('http://127.0.0.1:3016/?mode=local');page.evaluate('homeSlidesReady')
 assert page.locator('#home-backdrop img').count()==2;assert not page.locator('#home-backdrop').is_visible()
 page.locator('#view-home').click();page.wait_for_function('homeSlideTimer!==null');assert page.locator('#home-backdrop').is_visible();assert page.locator('#home-slideshow-controls').is_visible();assert page.locator('#home-backdrop img.active').count()==1
 page.clock.fast_forward(6100);assert page.evaluate('homeSlideIndex')==1
 page.locator('#home-slide-pause').click();current=page.evaluate('homeSlideIndex');page.clock.fast_forward(18000);assert page.evaluate('homeSlideIndex')==current;assert page.evaluate('homeSlideTimer') is None
 page.locator('#home-slide-next').click();assert page.evaluate('homeSlideIndex')==0;page.locator('#home-slide-previous').click();assert page.evaluate('homeSlideIndex')==1
 page.locator('#home-slide-pause').click();page.wait_for_function('homeSlideTimer!==null');page.locator('#view-training').click();assert page.evaluate('homeSlideTimer') is None;assert not page.locator('#home-backdrop').is_visible();assert page.locator('#training-space').is_visible()
 page.locator('#view-home').click();page.wait_for_function('homeSlideTimer!==null');page.emulate_media(reduced_motion='reduce');page.wait_for_function('homeSlidePaused===true');assert page.evaluate('homeSlideTimer') is None
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.locator('#home-slide-next').is_visible();assert not errors,errors
 # Without real photos, keep the existing blue home and never display broken images or fictional players.
 context2=browser.new_context();configure(context2,[]);empty=context2.new_page();empty.goto('http://127.0.0.1:3016/?mode=local');empty.evaluate('homeSlidesReady');empty.locator('#view-home').click();assert not empty.locator('#home-backdrop').is_visible();assert not empty.locator('#home-slideshow-controls').is_visible();assert empty.locator('.home-club-life').is_visible()
 print('PASS: preload/failed images, crossfade selection, automatic cycling, pause/resume/manual controls, stop outside home, reduced motion, mobile and empty-photo fallback.')
 browser.close()
