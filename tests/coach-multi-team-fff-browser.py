"""Simulated FFF responses verify batch setup and the actual header team switch."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("""document.addEventListener('DOMContentLoaded',()=>{
 clubNetworkSession={user:{id:'multi-test'}};clubNetworkBound=()=>true;
 clubNetworkRequest=async(path,options={})=>{
  const meta=JSON.parse(localStorage.getItem('test-metadata')||'{}');
  if(path==='/auth/v1/user'){if(options.method==='PUT'){Object.assign(meta,options.body.data);localStorage.setItem('test-metadata',JSON.stringify(meta));}return {user_metadata:meta};}
  const sourceURL=options.body.sourceURL,category=sourceURL.includes('U15')?'U15':'U17',points=category==='U15'?15:17;
  const calls=JSON.parse(localStorage.getItem('test-requests')||'[]');calls.push(sourceURL);localStorage.setItem('test-requests',JSON.stringify(calls));
  if(localStorage.getItem('test-fail-fff')===category)throw Error('FFF offline fixture');
  return {sourceURL,fetchedAt:'2026-11-06T12:00:00Z',html:'<table><tr><th>Rg</th><th>Equipe</th><th>Pts</th></tr><tr><td>1</td><td>Stade Mayennais '+category+'</td><td>'+points+'</td></tr></table>'};
 };
 setTimeout(()=>document.dispatchEvent(new Event('club-session-ready')),0);
});""")
 page.goto('http://localhost:3016/?mode=local');page.wait_for_selector('#coach-fff-setup')
 panel=page.locator('#coach-fff-setup')
 def fill(category):
  panel.get_by_label('Catégorie',exact=True).select_option(category)
  panel.get_by_label('Championnat / niveau',exact=True).fill('Départementale 1' if category=='U17' else 'Départementale 2')
  panel.locator('summary').click()
  panel.get_by_label('Lien de l’équipe FFF',exact=True).fill('https://epreuves.fff.fr/competition/club/548126-st-mayennais-f-c/equipe/2026_test_'+category+'_1/saison')
  panel.get_by_label('Nom exact de l’équipe sur la FFF',exact=True).fill('Stade Mayennais '+category)
 fill('U17');panel.get_by_role('button',name='+ Ajouter une autre équipe',exact=True).click()
 assert panel.locator('.coach-fff-queued-team').count()==1
 fill('U15');panel.get_by_role('button',name='+ Ajouter une autre équipe',exact=True).click()
 assert panel.locator('.coach-fff-queued-team').count()==2
 # Duplicate links cannot create a third context.
 fill('U15');panel.get_by_role('button',name='+ Ajouter une autre équipe',exact=True).click()
 assert 'déjà dans votre sélection' in panel.inner_text()
 assert panel.locator('.coach-fff-queued-team').count()==2
 # Clear the unqueued duplicate, then open U15 after the batch save.
 page.evaluate("""()=>{const p=document.getElementById('coach-fff-setup');for(const name of ['Catégorie','Championnat / niveau','Lien de l’équipe FFF','Nom exact de l’équipe sur la FFF'])p.querySelector('[aria-label="'+name+'"]').value=''}""")
 panel.locator('.coach-fff-queued-team').nth(1).locator('input[type=radio]').check()
 panel.get_by_role('button',name='Enregistrer mes équipes et continuer',exact=True).click()
 page.wait_for_function('typeof homeFFFRead==="function" && activeCoachTeam.category==="U15" && homeFFFRead()?.rows[0].points===15')
 assert page.locator('#coach-fff-setup').count()==0
 assert page.evaluate("JSON.parse(localStorage.getItem('test-metadata')).stade_team_profiles_v1.length")==2
 assert 'U15' in page.locator('.home-fff-team-context').inner_text()
 assert 'Départementale 2' in page.locator('.home-fff-ranking h2').inner_text()
 key15=page.evaluate('coachStorageKey(homeFFFKey)')
 # The existing header drives the real team switch and its authentication refresh.
 page.locator('#team-space-trigger').click()
 page.locator('#team-space-list .team-space-card').filter(has_text='U17').click()
 page.wait_for_function('typeof homeFFFRead==="function" && activeCoachTeam.category==="U17" && homeFFFRead()?.rows[0].points===17')
 key17=page.evaluate('coachStorageKey(homeFFFKey)');assert key15!=key17
 assert page.locator('.home-fff-own').inner_text().endswith('—\t—\t—\t—\t—\t—\t—') or '17' in page.locator('.home-fff-own').inner_text()
 assert 'U17' in page.locator('.home-fff-team-context').inner_text()
 assert 'Départementale 1' in page.locator('.home-fff-ranking h2').inner_text()
 # Failed refresh of U15 keeps U15's cache, never U17's ranking.
 page.evaluate("localStorage.setItem('test-fail-fff','U15')")
 page.locator('#team-space-trigger').click();page.locator('#team-space-list .team-space-card').filter(has_text='U15').click()
 page.wait_for_function('typeof homeFFFRead==="function" && activeCoachTeam.category==="U15" && homeFFFRead()?.rows[0].points===15')
 page.wait_for_function("document.querySelector('.home-fff-ranking')?.textContent.includes('Actualisation FFF indisponible')")
 assert page.evaluate("JSON.parse(localStorage.getItem('test-requests')).slice(-1)[0].includes('U15')")
 assert page.evaluate("JSON.parse(localStorage.getItem(coachStorageKey(homeFFFKey))).rows[0].points")==15
 assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).rows[0].points',key17)==17
 assert not errors,errors;b.close()
print('PASS: multi-team batch setup, duplicate prevention, selected initial team, header switch, isolated FFF cache and offline fallback')
