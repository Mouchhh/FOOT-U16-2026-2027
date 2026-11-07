"""Reloading an identical open draft restores its base revision; divergent drafts stay protected."""
import json
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:3016';uid='00000000-0000-4000-8000-000000000001';doc='00000000-0000-4000-8000-000000000002';remote=None;uploads=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(accept_downloads=True)
 ctx.route('**/club-cloud-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://club-test.supabase.co',publishableKey:'sb_publishable_test'};"))
 ctx.route('**/coach-team-fff-onboarding.js*',lambda r:r.fulfill(content_type='application/javascript',body=''))
 def api(r):
  global remote
  path=urlparse(r.request.url).path;data=[]
  if path=='/rest/v1/club_members':data=[{'user_id':uid,'display_name':'Coach Test','active':True}]
  if path=='/rest/v1/club_documents' and remote:data=[remote] if 'id=eq.' in r.request.url else [{k:v for k,v in remote.items() if k!='payload'}]
  if path=='/rest/v1/rpc/club_publish_document':
   body=r.request.post_data_json;uploads.append(body)
   if body['p_expected_revision']!=remote['revision'] or body['p_expected_id']!=remote['id']:
    return r.fulfill(status=409,content_type='application/json',body=json.dumps({'code':'PT409'}))
   remote={**remote,'revision':remote['revision']+1,'title':body['p_title'],'payload':body['p_payload']};data={k:v for k,v in remote.items() if k!='payload'}
  if path=='/auth/v1/user':data={'id':uid,'email':'coach@example.test'}
  r.fulfill(status=200,headers={'Access-Control-Allow-Origin':'*'},content_type='application/json',body=json.dumps(data))
 ctx.route('https://club-test.supabase.co/**',api)
 page=ctx.new_page();page.goto(BASE+'/?mode=local');page.wait_for_function("typeof state==='object'")
 seed={'session':{'access_token':'fake','refresh_token':'fake','expires_at':9999999999,'user':{'id':uid,'email':'coach@example.test'}}}
 page.evaluate("([seed,id])=>{sessionStorage.setItem('vestiaire-private-session:https://club-test.supabase.co',JSON.stringify(seed));sessionStorage.setItem('vestiaire-account-binding:https://club-test.supabase.co',JSON.stringify({userId:id,coach:{id:'account-'+id,name:'Coach Test'}}));}",[seed,uid])
 page.goto(BASE+'/?auth=login');page.wait_for_function("clubNetworkBound()&&!clubNetworkBusy&&!clubNetworkSyncPromise")
 payload=page.evaluate("id=>{const p=structuredClone(getCompositionBoard());p.documentId=id;p.title='Version identique';return p}",doc)
 remote={'id':'server-id','owner_id':uid,'kind':'composition','source_id':doc,'title':payload['title'],'revision':2,'updated_at':'2026-11-07T01:40:00Z','payload':payload}
 page.evaluate("p=>{clubNetworkSetLibrary('composition',[p]);state=structuredClone(p);persist();sessionStorage.removeItem(clubNetworkVersionKey('composition',p.documentId));}",payload)
 page.reload();page.wait_for_function("clubNetworkBound()&&!clubNetworkBusy&&!clubNetworkSyncPromise")
 assert page.evaluate("clubNetworkKnownVersion('composition',state.documentId).revision")==2
 page.evaluate("()=>{state.title='Modification normale';persist();coachStorageSet('vestiaire-saves',JSON.stringify([{date:new Date().toISOString(),state}]));saves=[{date:new Date().toISOString(),state:structuredClone(state)}];}")
 page.wait_for_function("clubNetworkKnownVersion('composition',state.documentId).revision===3&&!clubNetworkPending('composition',state.documentId)&&!clubNetworkSyncPromise")
 assert len(uploads)==1 and uploads[0]['p_expected_revision']==2,uploads
 # A different server revision must not silently rebase the still-open local draft.
 remote={**remote,'revision':4,'title':'Modification autre appareil','payload':{**remote['payload'],'title':'Modification autre appareil'}}
 page.evaluate("sessionStorage.removeItem(clubNetworkVersionKey('composition',state.documentId))")
 page.reload();page.wait_for_function("clubNetworkBound()&&!clubNetworkBusy&&!clubNetworkSyncPromise")
 assert page.evaluate('state.title')=='Modification normale'
 assert page.evaluate("clubNetworkKnownVersion('composition',state.documentId).revision")==0
 b.close();print('PASS lost-tab revision recovered for identical draft, next save uses expected revision, divergent draft not rebased')
