"""Long roster scrolls to the last player; panel lock and navigation still work."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768},user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.6 Safari/605.1.15');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('!!window.playerMonthlyReports')
 page.evaluate('()=>{squadSave(Array.from({length:30},(_,i)=>({id:"scroll-"+i,name:"Joueur "+(i+1),number:i+1,photo:"",position:"Milieu"})));workspaceNavigation.run("workspace-squad-entry");}')
 page.wait_for_function('!document.body.classList.contains("terrain-workflow-active")')
 for w,h in [(1366,768),(1440,900),(390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.evaluate('window.scrollTo(0,0)');page.mouse.move(w-80,h//2)
  page.mouse.wheel(0,600);page.wait_for_function('scrollY>100')
  page.mouse.wheel(0,20000)
  page.wait_for_function('(()=>{const r=document.querySelector("[data-player-id=scroll-29]").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight-(innerWidth>=1100?8:75)})()')
  assert page.locator('[data-player-id=scroll-29] .player-monthly-pdf').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=f'/tmp/squad-scroll-{w}.png')
 # Opening a player still locks the background, then closing restores page scrolling.
 page.locator('[data-player-id=scroll-29] .player-stat-profile-link').click()
 page.wait_for_function('document.body.classList.contains("workspace-panel-open")')
 assert page.evaluate('getComputedStyle(document.body).overflowY')=='hidden'
 page.locator('#player-stats-dialog .external-modal-close').click()
 page.wait_for_function('!document.body.classList.contains("workspace-panel-open")')
 page.evaluate('window.scrollTo(0,0)');page.mouse.move(300,500);page.mouse.wheel(0,800);page.wait_for_function('scrollY>100')
 page.evaluate('workspaceNavigation.run("view-home");workspaceNavigation.run("workspace-squad-entry")')
 page.wait_for_function('!document.body.classList.contains("terrain-workflow-active")')
 assert page.evaluate('getComputedStyle(document.body).overflowY')=='auto'
 assert not errors,errors;b.close();print('PASS: 30-player roster scrolls by wheel to last row and actions, short desktop/mobile, player sheet lock/unlock and repeat navigation. Chromium with Mac UA; native Safari not available.')
