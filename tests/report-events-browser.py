"""Stable event players; no manual/event double counts; editing/removal and real saves."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof renderReportEvents==="function" && window.workspaceSheets')
 page.locator('#view-reports').click()
 page.evaluate('''()=>{
  squadSave([{id:'event-a',name:'Alex',number:9,position:'Attaquant',photo:''},{id:'event-b',name:'Noé',number:8,position:'Milieu',photo:''},{id:'event-c',name:'Sam',number:6,position:'Milieu',photo:''}]);
  currentReport.info.date='2026-11-01';currentReport.title='Faits précis';
  currentReport.players=[{id:'row-a',squadPlayerId:'event-a',name:'Alex',number:'9',role:'Titulaire',minutes:'90',score:'',note:'',objective:'',goals:'1'}];
  reportTab='players';renderReportTabs();renderReportContent();
 }''')
 page.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click();event=page.locator('[data-event-index="0"]')
 assert event.get_by_label('Passeur décisif',exact=True).is_disabled()
 event.get_by_label('Buteur',exact=True).select_option('event-a');event.get_by_label('Passeur décisif',exact=True).select_option('event-b')
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-a").goals')=='1'
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-b").assists')=='1'
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-a").manualStatsBeforeEvents.goals')=='1'
 assert page.locator('[data-report-player="row-a"]').get_by_label('Buts',exact=True).is_editable()==False
 page.locator('#report-save').click();assert page.evaluate('reportValid(currentReport)')
 totals=page.evaluate("()=>{const s=playerStatsSeasonSnapshot(2026);return [s.players.get('event-a').totals.goals,s.players.get('event-b').totals.assists]}");assert totals==[1,1],totals
 # Assign the same field twice; this is an edit, not another contribution.
 event.get_by_label('Passeur décisif',exact=True).select_option('event-b');assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-b").assists')=='1'
 event.get_by_label('Buteur',exact=True).select_option('event-c')
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-a").goals')=='0'
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-c").goals')=='1'
 page.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click();second=page.locator('[data-event-index="1"]');second.get_by_label('Événement',exact=True).select_option('Carton');second.get_by_label('Joueur concerné',exact=True).select_option('event-b');second.get_by_label('Couleur du carton',exact=True).select_option('red')
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-b").redCards')=='1'
 second.get_by_label('Couleur du carton',exact=True).select_option('yellow');assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-b").redCards')=='0'
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-b").yellowCards')=='1'
 # Self-assist is rejected; optional no-assist remains valid.
 page.on('dialog',lambda d:d.accept());event.get_by_label('Passeur décisif',exact=True).select_option('event-c');assert page.evaluate('currentReport.events[0].assisterId')=='event-b'
 page.locator('#report-save').click();assert page.evaluate('reportLibrary.length')==1
 export=page.evaluate('buildReportDocument().textContent');assert 'Buteur : Sam' in export and 'Passe décisive : Noé' in export and 'Carton jaune' in export
 for width in (390,320):
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.get_by_role('button',name='Retirer le fait 1',exact=True).click();assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-c").goals')=='0'
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="event-b").assists')=='0'
 page.locator('#report-save').click();page.reload();page.wait_for_function('typeof reportEventCounts==="function" && typeof squadPlayers==="function"')
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('event-c').totals.goals")==0
 assert page.evaluate("playerStatsSeasonSnapshot(2026).players.get('event-b').totals.yellowCards")==1
 # Legacy free text remains valid and is exported without guessing player identity.
 assert page.evaluate("()=>{const r=newReport();r.events=[{minute:'10',type:'But pour',detail:'Ancien texte inchangé'}];return reportValid(r)&&reportEventDescription(r.events[0])==='Ancien texte inchangé';}")
 assert page.evaluate("()=>{const r=newReport();r.players=[{id:'old-c',squadPlayerId:'event-c',name:'Sam',number:'6',role:'Titulaire',minutes:'90',score:'',note:'',objective:'',goals:'1',eventStats:{goals:1}}];r.events=[{minute:'1',type:'But pour',detail:'',playerId:'event-c',playerName:'Sam'}];return reportEventsApply(r,[]).players[0].goals==='1'&&reportEventDescription(r.events[0],[]).includes('Sam');}")
 assert page.evaluate("!reportEventLinksValid({type:'But pour',playerId:'a',assisterId:'a'})&&!reportEventLinksValid({type:'Carton',card:'blue'})")
 assert not errors,errors
 b.close()
print('Goal/assist and card links, automatic rows, no double counts, corrections/removals, export, reload, legacy compatibility and mobile passed')
