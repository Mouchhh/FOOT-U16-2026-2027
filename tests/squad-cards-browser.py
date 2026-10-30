"""Squad cards, real position counts, optional preferred foot and safe deletion."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.squadWorkspace')
 page.evaluate("squadSave([{id:'a',name:'Guillaume',number:8,position:'Milieu',photo:'',foot:'Droit'},{id:'b',name:'Alex',number:1,position:'Gardien',photo:''},{id:'c',name:'Noé',number:4,position:'Défenseur',photo:''},{id:'d',name:'Sam',number:7,position:'Latéral',photo:''}])")
 page.locator('#workspace-squad-entry').click();cards=page.locator('.squad-page .squad-card');filters=page.get_by_role('group',name='Joueurs par poste',exact=True)
 assert page.locator('.squad-banner').is_visible();assert page.locator('.squad-banner').evaluate("e=>getComputedStyle(e).backgroundImage.includes('celebration-jeunes.jpg')")
 assert cards.count()==4;assert filters.get_by_role('button',name='Tous · 4',exact=True).get_attribute('aria-pressed')=='true';assert filters.get_by_role('button',name='Poste à préciser · 1',exact=True).is_visible()
 guillaume=cards.filter(has=page.get_by_text('Guillaume',exact=True));assert guillaume.locator('.roster-avatar').inner_text()=='G';assert 'Milieu · pied droit' in guillaume.inner_text()
 filters.get_by_role('button',name='Milieu · 1',exact=True).click();assert cards.count()==1;assert 'Guillaume' in cards.inner_text()
 page.get_by_label('Rechercher dans mes joueurs',exact=True).fill('Noé');assert cards.count()==0;page.get_by_label('Rechercher dans mes joueurs',exact=True).fill('');filters.get_by_role('button',name='Poste à préciser · 1',exact=True).click();assert cards.count()==1;assert 'Sam' in cards.inner_text()
 filters.get_by_role('button',name='Tous · 4',exact=True).click();page.get_by_role('button',name='Modifier Sam',exact=True).click();legacy=page.locator('#coach-squad-editor');assert legacy.get_by_label('Poste habituel',exact=True).input_value()=='Latéral';legacy.get_by_label('Pied préféré',exact=True).select_option('Les deux');legacy.get_by_role('button',name='Enregistrer le joueur',exact=True).click();assert page.evaluate("squadPlayers().find(p=>p.id==='d').position")=='Latéral'
 page.get_by_role('button',name='Modifier Noé',exact=True).click();editor=page.locator('#coach-squad-editor');editor.get_by_label('Pied préféré',exact=True).select_option('Gauche');editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();assert page.evaluate("squadPlayers().find(p=>p.id==='c').foot")=='Gauche'
 page.reload();page.wait_for_function("document.body.classList.contains('squad-mode')");assert 'pied gauche' in cards.filter(has=page.get_by_text('Noé',exact=True)).inner_text()
 for w,h in [(320,740),(390,844),(844,390),(1366,768)]:
  page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h)
  for card in cards.all():
   box=card.bounding_box();assert box['x']>=0 and box['x']+box['width']<=w+1,(w,h,box)
 page.on('dialog',lambda d:d.dismiss());page.get_by_role('button',name='Retirer Alex de mes joueurs',exact=True).click();assert cards.count()==4
 assert not errors,errors;b.close()
print('PASS squad cards, initials, exact position counts, legacy positions, search, preferred-foot save/reload, cancelled deletion and responsive grid.')
