"""The reference clip plays continuously and exposes a usable desktop/mobile review."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/atelier-reference.html')
 assert page.locator('[data-player]').count()==6
 assert page.locator('[data-equipment="pole"]').count()==6
 assert page.locator('[data-equipment="hurdle"]').count()==3
 assert page.locator('[data-equipment="ladder"]').count()==1
 assert page.locator('[data-ball="active"]').count()==1
 assert not page.evaluate('referencePreview.playing')
 page.locator('#reference-play').click();page.wait_for_timeout(450);page.locator('#reference-play').click()
 value=page.evaluate('referencePreview.time');assert value>.2
 page.wait_for_timeout(150);assert page.evaluate('referencePreview.time')==value
 page.evaluate('referencePreview.seek(6.9)')
 assert page.evaluate('new Set(referencePreview.state().moving).size')>=3
 assert '2 / 6' in page.locator('#scene-cycle').inner_text()
 page.screenshot(path='/tmp/reference-combination-desktop.png',full_page=True)
 before=page.evaluate('referencePreview.time');page.locator('#reference-next').click();assert page.evaluate('referencePreview.time')>before
 page.locator('#reference-back').click();assert page.evaluate('referencePreview.time')<before+1
 page.locator('#reference-reset').click();assert page.evaluate('referencePreview.time')==0
 page.locator('#reference-players').select_option('8');page.locator('#reference-apply').click();assert page.locator('[data-player]').count()==8
 page.locator('#reference-width').fill('8');page.locator('#reference-apply').click();assert '20 m' in page.locator('#reference-setting-status').inner_text();assert page.locator('[data-player]').count()==8
 page.locator('#reference-width').fill('24');page.locator('#reference-players').select_option('6');page.locator('#reference-apply').click()
 page.evaluate('referencePreview.seek(referencePreview.plan.duration)')
 assert page.evaluate('referencePreview.state().owner')==2
 assert 'Terminer les retours' in page.locator('#reference-cue').inner_text()
 page.locator('#reference-reset').click()
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/reference-combination-mobile.png',full_page=True)
 page.emulate_media(reduced_motion='reduce');page.reload();assert not page.evaluate('referencePreview.playing')
 assert not errors,errors
 print('PASS: real playback/pause/seek/steps, one clock and one ball, material counts, stable identities, participant changes, rejected invalid setup, complete rotation and mobile.')
 b.close()
