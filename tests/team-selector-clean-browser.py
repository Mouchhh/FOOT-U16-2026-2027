from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.locator('#team-space-trigger').wait_for();page.locator('#team-space-trigger').click()
 assert 'À classer' not in page.locator('.team-space-picker').inner_text()
 assert page.locator('#team-space-list button').all_text_contents()==['+ Ajouter une équipe']
 page.keyboard.press('Escape')
 page.evaluate("()=>{coachTeamDiscover({id:'team-test-senior',label:'Seniors',category:'Seniors',team:'Stade Mayennais'},true);coachTeamDiscover({id:'team-test-u17',label:'U17',category:'U17',team:'Stade Mayennais'},true);sessionStorage.setItem(coachTeamSelectionKey,'team-test-senior')}")
 page.reload();page.locator('#team-space-trigger').wait_for()
 page.evaluate("()=>{currentReport.info.date='2026-11-01';currentReport.info.opponent='Équipe Seniors';saveReport()}")
 page.locator('#team-space-trigger').click();menu=page.locator('#team-space-list')
 assert menu.locator('button').all_text_contents()==['Seniors','U17','+ Ajouter une équipe']
 assert menu.locator('.team-space-card[aria-pressed=true]').inner_text()=='Seniors'
 menu.get_by_role('button',name='U17',exact=True).click();page.wait_for_function('activeCoachTeam.id==="team-test-u17"')
 assert page.evaluate('reportLibrary.length')==0
 page.locator('#team-space-trigger').click();menu.get_by_role('button',name='Seniors',exact=True).click();page.wait_for_function('activeCoachTeam.id==="team-test-senior"')
 assert page.evaluate('reportLibrary[0].info.opponent')=='Équipe Seniors'
 for width in [1366,900,390,320]:
  page.set_viewport_size({'width':width,'height':844});page.locator('#team-space-trigger').click()
  assert 'À classer' not in menu.inner_text() and 'Configurer' not in menu.inner_text()
  assert menu.locator('button').count()==3
  box=menu.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.keyboard.press('Escape')
 assert not errors,errors
 b.close()
print('Created teams only, neutral empty state, no configuration entry, team switch isolation, preserved saved report and responsive dropdown passed')
