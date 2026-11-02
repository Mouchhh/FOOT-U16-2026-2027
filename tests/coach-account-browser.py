from playwright.sync_api import sync_playwright
from io import BytesIO
from PIL import Image
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=b.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce');page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.externalModalClose && typeof coachAccountOpen==="function"')
    page.locator('#coach-account-open').click();d=page.locator('#coach-account-dialog');d.locator('.external-modal-close').wait_for()
    assert d.get_by_role('tab').count()==4
    d.get_by_label('Prénom',exact=True).fill('Alex');d.get_by_label('Nom',exact=True).fill('Martin');d.get_by_label('Rôle',exact=True).fill('Entraîneur Équipe Première');d.get_by_label('E-mail de contact',exact=True).fill('coach@example.test');d.get_by_label('Téléphone',exact=True).fill('+33 6 00 00 00 00')
    image=Image.new('RGB',(60,60),'blue');data=BytesIO();image.save(data,format='PNG');d.get_by_label('Photo du coach',exact=True).set_input_files({'name':'portrait.png','mimeType':'image/png','buffer':data.getvalue()})
    page.wait_for_function("document.querySelector('.account-photo img').src.startsWith('data:image/jpeg')")
    d.get_by_role('button',name='Enregistrer mon profil',exact=True).click()
    assert page.evaluate('coachAccountRead().profile.firstName')=='Alex'
    assert page.evaluate("document.getElementById('home-greeting').textContent")=='Bonjour Alex Martin.'
    d.get_by_role('tab',name='Préférences & déconnexion',exact=True).click();d.locator('#account-start-page').select_option('agenda');d.get_by_label('Affichage compact',exact=True).check();d.get_by_label('Réduire les animations et défilements',exact=True).check();d.get_by_role('button',name='Enregistrer mes préférences',exact=True).click()
    assert page.evaluate("document.body.classList.contains('coach-compact')&&document.body.classList.contains('coach-reduced-motion')")
    d.get_by_role('tab',name='Mon profil & sécurité',exact=True).click();assert d.get_by_role('button',name='Modifier mon mot de passe').is_disabled()
    d.get_by_role('tab',name='Préférences & déconnexion',exact=True).click();d.locator('summary').filter(has_text='Signaler un problème').click();d.get_by_label('Décrire le problème',exact=True).fill('Le bouton est masqué sur téléphone.')
    href=d.get_by_role('link',name='Préparer un signalement',exact=True).get_attribute('href');assert href.startswith('https://github.com/Mouchhh/FOOT-U16-2026-2027/issues/new?') and 'access_token' not in href and 'coach%40example' not in href
    d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    other=context.new_page();other.goto('http://127.0.0.1:3016/?mode=local');other.wait_for_function("history.state?.clubNavigation?.page.view==='agenda'")
    assert other.evaluate('workspaceFlows.agenda.index()')==1
    assert other.evaluate('coachAccountRead().profile.photo.startsWith("data:image/jpeg")')
    other.close()
    # Saving failures must not apply a different preference.
    page.locator('#coach-account-open').click();d=page.locator('#coach-account-dialog');d.get_by_role('tab',name='Préférences & déconnexion',exact=True).click();d.locator('#account-start-page').select_option('resources')
    page.evaluate("()=>{window.accountRealSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k===coachAccountKey)throw new DOMException('quota','QuotaExceededError');return accountRealSet(k,v)}}")
    d.get_by_role('button',name='Enregistrer mes préférences',exact=True).click();assert page.evaluate('coachAccountDefaultPage()')=='agenda';page.evaluate('()=>{coachStorageSet=accountRealSet}')
    d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    # Exercise the actual security workflow with a stubbed auth transport; never contact a live account.
    page.evaluate("""()=>{window.realAccountBound=clubNetworkBound;window.realAccountRequest=clubNetworkRequest;window.realAccountStore=clubNetworkStoreSession;window.realAccountSession=clubNetworkSession;clubNetworkBound=()=>true;clubNetworkSession={user:{id:'account-test',email:'login@example.test'}};window.authCalls=[];clubNetworkStoreSession=s=>clubNetworkSession=s;clubNetworkRequest=async(path,options)=>{authCalls.push({path,options});if(path.includes('token'))return {user:{id:'account-test',email:'login@example.test'},access_token:'test-token'};return {id:'account-test'}}}""")
    page.locator('#coach-account-open').click();d=page.locator('#coach-account-dialog');d.get_by_role('tab',name='Mon profil & sécurité',exact=True).click()
    d.get_by_label('Mot de passe actuel',exact=True).fill('old-test-password');d.get_by_label('Nouveau mot de passe',exact=True).fill('new-test-password');d.get_by_label('Confirmer le nouveau mot de passe',exact=True).fill('new-test-password');d.get_by_role('button',name='Modifier mon mot de passe',exact=True).click()
    page.wait_for_function("document.getElementById('account-panel-security').textContent.includes('Mot de passe modifié.')")
    assert page.evaluate('authCalls.length')==2
    assert d.get_by_label('Nouveau mot de passe',exact=True).input_value()==''
    assert page.evaluate("Object.values(localStorage).every(v=>!v.includes('new-test-password')&&!v.includes('old-test-password'))")
    d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    page.evaluate('clubNetworkBound=realAccountBound;clubNetworkRequest=realAccountRequest;clubNetworkStoreSession=realAccountStore;clubNetworkSession=realAccountSession')
    # In-page reminders are explicit, use Paris appointment times, and do not repeat.
    page.evaluate("coachAccountSaveSection('notifications',{training:true,match:false,lead:30,browser:false})")
    page.evaluate("""()=>{window.accountRealNotify=notify;window.reminders=[];notify=x=>reminders.push(x);const library=trainingLibrary,week=document.getElementById('coach-agenda-week'),previous=week.value;const s=newTraining();s.title='Collectif';s.date='2026-11-02';s.time='18:30';trainingLibrary=[s];week.value='2027-01-04';window.filteredReminderCount=agendaCalendarEvents().filter(e=>e.kind==='training').length;coachAccountCheckReminders(new Date('2026-11-02T17:10:00Z'));coachAccountCheckReminders(new Date('2026-11-02T17:10:00Z'));trainingLibrary=library;week.value=previous;notify=accountRealNotify}""")
    assert page.evaluate('filteredReminderCount')==0
    assert page.evaluate('reminders.length')==1
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844});page.locator('#coach-account-open').click();d=page.locator('#coach-account-dialog');cross=d.locator('.external-modal-close');cross.wait_for()
        assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
        page.screenshot(path=f'/tmp/coach-account-{width}.png')
        d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    assert not errors,errors
    b.close()
print('Account tabs, profile/photo, preferences/start page, quota, real auth workflow with mocked transport, reminders, support URL and mobile red closes passed')
