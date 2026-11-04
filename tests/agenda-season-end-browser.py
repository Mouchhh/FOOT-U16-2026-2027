from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof agendaRecurringSeasonEnd==="function"')
 page.evaluate('''()=>{
 agendaCalendarToday=()=> '2026-11-04';
 const rows=[1,2,3,4,5,6,7].map(day=>({id:crypto.randomUUID(),day,type:'training',time:'19:00',title:'Entraînement',status:'pending',location:''}));
 const plan=agendaRecurringReplace(null,rows,'2026-11-02',true,'U17');agendaRecurringCommit(plan,0);
 }''')
 assert page.evaluate("agendaRecurringSeasonEnd('2026-11-04')")=='2027-06-15'
 assert page.evaluate("agendaRecurringSeasonEnd('2027-01-04')")=='2027-06-15'
 assert page.evaluate("agendaRecurringOccurrences(agendaRecurringRead(),{from:'2027-06-14',to:'2027-06-20'}).map(e=>e.date)")==['2027-06-14','2027-06-15']
 assert page.evaluate("agendaRecurringOccurrences(agendaRecurringRead(),{from:'2027-06-16',to:'2028-01-01'}).length")==0
 assert page.evaluate("playerAttendanceSessions.events({year:2026,from:'2027-06-14',cutoff:'2027-06-20',includeFuture:true}).length")==2
 # An old unbounded model gets the same computed cutoff, without deleting saved sessions.
 page.evaluate("()=>{const p=agendaRecurringRead();for(const s of p.slots)delete s.seasonEnd;coachStorageSet(agendaRecurringKey,JSON.stringify(p));}")
 assert page.evaluate("agendaRecurringOccurrences(agendaRecurringRead(),{from:'2027-06-16',to:'2028-01-01'}).length")==0
 # A new season can be configured explicitly, and receives its own June cutoff.
 page.evaluate("()=>{const p=agendaRecurringRead();const next=agendaRecurringReplace(p,p.templateSlots,'2027-08-01',true,'U17');agendaRecurringCommit(next,p.revision);}")
 assert page.evaluate("agendaRecurringOccurrences(agendaRecurringRead(),{from:'2027-08-02',to:'2027-08-08'}).length")==7
 assert page.evaluate("agendaRecurringOccurrences(agendaRecurringRead(),{from:'2028-06-16',to:'2028-07-01'}).length")==0
 assert not errors,errors
 b.close()
print('June 15 inclusive cutoff, old unbounded rules, agenda/attendance consistency and explicit next-season setup passed')
