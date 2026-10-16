"""UI integration with simulated Supabase; PostgreSQL authorization is tested separately.
Run against the static site: python3 tests/club-network-browser.py http://127.0.0.1:3016
Requires Playwright Python and Chromium. No external service or credentials used.
"""
import copy,json,sys,uuid,time
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3016'
A='00000000-0000-4000-8000-000000000001';B='00000000-0000-4000-8000-000000000002'
members=[dict(user_id=A,display_name='Coach A',active=True),dict(user_id=B,display_name='Coach B',active=True)]
C='00000000-0000-4000-8000-000000000004'
rows=[];calls=[];offline=False;presence={};presence_installed=True;activity_installed=True
invitation='a-secure-one-time-code-for-coach-c'

def api(route):
 global rows
 req=route.request;u=urlparse(req.url);q=parse_qs(u.query);path=u.path;body=req.post_data_json if req.post_data else {};actor=req.headers.get('authorization','').replace('Bearer token-','');calls.append((path,copy.deepcopy(body)))
 headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}
 def reply(obj,status=200):route.fulfill(status=status,headers=headers,content_type='application/json',body=json.dumps(obj))
 if req.method=='OPTIONS':return reply(None,204)
 if path in ['/auth/v1/verify','/auth/v1/token']:
  who=A if body.get('email')=='a@example.test' else B if body.get('email')=='b@example.test' else C if body.get('email')=='c@example.test' else 'outside' if body.get('email')=='outside@example.test' else body.get('refresh_token','').replace('refresh-','')
  if who not in [A,B,C,'outside']:return reply({'code':'invalid_credentials'},400)
  return reply(dict(access_token='token-'+who,refresh_token='refresh-'+who,expires_in=3600,user={'id':who,'email':body.get('email','a@example.test' if who==A else 'b@example.test')}))
 if path=='/auth/v1/settings':return reply({'disable_signup':False,'mailer_autoconfirm':True})
 if path in ['/rest/v1/rpc/club_registration_ready','/rest/v1/rpc/club_profile_registration_ready']:return reply(True)
 if path=='/auth/v1/signup':
  if body.get('email')!='c@example.test' or body.get('data',{}).get('club_activation_code')!=invitation:return reply({'code':'unexpected_failure'},500)
  if not any(m['user_id']==C for m in members):members.append(dict(user_id=C,display_name=body.get('data',{}).get('first_name','')+' '+body.get('data',{}).get('last_name',''),active=True))
  return reply(dict(access_token='token-'+C,refresh_token='refresh-'+C,expires_in=3600,user={'id':C,'email':'c@example.test'}))
 if path.startswith('/auth/v1/logout'):return reply({})
 if path=='/auth/v1/user':return reply({'id':actor})
 allowed=any(m['user_id']==actor and m['active'] for m in members)
 if path=='/rest/v1/club_members':return reply(members if allowed else [])
 if path=='/rest/v1/club_documents':
  result=copy.deepcopy(rows) if allowed else []
  for key in ['id','owner_id','kind','source_id']:
   if key in q:result=[r for r in result if r[key]==q[key][0][3:]]
  result.sort(key=lambda r:r['updated_at'],reverse=True)
  offset=int(q.get('offset',['0'])[0]);result=result[offset:offset+int(q.get('limit',['50'])[0])]
  if q.get('select')!=['*']:result=[{k:v for k,v in r.items() if k!='payload'} for r in result]
  return reply(result)
 if not allowed:return reply({'code':'42501'},403)
 if path=='/rest/v1/rpc/club_presence_ping':
  if not presence_installed:return reply({'code':'PGRST202'},404)
  presence[(actor,body['p_session_id'])]=(time.time(),body.get('p_online',True));return reply(None)
 if path=='/rest/v1/rpc/club_educator_activity':
  if not activity_installed:return reply({'code':'PGRST202'},404)
  online={uid for (uid,sid),(seen,active) in presence.items() if active and time.time()-seen<90}
  return reply([dict(user_id=m['user_id'],display_name=m['display_name'],last_login='2026-10-15T18:30:00Z' if m['user_id']==B else '2026-10-16T08:00:00Z',is_online=m['user_id'] in online) for m in members if m['active']])
 if path=='/rest/v1/rpc/club_connected_coaches':
  if not presence_installed:return reply({'code':'PGRST202'},404)
  online={uid for (uid,sid),(seen,active) in presence.items() if active and time.time()-seen<90}
  return reply([dict(user_id=m['user_id'],display_name=m['display_name'],last_seen='2026-10-16T12:00:00Z') for m in members if m['active'] and m['user_id'] in online])
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

