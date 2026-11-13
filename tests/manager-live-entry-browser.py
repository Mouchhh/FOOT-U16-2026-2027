"""Configured production-like site: role gating and same-tab entry, no real service calls."""
import os,json
from playwright.sync_api import sync_playwright
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3075')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':1000});page=ctx.new_page();errors=[];real=[];calls=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 ctx.add_init_script("""(()=>{const coach={id:'account-manager-fixture',name:'Directeur test'};localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([coach]));localStorage.setItem('vestiaire-active-coach',coach.id);const team={id:'team-fixture',label:'U17 test',category:'U17',team:'Équipe test',fffProfile:{version:1,gender:'Masculin',format:'Football à 11',number:1,season:'2026-2027',level:'District',sourceURL:'',officialName:''}};localStorage.setItem('vestiaire-coach:'+coach.id+':vestiaire-teams',JSON.stringify([team]));sessionStorage.setItem('vestiaire-coach:'+coach.id+':vestiaire-active-team',team.id);})();""")
 ctx.route('**/club-cloud-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://fake-cruza.supabase.co',publishableKey:'sb_publishable_test'};"))
 allowed=[False]
 def service(route):
  path=route.request.url.split('supabase.co')[-1];calls.append(path)
  headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization,apikey,Content-Type','Access-Control-Allow-Methods':'POST,GET,OPTIONS'}
  if route.request.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
  if path=='/rest/v1/rpc/club_management_access_info':value={'allowed':allowed[0]}
  elif path=='/rest/v1/rpc/club_management_overview':value={'access':{'allowed':True,'role':'director','categories':[],'display_name':'Directeur test'},'generated_at':'2026-11-13T10:00:00Z','total_documents':0,'truncated':False,'educators':[],'documents':[]}
  else:route.fulfill(status=503,headers=headers,content_type='application/json',body='{}');return
  route.fulfill(headers=headers,content_type='application/json',body=json.dumps(value))
 ctx.route('https://*.supabase.co/**',service)
 page.goto(base+'/index.html?mode=local');page.wait_for_function('typeof clubNetworkBound==="function"&&document.querySelector("#view-management")')
 assert page.locator('#view-management').is_hidden()
 page.evaluate("()=>{clubNetworkSession={user:{id:'manager-fixture'},access_token:'test-token',expires_at:Date.now()/1000+3600};clubNetworkMember={user_id:'manager-fixture',display_name:'Directeur test',active:true};document.dispatchEvent(new CustomEvent('club-session-ready'));}")
 page.wait_for_timeout(300);assert page.locator('#view-management').is_hidden()
 allowed[0]=True;page.evaluate("document.dispatchEvent(new CustomEvent('club-session-ready'))");page.wait_for_selector('#view-management:not([hidden])')
 assert page.locator('#view-management .navigation-icon').count()==1
 # Seed the normal session bridge used by the real app; do not create a new login store.
 page.evaluate("sessionStorage.setItem('vestiaire-private-session:https://fake-cruza.supabase.co',JSON.stringify({session:clubNetworkSession}))")
 page.locator('#view-management').click();page.wait_for_url('**/manager.html');page.wait_for_selector('#content:not([hidden])')
 assert 'demo=' not in page.url;assert page.locator('#demo-banner').is_hidden();assert page.locator('#club-name').inner_text()=='Stade Mayennais';assert page.locator('#manager-name').inner_text()=='Directeur test'
 assert page.locator('.brand img').evaluate('(e)=>e.complete&&e.naturalWidth>0')
 assert not errors,errors
 assert '/rest/v1/rpc/club_management_access_info' in calls and '/rest/v1/rpc/club_management_overview' in calls
 ctx.close();b.close()
print('PASS live integration: hidden before grant, role-gated entry, nav icon, same-tab session, no demo in production, SMFC branding and preserved configured-project behavior.')
