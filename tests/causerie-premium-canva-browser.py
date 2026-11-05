"""Canva receives the same club deck with GIFs, without changing the PPT preference.
All gateway/Canva requests are intercepted. No credentials or document reach a service.
"""
import io,json,zipfile,xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':1000});page=ctx.new_page();errors=[];uploads=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/canva-config.js*',lambda route:route.fulfill(content_type='application/javascript',body="window.CLUB_CANVA_GATEWAY='https://canva.test';"))
 def gateway(route):
  req=route.request;headers={'Access-Control-Allow-Origin':'http://127.0.0.1:3016','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Design-Title','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}
  if req.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
  assert req.headers.get('authorization')=='Bearer fake-premium-session'
  path=req.url.removeprefix('https://canva.test')
  if path=='/api/status':value={'connected':True,'latest_job_id':None}
  elif path=='/api/imports' and req.method=='POST':
   uploads.append(req.post_data_buffer);value={'id':'premium-job','status':'success','designs':[{'id':'premium-demo','edit_url':'https://www.canva.com/design/premium-demo/edit'}]}
  else:value={'id':'premium-job','status':'success','designs':[{'id':'premium-demo','edit_url':'https://www.canva.com/design/premium-demo/edit'}]}
  route.fulfill(status=200,headers=headers,content_type='application/json',body=json.dumps(value))
 ctx.route('https://canva.test/**',gateway);ctx.route('https://www.canva.com/**',lambda r:r.fulfill(content_type='text/html',body='<p>Canva simulé</p>'))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.causerieEleven&&window.causerieExportPhotos')
 page.evaluate('''()=>{clubNetworkSession={access_token:'fake-premium-session',user:{id:'fake-premium-coach'}};const board=getCompositionBoard();createCustomSequence();simpleState.sequenceTitle='Animation exemple';simpleState.sequenceId='premium-sequence';simpleState.customSteps=[[{id:simpleState.tokens[0].id,x:55,y:40,type:'move'}]];const entry={id:'premium-sequence',title:'Animation exemple',updatedAt:new Date().toISOString(),speed:'1',choice:'forward',state:structuredClone(simpleState)};board.causerieSlideAnimations={defensive:[entry],offDef:[],offensive:[],defOff:[]};board.causerieAnimationVariant='native';board.title='Exemple export Canva';document.querySelector('[data-causerie-export]').click();}''')
 page.wait_for_function('!document.querySelector("#causerie-upload").disabled');before=page.evaluate('JSON.stringify(getCompositionBoard())');assert not uploads
 page.locator('#causerie-upload').click();page.wait_for_function('document.querySelector(".causerie-results a")')
 assert len(uploads)==1
 with zipfile.ZipFile(io.BytesIO(uploads[0])) as z:
  ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
  for i in range(1,12):
   root=ET.fromstring(z.read(f'ppt/slides/slide{i}.xml'));assert not root.findall('p:timing',ns)
   assert any(n.get('name')==f'club-logo-slide-{i}' for n in root.findall('.//p:cNvPr',ns))
  assert any(name.endswith('.gif') for name in z.namelist())
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 assert page.evaluate('getCompositionBoard().causerieAnimationVariant')=='native'
 assert not errors,errors;b.close()
print('PASS: intercepted Canva import receives branded eleven-slide GIF variant, all logos, no native-only timing; source board and native PPT preference unchanged, no real Canva call.')
