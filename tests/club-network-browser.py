"""UI integration with simulated Supabase; PostgreSQL authorization is tested separately.
Run against the static site: python3 tests/club-network-browser.py http://127.0.0.1:3016
Requires Playwright Python and Chromium. No external service or credentials used.
"""
import copy,json,sys,uuid
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3016'
A='00000000-0000-4000-8000-000000000001';B='00000000-0000-4000-8000-000000000002'
members=[dict(user_id=A,display_name='Coach A',active=True),dict(user_id=B,display_name='Coach B',active=True)]
rows=[];calls=[];offline=False

def api(route):
 global rows
 req=route.request;u=urlparse(req.url);q=parse_qs(u.query);path=u.path;body=req.post_data_json if req.post_data else {};actor=req.headers.get('authorization','').replace('Bearer token-','');calls.append((path,copy.deepcopy(body)))
 headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}
 def reply(obj,status=200):route.fulfill(status=status,headers=headers,content_type='application/json',body=json.dumps(obj))
 if req.method=='OPTIONS':return reply(None,204)
 if path in ['/auth/v1/verify','/auth/v1/token']:
  who=A if body.get('email')=='a@example.test' else B if body.get('email')=='b@example.test' else 'outside' if body.get('email')=='outside@example.test' else body.get('refresh_token','').replace('refresh-','')
  if who not in [A,B,'outside']:return reply({'code':'invalid_credentials'},400)
  return reply(dict(access_token='token-'+who,refresh_token='refresh-'+who,expires_in=3600,user={'id':who,'email':body.get('email','a@example.test' if who==A else 'b@example.test')}))
 if path.startswith('/auth/v1/logout'):return reply({})
 if path=='/auth/v1/user':return reply({'id':actor})
 allowed=any(m['user_id']==actor and m['active'] for m in members)
 if path=='/rest/v1/club_members':return reply(members if allowed else [])
 if path=='/rest/v1/club_documents':
  result=copy.deepcopy(rows) if allowed else []
  for key in ['id','owner_id','kind']:
   if key in q:result=[r for r in result if r[key]==q[key][0][3:]]
  result.sort(key=lambda r:r['updated_at'],reverse=True)
  offset=int(q.get('offset',['0'])[0]);result=result[offset:offset+int(q.get('limit',['50'])[0])]
  if q.get('select')!=['*']:result=[{k:v for k,v in r.items() if k!='payload'} for r in result]
  return reply(result)
 if not allowed:return reply({'code':'42501'},403)
 if path=='/rest/v1/rpc/club_publish_document':
  if offline:return route.abort()
  row=next((r for r in rows if r['owner_id']==actor and r['kind']==body['p_kind'] and r['source_id']==body['p_source_id']),None)
  if (row and (row['revision']!=body['p_expected_revision'] or row['id']!=body['p_expected_id'])) or (not row and body['p_expected_revision']!=0):return reply({'code':'40001'},409)
  if not row:row=dict(id=str(uuid.uuid4()),owner_id=actor,kind=body['p_kind'],source_id=body['p_source_id'],revision=0);rows.append(row)
  row.update(title=body['p_title'],payload=copy.deepcopy(body['p_payload']),revision=row['revision']+1,updated_at='2026-10-16T12:00:%02dZ'%(len(calls)%60));return reply([row])
 if path=='/rest/v1/rpc/club_remove_document':
  row=next((r for r in rows if r['id']==body['p_id'] and r['owner_id']==actor and r['revision']==body['p_expected_revision']),None)
  if not row:return reply({'code':'40001'},409)
  rows.remove(row);return reply(None)
 return reply({'error':'unexpected'},500)

