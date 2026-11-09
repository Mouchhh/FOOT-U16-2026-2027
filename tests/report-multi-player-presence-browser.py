"""Attendance days explain empty weeks, relink explicit roster IDs, and persist multiple players."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.playerAttendanceSessions')
 page.evaluate("""()=>{
 const roster=[{id:'multi-a',name:'Alex',number:8,photo:'',position:'Milieu'},{id:'multi-b',name:'Noé',number:9,photo:'',position:'Attaquant'},{id:'multi-c',name:'Sam',number:1,photo:'',position:'Gardien'}];squadSave(roster);
 currentReport.info.date='2026-09-13';currentReport.preparation.imported=true;
 currentReport.players=roster.map((p,i)=>({id:'report-'+i,squadPlayerId:'old-'+i,name:p.name,number:String(p.number),role:'Titulaire',minutes:String(60+i),score:'',note:'Note '+i,objective:'Objectif '+i}));
 reportTab='general';hideClubHome();setReportView(true);renderReportContent();
 }""")
 empty=page.locator('.report-row-attendance-empty');assert empty.is_visible();assert '07/09/2026 au 13/09/2026' in empty.inner_text()
 before=page.evaluate('JSON.stringify(currentReport.players)')
 empty.get_by_role('button',name='Configurer les jours de séance').click();page.locator('#agenda-week-template').wait_for(state='visible');assert page.evaluate('JSON.stringify(currentReport.players)')==before
 page.evaluate("document.querySelector('#agenda-week-template').close()")
 page.evaluate("""()=>{coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-09-01',to:'2026-09-30',category:'U17',statuses:{},slots:[1,3,5].map(day=>({id:'weekday-'+day,day,type:'training',time:'19:00',title:'Entraînement',status:'pending'}))}));document.dispatchEvent(new Event('agenda-recurrence-updated'));}""")
 assert empty.count()==0;assert page.locator('.report-presence-badge').count()==0
 assert page.locator('select[aria-label^="Associer la fiche de"]').count()==3
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.set_viewport_size({'width':1366,'height':1000})
 page.get_by_label('Associer la fiche de Alex',exact=True).select_option('multi-a')
 assert page.get_by_label('Associer la fiche de Noé',exact=True).locator('option[value="multi-a"]').evaluate('(o)=>o.disabled')
 page.get_by_label('Associer la fiche de Noé',exact=True).select_option('multi-b');page.get_by_label('Associer la fiche de Sam',exact=True).select_option('multi-c')
 assert page.locator('.report-presence-badge').count()==9
 for name in ['Alex','Noé','Sam']:
  page.locator('.report-presence-badge[aria-label^="'+name+' · lun"]').click()
  assert page.locator('.report-row-status').inner_text()=='Présence enregistrée.'
 rows=page.evaluate('trainingLibrary[0].attendance.rows');assert len(rows)==3 and all(r['status']=='present' for r in rows),rows
 assert page.evaluate('trainingLibrary.length')==1
 page.locator('.report-presence-badge[aria-label^="Alex · lun"]').click()
 rows=page.evaluate('trainingLibrary[0].attendance.rows');assert [r['status'] for r in rows]==['absent','present','present']
 assert page.evaluate('currentReport.players.map(r=>r.minutes)')==['60','61','62']
 assert page.evaluate('currentReport.players.map(r=>r.note)')==['Note 0','Note 1','Note 2']
 page.evaluate('flushReportDraft()');page.reload();page.wait_for_function('!!window.playerAttendanceSessions');page.evaluate("hideClubHome();reportTab='general';setReportView(true);renderReportContent()")
 assert page.locator('.report-presence-badge[data-status="present"]').count()==2
 assert page.locator('.report-presence-badge[data-status="absent"]').count()==1
 assert page.evaluate('trainingLibrary.length')==1
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close();print('PASS empty-week guidance, explicit relinking, duplicate prevention, 3-player attendance and correction, reload persistence, minutes/notes preserved and mobile')
