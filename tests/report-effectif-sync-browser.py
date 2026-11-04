"""Stay on event input; validate a real report and read cumulative roster metrics immediately."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof reportStatsPrepareForSave==="function" && window.workspaceSheets')
 page.locator('#view-reports').click()
 page.evaluate('''()=>{
  squadSave([{id:'sync-a',name:'Alex Martin',number:9,position:'Attaquant',photo:''},{id:'sync-b',name:'Noé Petit',number:8,position:'Milieu',photo:''},{id:'sync-c',name:'Léon',number:6,position:'Défenseur',photo:''}]);
  currentReport.title='Bilan lié';currentReport.info.date='2026-11-01';
  currentReport.players=[{id:'manual-c',name:'Léon',number:'6',role:'Titulaire',minutes:'30',score:'',note:'',objective:'',goals:'0',assists:'0',yellowCards:'0',redCards:'0'}];
  const training=(id,date,status)=>({...newTraining(),id,date,time:'19:00',players:2,keepers:0,attendance:{version:1,source:'manual',date,time:'19:00',validatedAt:date+'T21:00:00Z',rows:[{id:'sync-a',name:'Alex Martin',status,included:true,keeper:false},{id:'sync-b',name:'Noé Petit',status:'present',included:true,keeper:false}]}});
  trainingLibrary=[training('sync-t1','2026-10-27','present'),training('sync-t2','2026-10-29','absent')];coachStorageSet('vestiaire-training-library',JSON.stringify(trainingLibrary));
  reportTab='players';renderReportTabs();renderReportContent();
  window.unrequestedProfiles=0;window.savedProfileOpen=playerStatsOpen;playerStatsOpen=(...args)=>{unrequestedProfiles++;return savedProfileOpen(...args);};
 }''')
 page.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click();event=page.locator('[data-event-index="0"]')
 event.get_by_label('Buteur',exact=True).scroll_into_view_if_needed()
 page.evaluate("currentReport.players.find(r=>r.id==='manual-c').minutes='abc'")
 original=event.bounding_box()['y'];page.evaluate("window.stableScorer=document.querySelector('[data-event-index=\"0\"] [aria-label=Buteur]')")
 event.get_by_label('Buteur',exact=True).select_option('sync-a')
 assert page.evaluate('stableScorer.isConnected && stableScorer===document.activeElement')
 assert abs(event.bounding_box()['y']-original)<8
 event.get_by_label('Passeur décisif',exact=True).select_option('sync-b')
 assert page.evaluate('unrequestedProfiles')==0
 page.locator('[data-report-player=manual-c]').get_by_label('Minutes jouées',exact=True).fill('30')
 assert page.evaluate("document.body.classList.contains('reports-mode') && reportTab==='players'")
 assert page.locator('dialog[open]').count()==0
 # The explicit profile-opening API also refuses to interrupt the report.
 page.evaluate("savedProfileOpen('sync-a')");assert page.locator('#player-stats-dialog').count()==0
 page.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click();page.locator('[data-event-index="1"]').get_by_label('Buteur',exact=True).select_option('sync-a')
 for index,player,color in [(2,'sync-a','yellow'),(3,'sync-b','red')]:
  page.get_by_role('button',name='+ Ajouter un fait de match',exact=True).click();row=page.locator(f'[data-event-index="{index}"]');row.get_by_label('Événement',exact=True).select_option('Carton');row.get_by_label('Joueur concerné',exact=True).select_option(player);row.get_by_label('Couleur du carton',exact=True).select_option(color)
 assert page.evaluate('unrequestedProfiles')==0 and page.locator('dialog[open]').count()==0
 a=page.locator('[data-report-player]').filter(has=page.get_by_role('heading',name='Alex Martin',exact=True));nb=page.locator('[data-report-player]').filter(has=page.get_by_role('heading',name='Noé Petit',exact=True))
 a.get_by_label('Minutes jouées',exact=True).fill('90');a.get_by_label('Passes décisives',exact=True).fill('0');a.get_by_label('Cartons rouges',exact=True).fill('0')
 nb.get_by_label('Minutes jouées',exact=True).fill('60');nb.get_by_label('Buts',exact=True).fill('0');nb.get_by_label('Cartons jaunes',exact=True).fill('0')
 page.evaluate("()=>{reportTab='preview';renderReportTabs();renderReportContent();}");page.locator('#report-next').click()
 assert page.evaluate("document.body.classList.contains('home-mode') && documentCompletionIsCompleted('report',currentReport)")
 assert page.evaluate("reportLibrary[0].players.find(r=>r.id==='manual-c').squadPlayerId")=='sync-c'
 page.locator('#workspace-squad-entry').click();card=page.locator('[data-player-id=sync-a]');other=page.locator('[data-player-id=sync-b]')
 for key,value in [('minutes','90'),('goals','2'),('assists','0'),('yellowCards','1'),('redCards','0')]:assert card.locator(f'[data-stat={key}] strong').inner_text()==value,(key,card.inner_text())
 assert card.locator('[data-stat=attendance] strong').inner_text()=='50 %'
 assert other.locator('[data-stat=minutes] strong').inner_text()=='60' and other.locator('[data-stat=assists] strong').inner_text()=='1'
 assert other.locator('[data-stat=redCards] strong').inner_text()=='1'
 assert other.locator('.player-stat-card-symbol.is-red').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(228, 31, 40)'
 # A new match accumulates; correcting that match replaces it instead of adding it again.
 page.evaluate("()=>{currentReport=newReport();currentReport.info.date='2026-11-02';currentReport.players=[{id:'row-2',squadPlayerId:'sync-a',name:'Alex Martin',number:'9',role:'Titulaire',minutes:'45',score:'',note:'',objective:'',goals:'1',assists:'0',yellowCards:'0',redCards:'0'}];saveReport();}")
 assert card.locator('[data-stat=minutes] strong').inner_text()=='135' and card.locator('[data-stat=goals] strong').inner_text()=='3'
 page.evaluate("()=>{currentReport.players[0].minutes='60';saveReport();}");assert card.locator('[data-stat=minutes] strong').inner_text()=='150'
 # Never silently accept statistical data without a date, or throw on an invalid row.
 assert not page.evaluate("()=>{currentReport.info.date='';return saveReport();}")
 assert 'date du bilan' in page.locator('#report-save-status').inner_text()
 assert not page.evaluate("()=>{currentReport.info.date='2026-11-02';currentReport.players[0].minutes='abc';return saveReport();}")
 assert page.evaluate('reportLibrary.length')==2
 page.evaluate("()=>{currentReport.players[0].minutes='60';flushReportDraft();}")
 page.reload();page.wait_for_selector('[data-player-id=sync-a]');assert page.locator('[data-player-id=sync-a] [data-stat=minutes] strong').inner_text()=='150'
 assert not errors,errors
 b.close()
print('Isolated stable event controls, no profile/navigation, full validation-to-card stats, attendance/colors, stable links, accumulation/correction, invalid saves and reload passed')
