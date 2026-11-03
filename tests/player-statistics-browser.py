"""Season/team statistics from saved documents; real inputs, persistence and modal UI."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof playerStatsSeasonSnapshot==="function"&&document.getElementById("player-stats-season")')
 results=page.evaluate("""()=>{
  const roster=[{id:'stats-a',name:'Alex Martin',number:9,photo:'',position:'Attaquant',foot:'Droit'},{id:'stats-b',name:'Alex Martin',number:10,photo:'',position:'Milieu',foot:'Gauche'},{id:'stats-c',name:'Camille',number:5,photo:'',position:'Défenseur',foot:''}];squadSave(roster);
  const row=(id,stats={})=>({id:'slot-'+id,name:roster.find(p=>p.id===id)?.name||'Sans fiche',number:String(roster.find(p=>p.id===id)?.number||1),role:'Titulaire',minutes:'',score:'',note:'',objective:'',squadPlayerId:id,...stats});
  const report=(id,date,players)=>({...newReport(),id,title:'Bilan '+id,updatedAt:date+'T20:00:00Z',info:{...newReport().info,date},players});
  const r1=report('r1','2026-09-10',[row('stats-a',{minutes:'70',goals:'2',assists:'1',yellowCards:'1',redCards:'0'})]);
  const corrected=structuredClone(r1);corrected.updatedAt='2026-09-11T20:00:00Z';corrected.players[0].goals='3';
  const r2=report('r2','2026-10-10',[row('stats-a',{minutes:'90',goals:'0',assists:'2',yellowCards:'0',redCards:'1',attendanceMode:'manual',attendanceRate:'85'})]);r2.eventType='training';
  const previous=report('old','2025-09-01',[row('stats-a',{minutes:'99',goals:'50'})]);
  const foreign=report('foreign','2026-09-01',[row('stats-a',{minutes:'99',goals:'50'})]);foreign.teamContext={...activeCoachTeam,id:'team-other'};
  const legacyForeign=report('legacy-foreign','2026-09-01',[row('stats-a',{minutes:'99',goals:'50'})]);delete legacyForeign.teamContext;legacyForeign.info.category='U15';
  const future=report('future','2026-11-20',[row('stats-a',{minutes:'99',goals:'50'})]);
  const ambiguous=row('stats-a',{minutes:'99',goals:'50'});delete ambiguous.squadPlayerId;
  const ambiguousReport=report('ambiguous','2026-10-01',[ambiguous]);
  const legacy=report('legacy','2026-10-01',[{id:'old-slot',name:'Camílle',number:'5',role:'Titulaire',minutes:'40',score:'',note:'Ancien bilan conservé',objective:''}]);
  const undated=report('undated','',[row('stats-a',{minutes:'99',goals:'50'})]);
  reportLibrary=[r1,corrected,r2,previous,foreign,future,ambiguousReport,legacy,undated,legacyForeign];
  const session=(id,date,status,validatedAt=date+'T20:00:00Z')=>({...newTraining(),id,date,time:'18:30',players:3,keepers:0,updatedAt:date+'T20:00:00Z',attendance:{version:1,source:'manual',date,time:'18:30',validatedAt,rows:[{id:'stats-a',name:'Alex Martin',status,keeper:false,included:true},{id:'stats-b',name:'Alex Martin',status:status==='present'?'absent':'present',keeper:false,included:true},{id:'external-c',name:'Camílle',status:'uncertain',keeper:false,included:true}]}});
  const t1=session('t1','2026-09-01','present'),t2=session('t2','2026-09-03','absent'),copy=session('t2-copy','2026-09-03','present','2026-09-03T19:00:00Z');
  const t3=session('t3','2026-09-05','uncertain');t3.attendance.rows[1].included=false;t3.attendance.rows[2].status='present';
  const pending=session('pending','2026-09-07','absent',''),stale=session('stale','2026-09-08','absent');stale.attendance.date='2026-09-06';
  const later=session('future','2026-11-20','absent'),other=session('other','2026-09-09','absent');other.teamContext={...activeCoachTeam,id:'team-other'};
  trainingLibrary=[t1,t2,copy,t3,pending,stale,later,other];
  const before=JSON.stringify({reportLibrary,trainingLibrary,roster}),snapshot=playerStatsSeasonSnapshot(2026,{now:{day:'2026-11-03',time:'20:00'}});
  if(JSON.stringify({reportLibrary,trainingLibrary,roster})!==before)throw Error('Statistics mutated their source');
  const invalid=structuredClone(corrected);invalid.players[0].goals='-1';if(reportValid(invalid))throw Error('Negative goals accepted');invalid.players[0].goals='1.5';if(reportValid(invalid))throw Error('Fractional goals accepted');invalid.players[0].goals='1';invalid.players[0].attendanceRate='101';if(reportValid(invalid))throw Error('Invalid percentage accepted');
  const duplicate=structuredClone(corrected);duplicate.players.push({...duplicate.players[0],id:'different-row'});if(reportValid(duplicate))throw Error('Duplicate stable link accepted');
  if(!reportValid(legacy))throw Error('Legacy report invalidated');
  const mixed={...legacy,players:[legacy.players[0],row('stats-c',{minutes:'20'})]};if(playerStatsSeasonSnapshot(2026,{reports:[mixed],now:{day:'2026-11-03',time:'20:00'}}).players.get('stats-c').totals.minutes!==20)throw Error('Explicit stable identity not preferred over legacy inference');
  const copyReport=structuredClone(corrected);copyReport.id='copy-r1';copyReport.statsEventId='r1';copyReport.updatedAt='2026-10-20T20:00:00Z';copyReport.players[0].minutes='60';copyReport.players[0].goals='4';const copyStats=playerStatsSeasonSnapshot(2026,{reports:[copyReport,...reportLibrary],now:{day:'2026-11-03',time:'20:00'}}).players.get('stats-a');if(copyStats.totals.minutes!==150||copyStats.totals.goals!==4)throw Error('Report copy counted twice '+JSON.stringify(copyStats));copyReport.info.date='2026-10-30';if(playerStatsSeasonSnapshot(2026,{reports:[copyReport,...reportLibrary],now:{day:'2026-11-03',time:'20:00'}}).players.get('stats-a').totals.minutes!==220)throw Error('Copy moved to new encounter not counted');

  if(playerStatsResolve({squadPlayerId:'missing-player',name:'Camille',number:'5'},roster))throw Error('Stale stable link reattached by name');
  const renamed=structuredClone(roster);renamed[0].name='Alex renommé';if(playerStatsSeasonSnapshot(2026,{roster:renamed,now:{day:'2026-11-03',time:'20:00'}}).players.get('stats-a').totals.goals!==3)throw Error('Stable link lost after rename');
  const autoReports=reportLibrary.map(r=>{const c=structuredClone(r);if(c.id==='r2')c.players[0].attendanceMode='auto';return c;});if(playerStatsSeasonSnapshot(2026,{reports:autoReports,now:{day:'2026-11-03',time:'20:00'}}).players.get('stats-a').attendance.rate!==50)throw Error('Latest automatic setting ignored');
  const priorPlan=coachStorageGet(agendaRecurringKey);coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-09-01',to:'2026-09-30',category:'U17',statuses:{},slots:[{id:'stats-recurring',day:2,type:'training',time:'19:00',title:'Entraînement',status:'pending'}]}));
  const recurring=playerStatsSeasonSnapshot(2026,{trainings:[],now:{day:'2026-11-03',time:'20:00'}});if(recurring.scheduled<4||recurring.players.get('stats-c').attendance.autoRate!==null)throw Error('Unmarked recurrence became absence');coachStorageSet(agendaRecurringKey,priorPlan||'');

  reportLibrary=reportLibrary.filter(playerStatsOwns);trainingLibrary=trainingLibrary.filter(playerStatsOwns);
  coachStorageSet('vestiaire-reports',JSON.stringify(reportLibrary));coachStorageSet('vestiaire-training-library',JSON.stringify(trainingLibrary));renderReportLibrary();renderTrainingLibrary();
  return {a:snapshot.players.get('stats-a'),b:snapshot.players.get('stats-b'),c:snapshot.players.get('stats-c')};
 }""")
 assert results['a']['totals']=={'minutes':160,'goals':3,'assists':3,'yellowCards':1,'redCards':1},results['a']
 assert results['a']['matches']==1 and results['a']['sessions']==1
 assert len(results['a']['attendance']['entries'])==3
 assert {row['date'] for row in results['a']['attendance']['entries']}=={'2026-09-01','2026-09-03','2026-09-05'}
 assert results['a']['attendance']['autoRate']==50 and results['a']['attendance']['rate']==85 and results['a']['attendance']['uncertain']==1
 assert not results['b']['known']['minutes'] and results['b']['attendance']['rate']==50
 assert results['c']['totals']['minutes']==40 and not results['c']['known']['goals'] and results['c']['attendance']['rate']==100
 page.locator('#workspace-squad-entry').click();card=page.locator('[data-player-id="stats-a"]');assert card.locator('[data-stat=minutes] strong').inner_text()=='160';assert card.locator('[role=progressbar]').get_attribute('aria-valuenow')=='85'
 card.locator('.player-stat-profile-link').click();dialog=page.locator('#player-stats-dialog');assert dialog.is_visible();assert dialog.locator('[data-stat=goals] strong').inner_text()=='3'
 assert 'Ratio buts / passes : 1' in dialog.inner_text();assert 'manuel' in dialog.inner_text()
 close=dialog.locator('.external-modal-close');close.wait_for();assert close.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
 r=dialog.bounding_box();x=close.bounding_box();assert x['y']>=r['y'] and x['y']+x['height']<=r['y']+76 and x['x']>=r['x']+r['width']-80
 dialog.get_by_label('Saison du bilan joueur',exact=True).select_option('2025');assert dialog.locator('[data-stat=goals] strong').inner_text()=='50';assert dialog.locator('[data-stat=attendance] strong').inner_text()=='—'
 dialog.locator('.external-modal-close').click();page.locator('#player-stats-season').select_option('2026')
 page.locator('#view-reports').click()
 if page.locator('#document-entry-dialog').is_visible():page.locator('#document-entry-create').click()
 page.evaluate("currentReport=newReport();currentReport.info.date='2026-10-25';currentReport.title='Statistiques saisies';currentReport.players=[{id:'new-row',name:'Alex Martin',number:'9',role:'Titulaire',minutes:'',score:'',note:'',objective:'',squadPlayerId:'stats-a'}];reportTab='players';renderReportTabs();renderReportContent()")
 page.locator('#report-content').get_by_label('Ce bilan concerne',exact=True).select_option('training')
 assert page.locator('#after-match .reports-heading h1').inner_text()=='Bilan de séance'
 player=page.locator('[data-report-player="new-row"]');player.get_by_label('Minutes jouées',exact=True).fill('20')
 for label,value in [('Buts','2'),('Passes décisives','1'),('Cartons jaunes','1'),('Cartons rouges','0')]:player.get_by_label(label,exact=True).fill(value)
 assert player.get_by_label('Taux de présence (%)',exact=True).input_value()=='50'
 player.get_by_label('Mode de présence aux séances',exact=True).select_option('manual');player.get_by_label('Taux de présence (%)',exact=True).fill('77')
 assert page.evaluate('saveReport()');assert page.evaluate("buildReportDocument().textContent.includes('Passes décisives : 1')")
 # Saving a corrected version of this same report replaces it instead of accumulating.
 player.get_by_label('Minutes jouées',exact=True).fill('25');assert page.evaluate('saveReport()')
 page.evaluate("document.getElementById('report-copy').click()");assert page.evaluate('!!currentReport.statsEventId')
 page.locator('#workspace-squad-entry').click();card=page.locator('[data-player-id="stats-a"]');assert card.locator('[data-stat=minutes] strong').inner_text()=='185';assert card.locator('[data-stat=goals] strong').inner_text()=='5';assert card.locator('[role=progressbar]').get_attribute('aria-valuenow')=='77'
 page.reload();page.wait_for_selector('[data-player-id="stats-a"]')
 assert page.locator('[data-player-id="stats-a"] [data-stat=minutes] strong').inner_text()=='185'

 assert page.locator('[data-player-id="stats-a"] [data-stat=minutes] strong').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
 page.screenshot(path='/tmp/player-statistics-cards.png')
 for width in [1366,1024,390,320]:
  page.set_viewport_size({'width':width,'height':900});card=page.locator('[data-player-id="stats-a"]');card.locator('.player-stat-profile-link').click();d=page.locator('#player-stats-dialog');assert d.is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  if width!=320:page.screenshot(path=f'/tmp/player-statistics-{width}.png')
  d.locator('.external-modal-close').click()
 assert not errors,errors;b.close()
print('PASS stable/homonym identity, team/season and draft isolation, report replacement, attendance denominator/duplicates/manual rates, real input/save/reload/print and responsive external-close player modal.')
