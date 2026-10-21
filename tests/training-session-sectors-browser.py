"""Find actual sessions by declared theme, objective and coach-written context."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local')
 page.evaluate("()=>{const base=structuredClone(currentTraining);trainingLibrary=[{...base,id:'press-test',title:'Pressing du mardi',themes:['Pressing','Défense'],notes:'Fermer la passe intérieure',date:'2026-10-20'},{...base,id:'keep-test',title:'Conservation du jeudi',themes:['Conservation','Technique'],notes:'Offrir deux angles au porteur',date:'2026-10-22'},{...base,id:'finish-test',title:'Finition du vendredi',themes:['Finition'],notes:'Attaquer le second poteau',date:'2026-10-23'}];renderTrainingLibrary();}")
 page.locator('#view-training').click();page.locator('#training-library-tab').click();assert page.locator('.training-session-sector').count()==3;assert page.locator('.training-saved-card').count()==3
 snapshot=page.evaluate('JSON.stringify(trainingLibrary)')
 page.locator('#training-session-theme-filter').select_option('Pressing');assert page.locator('.training-saved-card').count()==1;assert 'Fermer la passe intérieure' in page.locator('.training-saved-card').inner_text()
 page.locator('#training-session-objective-filter').select_option('finish');assert page.locator('.training-saved-card').count()==0;page.get_by_role('button',name='Réinitialiser les filtres',exact=True).click();assert page.locator('.training-saved-card').count()==3
 page.locator('#training-session-objective-filter').select_option('keep');assert page.locator('.training-saved-card').count()==1;assert 'Conservation du jeudi' in page.locator('.training-saved-card').inner_text()
 page.locator('#training-session-objective-filter').select_option('');page.locator('#training-library-search').fill('second poteau');assert page.locator('.training-saved-card').count()==1;assert 'Finition du vendredi' in page.locator('.training-saved-card').inner_text()
 assert page.evaluate('JSON.stringify(trainingLibrary)')==snapshot
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2');page.screenshot(path='/tmp/session-sectors-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS: sectors, combined theme/objective filters, objective text search, empty-state reset, immutable sessions and mobile.')
 b.close()
