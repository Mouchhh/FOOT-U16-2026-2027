from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_selector('#settings-navigation-footer');gear=page.locator('#coach-account-open');menu=page.locator('#settings-menu')
 assert page.locator('#workspace-navigation #coach-account-open').count()==1
 rect=gear.bounding_box();assert rect['x']<176 and rect['y']>800
 gear.hover();menu.wait_for(state='visible')
 assert menu.locator('#settings-menu-options > button').all_text_contents()==['Préférences','Déconnexion']
 assert not page.locator('dialog[open]').count()
 menu.get_by_role('button',name='Préférences',exact=True).click()
 menu.get_by_label('Page d’accueil par défaut',exact=True).select_option('agenda');menu.get_by_label('Affichage compact',exact=True).check()
 menu.get_by_role('button',name='Enregistrer',exact=True).click()
 assert page.evaluate('coachAccountRead().preferences.startPage')=='agenda'
 assert page.evaluate('coachAccountRead().preferences.compact')
 assert not page.locator('dialog[open]').count()
 page.keyboard.press('Escape');assert not menu.is_visible()
 gear.press('ArrowDown');assert menu.get_by_role('button',name='Préférences',exact=True).evaluate('e=>document.activeElement===e')
 page.keyboard.press('Escape')
 # Failed preference write preserves the old selection.
 gear.click();menu.get_by_role('button',name='Préférences',exact=True).click()
 menu.get_by_label('Page d’accueil par défaut',exact=True).select_option('resources')
 page.evaluate("()=>{window.settingsSet=coachStorageSet;coachStorageSet=()=>{throw Error('quota')}}")
 menu.get_by_role('button',name='Enregistrer',exact=True).click()
 assert page.evaluate('coachAccountRead().preferences.startPage')=='agenda'
 assert 'impossible' in menu.locator('[role=status]').inner_text()
 page.evaluate('()=>{coachStorageSet=settingsSet}')
 page.keyboard.press('Escape')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});gear.click();assert menu.is_visible()
  box=menu.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert gear.bounding_box()['x']<70
  page.keyboard.press('Escape')
 # The action invokes the existing authenticated logout workflow, without a new dialog.
 page.evaluate('()=>{window.settingsLogouts=0;clubNetworkBound=()=>true;clubNetworkLogout=async()=>{settingsLogouts++}}')
 gear.click();menu.get_by_role('button',name='Déconnexion',exact=True).click();assert page.evaluate('settingsLogouts')==1
 assert not page.locator('dialog[open]').count()
 assert not errors,errors
 b.close()
print('Bottom-left settings, two options, hover/click/keyboard, inline preferences, save rollback, logout and responsive positioning passed')
