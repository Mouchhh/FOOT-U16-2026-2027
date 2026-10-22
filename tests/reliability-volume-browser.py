"""Large metadata library stays bounded; small-screen routes retain documents."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local')
 page.wait_for_function("typeof clubNetworkRenderRows==='function'")
 result=page.evaluate('''()=>{
 clubNetworkSession={user:{id:'coach-0'}};clubNetworkMember={user_id:'coach-0',display_name:'Coach 0',active:true};
 clubNetworkBound=()=>true;clubNetworkQueueSync=()=>{};
 clubNetworkMembers=Array.from({length:100},(_,i)=>({user_id:'coach-'+i,display_name:'Coach '+i,active:true}));
 document.querySelector('#club-network-author').replaceChildren(new Option('Tous',''),...clubNetworkMembers.map(m=>new Option(m.display_name,m.user_id)));
 clubNetworkRows=Array.from({length:10000},(_,i)=>({id:'row-'+i,source_id:'source-'+i,owner_id:'coach-'+(i%100),kind:'training',title:'Séance '+i,revision:1,updated_at:'2026-10-22T12:00:00Z'}));
 clubNetworkRenderState();document.querySelector('#view-club-network').click();workspaceFlows.club.go(1);
 window.payloadReads=0;clubNetworkRequest=async()=>{payloadReads++;throw new Error('Unexpected payload download')};
 const start=performance.now();clubNetworkPageSize=50;clubNetworkRenderRows();
 return {ms:performance.now()-start,cards:document.querySelectorAll('.club-network-card').length};
 }''')
 assert result['cards']==50,result
 assert result['ms']<2500,result # broad regression budget, not a device performance promise
 assert page.locator('.club-coach-card[data-user-id="coach-0"]').text_content().find('100 document(s)')>=0
 page.locator('#club-document-title').fill('Séance 9999')
 assert page.locator('.club-network-card').count()==1
 assert page.evaluate('payloadReads')==0
 page.locator('#club-document-title').fill('')
 for width,height in [(320,568),(844,390)]:
  page.set_viewport_size({'width':width,'height':height})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(width,height)
 assert not errors,errors
 print('PASS 10,000 metadata rows / 100 coaches: 50 rendered cards, exact counts, title search without payload downloads, 320px and landscape. Render ms:',round(result['ms']))
 # Real browser touch events (emulated device), including player dragging.
 ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 phone=ctx.new_page();phone.on('pageerror',lambda e:errors.append(str(e)))
 phone.goto('http://127.0.0.1:3016/?mode=local')
 phone.wait_for_function("typeof workspaceNavigation==='object'")
 phone.locator('#view-pitch').tap()
 phone.locator('#view-pitch-submenu').get_by_role('menuitem',name='Compositions & plans de jeu',exact=True).tap()
 player=phone.locator('#players .player').first
 player.scroll_into_view_if_needed();box=player.bounding_box()
 before=phone.evaluate('JSON.stringify(state.players[0])')
 cdp=ctx.new_cdp_session(phone)
 x=box['x']+box['width']/2;y=box['y']+box['height']/2
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 for offset in [8,16,24,32]:
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+offset,'y':y-20}]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert phone.evaluate('JSON.stringify(state.players[0])')!=before,'Touch drag did not move player'
 assert not errors,errors
 ctx.close();b.close()
 print('PASS touch-emulated Chromium: menu selection and player drag.')
