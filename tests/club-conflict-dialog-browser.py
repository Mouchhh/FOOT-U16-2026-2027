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
 page.once('dialog',lambda d:d.accept());page.locator('#club-sync-conflicts').get_by_role('button',name='Ouvrir la version partagée').click()
 page.wait_for_function("currentTraining.title==='Séance partagée'")
 titles=page.evaluate("trainingLibrary.map(p=>p.title)")
 assert titles==['Séance partagée'],titles
 recovery=page.evaluate("clubNetworkRecoveryCandidates().filter(r=>r.kind==='training').map(r=>r.payload.title)")
 assert 'Séance locale à conserver' in recovery and 'Brouillon non envoyé' in recovery,recovery
 assert not page.evaluate("!!clubNetworkPending('training',currentTraining.id)")
 # Clean up only automatic local copies, after checking the complete remote list.
 migration=page.evaluate("""()=>{
 const source=structuredClone(currentTraining),base=JSON.stringify(currentTraining);
 const make=(title)=>({...structuredClone(source),id:crypto.randomUUID(),title});
 const automatic=make('Copie locale avant ouverture · Ancien doublon');
 const manual=make('Ma séance (copie)');
 const queued=make('Copie locale avant ouverture · Enregistrée en attente');
 const shared=make('Copie locale avant ouverture · Déjà partagée');
 const rows=[{owner_id:clubNetworkSession.user.id,kind:'training',source_id:shared.id}];
 clubNetworkSetLibrary('training',[source,automatic,manual,queued,shared]);
 clubNetworkMarkPending('training',queued.id,'save');
 clubNetworkRetireLocalCopies(rows);
 const ids=trainingLibrary.map(p=>p.id);
 if(ids.includes(automatic.id)||!ids.includes(source.id)||!ids.includes(manual.id)||!ids.includes(queued.id)||!ids.includes(shared.id))throw Error('Wrong cleanup scope');
 if(JSON.stringify(currentTraining)!==base)throw Error('Started work changed');
 if(!clubNetworkRecoveryCandidates().some(r=>r.payload.id===automatic.id&&r.payload.title==='Ancien doublon'))throw Error('Recovery missing');
 const count=clubNetworkRecoveryArchives().length;
 clubNetworkRetireLocalCopies(rows);
 if(clubNetworkRecoveryArchives().length!==count)throw Error('Cleanup is not idempotent');
 const blocked=make('Copie locale avant ouverture · Quota');
 clubNetworkSetLibrary('training',[...trainingLibrary,blocked]);
 const original=clubNetworkArchiveInterruptedSave;
 try{clubNetworkArchiveInterruptedSave=()=>{throw new DOMException('Test quota','QuotaExceededError')};clubNetworkRetireLocalCopies(rows);}
 finally{clubNetworkArchiveInterruptedSave=original}
 if(!trainingLibrary.some(p=>p.id===blocked.id))throw Error('Quota lost work');
 for(const kind of ['report','composition']){
  const original=kind==='report'?currentReport:getCompositionBoard(),snapshot=JSON.stringify(original);
  const copy=structuredClone(original),id=crypto.randomUUID();
  if(kind==='composition')copy.documentId=id;else copy.id=id;
  copy.title='Copie locale avant ouverture · Archive '+kind;
  clubNetworkSetLibrary(kind,[structuredClone(original),copy]);
  clubNetworkRetireLocalCopies(rows);
  if(clubNetworkLibrary(kind).some(p=>clubNetworkPayloadId(kind,p)===id))throw Error('Copy remains in '+kind);
  if(!clubNetworkRecoveryCandidates().some(r=>r.kind===kind&&clubNetworkPayloadId(kind,r.payload)===id))throw Error('Recovery missing for '+kind);
  if(JSON.stringify(original)!==snapshot)throw Error('Started '+kind+' changed');
 }
 if(clubNetworkPendingJobs().some(j=>j.op==='delete'))throw Error('Cleanup queued a cloud deletion');
 return {normal:ids.length,recovery:count,protectedQueued:!!clubNetworkPending('training',queued.id)};
 }""")
 b.close();print('PASS conflict without duplicate documents, preserved recovery, automatic-copy cleanup, queued/shared/manual protection, unchanged draft, idempotence and quota guard')
