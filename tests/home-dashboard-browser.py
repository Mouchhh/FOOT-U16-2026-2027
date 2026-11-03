"""Minimal home retains existing documents while removing secondary modules."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':768},timezone_id='America/New_York');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local');page.evaluate("document.querySelector('#view-home').click();workspaceFlows.home.go(0)")
 result=page.evaluate('''()=>{const check=(v,m)=>{if(!v)throw Error(m)};const now=homeClubNow(new Date('2026-10-21T17:00:00Z'));check(now.day==='2026-10-21','Paris day');check(homeClubNow(new Date('2026-10-21T22:30:00Z')).day==='2026-10-22','Paris midnight');
 const past={...newTraining(),id:'past',date:'2026-10-21',time:'17:00',duration:60,title:'Terminée'},live={...newTraining(),id:'live',date:'2026-10-21',time:'18:30',duration:90,title:'En cours'},future={...newTraining(),id:'future',date:'2026-10-22',time:'18:30',title:'Demain'};trainingLibrary=[future,past,live];check(homeUpcomingTraining(now).session.id==='live','missed ongoing session');check(homeUpcomingTraining(homeClubNow(new Date('2026-10-21T18:01:00Z'))).session.id==='future','finished session not removed');
 const board=structuredClone(getCompositionBoard());board.documentId='fixture';board.title='Compo à ouvrir';board.matchPreparation=newMatchPreparation();Object.assign(board.matchPreparation,{date:'2026-10-24',match:'Stade Mayennais / Laval'});const plan={...structuredClone(board),documentId:'plan-only',boardKind:'plan',matchPreparation:{...board.matchPreparation,date:'2026-10-22'}};saves=[{date:'2026-10-20',state:board},{date:'2026-10-20',state:plan}];check(homeUpcomingMatch(now).board.documentId==='fixture','plan offered as fixture');
 const original=JSON.stringify(getCompositionBoard());if(!workspaceReplaceDraft('composition',board))throw Error('draft fixture');getCompositionBoard().matchPreparation.date='2026-10-28';check(homeUpcomingMatch(now).date==='2026-10-28','stale saved fixture duplicates changed draft');getCompositionBoard().matchPreparation.date='2026-10-24';currentTraining={...live,title:'Ma séance de pressing'};currentReport=newReport();currentReport.updatedAt=new Date().toISOString();check(!homeWorkingCopies().some(w=>w.key==='report'),'empty report offered');currentReport.plan.priority='Protéger les transitions';check(homeWorkingCopies().some(w=>w.key==='report'),'real report absent');
 return {original};}''')

 before=page.evaluate('JSON.stringify({currentTraining,currentReport,state,saves,trainingLibrary})')
 page.evaluate('renderHomeQuick();renderClubHomeStats()')
 assert page.locator('#home-work-quick .completion-card').count()==0
 assert page.locator('#home-tools').is_hidden()
 assert page.evaluate('JSON.stringify({currentTraining,currentReport,state,saves,trainingLibrary})')==before
 for nav in ['#view-training','#view-pitch','#view-coach-agenda','#view-reports']:
  page.locator(nav).click();assert page.locator('.home-hero').is_hidden() or page.locator('#document-entry-dialog').is_visible()
  if page.locator('#document-entry-dialog').is_visible():page.locator('#document-entry-dialog .external-modal-close').click()
  page.locator('#view-home').click();assert page.locator('#home-greeting').is_visible()
 page.evaluate('workspaceFlows.home.go(1)');assert page.locator('#home-greeting').is_visible()
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/home-dashboard-mobile.png',full_page=True,animations='disabled')
 assert not errors,errors;b.close()
print('PASS minimal home: no widgets, drafts and saved documents retained, main modules accessible and mobile layout.')
