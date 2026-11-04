"""Select real recurring sessions, persist pointage and update the individual report."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.playerAttendanceSessions && window.workspaceSheets')
 page.evaluate('''()=>{
  squadSave([{id:'attendance-a',name:'Alex',number:8,position:'Milieu',photo:''},{id:'attendance-b',name:'Noé',number:9,position:'Attaquant',photo:''}]);
  coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-09-01',to:'2026-09-30',category:'U17',statuses:{},slots:[{id:'test-recurring',day:2,type:'training',time:'19:00',title:'Entraînement récurrent',status:'pending'}]}));
  currentReport.info.date='2026-09-30';currentReport.players=[{id:'report-row',squadPlayerId:'attendance-a',name:'Alex',number:'8',role:'Titulaire',minutes:'90',score:'4',note:'Historique conservé',objective:'Ancien objectif'}];
  reportTab='players';renderReportTabs();renderReportContent();
 }''')
 page.locator('#view-reports').click()
 if page.locator('#document-entry-resume').is_visible():page.locator('#document-entry-resume').click()
 page.evaluate("()=>{reportTab='players';renderReportTabs();renderReportContent();}")
 card=page.locator('[data-report-player=report-row]')
 assert card.count()==1
 for text in ['Évaluation / 5','Observation individuelle','Objectif individuel']:assert text not in card.inner_text()
 assert page.evaluate('currentReport.players[0].score')=='4'
 before=page.evaluate('JSON.stringify(currentTraining)')
 card.get_by_role('button',name='Sélectionner les séances · calcul auto',exact=True).click();sheet=page.locator('#player-attendance-sessions');assert sheet.is_visible()
 choices=sheet.locator('.attendance-session-choice select');assert choices.count()==5
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('attendance-a').attendance.rate") is None
 choices.nth(0).select_option('present');choices.nth(1).select_option('absent');sheet.locator('input[type=checkbox]').check()
 # A failed library write must preserve answers and leave the sheet open.
 page.evaluate("()=>{window.attendanceWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-training-library')throw Error('quota');return window.attendanceWriter(k,v);};}")
 sheet.get_by_role('button',name='Enregistrer les présences',exact=True).click();assert sheet.is_visible();assert page.evaluate('trainingLibrary.length')==0
 page.evaluate('()=>{coachStorageSet=window.attendanceWriter;}');sheet.get_by_role('button',name='Enregistrer les présences',exact=True).click();sheet.wait_for(state='detached')
 assert card.get_by_label('Taux de présence (%)',exact=True).input_value()=='50'
 assert page.evaluate('trainingLibrary.length')==2
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('attendance-a').attendance.rate")==50
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('attendance-b').attendance.rate") is None
 assert page.evaluate('JSON.stringify(currentTraining)')==before
 # Reopen: responses survive; correcting one occurrence updates the same session.
 card.get_by_role('button',name='Sélectionner les séances · calcul auto',exact=True).click();choices=sheet.locator('.attendance-session-choice select');assert choices.nth(0).input_value()=='present'
 choices.nth(1).select_option('present');sheet.locator('input[type=checkbox]').check();sheet.get_by_role('button',name='Enregistrer les présences',exact=True).click();sheet.wait_for(state='detached')
 assert page.evaluate('trainingLibrary.length')==2 and card.get_by_label('Taux de présence (%)',exact=True).input_value()=='100'
 # Revalidate the occurrence at save time; deleted/moved slots cannot be silently materialized.
 card.get_by_role('button',name='Sélectionner les séances · calcul auto',exact=True).click();sheet.locator('.attendance-session-choice select').nth(2).select_option('present');sheet.locator('input[type=checkbox]').check()
 page.evaluate("()=>{const plan=agendaRecurringRead();plan.enabled=false;coachStorageSet(agendaRecurringKey,JSON.stringify(plan));}")
 sheet.get_by_role('button',name='Enregistrer les présences',exact=True).click();assert sheet.is_visible() and page.evaluate('trainingLibrary.length')==2
 page.on('dialog',lambda d:d.accept());sheet.get_by_role('button',name='Fermer les présences aux séances',exact=True).click()
 # Canonical pointage survives reload, with no recurrence-only absence.
 page.reload();page.wait_for_function('window.playerAttendanceSessions');assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('attendance-a').attendance.rate")==100
 page.evaluate("playerAttendanceSessions.open({playerId:'attendance-a',year:2026})")
 for width in (390,320):
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('Legacy inputs removed; recurring pointage selection, persistence, live rate, correction/dedup, failed save, stale occurrence guard and mobile passed')
