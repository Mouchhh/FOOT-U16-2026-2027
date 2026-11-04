from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_selector('#home-photo-gallery');page.locator('#view-home').click()
 for width in [1440,900,390,320]:
  page.set_viewport_size({'width':width,'height':1000})
  images=page.locator('#home-photo-gallery img');assert images.count()==12
  assert images.evaluate_all('imgs=>new Set(imgs.map(i=>i.src)).size')==12
  assert images.evaluate_all('imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0&&i.alt&&getComputedStyle(i).objectFit==="cover"&&getComputedStyle(i).opacity==="1")')
  assert images.evaluate_all('imgs=>imgs.every(i=>i.getBoundingClientRect().width>50&&i.getBoundingClientRect().height>50)')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  images.last.scroll_into_view_if_needed();box=images.last.bounding_box();assert box['y']>=0 and box['y']<1000
  page.screenshot(path=f'/tmp/home-grid-{width}.png',full_page=True)
 page.locator('#view-reports').click();assert not page.locator('#home-photo-gallery').is_visible()
 page.locator('#view-home').click();assert page.locator('#home-photo-gallery img').count()==12
 assert not errors,errors
 b.close()
print('12 distinct loaded photos, responsive grid, cover cropping, last row reachable, navigation and no overflow passed')