def setup(browser):
 context=browser.new_context(viewport={'width':1440,'height':1100})
 context.route('**/club-cloud-config.js',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://club-test.supabase.co',publishableKey:'sb_publishable_test'};"))
 context.route('https://club-test.supabase.co/**',api)
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(URL);return context,page

def login(page,email):
 page.locator('#view-club-network').click();page.locator('#club-network-email').fill(email);page.locator('#club-network-password').fill('MotDePasseTest!2026');page.locator('#club-network-signin').click()
 if email=='outside@example.test':page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('Accès refusé')")
 else:page.wait_for_selector('#club-network-connected',state='visible');page.wait_for_function("!clubNetworkBusy")

def wait_queue(page):page.evaluate('async()=>{await clubNetworkQueue;}')

errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 # Unconfigured public site never calls a backend and clearly reports pending activation.
 plain=browser.new_page();plain.goto(URL);plain.locator('#view-club-network').click();assert plain.locator('#club-network-setup').is_visible();assert not plain.locator('#club-network-login').is_visible();assert not calls;plain.close()
 ca,a=setup(browser)
 assert a.evaluate("!clubNetworkConfigValid({url:'https://evil.test',publishableKey:'sb_publishable_test'})")
 assert a.evaluate("!clubNetworkConfigValid({url:'https://club-test.supabase.co',publishableKey:'sb_secret_test'})")
 login(a,'a@example.test');a.locator('.club-network-password summary').click();a.locator('#club-network-old-password').fill('MotDePasseTest!2026');a.locator('#club-network-new-password').fill('NouveauMotDePasse!2026');a.locator('#club-network-confirm-password').fill('NouveauMotDePasse!2026');a.locator('#club-network-password-form button').click();a.wait_for_function("document.querySelector('#club-network-status').textContent.includes('Mot de passe modifié')");a.locator('#club-network-close').click();a.locator('#view-training').click();a.locator('#training-title').fill('Séance collective A');a.locator('#local-coach-propose').click();a.locator('#local-coach-use').click();a.locator('#training-save').click();source_id=a.evaluate('currentTraining.id')
 a.locator('#view-club-network').click();a.wait_for_function('!clubNetworkBusy');a.select_option('#club-network-source','0');a.locator('#club-network-publish').click();a.wait_for_function('!clubNetworkBusy');assert len(rows)==1;assert rows[0]['revision']==1
 a.locator('#club-network-auto').check();a.locator('#club-network-close').click();a.locator('#training-notes').fill('Version actualisée A');a.locator('#training-save').click();wait_queue(a);assert rows[0]['revision']==2;assert rows[0]['payload']['notes']=='Version actualisée A'
 assert a.evaluate("!JSON.stringify(localStorage).includes('token-')")
 # A colleague consults diagrams and copies without modifying the original or their open draft.
 cb,b=setup(browser);login(b,'b@example.test');before=b.evaluate('JSON.stringify(currentTraining)');b.locator('#club-network-list button',has_text='Consulter').click();b.wait_for_selector('#club-network-preview',state='visible');assert b.locator('#club-network-preview-content svg').count()>=6;assert b.evaluate('JSON.stringify(currentTraining)')==before;assert b.locator('#club-network-list button',has_text='Retirer').count()==0
 b.locator('#club-network-copy').click();b.wait_for_function('!clubNetworkBusy');assert b.evaluate('trainingLibrary.length')==1;assert b.evaluate('trainingLibrary[0].id')!=source_id;assert b.evaluate('JSON.stringify(currentTraining)')==before
 b.locator('#club-network-close').click();b.locator('#view-reports').click();b.locator('#report-save').click();b.locator('#view-club-network').click();b.wait_for_function('!clubNetworkBusy');index=b.evaluate("clubNetworkSources.findIndex(x=>x.kind==='report')");b.select_option('#club-network-source',str(index));b.locator('#club-network-publish').click();b.wait_for_function('!clubNetworkBusy');assert len(rows)==2
 b.locator('#club-network-close').click();b.locator('#view-pitch').click();b.locator('#save').click();b.locator('#view-club-network').click();b.wait_for_function('!clubNetworkBusy');index=b.evaluate("clubNetworkSources.findIndex(x=>x.kind==='composition')");b.select_option('#club-network-source',str(index));b.locator('#club-network-publish').click();b.wait_for_function('!clubNetworkBusy');assert len(rows)==3
 # Filters and all three read-only renderers.
 a.locator('#view-club-network').click();a.wait_for_function('!clubNetworkBusy')
 for kind in ['report','composition','training']:
  a.select_option('#club-network-kind',kind);a.wait_for_function('!clubNetworkBusy');assert a.locator('.club-network-card').count()==1;a.locator('#club-network-list button',has_text='Consulter').click();a.wait_for_selector('#club-network-preview',state='visible');assert a.locator('#club-network-preview-content').inner_text();a.locator('#club-network-preview-close').click()
 # Same owner on another device must recover before publishing; stale saves are rejected.
 cd,d=setup(browser);login(d,'a@example.test');d.select_option('#club-network-kind','training');d.wait_for_function('!clubNetworkBusy');d.locator('#club-network-list button',has_text='Consulter').click();d.wait_for_selector('#club-network-preview',state='visible');d.locator('#club-network-copy').click();d.wait_for_function('!clubNetworkBusy');d.locator('#club-network-auto').check();d.locator('#club-network-close').click();d.locator('#view-training').click();d.select_option('#training-library',source_id);d.locator('#training-notes').fill('Nouvelle version depuis autre appareil');d.locator('#training-save').click();wait_queue(d);assert rows[0]['revision']==3
 a.locator('#club-network-close').click();a.locator('#training-notes').fill('Modification depuis version périmée');a.locator('#training-save').click();wait_queue(a);assert rows[0]['revision']==3;assert 'Conflit de version' in a.locator('#club-network-status').inner_text();assert a.evaluate("currentTraining.notes.includes('périmée')")
 # Recover own version: preserves differing open draft as a new local copy and safely loads server version.
 a.locator('#view-club-network').click();a.wait_for_function('!clubNetworkBusy');a.locator('#club-network-list button',has_text='Consulter').click();a.wait_for_selector('#club-network-preview',state='visible');a.locator('#club-network-copy').click();a.wait_for_function('!clubNetworkBusy');assert a.evaluate("currentTraining.notes.includes('autre appareil')");assert a.evaluate("trainingLibrary.some(s=>s.id!==currentTraining.id&&s.notes.includes('périmée'))")
 # Failed upload keeps local save; recovery does not silently overwrite server.
 a.locator('#club-network-close').click();offline=True;a.locator('#training-notes').fill('Travail sans connexion');a.locator('#training-save').click();wait_queue(a);assert rows[0]['revision']==3;assert a.evaluate("trainingLibrary.find(s=>s.id===currentTraining.id).notes==='Travail sans connexion'");offline=False
 # Session refresh and reload restore membership in the same tab, not in a different profile.
 a.evaluate('clubNetworkSession.expires_at=0');a.locator('#view-club-network').click();a.wait_for_function('!clubNetworkBusy');assert any(path=='/auth/v1/token' for path,_ in calls)
 a.reload();a.wait_for_function('!!clubNetworkMember');a.locator('#view-club-network').click();a.wait_for_function('!clubNetworkBusy');a.set_viewport_size({'width':390,'height':844});assert a.evaluate("document.querySelector('#club-network-dialog').scrollWidth<=document.querySelector('#club-network-dialog').clientWidth+1");assert a.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Logout clears private lists/previews and credentials; local docs remain.
 a.locator('#club-network-logout').click();a.wait_for_function('!clubNetworkBusy');assert a.locator('#club-network-list').inner_text()=='';assert a.locator('#club-network-preview-content').inner_text()=='';assert a.evaluate("!sessionStorage.getItem(clubNetworkSessionKey)");assert a.evaluate('trainingLibrary.length')>=2
 co,o=setup(browser);login(o,'outside@example.test');assert not o.locator('#club-network-connected').is_visible();assert o.evaluate('clubNetworkSession===null')
 # Membership revocation removes already displayed private list at the next check.
 members[1]['active']=False;b.locator('#club-network-refresh').click();b.wait_for_function('!clubNetworkBusy');assert not b.locator('#club-network-connected').is_visible();assert b.locator('#club-network-list').inner_text()==''
 assert not errors,errors
 print('PASS: pending setup, provisioned accounts and password changes, three document kinds, diagrams, explicit/automatic sharing, independent copies, cross-device conflicts and recovery, offline local saves, refresh/reload, mobile, logout and revocation; no JS errors. PostgreSQL policies tested separately.')
 browser.close()
