import os,json
from pathlib import Path
from datetime import datetime,timezone,timedelta
from playwright.sync_api import sync_playwright
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3065')
out=Path('/workspace/cruza-documents/responsable');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1600,'height':1100});errors=[];private=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:private.append(r.url) if 'supabase.co' in r.url else None)
 page.goto(base+'/manager.html?demo=1');page.wait_for_selector('#content:not([hidden])');page.evaluate('document.fonts.ready')
 metrics=page.locator('#metrics .metric strong').all_text_contents();assert metrics[0]=='6' and metrics[2]=='4';trainings=int(metrics[1]);reports=int(metrics[3]);assert trainings>5 and reports>3
 page.screenshot(path=str(out/'CRUZA-responsable-desktop.png'),full_page=True)
 page.get_by_role('button',name='Tout voir').click();assert page.locator('#documents-list .latest-item').count()==trainings+reports+4
 page.select_option('#kind','training');assert page.locator('#documents-list .latest-item').count()==trainings
 page.get_by_role('button',name='Consulter Conserver pour avancer',exact=True).click();assert page.locator('#document-dialog').is_visible();assert 'Exemple fictif' in page.locator('#preview-content').inner_text();page.get_by_role('button',name='Fermer l’aperçu').click()
 page.select_option('#scope','formation');assert page.locator('#metrics .metric strong').first.inner_text()=='4'
 page.select_option('#kind','all');assert page.locator('#documents-list .latest-item').count()>8
 page.locator('.sidebar [data-tab=educators]').click();page.fill('#search','Camille');assert page.locator('#educators-list .educator-row:not(.educator-head)').count()==1
 page.get_by_role('button',name='Voir les documents de Camille Laurent').click();assert page.locator('#documents-list .latest-item').count()>2
 page.get_by_role('button',name='Effacer le filtre').click();assert page.locator('#documents-list .latest-item').count()>8
 page.select_option('#scope','all');page.select_option('#period','all');page.locator('.sidebar [data-tab=overview]').click();page.fill('#search','')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(out/'CRUZA-responsable-mobile.png'),full_page=True)
 for width in [320,768,1440]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 assert not private,private
 page.goto(base+'/index.html?mode=local');page.wait_for_selector('#view-management:not([hidden])');page.evaluate('window.managerOriginalFlush=flushCoachWorkspace;flushCoachWorkspace=()=>false');page.locator('#view-management').click();assert '/index.html' in page.url;page.evaluate('flushCoachWorkspace=window.managerOriginalFlush');page.locator('#view-management').click();assert 'demo=1' in page.url
 # Standalone production denies missing config and never silently shows fixture data.
 page.goto(base+'/manager.html');page.wait_for_selector('#status:not([hidden])');assert page.locator('#content').is_hidden();assert 'configuration' in page.locator('#status').inner_text()
 page.close()
 # Mocked authenticated requests validate UI gating without real club credentials.
 ctx=b.new_context(viewport={'width':1440,'height':1000});q=ctx.new_page();q.on('pageerror',lambda e:errors.append(str(e)))
 q.route('**/club-cloud-config.js',lambda route:route.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://fake-cruza.supabase.co',publishableKey:'sb_publishable_test'};"))
 q.add_init_script("sessionStorage.setItem('vestiaire-private-session:https://fake-cruza.supabase.co',JSON.stringify({session:{user:{id:'director'},access_token:'fixture-token',expires_at:Date.now()/1000+3600}}));")
 now=datetime.now(timezone.utc).isoformat()
 payload={'access':{'allowed':True,'role':'pole','categories':['U17'],'display_name':'Responsable test'},'generated_at':now,'truncated':False,'total_documents':1,'educators':[{'id':'coach','name':'Éducateur test','active':True}],'documents':[{'id':'test-document','owner_id':'coach','title':'Séance test','kind':'training','category':'U17','revision':1,'updated_at':now}]}
 denied=[False]
 def handle(route):
  if denied[0]:route.fulfill(status=403,content_type='application/json',body=json.dumps({'code':'42501'}));return
  assert route.request.method=='POST'
  if route.request.url.endswith('club_management_document'):route.fulfill(content_type='application/json',body=json.dumps({'payload':{'notes':'<script>alert(1)</script>'}}))
  else:route.fulfill(content_type='application/json',body=json.dumps(payload))
 q.route('https://fake-cruza.supabase.co/rest/v1/rpc/*',handle)
 q.goto(base+'/manager.html');q.wait_for_selector('#content:not([hidden])');assert q.locator('#scope').is_disabled();assert q.locator('#scope').inner_text()=='U17';assert q.locator('#demo-banner').is_hidden()
 q.get_by_role('button',name='Consulter Séance test').first.click();q.wait_for_selector('#preview-content .preview-section');assert '<script>alert(1)</script>' in q.locator('#preview-content').inner_text();assert q.locator('#preview-content script').count()==0
 q.get_by_role('button',name='Fermer l’aperçu').click();denied[0]=True;q.get_by_role('button',name='Actualiser').click();q.wait_for_selector('#status:not([hidden])');assert q.locator('#content').is_hidden();assert 'pas de droit' in q.locator('#status').inner_text()
 assert not errors,errors
 ctx.close();b.close()
print('PASS: dashboard, filters, educator drilldown, text preview, 320/390/768/1440px, entry, no production requests in demo, denied/unconfigured states, XSS-safe text, authorization revocation.')
