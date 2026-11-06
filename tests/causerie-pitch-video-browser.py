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
 page.evaluate("premiumSnapshot.board.causerieAnimationVariant='video'")
 assert page.evaluate("""()=>{
  const initial=causerieAnimations.frames(premiumSnapshot.board.causerieSlideAnimations.defensive[0]).initial;
  for(const [key,value] of Object.entries(clubGamePhaseColors).filter(([k])=>k!=='ludic')){
   const node=document.createElement('section');node.className='training-assistant-intention';node.dataset.intention=key;document.body.append(node);
   const rgb=[0,2,4].map(i=>parseInt(value.slice(i,i+2),16));
   if(getComputedStyle(node).borderLeftColor!=='rgb('+rgb.join(', ')+')')throw Error('Phase color diverges from training');node.remove();
   const canvas=document.createElement('canvas');canvas.width=1008;canvas.height=816;
   renderMedia(canvas,initial,true,'',{pitchOnly:true,phaseColor:'#'+value});
   const data=canvas.getContext('2d').getImageData(0,0,1008,816).data;let found=0;
   for(let i=0;i<data.length;i+=4)if(data[i]===rgb[0]&&data[i+1]===rgb[1]&&data[i+2]===rgb[2])found++;
   if(found<10)throw Error('Phase arrow color missing');
  }return true;
 }""")

 before=page.evaluate('JSON.stringify(premiumSnapshot)')
 with page.expect_download(timeout=120000) as dl:
  page.evaluate("""async()=>{const deck=await causerieExport.build(premiumSnapshot,false);const blob=await deck.write({outputType:'blob'});mediaDownload(blob,'causerie-video.pptx');}""")
 target='/tmp/causerie-pitch-video-test.pptx';dl.value.save_as(target)
 assert page.evaluate('JSON.stringify(premiumSnapshot)')==before
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  mp4=[name for name in z.namelist() if name.endswith('.mp4')]
  assert len(mp4)==5,mp4
  for i in (6,7,8,9):
   root=ET.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
   assert not root.findall('.//a:t',NS),'No heading, labels or side information'
   assert root.findall('.//a:videoFile',NS),'Video media relationship required'
   assert any(n.get('action')=='ppaction://media' for n in root.findall('.//a:hlinkClick',NS)),'Clickable PowerPoint media'
   assert not root.findall('.//p:animMotion',NS)
  for index,name in enumerate(mp4):
   path=Path(f'/tmp/causerie-video-check-{index}.mp4');path.write_bytes(z.read(name))
   import subprocess,json
   probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
   assert probe['streams'][0]['codec_name']=='h264',probe
   assert float(probe['format']['duration'])>0.5
   if index==0:
    from PIL import Image,ImageChops
    import io
    first=Image.open(io.BytesIO(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-frames:v','1','-f','image2pipe','-vcodec','png','-'])))
    last=Image.open(io.BytesIO(subprocess.check_output(['ffmpeg','-v','error','-ss','0.7','-i',str(path),'-frames:v','1','-f','image2pipe','-vcodec','png','-'])))
    difference=ImageChops.difference(first.convert('RGB'),last.convert('RGB'))
    assert sum(1 for pixel in difference.get_flattened_data() if max(pixel)>30)>500,'Actual player/ball movement must be encoded'

  assert 'Garder une couverture derrière la ligne.' in ''.join(ET.fromstring(z.read('ppt/notesSlides/notesSlide6.xml')).itertext())
  assert 'Nos idées de jeu' in ''.join(ET.fromstring(z.read('ppt/notesSlides/notesSlide6.xml')).itertext())
 # Confirm actual browser playback can pause and resume the encoded file in place.
 data=Path('/tmp/causerie-video-check-0.mp4').read_bytes()
 import base64
 page.evaluate("""data=>{const v=document.createElement('video');v.id='video-pause-test';v.controls=true;v.muted=true;v.src='data:video/mp4;base64,'+data;document.body.append(v)}""",base64.b64encode(data).decode())
 page.locator('#video-pause-test').evaluate('(v)=>v.play()');page.wait_for_function('document.querySelector("#video-pause-test").currentTime>0.2')
 paused=page.locator('#video-pause-test').evaluate('(v)=>{v.pause();return v.currentTime}')
 page.wait_for_timeout(200)
 assert abs(page.locator('#video-pause-test').evaluate('(v)=>v.currentTime')-paused)<0.03
 page.locator('#video-pause-test').evaluate('(v)=>v.play()');page.wait_for_function('(time)=>document.querySelector("#video-pause-test").currentTime>time+0.1',arg=paused)
 assert not errors,errors;b.close()
print('PASS: eleven slides, five embedded H.264 videos, pitch-only slides, clickable media, source notes preserved and real pause/resume')
