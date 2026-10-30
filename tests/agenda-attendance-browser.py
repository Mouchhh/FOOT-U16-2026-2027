"""Week/category/coach filters, duplicate protection and validated persisted manual attendance."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof trainingApplyAttendance==='function'")
 page.evaluate("()=>{const base=newTraining();trainingLibrary=[['a','U17','Enzo','2026-10-20'],['b','U15','Hugo','2026-10-22'],['c','U17','Hugo','2026-10-28']].map(([id,category,coach,date])=>({...structuredClone(base),id,category,coach,date,title:'Séance '+id}));document.querySelector('#view-coach-agenda').click();workspaceFlows.agenda.go(1);document.querySelector('#coach-agenda-all').click();}")
 assert page.locator('.coach-agenda-card').count()==3
 page.locator('#agenda-calendar-filters>summary').click()
 page.locator('#coach-agenda-week').fill('2026-10-22');page.locator('#coach-agenda-week').blur();assert page.locator('.coach-agenda-card').count()==2
 page.locator('#coach-agenda-category').select_option('U17');assert page.locator('.coach-agenda-card').count()==1
 page.locator('#coach-agenda-author').select_option('Hugo');assert page.locator('.coach-agenda-card').count()==0
 page.locator('#coach-agenda-category').select_option('');assert page.locator('.coach-agenda-card').count()==1
 page.evaluate("()=>{currentTraining={...newTraining(),players:10,keepers:1,space:'full'};syncTrainingForm();squadPlayers=()=>[{id:'a',name:'Alex',position:'Milieu'},{id:'b',name:'Bastien',position:'Attaquant'},{id:'g',name:'Gabriel',position:'Gardien'},{id:'d',name:'Damien',position:'Défenseur'},{id:'e',name:'Enzo',position:'Milieu'}];document.querySelector('#view-training').click();trainingWizard.go(2);}")
 page.locator('#training-attendance-open').click();d=page.locator('#training-attendance-dialog')
 assert d.get_by_label('Réponse de Enzo',exact=True).input_value()=='uncertain'
 for name in ['Alex','Bastien','Gabriel']:d.get_by_label('Réponse de '+name,exact=True).select_option('present')
 d.get_by_label('Réponse de Damien',exact=True).select_option('absent')
 assert d.get_by_role('button',name='Valider l’effectif',exact=True).is_disabled()
 page.once('dialog',lambda dialog:dialog.dismiss());d.get_by_role('button',name='Fermer',exact=True).click();assert d.is_visible()
 d.get_by_role('button',name='Enregistrer les réponses',exact=True).click();assert page.evaluate('currentTraining.players')==10
 assert page.evaluate("currentTraining.attendance.rows.find(r=>r.name==='Enzo').status==='uncertain'&&!currentTraining.attendance.validatedAt")
 d.get_by_role('button',name='Fermer',exact=True).click();page.reload();page.wait_for_function("typeof trainingApplyAttendance==='function'")
 page.evaluate("document.querySelector('#view-training').click();trainingWizard.go(2)");page.locator('#training-attendance-open').click()
 assert d.get_by_label('Réponse de Alex',exact=True).input_value()=='present'
 d.get_by_label('J’ai vérifié les noms, les réponses et les gardiens.',exact=True).check()
 d.get_by_label('Réponse de Damien',exact=True).select_option('uncertain');assert d.get_by_role('button',name='Valider l’effectif',exact=True).is_disabled()
 d.get_by_label('Réponse de Damien',exact=True).select_option('absent');d.get_by_label('J’ai vérifié les noms, les réponses et les gardiens.',exact=True).check()
 page.evaluate("()=>{window.attendanceWriter=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};}")
 d.get_by_role('button',name='Valider l’effectif',exact=True).click();assert page.evaluate('currentTraining.players===10&&currentTraining.keepers===1')
 page.evaluate('()=>{coachStorageSet=attendanceWriter;}');d.get_by_role('button',name='Valider l’effectif',exact=True).click()
 assert page.evaluate('currentTraining.players===3&&currentTraining.keepers===1&&Boolean(currentTraining.attendance.validatedAt)')
 page.locator('#training-save').click();assert page.evaluate('trainingLibrary.some(s=>s.id===currentTraining.id&&Boolean(s.attendance?.validatedAt))')
 assert page.evaluate("trainingAttendanceCounts(currentTraining.attendance.rows).unknown===1&&trainingAttendanceCounts(currentTraining.attendance.rows).absent===1")
 assert page.evaluate("()=>{const source=structuredClone(currentTraining);const a=planningCopySession(source,'2026-11-02'),b=planningCopySession(source,'2026-11-02');const count=trainingLibrary.length;return !a.attendance&&!planningStoreCopies([a,b])&&trainingLibrary.length===count&&planningStoreCopies([a])&&!planningStoreCopies([b])&&trainingLibrary.length===count+1;}")
 page.locator('#training-date').fill(page.evaluate('planningAddDays(currentTraining.date,1)'));page.locator('#training-date').blur();assert 'à revalider' in page.locator('#training-attendance-summary').inner_text()
 page.locator('#training-attendance-open').click();assert d.get_by_label('Réponse de Alex',exact=True).input_value()=='uncertain'
 page.screenshot(path='/tmp/attendance-desktop.png');page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/tmp/attendance-mobile.png');assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2');d.get_by_role('button',name='Fermer',exact=True).click()
 assert not errors,errors
 b.close();print('PASS agenda/attendance: combined filters, explicit confirmation, unknown versus absent, saved pending answers/reload, storage rollback, keeper count, no copied answers, duplicate slots rejected, date invalidation and mobile.')
