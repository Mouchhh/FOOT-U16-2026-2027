"""Browser integration with simulated Supabase and WhatsApp reactions; no real account."""
from pathlib import Path
import copy,json
# Reuse the authenticated-club fixture, without executing its full journey.
source=(Path(__file__).parent/'club-network-browser.py').read_text()
exec(source.split('errors=[]\nwith sync_playwright()')[0],globals())
errors=[]
wa={'state':'disconnected','group':None,'event':None};removed=False;fail_read=False
participants=[
 {'senderKey':'a','name':'Enzo Joueur','status':'present','emoji':'👍🏽','time':100,'isMe':False},
 {'senderKey':'b','name':'Hugo Joueur','status':'present','emoji':'👍','time':100,'isMe':False},
 {'senderKey':'c','name':'Gardien Club','status':'present','emoji':'👍','time':100,'isMe':False},
 {'senderKey':'d','name':'Coach Club','status':'present','emoji':'👍','time':100,'isMe':True},
 {'senderKey':'e','name':'Sans Réponse','status':'uncertain','emoji':'','time':None,'isMe':False},
 {'senderKey':'f','name':'Absent Club','status':'absent','emoji':'👎','time':100,'isMe':False}]
def gateway(route):
 global wa
 request=route.request;path=urlparse(request.url).path
 assert request.headers.get('authorization')=='Bearer token-'+A
 def reply(value,status=200):route.fulfill(status=status,content_type='application/json',headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, DELETE'},body=json.dumps(value))
 if request.method=='OPTIONS':return reply({})
 if path=='/api/connect':wa['state']='qr';wa['qr']='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN0kAAAAASUVORK5CYII=';return reply(wa)
 if path=='/api/status':
  if wa['event']:
   wa['event']['responses']=copy.deepcopy(participants)
   if removed:wa['event']['responses'][0].update(status='uncertain',emoji='',time=200)
   wa['event']['lastRead']=int(time.time()*1000);wa['event']['error']='Lecture interrompue' if fail_read else None
  return reply(wa)
 if path=='/api/groups':return reply({'groups':[{'id':'team','name':'Équipe U17'}]})
 if path=='/api/group':wa.update(group={'id':'team','name':'Équipe U17'},event=None);return reply(wa)
 if path=='/api/announcements':return reply({'messages':[{'id':'announcement','text':'Mardi 18h : réagir 👍 ou 👎','time':int(time.time())}]})
 if path=='/api/event':wa['event']={**request.post_data_json,'message':{'text':'Mardi 18h : réagir 👍 ou 👎'},'responses':copy.deepcopy(participants),'lastRead':int(time.time()*1000),'error':None};return reply(wa)
 if path=='/api/disconnect':wa={'state':'disconnected','group':None,'event':None};return reply({'disconnected':True})
 return reply({'error':'unexpected'},500)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000})
 context.route('**/club-cloud-config.js',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CLOUD_CONFIG={url:'https://club-test.supabase.co',publishableKey:'sb_publishable_test'};"))
 context.route('https://club-test.supabase.co/**',api)
 context.route('**/whatsapp-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_WHATSAPP_GATEWAY='https://wa-test.example';"))
 context.route('https://wa-test.example/**',gateway)
 page=context.new_page();page.on('dialog',lambda d:d.accept());page.on('pageerror',lambda e:errors.append(str(e)));page.goto(URL+'?auth=login');login(page,'a@example.test')
 page.locator('#view-training').click();page.locator('#training-step-link-2').click();page.locator('#training-whatsapp>summary').click()
 page.get_by_role('button',name='Associer mon compte',exact=True).click();page.locator('.whatsapp-qr').wait_for(state='visible')
 wa['state']='ready';wa.pop('qr',None);page.get_by_role('button',name='Actualiser',exact=True).click();page.get_by_role('button',name='Choisir mon groupe',exact=True).click();page.get_by_role('button',name='Utiliser ce groupe',exact=True).click()
 page.get_by_role('button',name='Choisir le message de cette séance',exact=True).click();page.locator('#whatsapp-message').wait_for();page.get_by_role('button',name='Lire ses réactions',exact=True).click()
 page.locator('.whatsapp-table tbody tr').last.wait_for();assert page.locator('.whatsapp-table tbody tr').count()==6
 assert page.locator('#whatsapp-apply').is_disabled();assert '3 présents' in page.locator('.whatsapp-totals').inner_text()
 page.get_by_label('Gardien Club est gardien',exact=True).check();page.locator('#whatsapp-confirm').check();assert page.locator('#whatsapp-apply').is_enabled()
 # A newly removed reaction is detected during the final recheck; it must not change the session silently.
 before=page.evaluate('currentTraining.players');removed=True;page.locator('#whatsapp-apply').click();page.wait_for_function("document.querySelector('#whatsapp-status').textContent.includes('ont changé')")
 assert page.evaluate('currentTraining.players')==before;assert not page.locator('#whatsapp-confirm').is_checked();assert '2 présents' in page.locator('.whatsapp-totals').inner_text()
 # Coach validates a manual correction, while absent/non-responding players and the coach stay uncounted.
 page.get_by_label('Présence de Enzo Joueur',exact=True).select_option('present');page.locator('#whatsapp-confirm').check();page.locator('#whatsapp-apply').click();page.wait_for_function("document.querySelector('#whatsapp-status').textContent.includes('Effectif appliqué')")
 assert page.evaluate('currentTraining.players')==3;assert page.evaluate('currentTraining.keepers')==1
 assert 'Enregistrez la séance' in page.locator('#whatsapp-status').inner_text()
 # An interrupted read prevents validation; no change is made to the group or the draft.
 fail_read=True;page.get_by_role('button',name='Actualiser',exact=True).click();page.wait_for_function("document.querySelector('#whatsapp-status').textContent.includes('Lecture interrompue')");assert page.locator('#whatsapp-apply').is_disabled()
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.get_by_role('button',name='Déconnecter WhatsApp et effacer mes collectes',exact=True).click();page.wait_for_function("document.querySelector('#training-whatsapp>summary').textContent.includes('non connecté')");assert page.locator('.whatsapp-table').count()==0
 assert not errors,errors
 context.close();browser.close()
print('PASS: QR private UI, coach/group/message selection, thumbs, no-answer/coach exclusion, stale reaction recheck, keeper counts, explicit draft adaptation, read failure and mobile.')
