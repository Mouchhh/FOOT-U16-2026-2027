"""Saving the coach's team must not depend on FFF availability or fail silently."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("""document.addEventListener('DOMContentLoaded',()=>{
 clubNetworkSession={user:{id:'feedback-test'}};clubNetworkBound=()=>true;
 clubNetworkRequest=async(path,options={})=>{
  if(path==='/auth/v1/user'){
   if(options.method==='PUT'){
    if(window.testSaveFails){const e=Error('Rejected');e.status=422;e.code='test_validation';throw e;}
    localStorage.setItem('test-metadata',JSON.stringify(options.body.data));
   }
   return {user_metadata:JSON.parse(localStorage.getItem('test-metadata')||'{}')};
  }
  throw Error('FFF offline');
 };
 setTimeout(()=>document.dispatchEvent(new Event('club-session-ready')),0);
});""")
 page.goto('http://localhost:3016/?mode=local');page.wait_for_selector('#coach-fff-setup')
 panel=page.locator('#coach-fff-setup');save=panel.get_by_role('button',name='Confirmer et ouvrir mon équipe',exact=True)
 save.click();assert 'Vérifiez le champ' in panel.locator('.coach-fff-status').inner_text()
 panel.get_by_label('Catégorie',exact=True).select_option('U17')
 panel.get_by_label('Championnat / niveau',exact=True).fill('Départementale 1')
 # An expired owner check must explain the refusal instead of silently returning.
 page.evaluate('clubNetworkBound=()=>false');save.click()
 assert 'a changé' in panel.locator('.coach-fff-status').inner_text()
 page.evaluate('clubNetworkBound=()=>true')
 # API failures are visible and allow retry without clearing the form.
 page.evaluate('window.testSaveFails=true');save.click()
 page.wait_for_function("document.querySelector('.coach-fff-status').textContent.includes('HTTP 422')")
 assert save.is_enabled()
 assert panel.get_by_label('Championnat / niveau',exact=True).input_value()=='Départementale 1'
 # No FFF link is required; saving works while the FFF service is unavailable.
 page.evaluate('window.testSaveFails=false');save.click()
 page.wait_for_function('typeof coachFFFSource==="function" && coachFFFProfileValid(activeCoachTeam) && activeCoachTeam.fffProfile.sourceURL===""')
 assert page.locator('#coach-fff-setup').count()==0
 assert page.evaluate("JSON.parse(localStorage.getItem('test-metadata')).stade_team_profiles_v1.length")==1
 assert page.evaluate("homeFFFDefaultURL()")==''
 assert 'Équipe enregistrée' in page.locator('.home-fff-ranking').inner_text()
 # An explicit route back to the FFF association stays available.
 page.get_by_role('button',name='Mon équipe FFF',exact=True).click()
 panel=page.locator('#coach-fff-setup');assert panel.get_by_label('Catégorie',exact=True).input_value()=='U17'
 assert not errors,errors;b.close()
print('PASS: visible field/API errors, retained input, retry and team save without FFF, no repeated setup and later association')
