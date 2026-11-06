"""Club identity, full notes, photo hierarchy, centered hosts and fixed slide count."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import zipfile,re,xml.etree.ElementTree as ET
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(accept_downloads=True,viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.causerieEleven&&window.causerieExportPhotos')
 page.evaluate(r'''()=>{
 const board=structuredClone(getCompositionBoard());board.title='Causerie · exemple de mise en page';board.formation='4-3-3';
 for(let i=0;i<3;i++)board.players.push({...board.players[0],id:100+i,name:'Impacteur '+(i+1),number:12+i,role:'sub',photo:''});
 board.matchPreparation={...newMatchPreparation(),title:'APERÇU · EXEMPLE DE MISE EN PAGE',match:'STADE MAYENNAIS / ADVERSAIRE',date:'2026-11-07',round:'Journée 6',venue:'À l’extérieur',contextObjective:'Imposer notre rythme. Jouer ensemble jusqu’au bout.',contextDynamics:'Garder notre confiance.\nAccepter les temps faibles.\nSe parler pour rester organisés.\nFaire les efforts ensemble jusqu’au bout.',context:'Un groupe prêt à faire les efforts ensemble.\nUn déplacement qui demande de la concentration.\nEntrer dans le match dès les premières minutes.\nGarder nos repères quand le rythme change.\nRester solidaires jusqu’au coup de sifflet final.',opponent:'Adversaire · exemple.\nUne équipe qui cherche rapidement ses attaquants.\nIdentifier les espaces libres avant de recevoir.\nGarder une couverture derrière chaque pression.',opponentStrengths:'Jeu direct vers les attaquants. Présence sur les seconds ballons.',opponentWeaknesses:'Espace derrière le premier rideau. Côtés à exploiter.',opponentAnimation:'4-4-2 · bloc médian',objectives:['Jouer simple et vers l’avant','Rester proches pour défendre','Accélérer après la récupération','Prendre du plaisir à jouer ensemble'],defensive:'BLOC HAUT :\nOrienter la première relance vers un côté.\nLe partenaire proche couvre la sortie du porteur.\n\nBLOC MÉDIAN :\nCoulisser ensemble et fermer les passes intérieures.\nGarder une couverture derrière la ligne.',offensive:'Écarter pour libérer l’intérieur. Fixer avant de trouver le troisième joueur.',transitionOffDef:'Freiner immédiatement le porteur. Les partenaires protègent l’axe.',transitionDefOff:'Lever la tête dès la récupération. Chercher la profondeur si elle est libre.',setPiecesFor:'Attaquer les zones définies. Être présents au second ballon.',setPiecesAgainst:'Rester concentrés sur les marquages. Sortir ensemble après le dégagement.',closingMessage:'JOUER ENSEMBLE.\nFAIRE LES EFFORTS ENSEMBLE.'};
 const sequence=(id,title)=>{const initial={tokens:[{id:'6',label:'6',side:'own',x:25,y:45},{id:'8',label:'8',side:'own',x:45,y:35},{id:'10',label:'10',side:'own',x:60,y:65},{id:'9',label:'9',side:'away',x:65,y:45}],ball:{x:30,y:50}};return {id,title,updatedAt:new Date().toISOString(),speed:'1',choice:'forward',state:{sequenceId:id,sequenceTitle:title,scenario:'custom',step:0,tokens:structuredClone(initial.tokens),ball:{...initial.ball},customBase:initial,customSteps:[[{id:'6',x:50,y:40,type:'move'},{id:'ball',x:50,y:40,type:'pass'}]]}};};
 const object=(id,type,x,y,color)=>({id,type,x,y,color,label:type==='blue'?'6':'',rotation:0,scale:1});
 const objects=[object('a','blue',25,40,'#0055a5'),object('b','blue',55,65,'#0055a5'),object('c','red',50,45,'#e31b23'),object('ball','ball',30,45,'#ffffff'),object('cone','cone',75,30,'#f59e0b')];
 const exercise={id:'demo-exercise',title:'Fixer pour sortir de la pression',custom:{title:'Fixer pour sortir de la pression',goal:'Trouver un partenaire libre après fixation',organisation:'Deux équipes et un appui. Zone de 40 × 32 mètres.',instructions:'Attirer un adversaire avant de transmettre. Changer le rythme à la passe vers l’avant. FIN-INTÉGRALE-EXERCICE',material:'Ballons, chasubles, coupelles',success:'Le joueur libre reçoit orienté.',kind:'possession',width:40,length:32,board:{version:1,lines:true,seconds:1,frames:[{objects},{objects:objects.map(o=>({...o,x:Math.min(90,o.x+12)}))}]}}};
 board.causerieSlideAnimations={defensive:[sequence('def-a','Bloc haut · orienter ensemble'),sequence('def-b','Bloc médian · protéger l’axe')],offensive:[],offDef:[sequence('loss','Freiner pour reformer le bloc')],defOff:[sequence('win','Trouver la première passe') ]};board.causerieSlideExercises={defensive:[],offensive:[exercise],offDef:[],defOff:[]};
 window.premiumSnapshot={board,linked:null,demonstrations:{sequences:[],media:[]},photos:{choices:{1:'club:celebration-equipe',3:'club:echange-joueurs',5:'club:entree-terrain',10:'club:encadrement',6:'club:action-ballon',11:'club:cercle-equipe'},items:[]},landscape:true};window.premiumSourceBefore=JSON.stringify(premiumSnapshot);
 }''')
 for variant in ['native','gif']:
  page.evaluate(r'''variant=>{
   premiumSnapshot.board.causerieAnimationVariant=variant;
   if(variant==='gif')premiumSnapshot.board.matchPreparation.defensive+='\n'+('Texte complet du coach à conserver dans les notes. '.repeat(35))+'FIN-INTÉGRALE-DEF';
  }''',variant)
  before=page.evaluate('JSON.stringify(premiumSnapshot)')
  with page.expect_download(timeout=120000) as dl:
   page.evaluate('''async()=>{const deck=await causerieExport.build(premiumSnapshot,false);const blob=await deck.write({outputType:'blob'});mediaDownload(blob,'causerie-premium-exemple.pptx');}''')
  path='/tmp/causerie-premium-'+variant+'.pptx';dl.value.save_as(path)
  assert page.evaluate('JSON.stringify(premiumSnapshot)')==before
  with zipfile.ZipFile(path) as z:
   assert z.testzip() is None
   slides=[f'ppt/slides/slide{i}.xml' for i in range(1,12)];assert all(s in z.namelist() for s in slides)
   assert not 'ppt/slides/slide12.xml' in z.namelist()
   for i,s in enumerate(slides,1):
    root=ET.fromstring(z.read(s));assert any(n.get('name')==f'club-logo-slide-{i}' for n in root.findall('.//p:cNvPr',NS)),i
    for x in root.findall('.//a:xfrm',NS):
     off,ext=x.find('a:off',NS),x.find('a:ext',NS)
     if off is None or ext is None:continue
     assert int(off.get('x'))>=-100 and int(off.get('y'))>=-100,(i,off.attrib)
     assert int(off.get('x'))+int(ext.get('cx'))<=12192500,(i,off.attrib,ext.attrib)
     assert int(off.get('y'))+int(ext.get('cy'))<=6858100,(i,off.attrib,ext.attrib)
   for i in range(1,12):
    root=ET.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
    assert not any(n.get('name','').startswith('club-ribbon-') for n in root.findall('.//p:cNvPr',NS))
    assert 'STADE MAYENNAIS  /  CAUSERIE' not in ''.join(root.itertext())
    if i==6:assert len(root.findall('.//p:pic',NS))==(1 if variant=='native' else 3), 'Only logo and tactical media, no decorative photo'
    if i in (1,11):assert root.find('p:cSld/p:bg/p:bgPr/a:solidFill/a:srgbClr',NS).get('val')=='0055A5'
   contents=''.join(z.read(s).decode() for s in slides)
   for color in ['0B192C','E31B23','0055A5','B45309','247342']:assert color in contents,color
   assert 'Montserrat' in contents and 'Arial' in contents
   assert 'Prendre du plaisir à jouer ensemble' in ''.join(ET.fromstring(z.read('ppt/slides/slide5.xml')).itertext())
   for n in [3,5,10]:
    names=[v.get('name','') for v in ET.fromstring(z.read(f'ppt/slides/slide{n}.xml')).findall('.//p:cNvPr',NS)]
    assert f'club-reference-angle-{n}' in names
    assert f'personal-photo-{n}' in names
   for n in range(2,11):
    names=[v.get('name','') for v in ET.fromstring(z.read(f'ppt/slides/slide{n}.xml')).findall('.//p:cNvPr',NS)]
    assert len([v for v in names if v.startswith(f'club-reference-chevron-{n}-')])==3
   cover=ET.fromstring(z.read('ppt/slides/slide1.xml'))
   for run in cover.findall('.//a:r',NS):
    prop=run.find('a:rPr',NS)
    assert prop is not None and prop.get('b')=='1'
    assert prop.find('a:latin',NS).get('typeface')=='Arial'
    assert prop.get('i')!='1'
   assert 'Montserrat' in z.read('ppt/slides/slide11.xml').decode()
   assert 'Rester solidaires jusqu’au coup de sifflet final.' in ''.join(ET.fromstring(z.read('ppt/slides/slide3.xml')).itertext())
   assert 'Garder une couverture derrière chaque pression.' in ''.join(ET.fromstring(z.read('ppt/slides/slide4.xml')).itertext())
   assert 'Informations adversaire' in ''.join(ET.fromstring(z.read('ppt/slides/slide4.xml')).itertext())
   context=ET.fromstring(z.read('ppt/slides/slide3.xml'))
   assert len([n for n in context.findall('.//p:cNvPr',NS) if n.get('name','').startswith('group-dynamic-point-')])==4
   assert 'Faire les efforts ensemble jusqu’au bout.' in ''.join(context.itertext())
   assert 'Imposer notre rythme.' not in ''.join(context.itertext())
   assert 'Imposer notre rythme.' in ''.join(ET.fromstring(z.read('ppt/notesSlides/notesSlide3.xml')).itertext())
   assert 'FIN-INTÉGRALE-DEF' not in z.read('ppt/slides/slide6.xml').decode()
   if variant=='gif':assert 'FIN-INTÉGRALE-DEF' in z.read('ppt/notesSlides/notesSlide6.xml').decode()
   else:assert 'Garder une couverture derrière la ligne.' in ''.join(ET.fromstring(z.read('ppt/slides/slide6.xml')).itertext())
   assert 'FIN-INTÉGRALE-EXERCICE' in z.read('ppt/notesSlides/notesSlide8.xml').decode()
   assert 'RÈGLES DE L’ATELIER' in ''.join(ET.fromstring(z.read('ppt/slides/slide8.xml')).itertext())
   assert 'Attirer un adversaire avant de transmettre.' in ''.join(ET.fromstring(z.read('ppt/slides/slide8.xml')).itertext())
   assert '40 × 32 m' in ''.join(ET.fromstring(z.read('ppt/slides/slide8.xml')).itertext())
   assert bool(ET.fromstring(z.read('ppt/slides/slide6.xml')).findall('p:timing',NS))==(variant=='native')
 # Fixed count does not silently shrink five diagrams to unreadable thumbnails.
 assert page.evaluate('''async()=>{const s=structuredClone(premiumSnapshot);s.board.causerieSlideAnimations.defensive=Array.from({length:5},(_,i)=>({...s.board.causerieSlideAnimations.defensive[0],id:'extra-'+i}));try{await causerieExport.build(s,false);return false;}catch(e){return e.message.includes('maximum 4');}}''')
 assert not errors,errors;b.close()
print('PASS: premium native/GIF decks, 11 logos and slides, strict palette, two font families, bounded geometry, complete long notes, exercise dimensions, native timing, no source mutation and readable diagram limit.')
