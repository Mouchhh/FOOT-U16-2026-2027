"""Direct attendance, opponent events, goal validation, minutes and yellow-card series."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.reportAttendanceInline && window.workspaceSheets')
 page.locator('#view-reports').click()
 page.evaluate("()=>{squadSave([{id:'rules-a',name:'Alex',number:9,position:'Attaquant',photo:''},{id:'rules-b',name:'Noé',number:8,position:'Milieu',photo:''}]);currentReport.info.date='2026-11-01';currentReport.info.opponent='Adversaire';renderReportContent()}")
 panel=page.locator('#report-attendance-inline');panel.locator(':scope > summary').click()
 create=panel.locator('.report-attendance-create');create.locator('summary').click()
 create.get_by_label('Date de la séance',exact=True).fill('2026-10-29')
 create.get_by_role('button',name='Créer et pointer cette séance',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==1
 panel.get_by_role('radio',name='Présent · Alex',exact=True).check()
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').attendance.rate")==100
 panel.get_by_role('radio',name='Absent · Noé',exact=True).check()
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-b').attendance.rate")==0
 panel.get_by_role('radio',name='Absent · Alex',exact=True).check()
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').attendance.rate")==0
 assert page.evaluate('trainingLibrary.length')==1
 panel.get_by_role('radio',name='Présent · Alex',exact=True).check()
 page.get_by_label('Buts marqués',exact=True).fill('1');page.get_by_label('Buts encaissés',exact=True).fill('1')
 page.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click()
 page.locator('#report-quick-validate').click()
 assert page.evaluate('reportLibrary.length')==0 and page.locator('#report-content').is_visible()
 assert 'sélectionnez un buteur' in page.locator('#report-goal-error').inner_text()
 event=page.locator('[data-event-index="0"]');event.get_by_label('Buteur',exact=True).select_option('rules-a');event.get_by_label('Passeur décisif',exact=True).select_option('rules-b')
 assert page.locator('#report-goal-error').inner_text()==''
 page.get_by_label('Minutes jouées · Alex',exact=True).fill('90')
 page.get_by_label('Minutes jouées · Noé',exact=True).fill('60')
 page.get_by_role('button',name='+ Fait adverse',exact=True).click()
 row=page.locator('[data-event-index="1"]');assert row.get_by_label('Événement',exact=True).input_value()=='But contre'
 assert row.get_by_label('Buteur',exact=True).count()==0
 page.get_by_role('button',name='+ Fait adverse',exact=True).click()
 row=page.locator('[data-event-index="2"]');row.get_by_label('Événement',exact=True).select_option('Carton adverse');row.get_by_label('Couleur du carton',exact=True).select_option('red')
 assert not row.get_by_label('Joueur concerné',exact=True).count()
 assert page.evaluate("reportEventDescription(currentReport.events[2])")=='Carton rouge'
 page.locator('#report-quick-validate').click();assert page.evaluate("document.body.classList.contains('home-mode')")
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').totals.minutes")==90
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').totals.goals")==1
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-b').totals.assists")==1
 assert page.evaluate("[...playerStatsSeasonSnapshot(2026).players.values()].every(s=>s.totals.redCards===0)")
 # Real saved report history feeds the compact warning and detail, with exact 10-match boundaries.
 page.evaluate('''()=>{
  window.makeDiscipline=(length,marks)=>Array.from({length},(_,i)=>{
   const r=newReport();r.id='discipline-'+i;r.info.date='2026-09-'+String(i+1).padStart(2,'0');r.players=[{id:'line-'+i,squadPlayerId:'rules-a',name:'Alex',number:'9',role:'Titulaire',minutes:'90',score:'',note:'',objective:'',yellowCards:String(marks.includes(i)?1:0),redCards:'0'}];return r;
  });
  reportLibrary=makeDiscipline(10,[0,2,9]);coachStorageSet('vestiaire-reports',JSON.stringify(reportLibrary));
 }''')
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').discipline.alert")
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').discipline.matches")==10
 page.locator('#workspace-squad-entry').click();card=page.locator('[data-player-id=rules-a]')
 assert '3 jaunes' in card.locator('.player-discipline-alert').inner_text()
 card.locator('.player-stat-profile-link').click();assert page.locator('#player-stats-dialog [role=alert]').is_visible()
 page.locator('#player-stats-dialog .external-modal-close').click()
 page.evaluate('()=>{reportLibrary=makeDiscipline(11,[0,2,9]);squadRender()}')
 assert not page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').discipline.alert")
 page.evaluate('()=>{reportLibrary=makeDiscipline(15,[5,9,14]);squadRender()}')
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').discipline.alert")
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('rules-a').discipline.matches")==10
 # Future reports and training reports cannot trigger a yellow-card match series.
 assert page.evaluate("()=>{const reports=makeDiscipline(3,[0,1,2]);reports.forEach(r=>r.eventType='training');return !playerStatsSeasonSnapshot(2026,{reports}).players.get('rules-a').discipline.alert}")
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('Attendance without agenda, instant correction, scorer blocking, opponent goals/cards, minute totals, discipline alert/details/10-match reset and mobile passed')
