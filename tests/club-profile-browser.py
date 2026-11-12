"""Account menu, team deletion, club colours/logo applied to the site, club photo library used by causeries."""
import base64
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.clubTheme && !!window.clubPhotoLibrary')
 # Account menu: only « Mon profil ».
 page.locator('#coach-profile-trigger').click();assert page.locator('#coach-profile-options button').all_inner_texts()==['Mon profil']
 page.keyboard.press('Escape')
 # Team deletion: active team B is deleted with its documents and never comes back.
 page.evaluate("""()=>{const t=[{id:'unassigned',label:'À classer',category:'',team:''},{id:'team-test-a',label:'Test A',category:'U14',team:'Stade Mayennais'},{id:'team-test-b',label:'Test B',category:'U15',team:'Stade Mayennais'}];
  localStorage.setItem(coachTeamManifestKey,JSON.stringify(t));localStorage.setItem(coachTeamBaseKey('vestiaire-reports')+':team:team-test-b',JSON.stringify([{id:'r1',teamContext:t[2]},{id:'r2',teamContext:t[2]}]));
  sessionStorage.setItem(coachTeamSelectionKey,'team-test-b');}""")
 page.reload();page.wait_for_function('activeCoachTeam.id==="team-test-b"')
 page.locator('#team-space-trigger').click();page.get_by_role('button',name='Supprimer l’équipe Test B',exact=True).click()
 dialog=page.locator('.coach-team-delete');assert '2 document' in dialog.inner_text() or '3 document' in dialog.inner_text()
 dialog.get_by_role('button',name='Supprimer définitivement',exact=True).click()
 page.wait_for_function('activeCoachTeam.id==="team-test-a"')
 assert page.evaluate("Object.keys(localStorage).filter(k=>k.endsWith(':team:team-test-b')).length")==0
 page.reload();page.wait_for_function('typeof coachTeams!=="undefined"');assert 'team-test-b' not in page.evaluate('coachTeams.map(t=>t.id)')
 # Club colours and logo through the real form.
 page.evaluate("coachAccountOpen('club')");d=page.locator('#coach-account-dialog')
 d.get_by_label('Couleur principale',exact=True).fill('#0a7a3d');d.get_by_label('Couleur secondaire',exact=True).fill('#ffeb3b')
 assert 'Assombrie' in d.locator('.account-club-identity').inner_text()
 png=page.evaluate("()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#0a7a3d';x.fillRect(0,0,64,64);return c.toDataURL('image/png').split(',')[1]}")
 d.get_by_label('Logo du club',exact=True).set_input_files({'name':'logo.png','mimeType':'image/png','buffer':base64.b64decode(png)})
 page.wait_for_timeout(400);d.get_by_role('button',name='Enregistrer les détails du club',exact=True).click()
 assert page.evaluate("coachClubDetailsRead().primaryColor")=='#0a7a3d'
 assert page.evaluate("getComputedStyle(document.querySelector('button.primary')).backgroundColor")=='rgb(10, 122, 61)'
 assert page.evaluate("document.querySelector('header img').getAttribute('src').startsWith('data:image/')")
 page.reload();page.wait_for_function('!!window.clubTheme');page.wait_for_load_state('load')
 assert page.evaluate("getComputedStyle(document.querySelector('button.primary')).backgroundColor")=='rgb(10, 122, 61)'
 # Photo library feeds the causerie slides.
 page.evaluate("coachAccountOpen('club')")
 jpg=page.evaluate("()=>{const c=document.createElement('canvas');c.width=400;c.height=300;const x=c.getContext('2d');x.fillStyle='#c62828';x.fillRect(0,0,400,300);return c.toDataURL('image/jpeg').split(',')[1]}")
 d.get_by_label('Ajouter des photos à la bibliothèque du club',exact=True).set_input_files([{'name':'a.jpg','mimeType':'image/jpeg','buffer':base64.b64decode(jpg)}])
 page.wait_for_function('clubPhotoLibrary.cached().length===1');assert d.locator('.club-photo-item').count()==1
 pixel=page.evaluate("""async()=>{const r=await causerieExportPhotos.resolve(causerieExportPhotos.capture());const i=new Image();i.src=r[1].landscape;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);return [...x.getImageData(5,5,1,1).data].slice(0,3)}""")
 assert pixel[0]>150 and pixel[1]<80,pixel
 # Back to the original colours and logo.
 d.get_by_role('button',name='Couleurs d’origine',exact=True).click();d.get_by_role('button',name='Retirer le logo',exact=True).click()
 d.get_by_role('button',name='Enregistrer les détails du club',exact=True).click()
 assert page.evaluate("getComputedStyle(document.querySelector('button.primary')).backgroundColor")=='rgb(40, 85, 162)'
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors;b.close();print('PASS: account menu, team deletion, club colours/logo, photo library in causeries, mobile.')
