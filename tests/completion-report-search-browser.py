"""Quick report plus bounded authenticated metadata search; no real API calls."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.evaluate("document.querySelector('#view-reports').click();reportTab='general';renderReportContent()")
 quick=page.locator('#report-quick-panel');quick.get_by_label('Adversaire',exact=True).fill('Équipe visiteuse');quick.locator('.report-essential-followup > summary').click();quick.get_by_label('La priorité à travailler',exact=True).fill('Sortir de la pression par le côté libre')
 quick.get_by_role('button',name='Renseigner tous les détails du match',exact=True).click();assert page.locator('#report-content').get_by_label('Adversaire',exact=True).input_value()=='Équipe visiteuse'
 assert page.evaluate('currentReport.plan.priority')=='Sortir de la pression par le côté libre'
 page.locator('#report-quick-panel').get_by_role('button',name='Revenir au bilan essentiel',exact=True).click();quick.get_by_role('button',name='Choisir les exercices pour la prochaine séance',exact=True).click();assert page.locator('#report-training-dialog').is_visible();page.locator('#report-training-dialog').get_by_role('button',name='Fermer',exact=True).click()
 result=page.evaluate('''async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 clubNetworkSession={user:{id:'search-coach'}};clubNetworkMember={user_id:'search-coach',display_name:'Coach de test',active:true};clubNetworkBound=()=>true;clubNetworkMembers=[clubNetworkMember];clubNetworkRows=[];
 const payloads={};for(let i=0;i<53;i++){const s=newTraining();s.id='source-'+i;s.category=i%2?'U17':'Seniors';s.date='2026-10-21';s.themes=['Transitions'];s.clubReference=i===1;const r={id:'row-'+i,source_id:s.id,kind:'training',owner_id:'search-coach',revision:1,title:'Fiche '+i,updated_at:'2026-10-21T10:00:00Z'};clubNetworkRows.push(r);payloads[r.id]=s;}
 let calls=0;clubNetworkRequest=async path=>{calls++;const id=decodeURIComponent(path.split('id=eq.')[1].split('&')[0]),row=clubNetworkRows.find(r=>r.id===id);return [{...row,payload:payloads[id]}];};
 document.querySelector('#club-network-author').replaceChildren(new Option('Coach de test','search-coach'));document.querySelector('#club-network-author').value='search-coach';document.querySelector('#club-network-kind').value='folder:training';
 clubDocumentSearch={category:'u17',theme:'Transitions',from:'2026-10-01',to:'2026-10-31',reference:false};await clubDocumentLoadBatch();check(calls===50,'not bounded');check(document.querySelectorAll('.club-network-card').length===12,'first batch page');await clubDocumentLoadBatch();check(calls===53,'duplicate network reads');check(document.querySelectorAll('.club-network-card').length===12,'full filtered page');clubDocumentSearch.reference=true;clubNetworkRenderRows();check(document.querySelectorAll('.club-network-card').length===1,'reference filter');
 clubNetworkSession.user.id='other';check(!clubDocumentMatches(clubNetworkRows[1]),'cross-account cache');clubNetworkSession.user.id='search-coach';clubNetworkRows[1].revision=2;check(!clubDocumentMatches(clubNetworkRows[1]),'stale revision');return calls;
 }''');assert result==53
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors;b.close();print('PASS quick/detailed report and match link; bounded 53-document search, category/theme/date/reference, cache isolated by account/revision.')
