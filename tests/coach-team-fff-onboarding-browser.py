"""Simulated authenticated onboarding; no live FFF results are invented."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('typeof coachFFFEnsure==="function"')
 page.evaluate("""()=>{window.mockMetadata={};window.calls=[];clubNetworkSession={user:{id:'test-coach'}};clubNetworkBound=()=>true;clubNetworkRequest=async(path,options={})=>{calls.push({path,options});if(path==='/auth/v1/user'){if(options.method==='PUT')mockMetadata={...mockMetadata,...options.body.data};return {user_metadata:mockMetadata}};return {html:'<a href="/competition/club/548126-st-mayennais-f-c/equipe/2026_test_U17_1/saison">Stade Mayennais U17 1 D1</a><a href="/competition/club/548126-st-mayennais-f-c/equipe/2026_test_U15_1/saison">Stade Mayennais U15</a>'}};document.dispatchEvent(new Event('club-session-ready'))}""")
 page.wait_for_selector('#coach-fff-setup')
 panel=page.locator('#coach-fff-setup')
 assert panel.get_by_label('Club',exact=True).input_value()=='Stade Mayennais'
 panel.get_by_label('Catégorie',exact=True).select_option('U17')
 panel.get_by_label('Championnat / niveau',exact=True).fill('Départementale 1')
 page.screenshot(path='/tmp/stade-coach-team-setup.png')
 panel.get_by_role('button',name='Rechercher mon équipe sur la FFF').click()
 select=panel.get_by_label('Équipe officielle trouvée',exact=True)
 assert select.locator('option').count()==2
 # Both FFF team page variants resolve to a single choice, preferring standings.
 assert page.evaluate("""()=>coachFFFCandidates('<a href=\"/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/saison\">U17</a><a href=\"/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/classement\">U17 D1</a>',agendaFFFDefault,'U17').map(c=>c.url)""")==['https://epreuves.fff.fr/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/classement']
 # Discovery must never silently choose a side.
 assert select.input_value()==''
 select.select_option(index=1)
 # A changed detail invalidates previously returned results and selection.
 panel.get_by_label('Numéro de l’équipe',exact=True).fill('2')
 assert panel.get_by_label('Lien de l’équipe FFF',exact=True).input_value()==''
 panel.get_by_label('Numéro de l’équipe',exact=True).fill('1')
 panel.get_by_role('button',name='Rechercher mon équipe sur la FFF').click()
 panel.get_by_label('Équipe officielle trouvée',exact=True).select_option(index=1)
 # Prevent reload for inspection of the remote payload and frozen-context write.
 page.evaluate("()=>{coachFFFApplyProfiles=(profiles)=>{window.savedProfiles=profiles;throw Error('stop before reload')}}")
 panel.get_by_role('button',name='Confirmer et ouvrir mon équipe').click()
 page.wait_for_function('window.savedProfiles?.length===1')
 profile=page.evaluate('savedProfiles[0]');assert profile['fffProfile']['number']==1
 assert profile['fffProfile']['level']=='Départementale 1'
 assert profile['fffProfile']['officialName']=='Stade Mayennais U17 1 D1'
 assert page.evaluate('mockMetadata.stade_team_profiles_v1.length')==1
 assert page.evaluate("coachFFFProfileValid(savedProfiles[0])")
 assert not page.evaluate("coachFFFProfileValid({...savedProfiles[0],fffProfile:{...savedProfiles[0].fffProfile,sourceURL:'https://evil.example'}})")
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':850});assert panel.evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
 panel.get_by_role('button',name='Plus tard',exact=True).click()
 # Already configured active team must not reopen onboarding on reconnect.
 page.evaluate("""()=>{localStorage.setItem(coachTeamManifestKey,JSON.stringify(savedProfiles));sessionStorage.setItem(coachTeamSelectionKey,savedProfiles[0].id)}""")
 page.reload();page.wait_for_function('typeof coachFFFEnsure==="function"')
 page.evaluate("""()=>{clubNetworkSession={user:{id:'test-coach'}};clubNetworkBound=()=>true;clubNetworkRequest=async()=>{throw Error('FFF unavailable in fixture')};document.dispatchEvent(new Event('club-session-ready'))}""")
 page.wait_for_timeout(150);assert page.locator('#coach-fff-setup').count()==0
 # A fresh browser restores the account profile without asking the questions again.
 other=b.new_page();other.goto('http://localhost:3016/?mode=local');other.wait_for_function('typeof coachFFFEnsure==="function"')
 remote={**profile,'id':'team-restored-test','category':'U15','label':'U15'}
 other.evaluate("""profile=>{clubNetworkSession={user:{id:'test-coach'}};clubNetworkBound=()=>true;clubNetworkRequest=async()=>({user_metadata:{stade_team_profiles_v1:[profile],stade_active_team_v1:profile.id}});document.dispatchEvent(new Event('club-session-ready'))}""",remote)
 other.wait_for_function('typeof coachFFFSource==="function" && activeCoachTeam.id==="team-restored-test"')
 assert other.evaluate('coachFFFSource()')==profile['fffProfile']['sourceURL']
 assert other.locator('#coach-fff-setup').count()==0
 assert not errors,errors;b.close()
print('PASS: first-login setup, detailed profile, FFF discovery/explicit confirmation, invalidated stale selection, cloud persistence, mobile and no repeated setup')
