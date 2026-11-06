"""Actual causerie button launches creation; all remote responses are simulated."""
import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':1100});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 connected=True;uploads=[];auth=[]
 ctx.route('**/canva-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CANVA_GATEWAY='https://canva.test';"))
 def gateway(route):
  global connected
  req=route.request;path=req.url.removeprefix('https://canva.test');headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Design-Title','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}
  if req.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
  if path=='/oauth/start':
   auth.append(req.method);connected=True;route.fulfill(content_type='text/html',body='<p>Authorisation simulée</p>');return
  if path=='/api/status':value={'connected':connected,'latest_job_id':None}
  elif path=='/api/imports':
   uploads.append(req.post_data_buffer);value={'id':'test-job','status':'success','designs':[{'id':'test-design','edit_url':'https://www.canva.com/design/test-design/edit'}]}
  else:raise AssertionError(path)
  route.fulfill(status=200,headers=headers,content_type='application/json',body=json.dumps(value))
 ctx.route('https://canva.test/**',gateway);ctx.route('https://www.canva.com/**',lambda r:r.fulfill(content_type='text/html',body='<p>Design simulé</p>'))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('typeof window.causerieExport?.createAndOpen==="function"')
 page.evaluate("()=>{clubNetworkSession={access_token:'fake-session',user:{id:'fake-coach'}};getCompositionBoard().title='Causerie test bouton'}")
 page.locator('#view-pitch').click();page.locator('#match-new').click();page.locator('#task-match-causerie').click()
 button=page.locator('.causerie-canva-badge');before=page.evaluate('JSON.stringify(getCompositionBoard())')
 button.click();page.evaluate('causerieExport.createAndOpen()')
 page.wait_for_selector('.causerie-results a',timeout=30000)
 assert len(uploads)==1 and uploads[0][:2]==b'PK'
 assert len(ctx.pages)==1 # No blank popup during generation for a connected account.
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 page.evaluate('document.getElementById("causerie-dialog").close()')
 # A disconnected account waits for an explicit, fresh OAuth click.
 connected=False;button.click()
 page.wait_for_function('document.getElementById("causerie-status").textContent.includes("Cliquez sur")')
 assert len(uploads)==1
 with page.expect_popup() as popup:page.locator('#causerie-connect').click()
 popup.value.wait_for_load_state()
 page.wait_for_function('document.querySelector(".causerie-results a")',timeout=30000)
 assert len(uploads)==2 and auth==['POST']
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 page.evaluate('document.getElementById("causerie-dialog").close()')
 # A synchronous preparation error is reported next to the button, not swallowed.
 page.evaluate("()=>{window.oldAnalyze=causerieLayout.analyze;causerieLayout.analyze=()=>{throw Error('Préparation test indisponible')}}")
 button.click()
 assert 'Préparation test indisponible' in page.locator('#causerie-ppt-status').inner_text()
 assert page.locator('#causerie-ppt-status').is_visible()
 page.evaluate('()=>{causerieLayout.analyze=oldAnalyze}')
 assert not errors,errors;b.close()
print('PASS: real Canva button, single connected import, no blank popup, explicit OAuth then import, visible preparation failure and unchanged causerie; no real service call')
