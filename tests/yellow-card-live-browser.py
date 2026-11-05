"""Live caution, threshold, chronological minute and saved roster alert."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('typeof playerDisciplineStatus === "function"')
 page.evaluate('''()=>{
 squadSave([{id:'discipline-test',name:'Alex test',number:9,photo:'',position:'Milieu',foot:'Droit'}]);
 const date=playerStatsNow().day;
 function history(days){const r=newReport();r.info.date=agendaCalendarAdd(date,-days);r.players=[{id:crypto.randomUUID(),squadPlayerId:'discipline-test',name:'Alex test',number:'9',role:'Titulaire',minutes:'90',score:'',note:'',objective:'',yellowCards:'1'}];r.title='Historique '+days;return r;}
 reportLibrary=[history(14),history(7)];currentReport=newReport();currentReport.info.date=date;currentReport.info.goalsFor='0';currentReport.info.goalsAgainst='0';currentReport.title='Contrôle discipline';workspaceNavigation.run('view-reports');reportTab='players';renderReportTabs();renderReportContent();
 }''')
 page.get_by_role('button',name='+ Carton jaune',exact=True).click()
 event=page.locator('[data-event-index="0"]');event.get_by_label('Minute',exact=True).fill('28');event.get_by_label('Joueur concerné',exact=True).select_option('discipline-test')
 assert page.evaluate('currentReport.players[0].yellowCards')=='1'
 assert page.locator('[data-event-index="0"] [aria-label="Minute"]').input_value()=='28'
 assert page.locator('.report-discipline-live .is-critical').is_visible()
 assert '3 jaunes' in page.locator('.report-discipline-live').inner_text()
 assert page.evaluate('reportLibrary.length')==2
 assert page.evaluate('playerStatsSeasonSnapshot(playerStatsSeason()).players.get("discipline-test").totals.yellowCards')==2
 page.evaluate("reportTab='preview';renderReportTabs();renderReportContent()")
 card=page.locator('.report-summary-event');assert card.locator('time').inner_text()=='28′';assert 'Carton jaune' in card.inner_text()
 assert page.locator('.report-discipline-live .is-critical').is_visible()
 page.evaluate("reportTab='players';renderReportTabs();renderReportContent()")
 event=page.locator('[data-event-index="0"]');event.get_by_label('Couleur du carton',exact=True).select_option('red')
 assert page.locator('.report-discipline-live .is-critical').count()==0
 event.get_by_label('Couleur du carton',exact=True).select_option('yellow')
 assert page.locator('.report-discipline-live .is-critical').is_visible()
 page.evaluate('window.historyBackup=reportLibrary;reportLibrary=[];renderReportContent()')
 assert '1 jaune' in page.locator('.report-discipline-live').inner_text();assert page.locator('.report-discipline-live .is-critical').count()==0
 page.evaluate('reportLibrary=historyBackup;renderReportContent()')
 page.locator('#report-next').click()
 assert page.evaluate('reportLibrary.some(r=>r.id===currentReport.id)')
 assert page.evaluate('reportDisciplinePreview(currentReport)[0].status.yellow')==3
 assert page.evaluate('''()=>{
  const series=(n,marks)=>Array.from({length:n},(_,i)=>({kind:'match',date:'2026-09-'+String(i+1).padStart(2,'0'),minutes:'90',role:'Titulaire',yellowCards:marks.includes(i)?'1':'0'}));
  return playerDisciplineStatus(series(10,[0,4,9])).alert && !playerDisciplineStatus(series(11,[0,4,9])).alert && playerDisciplineStatus(series(12,[2,5,11])).alert && !playerDisciplineStatus(series(13,[2,5,11])).alert && !playerDisciplineStatus(series(3,[0,1,2]).map(r=>({...r,kind:'training'}))).alert;
 }''')
 page.evaluate("workspaceNavigation.run('workspace-squad-entry')")
 assert '3 jaunes' in page.locator('[data-player-id="discipline-test"] .player-discipline-alert').inner_text()
 assert not errors,errors;b.close();print('PASS: live yellow 28th minute, first caution vs critical third caution, no draft aggregation, color correction, synthesis and saved roster alert.')
