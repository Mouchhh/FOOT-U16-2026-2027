"""Shared work: title search, coach-card filters, bounded metadata reads and logout isolation."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof clubDocumentCandidates==='function'")
 page.evaluate('''()=>{
 clubNetworkSession={user:{id:'coach-a'}};clubNetworkMember={user_id:'coach-a',display_name:'Alice',active:true};clubNetworkBound=()=>Boolean(clubNetworkSession&&clubNetworkMember);clubNetworkQueueSync=()=>{};
 clubNetworkMembers=[clubNetworkMember,{user_id:'coach-b',display_name:'Benoît',active:true}];
 document.querySelector('#club-network-author').replaceChildren(new Option('Tous',''),new Option('Alice','coach-a'),new Option('Benoît','coach-b'));
 clubNetworkRows=[];window.workPayloads={};window.workCalls=[];
 for(let i=0;i<54;i++){const s=newTraining();s.id='session-'+i;s.category='U17';s.themes=['Pressing'];s.title=i===53?'Séance pressing côté gauche':'Relance '+i;
 const r={id:'row-'+i,source_id:s.id,owner_id:i===53?'coach-b':'coach-a',kind:'training',revision:1,title:s.title,updated_at:'2026-10-21T12:00:00Z'};clubNetworkRows.push(r);workPayloads[r.id]=s;}
 clubNetworkRequest=async path=>{const id=decodeURIComponent(path.split('id=eq.')[1].split('&')[0]);workCalls.push(id);const row=clubNetworkRows.find(r=>r.id===id);return [{...row,payload:workPayloads[id]}];};
 clubNetworkRenderState();document.querySelector('#view-club-network').click();workspaceFlows.club.go(1);clubNetworkRenderRows();
 }''')
 title=page.get_by_label('Trouver un document',exact=True)
 title.fill('seance COTE')
 assert page.locator('.club-network-card').count()==1
 assert page.locator('.club-network-card h3').inner_text()=='Séance pressing côté gauche'
 assert page.evaluate('workCalls.length')==0
 title.fill('absent');assert page.locator('.club-network-card').count()==0
 title.fill('')
 page.get_by_text('Rechercher · catégorie, thème et date',exact=True).click()
 page.evaluate("clubDocumentSearch={category:'u17',theme:'Pressing',from:'',to:'',reference:false};document.querySelector('#club-network-author').value='coach-a';clubDocumentLoadBatch()")
 page.wait_for_function('workCalls.length===50&&!document.querySelector("#club-document-search-next").disabled')
 assert 'partielle' in page.locator('#club-document-search-status').inner_text(), page.locator('#club-document-search-status').inner_text()
 assert page.locator('.club-network-card').count()==50
 # Clicking an educator card must trigger the same detailed search as the select.
 page.evaluate('workspaceFlows.club.go(0)');page.locator('.club-coach-card[data-user-id="coach-b"]').click()
 page.wait_for_function('workCalls.includes("row-53")&&!document.querySelector("#club-document-search-next").disabled')
 assert page.locator('.club-network-card').count()==1
 assert '1 / 1' in page.locator('#club-document-search-status').inner_text()
 page.evaluate('workspaceFlows.club.go(0)');page.locator('.club-coach-card').filter(has_text='Tous les éducateurs').click()
 page.wait_for_function('workCalls.length===54&&!document.querySelector("#club-document-search-next").disabled')
 assert page.locator('.club-network-card').count()==50 # bounded first display, all 54 searched
 assert '54 / 54' in page.locator('#club-document-search-status').inner_text()
 title.fill('cote');assert page.locator('.club-network-card').count()==1
 page.screenshot(path='/tmp/club-work-desktop.png')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 page.screenshot(path='/tmp/club-work-mobile.png')
 assert page.evaluate("()=>{clubNetworkClear();return clubDocumentCache.size===0&&clubDocumentSearch===null&&document.querySelector('#club-document-title').value===''}")
 assert not errors,errors
 b.close();print('PASS club work: accent-insensitive title search without downloads, 50-read batches, educator cards reload metadata, all educators, partial/complete status, mobile and logout isolation.')
