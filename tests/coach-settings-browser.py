"""Four settings sections, local club directory, team editor handoffs and responsive closes."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce')
    page=context.new_page();errors=[];confirmations=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    def accept(dialog): confirmations.append(dialog.message);dialog.accept()
    page.on('dialog',accept)
    def ready(): page.wait_for_function('window.externalModalClose && typeof coachClubDetailsRead==="function" && window.workspaceFraming')
    def account(tab):
        page.locator('#coach-account-open').click();d=page.locator('#coach-account-dialog');d.get_by_role('tab',name=tab,exact=True).click();return d
    page.goto('http://127.0.0.1:3016/?mode=local');ready()
    d=account('Détails du club')
    assert d.get_by_role('tab').all_text_contents()==['Mon profil & sécurité','Détails du club','Catégories & équipes','Préférences & déconnexion']
    assert d.get_by_label('Nom du stade',exact=True).input_value()==''
    assert d.locator('.account-club-brand img').get_attribute('src')=='assets/club-logo.jpg'
    assert d.locator('.account-color-swatch').last.evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(228, 31, 40)'
    d.get_by_label('Ville',exact=True).fill('Mayenne');d.get_by_label('Nom du stade',exact=True).fill('Stade de test')
    d.get_by_label('E-mail du club',exact=True).fill('contact@example.test')
    first=d.locator('.account-club-contact').first;first.get_by_label('Nom du contact',exact=True).fill('Camille Test');first.get_by_label('Fonction',exact=True).fill('Secrétaire');first.get_by_label('Téléphone du contact',exact=True).fill('06 00 00 00 00')
    d.get_by_role('button',name='+ Ajouter un contact',exact=True).click();assert d.locator('.account-club-contact').count()==3
    d.locator('.account-club-contact').last.get_by_role('button',name='Retirer ce contact',exact=True).click()
    d.get_by_role('button',name='Enregistrer les détails du club',exact=True).click()
    assert page.evaluate('coachClubDetailsRead().contacts[0].name')=='Camille Test'
    assert page.evaluate('coachClubDetailsRead().stadium')=='Stade de test'
    # Failed local writes do not replace a successfully saved club directory.
    d.get_by_label('Ville',exact=True).fill('Non enregistrée')
    page.evaluate("()=>{window.settingsSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k===coachClubDetailsKey)throw Error('quota');return settingsSet(k,v)}}")
    d.get_by_role('button',name='Enregistrer les détails du club',exact=True).click()
    assert page.evaluate('coachClubDetailsRead().city')=='Mayenne'
    page.evaluate('()=>{coachStorageSet=settingsSet}')
    d.get_by_role('tab',name='Préférences & déconnexion',exact=True).click()
    assert d.get_by_role('button',name='Quitter le mode local',exact=True).is_visible()
    assert d.locator('#account-panel-notifications').count()==1 and d.locator('#account-panel-support').count()==1
    # Unsaved settings are explicitly discarded before leaving for the existing team editor.
    d.get_by_role('tab',name='Catégories & équipes',exact=True).click()
    page.remove_listener('dialog',accept);page.once('dialog',lambda message:message.dismiss())
    d.get_by_role('button',name='+ Ajouter une équipe',exact=True).click();assert d.is_visible() and page.locator('.coach-team-dialog').count()==0
    page.on('dialog',accept);d.get_by_role('button',name='+ Ajouter une équipe',exact=True).click()
    editor=page.locator('.coach-team-dialog');editor.wait_for();d.wait_for(state='detached');assert len(confirmations)==1
    editor.get_by_role('button',name='Fermer',exact=True).click();editor.wait_for(state='detached');d=page.locator('#coach-account-dialog');d.get_by_role('tab',name='Catégories & équipes',exact=True).wait_for()
    assert d.get_by_role('tab',name='Catégories & équipes',exact=True).get_attribute('aria-selected')=='true'
    d.get_by_role('button',name='+ Ajouter une équipe',exact=True).click();editor=page.locator('.coach-team-dialog')
    editor.get_by_label('Nom affiché (ex. Seniors A)',exact=True).fill('Équipe test');editor.get_by_label('Catégorie (ex. Seniors, U15)',exact=True).fill('U19');editor.get_by_label('Nom de l’équipe',exact=True).fill('Mon club')
    editor.get_by_role('button',name='Créer et ouvrir cette équipe',exact=True).click();page.wait_for_function("activeCoachTeam.label==='Équipe test'");ready()
    assert page.evaluate('coachClubDetailsRead().city')=='Mayenne'
    d=account('Catégories & équipes');assert d.locator('.account-team-active').count()==1
    # Editing another team uses that team's configuration, without overwriting the active team's identity.
    d.get_by_role('button',name='Modifier À classer',exact=True).click();editor=page.locator('.coach-team-dialog')
    assert editor.get_by_label('Nom affiché (ex. Seniors A)',exact=True).input_value()==''
    editor.get_by_label('Nom affiché (ex. Seniors A)',exact=True).fill('Groupe initial');editor.get_by_label('Catégorie (ex. Seniors, U15)',exact=True).fill('Loisirs')
    editor.get_by_role('button',name='Enregistrer mon équipe',exact=True).click();page.wait_for_function("activeCoachTeam.label==='Groupe initial'");ready()
    assert page.evaluate("coachTeams.find(t=>t.label==='Équipe test').category")=='U19'
    d=account('Catégories & équipes');d.get_by_role('button',name='Sélectionner Équipe test',exact=True).click()
    page.wait_for_function("activeCoachTeam.label==='Équipe test'");ready()
    for width in [1366,390,320]:
        page.set_viewport_size({'width':width,'height':844});d=account('Détails du club');cross=d.locator('.external-modal-close');cross.wait_for()
        assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        box=cross.bounding_box();panel=d.bounding_box();assert box['y']>=0 and box['y']+box['height']<=panel['y']+2
        assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=f'/tmp/coach-settings-{width}.png')
        d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    assert not errors,errors
    browser.close()
print('Four settings sections, club contacts persistence/quota, shared team directory, guarded editor handoff/cancel, editing another team and responsive external red closes passed')
