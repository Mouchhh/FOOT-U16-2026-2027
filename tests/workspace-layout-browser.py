"""Laptop workspace: compact chrome, no page scrolling for setup, collapsible menu."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.locator('#view-training').click();page.wait_for_timeout(350)
 assert page.locator('#coach-profile').is_hidden();assert page.locator('#club-account-bar').is_hidden();assert page.locator('#club-profile').bounding_box()['y']<115;assert page.locator('#training-title').bounding_box()['y']<440
 for step in range(3):
  page.locator('#training-step-link-'+str(step)).click();page.wait_for_timeout(100);metrics=page.locator('#training-step-'+str(step)).evaluate('(e)=>({height:e.clientHeight,content:e.scrollHeight})');print('Step',step+1,metrics)
  assert metrics['content']<=metrics['height']+2,metrics
  assert page.evaluate('Math.abs(scrollY)<2');assert page.evaluate('document.documentElement.scrollHeight<=innerHeight+2');assert page.locator('#training-next').bounding_box()['y']<740
 before=page.locator('#training-space').bounding_box()['height'];page.locator('#workspace-menu-toggle').click();assert page.locator('#workspace-navigation').is_hidden();page.wait_for_timeout(100);assert page.locator('#training-space').bounding_box()['height']>before;assert page.locator('#workspace-menu-toggle').get_attribute('aria-expanded')=='false';page.locator('#workspace-menu-toggle').click();assert page.locator('#workspace-navigation').is_visible()
 page.locator('#view-reports').click();assert page.locator('#coach-profile').is_hidden();assert page.locator('#club-profile').bounding_box()['y']<115;page.locator('#view-coach-agenda').click();assert page.locator('#coach-profile').is_hidden();page.locator('#view-pitch').click();assert page.locator('#coach-profile').is_hidden();page.locator('#view-home').click();assert page.locator('#coach-profile').is_visible()
 page.set_viewport_size({'width':390,'height':844});page.locator('#view-training').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.locator('#workspace-menu-toggle').is_visible();assert page.locator('#workspace-menu-toggle').bounding_box()['y']<52;page.locator('#workspace-menu-toggle').click();assert page.locator('#workspace-navigation').is_hidden();page.locator('#workspace-menu-toggle').click();assert page.locator('#workspace-navigation').is_visible();assert not errors,errors
 print('PASS: compact laptop forms fit without scrolling, team at top, home-only coach/account panels, expandable menu, all work views and mobile.')
 b.close()
