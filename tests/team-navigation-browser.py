"""Visual context switcher, profile disclosure and settings dock on desktop/touch."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:3016/?mode=local');page.locator('#team-space-trigger').wait_for()
    assert not page.locator('.coach-team-picker').is_visible()
    assert not page.locator('header #coach-account-open').count()
    assert page.locator('#coach-account-open').is_visible()
    page.locator('#team-space-trigger').click()
    assert page.locator('.team-space-card[aria-pressed=true]').count()==1
    assert page.locator('#team-space-add').is_visible()
    page.locator('#team-space-trigger').press('Escape')
    assert not page.locator('#team-space-list').is_visible()
    page.locator('#coach-profile-trigger').hover();page.locator('#coach-profile-options').wait_for(state='visible')
    page.get_by_role('button',name='Mes Préférences',exact=True).click()
    assert page.locator('#account-tab-preferences').get_attribute('aria-selected')=='true'
    page.locator('#coach-account-dialog .external-modal-close').click()
    page.locator('#coach-account-dialog').wait_for(state='detached')
    page.locator('#coach-profile-trigger').click();page.locator('#coach-profile-options').get_by_role('button',name='Mon Profil',exact=True).click()
    assert page.locator('#account-tab-profile').get_attribute('aria-selected')=='true'
    page.locator('#coach-account-dialog').get_by_label('Prénom',exact=True).fill('Alex')
    page.locator('#coach-account-dialog').get_by_label('Nom',exact=True).fill('Martin')
    page.get_by_role('button',name='Enregistrer mon profil',exact=True).click()
    page.locator('#coach-account-dialog .external-modal-close').click()
    assert page.locator('.coach-profile-name').inner_text()=='Alex Martin'
    # Both menus are nonblocking, keyboard accessible and mutually exclusive.
    page.locator('#team-space-trigger').click()
    page.locator('#coach-profile-trigger').focus();page.locator('#coach-profile-trigger').press('ArrowDown')
    assert not page.locator('#team-space-list').is_visible()
    assert page.get_by_role('button',name='Mon Profil',exact=True).evaluate('e=>e===document.activeElement')
    page.keyboard.press('Escape')
    # Guard foreign draft writes while retaining the current team's stored payload.
    assert page.evaluate("""()=>{const old=coachStorageGet('vestiaire-report-draft');try{coachStorageSet('vestiaire-report-draft',JSON.stringify({...currentReport,teamContext:{id:'team-foreign',label:'Autre',category:'Autre',team:'Club'}}));return false}catch{return old===coachStorageGet('vestiaire-report-draft')}}""")
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844})
        page.locator('#team-space-trigger').click()
        assert page.locator('#team-space-list').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        box=page.locator('#team-space-list').bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
        page.locator('#team-space-trigger').press('Escape')
        page.locator('#coach-profile-trigger').click()
        assert page.locator('#coach-profile-options').is_visible()
        page.keyboard.press('Escape')
        gear=page.locator('#coach-account-open').bounding_box();assert gear['x']+gear['width']<=width and gear['height']>=44
        page.screenshot(path=f'/tmp/team-navigation-{width}.png')
    assert not errors,errors
    touch=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    phone=touch.new_page();phone.on('pageerror',lambda e:errors.append(str(e)))
    phone.goto('http://127.0.0.1:3016/?mode=local');phone.locator('#team-space-trigger').wait_for()
    phone.locator('#coach-profile-trigger').tap()
    assert phone.locator('#coach-profile-options').is_visible()
    phone.get_by_role('button',name='Mon Profil',exact=True).tap()
    assert phone.locator('#account-tab-profile').get_attribute('aria-selected')=='true'
    phone.locator('#coach-account-dialog .external-modal-close').tap()
    phone.evaluate("()=>{window.logoutCalls=0;clubNetworkBound=()=>true;clubNetworkLogout=async()=>{logoutCalls++}}")
    phone.locator('#coach-profile-trigger').tap()
    phone.get_by_role('button',name='Se Déconnecter',exact=True).tap()
    assert phone.evaluate('logoutCalls')==1
    assert not errors,errors
    touch.close()
    b.close()
print('Team cards, scoped draft guard, hover/click/keyboard profile, profile refresh, preferences and mobile passed')
