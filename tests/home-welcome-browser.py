"""Personal greeting, real explicit save date and compact club home."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':768},timezone_id='America/New_York',reduced_motion='reduce');ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'hugo',name:'Hugo'}]));localStorage.setItem('vestiaire-active-coach','hugo');");page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_selector('#home-last-saved');assert page.locator('#home-greeting').inner_text()=='Bonjour Hugo.'
 assert 'Aucun document enregistré' in page.locator('#home-last-saved').inner_text();assert page.locator('#coach-profile').is_hidden();assert page.locator('#club-profile').is_hidden();assert page.locator('#home-work-quick .home-dashboard-card').count()==3
 # Updating a draft must not masquerade as an explicit save.
 page.evaluate("currentTraining.updatedAt=new Date().toISOString();saveTrainingDraft();renderClubHomeStats()");assert 'Aucun document enregistré' in page.locator('#home-last-saved').inner_text()
 page.evaluate("const entry={...newTraining(),updatedAt:'2026-10-20T12:15:00Z'};coachStorageSet('vestiaire-training-library',JSON.stringify([entry]));renderClubHomeStats()")
 assert '20 octobre 2026 à 14:15' in page.locator('#home-last-saved').inner_text();assert 'sur cet appareil' in page.locator('#home-last-saved').inner_text()
 assert page.evaluate("(()=>{const read=coachStorageGet;coachStorageGet=()=>{throw Error('quota')};try{return homeLastSavedLabel().includes('indisponible')}finally{coachStorageGet=read}})()")
 page.locator('#home-tools>summary').click();page.locator('#home-profile-settings>summary').click();assert page.locator('#coach-select').is_visible();page.locator('#home-profile-settings>summary').click();page.locator('#home-tools>summary').click()
 page.evaluate("window.homeOriginalBound=clubNetworkBound;window.homeOriginalMember=clubNetworkMember;clubNetworkBound=()=>true;clubNetworkMember={display_name:'Alice'};renderClubHomeStats()")
 assert page.locator('#home-greeting').inner_text()=='Bonjour Alice.'
 page.evaluate("clubNetworkBound=homeOriginalBound;clubNetworkMember=homeOriginalMember;renderClubHomeStats()")
 for w,h in [(320,740),(390,844),(844,390),(1366,768)]:
  page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h)
  if page.locator('#home-backdrop').is_visible():
   photo=page.locator('#home-backdrop').bounding_box();hero=page.locator('.home-hero').bounding_box();assert abs(photo['height']-hero['height'])<2 and abs(photo['y']-hero['y'])<2
 page.locator('#view-training').click();assert page.locator('.home-hero').is_hidden();page.locator('#view-home').click();assert page.locator('#home-greeting').inner_text()=='Bonjour Hugo.'
 assert not errors,errors;b.close()
print('PASS greeting per active/account coach, explicit local save time in Paris, draft exclusion, unavailable storage, retained profile controls and responsive bounded hero.')
