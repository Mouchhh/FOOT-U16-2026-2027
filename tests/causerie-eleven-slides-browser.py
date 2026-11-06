from playwright.sync_api import sync_playwright
from pathlib import Path
import zipfile,re,xml.etree.ElementTree as ET
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(accept_downloads=True,viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.causerieEleven && window.tacticalAnimationLibrary')
 page.locator('#view-pitch').click();page.locator('#match-new').click()
 page.evaluate('''()=>{
 state.title='STADE MAYENNAIS / ÉQUIPE ADVERSE';state.matchPreparation.date='2026-11-08';state.matchPreparation.title='CHAMPIONNAT · EXEMPLE';state.matchPreparation.match='STADE MAYENNAIS / ÉQUIPE ADVERSE';state.matchPreparation.round='Journée 5';state.matchPreparation.venue='Stade · à personnaliser';state.matchPreparation.context='Contexte saisi par le coach';state.matchPreparation.objectives=['Premier axe du coach','Deuxième axe du coach','Troisième axe du coach',''];state.matchPreparation.defensive='Consignes défensives du coach';state.matchPreparation.offensive='Consignes offensives du coach';state.matchPreparation.transitionOffDef='Réaction à la perte · à personnaliser';state.matchPreparation.transitionDefOff='Réaction à la récupération · à personnaliser';state.matchPreparation.setPiecesFor='CPA offensifs · à personnaliser';state.matchPreparation.setPiecesAgainst='CPA défensifs · à personnaliser';state.matchPreparation.closingMessage='Mot d’ordre du coach';
 state.players=[...layouts['4-3-3'].map(([x,y],i)=>({id:'demo-player-'+i,name:'Joueur '+(i===10?1:i+2),number:i===10?1:i+2,photo:'',role:'starter',x,y,formationSlot:i})),...[0,1,2].map(i=>({id:'demo-sub-'+i,name:'Finisseur '+(i+1),number:i+12,photo:'',role:'sub',x:92,y:20+i*12,benchX:92,benchY:20+i*12,subSlot:i}))];state.benchSlotCount=3;
 const entry=(id,title,x)=>{const initial={tokens:[{id:'p1',label:'6',side:'own',x:20,y:40}],ball:{x:30,y:50}};return {id,title,updatedAt:new Date().toISOString(),speed:'1',choice:'forward',state:{sequenceId:id,sequenceTitle:title,scenario:'custom',step:0,tokens:structuredClone(initial.tokens),ball:{...initial.ball},customBase:initial,customSteps:[[{id:'p1',x,y:30,type:'move'},{id:'ball',x,y:30,type:'pass'}]]}}};
 simpleCommitLibrary([entry('eleven-a','Schéma A · exemple',50),entry('eleven-b','Schéma B · exemple',65)]);
 }''')
 page.locator('#task-match-causerie').click();page.locator('.causerie-clean-library > summary').evaluate_all('(rows)=>rows.forEach(row=>row.parentElement.open=true)')
 page.get_by_label('Animation Défensive · Schéma A · exemple',exact=True).check();page.get_by_label('Animation Défensive · Schéma B · exemple',exact=True).check()
 for phase in ['Transition OFF / DEF','Animation Offensive','Transition DEF / OFF']:page.get_by_label(phase+' · Schéma A · exemple',exact=True).check()
 assert page.evaluate('valid(getCompositionBoard())')
 original=page.evaluate('JSON.stringify({state,saves,simpleState})')
 for mode in ['native','gif']:
  page.locator('.causerie-export-options').evaluate('(node)=>node.open=true')
  page.get_by_label('Format des animations des 11 slides',exact=True).select_option(mode)
  source_before=page.evaluate('JSON.stringify({state,saves,simpleState})')
  with page.expect_download(timeout=120000) as dl:
   page.evaluate('''async()=>{const snapshot=causerieExport.capture();const deck=await causerieExport.build(snapshot,false);if(deck._slides.length!==11)throw Error('Wrong slide count');const blob=await deck.write({outputType:'blob'});const a=document.createElement('a');a.download='causerie-11.pptx';a.href=URL.createObjectURL(blob);a.click();}''')
  assert page.evaluate('JSON.stringify({state,saves,simpleState})')==source_before
  path=Path('/tmp/stade-mayennais-causerie-11-'+mode+'.pptx');dl.value.save_as(path)
  with zipfile.ZipFile(path) as z:
   assert z.testzip() is None
   slides=sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n)[1]));assert len(slides)==11
   titles=['CHAMPIONNAT','La composition','La dynamique du groupe','Informations adversaire','Nos idées fortes','Animation Défensive','Transition OFF / DEF','Animation Offensive','Transition DEF / OFF','CPA','ENSEMBLE']
   for n,(name,title) in enumerate(zip(slides,titles),1):
    if n not in (6,7,8,9):assert title in ''.join(ET.fromstring(z.read(name)).itertext()),(name,title)
   for n in [6,7,8,9]:
    root=ET.fromstring(z.read('ppt/slides/slide'+str(n)+'.xml'))
    assert len(root.findall('p:timing',ns))==(1 if mode=='native' else 0)
    ids=[node.attrib['id'] for node in root.findall('.//p:cTn',ns)];assert len(ids)==len(set(ids))
    shapes={node.attrib['id'] for node in root.findall('.//p:cNvPr',ns)}
    for motion in root.findall('.//p:animMotion',ns):assert motion.find('.//p:spTgt',ns).attrib['spid'] in shapes
   if mode=='native':assert len(ET.fromstring(z.read('ppt/slides/slide6.xml')).findall('.//p:animMotion',ns))==4
   else:assert len([n for n in z.namelist() if n.endswith('.gif')])>=2
   assert len([n for n in z.namelist() if re.fullmatch(r'ppt/notesSlides/notesSlide\d+\.xml',n)])==11
 # Selecting a new match must clear optional phase selections and content.
 page.evaluate('startBlankMatch()');assert page.evaluate('getCompositionBoard().causerieSlideAnimations===undefined')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors;b.close()
print('Exactly eleven ordered slides, two native animations on slide 6, per-phase choices, unique timing ids, notes, Canva GIF variant and mobile passed')
