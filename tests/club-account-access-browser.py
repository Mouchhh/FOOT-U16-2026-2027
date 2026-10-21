"""Account acceptance: reset links, expiry, mismatch, reload, authorization and no real mail."""
import json,time
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:3016';uid='00000000-0000-4000-8000-000000000001';calls=[];errors=[];weak=False;authorized=False;fail_logout=False

def api(route):
 global weak
 req=route.request;path=urlparse(req.url).path;body=req.post_data_json if req.post_data else {};calls.append((path,req.method,body));headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'}
 def reply(obj,status=200):route.fulfill(status=status,headers=headers,content_type='application/json',body=json.dumps(obj))
 if req.method=='OPTIONS':return reply(None,204)
 if path in ['/auth/v1/recover','/auth/v1/resend']:return reply({})
 if path=='/auth/v1/user':
  if req.headers.get('authorization')=='Bearer expired':return reply({'code':'otp_expired'},401)
  if req.method=='PUT' and weak:weak=False;return reply({'code':'weak_password'},422)
  return reply({'id':uid,'email':'coach@example.test'})
 if path=='/auth/v1/verify':return reply({'access_token':'verified','refresh_token':'refresh','expires_in':3600,'user':{'id':uid,'email':'coach@example.test'}})
 if path=='/auth/v1/token':return reply({'code':'invalid_credentials'},400)
 if path=='/auth/v1/logout':return route.abort() if fail_logout else reply({})
 if path=='/rest/v1/club_members':return reply([{'user_id':uid,'display_name':'Coach Test','active':True}] if authorized else []) # A valid reset never grants membership.
 return reply([])

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900})
 ctx.route('**/club-cloud-config.js',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://club-test.supabase.co',publishableKey:'sb_publishable_test'};"));ctx.route('https://club-test.supabase.co/**',api)
 page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/?auth=login');page.wait_for_selector('#club-auth-forgot')
 page.locator('#club-network-email').fill('coach@example.test');page.locator('#club-network-password').fill('incorrect');page.locator('#club-network-signin').click();page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('incorrect')");assert page.locator('#club-network-email').input_value()=='coach@example.test'
 page.locator('#club-auth-forgot').click();assert page.locator('#club-recovery-email').input_value()=='coach@example.test';page.locator('#club-network-recover').get_by_role('button',name='Recevoir le lien',exact=True).click();page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('Si un compte')")
 page.locator('#club-auth-resend').click();page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('attend une confirmation')");assert any(c[0]=='/auth/v1/resend' and c[2]=={'type':'signup','email':'coach@example.test'} for c in calls)
 sent=next(c for c in calls if c[0]=='/auth/v1/recover');assert sent[2]=={'email':'coach@example.test'}
 page.goto(BASE+'/index.html?auth=recovery#access_token=valid&refresh_token=refresh&type=recovery&expires_in=3600');page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('Lien vérifié')");assert 'access_token' not in page.url;assert not page.locator('main').is_visible();assert not page.evaluate('clubNetworkBound()')
 page.evaluate("dispatchEvent(new Event('focus'));dispatchEvent(new Event('online'))");assert not any(c[0]=='/rest/v1/club_members' for c in calls)
 page.reload();page.wait_for_selector('#club-network-reset',state='visible');assert page.evaluate('clubAccountRecoveryActive');assert not page.locator('main').is_visible()
 page.locator('#club-recovery-password').fill('NouveauMotDePasse2026!');page.locator('#club-recovery-confirm').fill('AutreMotDePasse2026!');page.locator('#club-network-reset button[type=submit]').click();page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('identiques')");assert not any(c[0]=='/auth/v1/user' and c[1]=='PUT' for c in calls)
 weak=True;page.locator('#club-recovery-confirm').fill('NouveauMotDePasse2026!');page.locator('#club-network-reset button[type=submit]').click();page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('plus solide')");assert page.locator('#club-recovery-password').input_value()=='';assert page.evaluate('clubAccountRecoveryActive')
 page.locator('#club-recovery-password').fill('DifferentMotDePasse2026!');page.locator('#club-recovery-confirm').fill('DifferentMotDePasse2026!');page.locator('#club-network-reset button[type=submit]').click();page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('pas autorisé')");assert not page.locator('main').is_visible();assert page.evaluate('clubNetworkSession===null');assert page.evaluate("!JSON.stringify(localStorage).includes('DifferentMotDePasse')&&!JSON.stringify(sessionStorage).includes('DifferentMotDePasse')")
 page.goto(BASE+'/index.html?auth=recovery#error=access_denied&error_code=otp_expired&error_description=secret');page.wait_for_selector('#club-network-recover',state='visible');assert 'secret' not in page.url;assert 'expiré' in page.locator('#club-network-status').inner_text()
 page.goto(BASE+'/index.html?auth=recovery&token_hash=one-time-token&type=recovery');page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('Lien vérifié')");assert 'token_hash' not in page.url;assert any(c[0]=='/auth/v1/verify' and c[2]=={'token_hash':'one-time-token','type':'recovery'} for c in calls)
 page.locator('#club-network-reset').get_by_role('button',name='Annuler et revenir à la connexion',exact=True).click();assert page.locator('#club-network-login').is_visible();assert page.evaluate('clubNetworkSession===null')
 page.set_viewport_size({'width':390,'height':844});page.locator('#club-network-password').fill('VisibleSecret!');page.locator('#club-network-login .club-password-reveal').click();assert page.locator('#club-network-password').get_attribute('type')=='text';page.locator('#club-network-login .club-password-reveal').click();assert page.locator('#club-network-password').get_attribute('type')=='password';assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/account-login-mobile.png',animations='disabled')
 # A genuinely authorized account completes recovery, binds its coach and reaches home.
 authorized=True;page.goto(BASE+'/index.html?auth=recovery#access_token=authorized&refresh_token=refresh&type=recovery');page.wait_for_function("document.querySelector('#club-network-status').textContent.includes('Lien vérifié')")
 page.locator('#club-recovery-password').fill('UnAutreMotDePasse2026!');page.locator('#club-recovery-confirm').fill('UnAutreMotDePasse2026!');page.locator('#club-network-reset button[type=submit]').click();page.wait_for_selector('#club-home',state='visible');assert page.evaluate('activeCoach.id')=='account-'+uid;assert page.locator('#coach-select option:checked').inner_text()=='Coach Test';assert not page.evaluate('clubAccountRecoveryActive')
 page.evaluate("document.querySelector('#view-training').click();trainingWizard.go(2)");page.wait_for_function("history.state?.clubNavigation?.page.view==='training'");page.reload();page.wait_for_function("clubNetworkBound() && !clubNetworkBusy && document.body.classList.contains('training-mode')");assert page.locator('#training-step-2').is_visible();page.evaluate("document.querySelector('#view-home').click()")
 page.evaluate("currentTraining.title='Brouillon conservé après déconnexion';saveTrainingDraft()");old_session=page.evaluate('clubNetworkSession');fail_logout=True;page.locator('#club-account-signout').click();page.wait_for_url('**/accueil.html');page.goto(BASE+'/index.html?auth=login');assert not page.locator('main').is_visible();assert page.evaluate("Object.values(localStorage).some(s=>s.includes('Brouillon conservé après déconnexion'))")
 page.evaluate('s=>{clubNetworkSession=s;clubNetworkResume()}',old_session);assert page.evaluate('clubNetworkSession===null');assert not page.locator('main').is_visible()
 # Confirmation email returns use the same verified account and membership checks.
 page.goto(BASE+'/index.html?auth=login#access_token=confirmed&refresh_token=refresh&type=signup');page.wait_for_selector('#club-home',state='visible');assert page.evaluate('activeCoach.id')=='account-'+uid;assert not page.evaluate('clubAccountRecoveryActive');assert 'access_token' not in page.url
 assert not errors,errors;b.close();print('PASS account recovery, link verification/expiry, reload and focus guard, confirmation mismatch, weak password, unchanged authorization, cleanup, cancellation and mobile.')
