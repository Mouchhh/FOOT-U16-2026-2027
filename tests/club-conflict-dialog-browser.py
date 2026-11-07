"""A conflict opens the exact document; preview preserves local data and resolution backs it up."""
import json
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:3016';uid='00000000-0000-4000-8000-000000000001';doc='00000000-0000-4000-8000-000000000002';remote=None
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(accept_downloads=True)
 ctx.route('**/club-cloud-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://club-test.supabase.co',publishableKey:'sb_publishable_test'};"))
 ctx.route('**/coach-team-fff-onboarding.js*',lambda r:r.fulfill(content_type='application/javascript',body=''))
 def api(r):
  path=urlparse(r.request.url).path;data=[]
  if path=='/rest/v1/club_members':data=[{'user_id':uid,'display_name':'Coach Test','active':True}]
  if path=='/rest/v1/club_documents' and 'id=eq.' in r.request.url:data=[remote]
  if path=='/auth/v1/user':data={'id':uid,'email':'coach@example.test'}
  r.fulfill(status=200,headers={'Access-Control-Allow-Origin':'*'},content_type='application/json',body=json.dumps(data))
 ctx.route('https://club-test.supabase.co/**',api)
 page=ctx.new_page();page.goto(BASE+'/?mode=local');page.wait_for_function("typeof currentTraining==='object'")
 seed={'session':{'access_token':'fake','refresh_token':'fake','expires_at':9999999999,'user':{'id':uid,'email':'coach@example.test'}}}
 page.evaluate("([seed,id])=>{sessionStorage.setItem('vestiaire-private-session:https://club-test.supabase.co',JSON.stringify(seed));sessionStorage.setItem('vestiaire-account-binding:https://club-test.supabase.co',JSON.stringify({userId:id,coach:{id:'account-'+id,name:'Coach Test'}}));}",[seed,uid])
 page.goto(BASE+'/?auth=login');page.wait_for_function("clubNetworkBound()&&!clubNetworkBusy&&!clubNetworkSyncPromise")
 local=page.evaluate("id=>{const p=structuredClone(currentTraining);p.id=id;p.title='Séance locale à conserver';return p}",doc)
 remote={'id':'server-id','owner_id':uid,'kind':'training','source_id':doc,'title':'Séance partagée','revision':2,'updated_at':'2026-11-07T01:40:00Z','payload':{**local,'title':'Séance partagée'}}
 page.evaluate("([local,row])=>{clubNetworkSetLibrary('training',[local]);currentTraining=structuredClone(local);currentTraining.title='Brouillon non envoyé';clubNetworkMarkPending('training',local.id,'save');const k=clubNetworkPendingKey('training',local.id),j=JSON.parse(localStorage.getItem(k));j.conflict=true;localStorage.setItem(k,JSON.stringify(j));clubNetworkRows=[row];clubSaveStatus('error','Conflit',true)}",[local,{k:v for k,v in remote.items() if k!='payload'}])
 page.locator('#club-save-label').click();page.locator('#club-save-resolve').click();dialog=page.locator('#club-sync-conflicts');dialog.wait_for(state='visible');assert 'Séance locale à conserver' in dialog.inner_text()
 with page.expect_download() as dl:dialog.get_by_role('button',name='Télécharger ma copie locale (.json)').click()
 downloaded=json.load(open(dl.value.path()));assert downloaded['payload']['title']=='Séance locale à conserver'
 dialog.get_by_role('button',name='Consulter la version partagée').click();page.locator('#club-network-preview').wait_for(state='visible')
 assert page.evaluate("clubNetworkPending('training',currentTraining.id).conflict")
 assert page.evaluate('currentTraining.title')=='Brouillon non envoyé'
 page.evaluate("document.querySelector('#club-network-preview').close();clubNetworkShowConflicts()")
 page.once('dialog',lambda d:d.accept());page.locator('#club-sync-conflicts').get_by_role('button',name='Conserver ma copie et ouvrir la version partagée').click()
 page.wait_for_function("currentTraining.title==='Séance partagée'")
 titles=page.evaluate("trainingLibrary.map(p=>p.title)")
 assert any('Copie locale avant ouverture' in t and 'Séance locale à conserver' in t for t in titles),titles
 assert any('Copie locale avant ouverture' in t and 'Brouillon non envoyé' in t for t in titles),titles
 assert not page.evaluate("!!clubNetworkPending('training',currentTraining.id)")
 b.close();print('PASS exact conflict dialog, local JSON backup, read-only preview and resolution preserving local saved copy plus draft')
