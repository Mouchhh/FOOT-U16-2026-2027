"""Public login reports failed network, HTML gateways and auth errors without secrets."""
import json
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:3016'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=browser.new_context()
 ctx.route('**/club-cloud-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://club-test.supabase.co',publishableKey:'sb_publishable_test'}"))
 page=ctx.new_page();page.goto(BASE+'/?auth=login');page.wait_for_selector('#club-network-login',state='visible')
 for mode,status,body,expected in [
  ('html',503,'<html>HiddenSecret private@example.test</html>','HTTP 503'),
  ('json',500,json.dumps({'error_code':'unexpected_failure'}),'Supabase est indisponible'),
  ('html',200,'<html>HiddenSecret</html>','réponse illisible'),
  ('abort',0,'','réseau inaccessible'),
  ('json',400,json.dumps({'error_code':'invalid_credentials'}),'mot de passe incorrect')]:
  def api(r):
   if mode=='abort':return r.abort()
   r.fulfill(status=status,content_type='text/html' if mode=='html' else 'application/json',headers={'Access-Control-Allow-Origin':'*'},body=body)
  ctx.route('https://club-test.supabase.co/**',api)
  message=page.evaluate("async()=>{try{await clubNetworkRequest('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email:'fake@example.test',password:'fake-only'}});return 'UNEXPECTED SUCCESS'}catch(e){return clubNetworkMessage(e)}}")
  assert expected in message,(mode,status,message)
  assert 'HiddenSecret' not in message and 'private@example.test' not in message
  assert not page.evaluate('clubNetworkBound()')
  assert not page.locator('main').is_visible()
  ctx.unroute('https://club-test.supabase.co/**',api)
 browser.close()
 print('PASS login service diagnostics, no private response body and no unauthorized access')
