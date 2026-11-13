"""Actual exported/uploaded PPTX, not presenter notes, contains each authored section."""
import os,json,zipfile,io,xml.etree.ElementTree as ET
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3070');out=Path('/workspace/cruza-documents/causerie-correction');out.mkdir(parents=True,exist_ok=True)
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
def slide_text(blob):
 with zipfile.ZipFile(io.BytesIO(blob)) as z:
  names=[n for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')]
  names.sort(key=lambda n:int(n.split('slide')[-1].split('.')[0]));return ['\n'.join(ET.fromstring(z.read(n)).itertext()) for n in names],z.namelist()
def authored_text(blob):
 fields={}
 with zipfile.ZipFile(io.BytesIO(blob)) as z:
  names=sorted([n for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')],key=lambda n:int(n.split('slide')[-1].split('.')[0]))
  for name in names:
   for shape in ET.fromstring(z.read(name)).findall('.//p:sp',NS):
    mark=shape.find('p:nvSpPr/p:cNvPr',NS)
    if mark is not None and mark.get('name','').startswith('causerie-authored-'):
     fields[mark.get('name')]=fields.get(mark.get('name'),'')+''.join(t.text or '' for t in shape.findall('.//a:t',NS))
 return list(fields.values())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':1100},accept_downloads=True,locale='fr-FR');page=ctx.new_page();errors=[];uploads=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 ctx.route('**/canva-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CANVA_GATEWAY='https://canva.test';"))
 def gateway(route):
  req=route.request;path=req.url.removeprefix('https://canva.test');headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Design-Title','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}
  if req.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
  if path=='/api/status':v={'connected':True,'latest_job_id':None,'max_import_bytes':100*1024*1024}
  elif path=='/api/imports':uploads.append(req.post_data_buffer);v={'id':'content-job','status':'success','designs':[{'id':'content-design','edit_url':'https://www.canva.com/design/content-design/edit'}]}
  else:raise AssertionError(path)
  route.fulfill(status=200,headers=headers,content_type='application/json',body=json.dumps(v))
 ctx.route('https://canva.test/**',gateway)
 ctx.route('https://*.supabase.co/**',lambda r:r.abort())
 page.goto(base+'/?mode=local');page.wait_for_function('window.causerieEleven && window.causerieExport');page.evaluate("clubNetworkSession={access_token:'test-only-token',user:{id:'fixture-coach'}}");page.locator('#view-pitch').click();page.locator('#match-new').click();page.locator('#task-match-causerie').click()
 context=page.get_by_label('Contexte du match',exact=True);assert context.is_visible();context.fill('CONTEXTE-UNIQUE : match décisif, rester sereins.');assert page.evaluate("getCompositionBoard().matchPreparation.context").startswith('CONTEXTE-UNIQUE')
 page.get_by_label('Animation Défensive · Consignes',exact=True).fill('DEFENSE-UNIQUE : protéger l’axe et orienter le porteur.')
 page.get_by_label('Animation Offensive · Consignes',exact=True).fill('ATTAQUE-UNIQUE : occuper les couloirs et fixer avant de transmettre.')
 page.get_by_label('Transition OFF / DEF · Consignes',exact=True).fill('PERTE-UNIQUE : les trois plus proches freinent le porteur.')
 page.get_by_label('Transition DEF / OFF · Consignes',exact=True).fill('RECUPERATION-UNIQUE : première passe vers un joueur disponible.')
 page.get_by_label('CPA Défensif · Consignes',exact=True).fill('CPA-DEF-UNIQUE : zone au premier poteau.')
 page.get_by_label('CPA Offensif · Consignes',exact=True).fill('CPA-OFF-UNIQUE : attaque du deuxième poteau.')
 page.get_by_label('Mot d’ordre final · Consignes',exact=True).fill('FINAL-UNIQUE : jouer ensemble jusqu’au bout.')
 page.screenshot(path=str(out/'contexte-causerie-corrige.png'),full_page=True)
 page.evaluate('''()=>{const b=getCompositionBoard();b.matchPreparation.contextObjective='OBJECTIF-CONTEXTE-UNIQUE';b.matchPreparation.contextDynamics='DYNAMIQUE-UNIQUE';b.matchPreparation.opponent='ADVERSAIRE-UNIQUE';b.matchPreparation.specific='MISE-EN-PLACE-UNIQUE';b.notes='TACTIQUE-UNIQUE';
 const initial={tokens:[{id:'p1',label:'6',side:'own',x:20,y:40}],ball:{x:30,y:50}};
 const sequence={id:'content-animation',title:'Séquence intégrale',updatedAt:new Date().toISOString(),speed:'1',choice:'forward',state:{sequenceId:'content-animation',sequenceTitle:'Séquence intégrale',scenario:'custom',step:0,tokens:structuredClone(initial.tokens),ball:{...initial.ball},customBase:initial,customSteps:[[{id:'p1',x:60,y:30,type:'move'},{id:'ball',x:60,y:30,type:'pass'}]]}};
 b.causerieSlideAnimations={defensive:[sequence],offDef:[],offensive:[],defOff:[]};b.causerieAnimationVariant='native';window.contentBefore=JSON.stringify(causerieExport.capture());}''')
 markers=['CONTEXTE-UNIQUE','DEFENSE-UNIQUE','ATTAQUE-UNIQUE','PERTE-UNIQUE','RECUPERATION-UNIQUE','CPA-DEF-UNIQUE','CPA-OFF-UNIQUE','FINAL-UNIQUE','OBJECTIF-CONTEXTE-UNIQUE','DYNAMIQUE-UNIQUE','ADVERSAIRE-UNIQUE','MISE-EN-PLACE-UNIQUE','TACTIQUE-UNIQUE']
 with page.expect_download(timeout=90000) as d:
  page.evaluate("async()=>{const deck=await causerieExport.build(causerieExport.capture(),false);mediaDownload(await deck.write({outputType:'blob'}),'complete-short.pptx')}")
 short=out/'causerie-courte-corrigee.pptx';d.value.save_as(short);texts,files=slide_text(short.read_bytes());assert len(texts)==11,len(texts)
 for m in markers:assert m in '\n'.join(texts),m
 assert 'DEFENSE-UNIQUE' in texts[4];assert 'PERTE-UNIQUE' in texts[5];assert 'ATTAQUE-UNIQUE' in texts[6];assert 'RECUPERATION-UNIQUE' in texts[7]
 assert page.evaluate('JSON.stringify(causerieExport.capture())')==page.evaluate('contentBefore')
 # Overflow must stay on visible continuation slides in section order.
 long='DEBUT-TEXTE-LONG '+('Se replacer collectivement et communiquer avant chaque déplacement. '*52)+' FIN-TEXTE-LONG'
 page.get_by_label('Animation Défensive · Consignes',exact=True).fill(long)
 page.evaluate("()=>{getCompositionBoard().matchPreparation.specific='DEBUT-SPECIFIQUE '+('Une mise en place complète, sans couper les consignes. '.repeat(45))+' FIN-SPECIFIQUE';window.longBefore=JSON.stringify(causerieExport.capture())}")
 with page.expect_download(timeout=90000) as d:
  page.evaluate("async()=>{const deck=await causerieExport.build(causerieExport.capture(),false);mediaDownload(await deck.write({outputType:'blob'}),'complete-long.pptx')}")
 path=out/'causerie-longue-corrigee.pptx';d.value.save_as(path);texts,files=slide_text(path.read_bytes());assert len(texts)>11
 combined=''.join(texts);normalize=lambda s:''.join(s.split());assert any(normalize(long) in normalize(v) for v in authored_text(path.read_bytes()))
 for m in ['DEBUT-SPECIFIQUE','FIN-SPECIFIQUE']:assert m in combined,m
 assert combined.index('FIN-TEXTE-LONG')<combined.index('PERTE-UNIQUE');assert page.evaluate('JSON.stringify(causerieExport.capture())')==page.evaluate('longBefore')
 # Actual create-and-upload path uses MP4 media and sends all authored text.
 page.evaluate("()=>{clubNetworkSession={access_token:'test-only-token',user:{id:'fixture-coach'}};}")
 page.evaluate('causerieExport.createAndOpen()');page.wait_for_function("document.querySelector('#causerie-results a')",timeout=120000)
 assert len(uploads)==1;uploaded=uploads[0];(out/'causerie-envoyee-canva-test.pptx').write_bytes(uploaded);texts,files=slide_text(uploaded);combined=''.join(texts)
 for m in markers:
  if m!='DEFENSE-UNIQUE' and m!='MISE-EN-PLACE-UNIQUE':assert m in combined,m
 assert any(normalize(long) in normalize(v) for v in authored_text(uploaded));assert any(f.endswith('.mp4') for f in files),files
 assert not errors,errors
 after=page.evaluate('causerieExport.capture()');before=json.loads(page.evaluate('longBefore'))
 def diffs(a,b,path=''):
  if isinstance(a,dict) and isinstance(b,dict):
   return sum((diffs(a.get(k),b.get(k),path+'.'+k) for k in set(a)|set(b)),[])
  if a!=b:return [(path,str(a)[:120],str(b)[:120])]
  return []
 changed=diffs(before,after);print('Upload source differences:',changed)
 assert not changed,changed
 b.close()
print('PASS: visible context input, short 11-slide deck, every authored section on slides, lossless continuation, ordering, source unchanged, actual mocked Canva upload with MP4.')
