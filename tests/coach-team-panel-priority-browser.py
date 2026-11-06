"""Regression: an existing workspace dialog must not make team setup inert."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('typeof coachFFFOpen==="function"')
 page.evaluate("""()=>{clubNetworkSession={user:{id:'priority-test'}};clubNetworkBound=()=>true;window.meta={};clubNetworkRequest=async(path,options={})=>{if(options.method==='PUT')Object.assign(meta,options.body.data);return {user_metadata:meta}};document.getElementById('editor').showModal();coachFFFOpen()}""")
 panel=page.locator('#coach-fff-setup');panel.wait_for()
 assert not panel.evaluate('(n)=>n.inert')
 assert page.locator('#editor').evaluate('(n)=>n.open && n.classList.contains("workspace-sheet-suspended")')
 # All clicks are real browser clicks, without force or directly invoking the handler.
 panel.get_by_role('button',name='Confirmer et ouvrir mon équipe',exact=True).click()
 assert panel.locator('.coach-fff-status').inner_text()
 # Closing setup restores the original editor and its content.
 panel.get_by_role('button',name='Plus tard',exact=True).click()
 page.wait_for_function('!document.getElementById("editor").classList.contains("workspace-sheet-suspended")')
 assert page.locator('#editor').is_visible()
 page.evaluate('coachFFFOpen()');panel=page.locator('#coach-fff-setup')
 panel.get_by_label('Catégorie',exact=True).select_option('U17')
 panel.get_by_label('Championnat / niveau',exact=True).fill('Départementale 1')
 panel.locator('summary').click()
 panel.get_by_label('Lien de l’équipe FFF',exact=True).fill('https://epreuves.fff.fr/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/classement')
 panel.get_by_label('Nom exact de l’équipe sur la FFF',exact=True).fill('Stade Mayennais U17')
 # A second legacy editor opening while setup is active must remain suspended.
 page.evaluate('document.getElementById("coach-editor").showModal()')
 assert not panel.evaluate('(n)=>n.inert')
 assert page.evaluate('document.getElementById("coach-fff-setup").contains(document.activeElement)')
 page.evaluate("()=>{coachFFFApplyProfiles=profiles=>{window.saved=profiles;throw Error('stop before reload')}}")
 panel.get_by_role('button',name='Confirmer et ouvrir mon équipe',exact=True).click()
 page.wait_for_function('window.saved?.length===1')
 assert page.evaluate('meta.stade_team_profiles_v1[0].fffProfile.sourceURL.endsWith("/classement")')
 assert not errors,errors;b.close()
print('PASS: setup remains clickable above existing/new dialogs, keyboard focus stays inside, prior editor restores and valid FFF team reaches save')
