"""Visible working surfaces and reachable controls across laptop, desktop and phone."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local')
 page.wait_for_selector('#comfort-match-tools',state='attached')
 for w,h in [(1280,720),(1366,768),(1920,1080),(390,844),(320,740),(844,390)]:
  page.set_viewport_size({'width':w,'height':h})
  page.locator('#view-pitch').click()
  for tab in ['composition','tactics']:
   page.locator('#task-match-'+tab).click();page.wait_for_timeout(120)
   if w>=1000:
    pitch=page.locator('#pitch').bounding_box();pane=page.locator('#terrain-page-0').bounding_box()
    assert pitch['y']>=pane['y']-1 and pitch['y']+pitch['height']<=pane['y']+pane['height']+1,(w,h,tab,pitch,pane)
   else:
    assert not page.locator('#comfort-match-tools').evaluate('e=>e.open')
    page.locator('#comfort-match-tools>summary').click()
    page.locator('#formation').scroll_into_view_if_needed()
    assert page.locator('#formation').is_visible()
    page.locator('#comfort-match-tools>summary').click()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,tab)
  page.locator('#task-match-causerie').click()
  page.locator('#match-plan-context').fill('Repère conservé sur tous les écrans')
  page.locator('#view-training').click();page.locator('#task-training-bible').click()
  assert page.locator('#training-search').bounding_box()['height']<=48
  page.locator('#training-search').fill('possession');page.locator('#training-search').fill('')
  for nav in ['view-home','view-coach-agenda','view-reports','view-pitch']:
   page.locator('#'+nav).click()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h,nav)
  page.locator('#task-match-causerie').click()
  assert page.locator('#match-plan-context').input_value()=='Repère conservé sur tous les écrans'
 assert not errors,errors
 b.close()
print('PASS: full Match pitches on three desktop sizes, reachable collapsed tools, compact Bible search, six viewport sizes and preserved causerie.')
