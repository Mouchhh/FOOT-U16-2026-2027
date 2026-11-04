from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.monthlyPlayerReview')
 page.evaluate('''()=>{
  squadSave([{id:'monthly-a',name:'Alex Martin',number:9,photo:'',position:'Attaquant'}]);
  const report=(id,date,minutes)=>{const r=newReport();r.id=id;r.info.date=date;r.players=[{id:'monthly-row',squadPlayerId:'monthly-a',name:'Alex Martin',number:'9',score:'',note:'',objective:'',role:'Titulaire',minutes,goals:'1',assists:'0',yellowCards:'1',redCards:'0'}];return r;};
  reportLibrary=[report('monthly-r1','2026-10-02','60'),report('monthly-r2','2026-09-02','30')];
  const training=(id,date,status)=>({...newTraining(),id,date,time:'19:00',players:2,keepers:0,attendance:{version:1,source:'manual',date,time:'19:00',validatedAt:date+'T21:00:00Z',rows:[{id:'monthly-a',name:'Alex Martin',status,included:true,keeper:false}]}});
  trainingLibrary=[training('monthly-t1','2026-10-01','present'),training('monthly-t2','2026-10-08','absent')];
 }''')
 assert page.evaluate("monthlyPlayerSnapshot('2026-10').players.get('monthly-a').totals.minutes")==60
 assert page.evaluate("monthlyPlayerSnapshot('2026-10').players.get('monthly-a').attendance.rate")==50
 assert page.evaluate("monthlyReviewLastDay('2028-02')")=='2028-02-29'
 assert page.evaluate("monthlyReviewLastDay('2027-02')")=='2027-02-28'
 page.locator('#view-coach-agenda').click();page.locator('#coach-agenda-month').fill('2026-10');page.locator('#coach-agenda-month').dispatch_event('change')
 reminder=page.locator('[data-monthly-reminder="2026-10-31"]');assert reminder.count()==1
 reminder.click();row=page.locator('[data-monthly-player="monthly-a"]');assert row.is_visible()
 assert '60 min' in row.inner_text() and '50 %' in row.inner_text() and '+30 min' in row.inner_text()
 assert not page.locator('#coach-squad-list').is_visible() if page.locator('#coach-squad-list').count() else True
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 page.get_by_role('button',name='Vue saison',exact=True).click();assert not row.count()
 assert not errors,errors
 b.close()
print('Monthly aggregates, previous-month evolution, attendance, leap-year reminder, agenda-to-roster link and responsive layout passed')
