"""Live home cards use validated team data; no example statistics or overflow."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:d.accept())
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded')
 page.wait_for_function('typeof homeWidgetsSnapshot==="function"')
 page.evaluate('workspaceNavigation.run("view-home")')
 page.wait_for_selector('#home-live-widgets .home-live-card')
 assert page.locator('#home-live-widgets .home-live-card').count()==3
 assert '92%' not in page.locator('#home-live-widgets').inner_text()
 page.evaluate('''()=>{
 squadSave([{id:'p1',name:'Alice',number:1,photo:'',position:'Milieu'}]);
 const day=playerStatsNow().day;
 trainingLibrary=[1,2,3].map((n)=>{const s=newTraining();s.date=agendaCalendarAdd(day,-n);s.attendance={version:1,source:'manual',date:s.date,time:s.time,validatedAt:new Date().toISOString(),rows:[{id:'p1',name:'Alice',status:n===1?'absent':'present',included:true,keeper:false}]};return s;});
 const next=newTraining();next.date=agendaCalendarAdd(day,1);next.title='Sortie de balle';trainingLibrary.push(next);
 const r=newReport();r.info.date=agendaCalendarAdd(day,-1);r.info.goalsFor='3';r.info.goalsAgainst='1';r.info.opponent='Club test';r.plan.priority='Cadrage défensif';r.documentCompletion={version:1,kind:'report',at:new Date().toISOString(),fingerprint:documentCompletionFingerprint(r)};
 reportLibrary=[r,{...structuredClone(r),id:crypto.randomUUID()}];
 const draft=newReport();draft.info.date=agendaCalendarAdd(day,-2);draft.info.goalsFor='0';draft.info.goalsAgainst='9';reportLibrary.push(draft);
 renderHomeWidgets();
 }''')
 s=page.evaluate('(()=>{const s=homeWidgetsSnapshot();return {rate:s.rate,active:s.active,sessions:s.sessions,form:s.form,points:s.points,recommendation:s.recommendation}})()')
 assert s=={'rate':67,'active':1,'sessions':3,'form':['V'],'points':3,'recommendation':'Cadrage défensif'},s
 assert 'Sortie de balle' in page.locator('#home-live-widgets').inner_text()
 page.evaluate("()=>{const foreign=structuredClone(reportLibrary[0]);foreign.id=crypto.randomUUID();foreign.teamContext={...activeCoachTeam,id:'other-team'};foreign.info.goalsFor='0';foreign.info.goalsAgainst='8';foreign.documentCompletion.fingerprint=documentCompletionFingerprint(foreign);reportLibrary.push(foreign);}")
 assert page.evaluate('homeWidgetsSnapshot().points')==3
 # Re-render via the shared save hook, without reloading the page.
 page.evaluate("()=>{trainingLibrary[0].attendance.rows[0].status='present';renderHomeQuick();}")
 page.wait_for_function("document.querySelector('.home-live-group').textContent.includes('100%')")

 for w,h in [(1440,1000),(820,1000),(390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(150)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert page.locator('#home-live-widgets').is_visible()
  page.screenshot(path=f'/tmp/home-live-{w}.png',full_page=True)
 page.locator('.home-live-open').click()
 page.wait_for_function('document.body.classList.contains("training-mode")')
 assert page.evaluate('currentTraining.title')=='Sortie de balle'
 assert not errors,errors
 b.close();print('PASS: empty state, 3 attendance slots, dedup validated matches, draft excluded, recommendation, desktop/tablet/mobile and opening session.')
