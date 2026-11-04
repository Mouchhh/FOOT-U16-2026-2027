from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.squadProfileFields && window.documentEntry')
 page.evaluate("()=>{coachTeamDiscover({id:'team-roster-a',label:'Seniors',category:'Seniors',team:'Stade Mayennais'},true);coachTeamDiscover({id:'team-roster-b',label:'U17',category:'U17',team:'Stade Mayennais'},true);sessionStorage.setItem(coachTeamSelectionKey,'team-roster-a')}")
 page.reload();page.wait_for_function('window.squadProfileFields')
 page.evaluate("()=>squadSave([{id:'clean-a',name:'Alex Martin',number:9,photo:'',position:'Attaquant',primaryCategory:'U17',availability:'Disponible'},{id:'clean-b',name:'Noé Petit',number:8,photo:'',position:'Milieu',primaryCategory:'Seniors'}])")
 page.locator('#workspace-squad-entry').click();cards=page.locator('.squad-card[data-player-id]')
 assert cards.count()==2 and page.locator('#squad-team-filter').is_visible()
 assert page.locator('.squad-card-number').count()==0
 assert 'N°' not in page.locator('#coach-squad-dialog').inner_text()
 alex=page.locator('[data-player-id=clean-a]');assert alex.locator('.squad-primary-category').inner_text()=='U17';assert alex.locator('.squad-availability').inner_text()=='Disponible'
 alex.locator('.player-stat-profile-link').click();detail=page.locator('#player-stats-dialog');assert 'N°' not in detail.inner_text();assert detail.locator('.squad-primary-category').inner_text()=='U17'
 detail.locator('.external-modal-close').click()
 alex.locator('.player-stat-manage summary').click();alex.get_by_role('button',name='Modifier Alex Martin',exact=True).click()
 editor=page.locator('#coach-squad-editor');assert not editor.get_by_label('Numéro habituel',exact=True).is_visible()
 editor.get_by_label('Catégorie principale',exact=True).fill('U15');editor.get_by_label('Disponibilité',exact=True).select_option('Indisponible');editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click()
 assert page.evaluate("squadPlayers().find(p=>p.id==='clean-a').number")==9
 assert alex.locator('.squad-primary-category').inner_text()=='U15'
 page.get_by_label('Filtrer par catégorie principale',exact=True).select_option('U15');assert alex.is_visible();assert not page.locator('[data-player-id=clean-b]').is_visible()
 # Team switching retains per-team isolation rather than mixing players into a combined list.
 page.locator('#squad-team-filter').select_option('team-roster-b');page.wait_for_function('activeCoachTeam.id==="team-roster-b"')
 assert page.evaluate('squadPlayers().length')==0
 page.locator('#squad-team-filter').select_option('team-roster-a');page.wait_for_function('activeCoachTeam.id==="team-roster-a"')
 assert page.evaluate('squadPlayers().length')==2
 assert alex.locator('.squad-primary-category').inner_text()=='U15'
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert 'N°' not in page.locator('#coach-squad-dialog').inner_text()
 assert not errors,errors
 b.close()
print('No roster jersey labels, category/status cards and detail, editable metadata without number changes, category filter, team isolation/reload and mobile passed')