def setup(browser,local=False):
 context=browser.new_context(viewport={'width':1440,'height':1100})
 context.route('**/club-cloud-config.js',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://club-test.supabase.co',publishableKey:'sb_publishable_test'};"))
 context.route('https://club-test.supabase.co/**',api)
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(URL+('?mode=local' if local else '?auth=login'));return context,page

def login(page,email):
 page.locator('#club-network-email').fill(email);page.locator('#club-network-password').fill('MotDePasseTest!2026');page.locator('#club-network-signin').click()
 if email=='outside@example.test':page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('pas autorisé')")
 else:page.wait_for_selector('#club-account-bar',state='visible');wait_sync(page)

def wait_sync(page):
 page.wait_for_function('!clubNetworkBusy && !clubNetworkSyncPromise')
 page.evaluate('async()=>{await clubNetworkQueue;}')

def club(page):page.locator('#club-account-library').click();wait_sync(page)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 # A separate welcome page offers login and signup before any protected application content.
 landingctx,landing=setup(browser);landing.goto(URL);landing.wait_for_url('**/accueil.html');assert landing.locator('#welcome-login').is_visible();assert landing.locator('#welcome-signup').is_visible();landing.set_viewport_size({'width':390,'height':844});assert landing.evaluate('document.documentElement.scrollWidth<=innerWidth');landing.locator('#welcome-signup').click();landing.locator('#club-network-signup').wait_for(state='visible');assert landing.locator('#club-network-signup').is_visible();assert landing.locator('#club-signup-first-name').is_visible();landingctx.close()
 # The whole app is private by default; the local tool remains explicitly available.
 ca,a=setup(browser);assert a.locator('#club-auth-gate').is_visible();assert not a.locator('main').is_visible()
 localctx,local=setup(browser,True);assert local.locator('main').is_visible();local.locator('#view-training').click();assert local.locator('#training-space').is_visible();localctx.close()
 login(a,'a@example.test');assert a.locator('#club-connected').is_visible();assert 'Coach A' in a.locator('#club-connected-names').inner_text();assert a.evaluate('activeCoach.id')=='account-'+A;assert a.locator('#club-auth-gate').is_hidden();assert a.locator('#coach-profile').is_visible();assert a.locator('#coach-select option:checked').inner_text()=='Coach A';assert a.locator('#coach-select').is_disabled();assert a.locator('#club-home').is_visible();assert a.locator('#club-network-dialog').is_hidden()
 a.screenshot(path='/tmp/private-club-home.png',full_page=True)
 # The post-login home has five sections, original tools, a club logo, and all approved educators.
 assert a.locator('.home-section-card').count()==5;assert a.locator('.brand .club-logo').is_visible();assert a.locator('#club-connected .club-connected-person').count()==2
 assert a.locator('#club-connected .online').count()==1;assert '15/10/2026' in a.locator('.club-connected-person[data-user-id="'+B+'"] .club-last-login').inner_text()
 for button,target in [('view-pitch','.workspace'),('view-training','#training-space'),('view-coach-agenda','#coach-agenda'),('view-reports','#after-match'),('view-club-network','#club-network-dialog')]:
  a.locator('#'+button).click();assert a.locator(target).is_visible();assert a.locator('#section-subnav').count()==0;assert a.locator('#club-home').is_hidden();a.locator('#view-home').click();assert a.locator('#club-home').is_visible()
 a.locator('.home-section-card',has_text='Terrain & tactique').click();a.locator('#mode-simple').click();assert a.locator('#simple-board').is_visible();a.locator('#view-home').click()
 a.set_viewport_size({'width':390,'height':844});assert a.evaluate('document.documentElement.scrollWidth<=innerWidth');a.set_viewport_size({'width':1440,'height':1000})
 # Explicit saves automatically publish with no opt-in or separate Share click.
 a.locator('#view-training').click();a.locator('#training-title').fill('Séance du coach A');a.locator('#local-coach-propose').click();a.locator('#local-coach-use').click();a.locator('#training-save').click();wait_sync(a);source_id=a.evaluate('currentTraining.id');assert len(rows)==1;assert rows[0]['owner_id']==A
 a.locator('#training-notes').fill('Travail partagé automatiquement');a.locator('#training-save').click();wait_sync(a);assert rows[0]['revision']==2
 # A different PC sees the club's work and updates without pressing Refresh.
 cb,b=setup(browser);login(b,'b@example.test');a.evaluate('clubNetworkQueueSync()');wait_sync(a);assert 'Coach B' in a.locator('#club-connected-names').inner_text();assert a.locator('#club-connected-names .online').count()==2;assert b.locator('#club-connected .online').count()==2;assert b.evaluate('trainingLibrary.length')==0;club(b);assert b.locator('.club-network-card').count()==1;b.locator('.club-coach-card',has_text='Coach A').click();assert b.locator('#club-network-author').input_value()==A;b.locator('.club-coach-card',has_text='Tous les éducateurs').click()
 a.locator('#training-title').fill('Séance A actualisée');a.locator('#training-save').click();wait_sync(a)
 b.wait_for_function("document.querySelector('#club-network-list').textContent.includes('Séance A actualisée')",timeout=15000)
 before=b.evaluate('JSON.stringify(currentTraining)');b.locator('#club-network-list button',has_text='Consulter').click();b.wait_for_selector('#club-network-preview',state='visible');assert b.locator('#club-network-preview-content svg').count()>=6;assert b.evaluate('JSON.stringify(currentTraining)')==before
 b.locator('#club-network-copy').click();wait_sync(b);assert b.evaluate('trainingLibrary.length')==1;assert b.evaluate('trainingLibrary[0].id')!=source_id;assert len(rows)==2
 # Same account on a new PC gets its own library automatically and can open/edit it.
 cd,d=setup(browser);login(d,'a@example.test');assert d.evaluate('trainingLibrary.length')==1;d.locator('#view-training').click();d.select_option('#training-library',source_id);d.locator('#training-notes').fill('Modification depuis un autre PC');d.locator('#training-save').click();wait_sync(d);remote_version=rows[0]['revision']
 # Polling refreshes the library while preserving the other PC's unfinished draft and its version.
 a.evaluate('clubNetworkQueueSync()');wait_sync(a);assert a.evaluate("currentTraining.notes==='Travail partagé automatiquement'")
 a.locator('#training-notes').fill('Version locale concurrente');a.locator('#training-save').click();wait_sync(a);assert rows[0]['revision']==remote_version;assert 'conflit' in a.locator('#club-sync-status').inner_text().lower()
 club(a);a.select_option('#club-network-author',A);a.select_option('#club-network-kind','training');a.locator('#club-network-list button',has_text='Ouvrir pour modifier').click();wait_sync(a);assert a.locator('#training-space').is_visible();assert a.evaluate("currentTraining.notes==='Modification depuis un autre PC'");assert a.evaluate("trainingLibrary.some(s=>s.notes==='Version locale concurrente'&&s.id!==currentTraining.id)")
 # Connection failure keeps a persistent upload job; Online retries without a second Save.
 offline=True;a.locator('#training-notes').fill('Enregistrement hors connexion');a.locator('#training-save').click();wait_sync(a);assert a.evaluate('clubNetworkPendingJobs().length')==1;assert rows[0]['revision']==remote_version;a.reload();a.wait_for_selector('#club-account-bar',state='visible');wait_sync(a);assert a.evaluate('clubNetworkPendingJobs().length')==1;assert a.evaluate("currentTraining.notes==='Enregistrement hors connexion'");offline=False;a.evaluate("dispatchEvent(new Event('online'))");wait_sync(a);assert rows[0]['payload']['notes']=='Enregistrement hors connexion';assert a.evaluate('clubNetworkPendingJobs().length')==0
 # A complete manual session with a custom exercise is shared and readable by colleagues.
 b.locator('#view-training').click();b.locator('#training-manual').click();b.locator('#training-title').fill('Manuelle B');b.locator('#training-players').fill('18');b.locator('#training-duration').fill('75');b.select_option('#training-space-size','quarter');b.locator('#training-custom-add').click();b.locator('#custom-training-title').fill('Exercice inventé du coach B');b.locator('#custom-training-duration').fill('75');b.locator('#custom-training-instructions').fill('Coulisser ensemble après la passe');b.locator('#custom-training-form button[type=submit]').click();b.locator('#training-save').click();wait_sync(b)
 assert any(r['owner_id']==B and r['kind']=='training' and r['payload'].get('creationMode')=='manual' and r['payload']['space']=='quarter' and r['payload']['blocks'][0]['custom']['title']=='Exercice inventé du coach B' for r in rows)
 club(a);a.select_option('#club-network-author',B);a.select_option('#club-network-kind','training');a.locator('.club-network-card',has_text='Manuelle B').get_by_role('button',name='Consulter',exact=True).click();a.wait_for_selector('#club-network-preview',state='visible');assert 'Coulisser ensemble après la passe' in a.locator('#club-network-preview-content').inner_text();assert 'Quart de terrain' in a.locator('#club-network-preview-content').inner_text();assert a.locator('#club-network-preview-content svg').count()>=1;a.locator('#club-network-preview-close').click()
 # All original app tools are usable in the private workspace and all saved kinds synchronize.
 b.locator('#view-reports').click();b.locator('#report-title').fill('Rapport B');b.locator('#report-save').click();wait_sync(b);assert any(r['kind']=='report' and r['owner_id']==B for r in rows)
 b.locator('#view-pitch').click();b.locator('#composition-title').fill('Composition B');b.locator('#match-plan-open').click();b.locator('#match-plan-objective-0').fill('Priorité partagée du match');b.locator('#match-plan-defensive').fill('Protéger l’axe ensemble');b.locator('#match-plan-form button[type=submit]').click();wait_sync(b);assert any(r['kind']=='composition' and r['owner_id']==B and r['payload']['matchPreparation']['objectives'][0]=='Priorité partagée du match' for r in rows)
 club(a);a.select_option('#club-network-author',B);a.select_option('#club-network-kind','composition');a.locator('#club-network-list button',has_text='Consulter').click();a.wait_for_selector('#club-network-preview',state='visible');assert 'Priorité partagée du match' in a.locator('#club-network-preview-content').inner_text();assert 'Protéger l’axe ensemble' in a.locator('#club-network-preview-content').inner_text();a.locator('#club-network-preview-close').click()
 assert b.locator('#club-account-backup').count()==0;assert b.locator('#training-json').count()==0;assert b.locator('#report-export').count()==0
 # Deleting a saved document removes it on the other PC without overwriting its open draft.
 a.locator('#view-training').click();a.locator('#training-delete').click();wait_sync(a);assert not any(r['owner_id']==A and r['source_id']==source_id for r in rows)
 d.evaluate('clubNetworkQueueSync()');wait_sync(d);assert not d.evaluate('trainingLibrary.some(s=>s.id===currentTraining.id)')
 # Presence expires by server time; absence of the optional SQL never fabricates green names.
 for key,(seen,active) in list(presence.items()):
  if key[0]==B:presence[key]=(time.time()-100,active)
 a.evaluate('clubNetworkQueueSync()');wait_sync(a);assert a.locator('.club-connected-person[data-user-id="'+B+'"] .online').count()==0;assert 'Hors ligne' in a.locator('.club-connected-person[data-user-id="'+B+'"]').inner_text()
 presence_installed=False;a.evaluate('clubNetworkQueueSync()');wait_sync(a);assert a.locator('#club-connected-names .online').count()==0;assert 'Coach B' in a.locator('#club-connected-names').inner_text();assert 'indisponible' in a.locator('#club-connected-status').inner_text();presence_installed=True;activity_installed=True
 # Account cache and token are separate from local coach profiles, and logout gates the entire site.
 assert a.evaluate("!JSON.stringify(localStorage).includes('token-')")
 a.reload();a.wait_for_selector('#club-account-bar',state='visible');wait_sync(a);assert a.evaluate('activeCoach.id')=='account-'+A
 a.set_viewport_size({'width':390,'height':844});assert a.evaluate('document.documentElement.scrollWidth<=innerWidth');club(a);assert a.evaluate('document.documentElement.scrollWidth<=innerWidth')
 a.locator('#club-account-signout').click();a.wait_for_url('**/accueil.html');a.locator('#welcome-login').click();a.locator('#club-auth-gate').wait_for(state='visible');assert a.locator('#club-auth-gate').is_visible();assert not a.locator('main').is_visible();assert a.evaluate('clubNetworkSession===null')
 # A different coach using the same browser tab loads their own namespace, never the preceding account.
 login(a,'b@example.test');assert a.evaluate('activeCoach.id')=='account-'+B;assert not a.evaluate("trainingLibrary.some(s=>s.title==='Séance A actualisée')")
 # Older Supabase installations still show verified green LEDs, without invented last-login dates.
 activity_installed=False;a.evaluate('clubNetworkQueueSync()');wait_sync(a);a.locator('#view-home').click();assert a.locator('#club-connected .online').count()>=1;assert 'Non disponible' in a.locator('#club-connected .club-last-login').first.inner_text();activity_installed=True
 # Signup requires both an approved address and its one-time code; the server owns membership/name.
 cc,c=setup(browser);c.locator('#club-auth-show-signup').click();c.locator('#club-signup-first-name').fill('Camille');c.locator('#club-signup-last-name').fill('Martin');c.locator('#club-signup-email').fill('c@example.test');c.locator('#club-signup-code').fill('wrong-code-long-enough');c.locator('#club-signup-password').fill('MotDePasseTest!2026');c.locator('#club-signup-confirm').fill('MotDePasseTest!2026');c.locator('#club-network-signup button[type=submit]').click();c.wait_for_function("document.querySelector('#club-network-status').textContent.includes('refusée')");assert not c.locator('main').is_visible()
 c.locator('#club-signup-code').fill(invitation);c.locator('#club-network-signup button[type=submit]').click();c.wait_for_selector('#club-account-bar',state='visible');wait_sync(c);assert c.evaluate('activeCoach.id')=='account-'+C;assert c.locator('#coach-select option:checked').inner_text()=='Camille Martin';assert c.locator('#coach-profile').is_visible()
 co,o=setup(browser);login(o,'outside@example.test');assert not o.locator('main').is_visible();assert o.evaluate('clubNetworkSession===null')
 # Revocation is detected automatically, clearing the shared UI and gating the complete app.
 members[1]['active']=False;b.evaluate("dispatchEvent(new Event('focus'))");wait_sync(b);assert b.locator('#club-auth-gate').is_visible();assert not b.locator('main').is_visible();assert b.locator('#club-network-list').inner_text()==''
 assert not errors,errors
 print('PASS: post-login home and five sections and original tools, club logo, online LEDs and last login (including missing migration), full private app, account isolation, automatic save and cross-PC refresh, own-library download, all three kinds, schematics and copies, conflicts preserving drafts, persistent offline retry, reload/logout, approved signup with invitation code, revocation and mobile. Backend authorization tested separately on PostgreSQL.')
 browser.close()
