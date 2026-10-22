"""Actual downloaded artifacts: PNG/PDF fidelity, decoded video and paginated documents."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops,ImageStat
import base64,io,json,subprocess,fitz
import numpy as np
OUT=Path('/tmp/stade-exports-16');OUT.mkdir(exist_ok=True)
photo=Image.new('RGB',(120,300),'#f0aa17');photo.paste('#d42030',(0,0,120,90));photo.paste('#2030d4',(0,210,120,300));buf=io.BytesIO();photo.save(buf,format='PNG');src='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()
def save_download(event,path):
 d=event.value;d.save_as(str(path));assert d.failure() is None and path.stat().st_size>100;return d.suggested_filename
def video_info(path,w,h):
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]));stream=next(s for s in info['streams'] if s['codec_type']=='video');assert (stream['width'],stream['height'])==(w,h);assert float(info['format'].get('duration') or stream['duration'])>.4
 first=OUT/(path.stem+'-first.png');last=OUT/(path.stem+'-last.png')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-frames:v','1',str(first)],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-sseof','-0.15','-i',str(path),'-frames:v','1',str(last)],check=True)
 assert sum(ImageStat.Stat(ImageChops.difference(Image.open(first).convert('RGB'),Image.open(last).convert('RGB'))).mean)>.1
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page(viewport={'width':1366,'height':900},accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof compositionPDF==='function'")
 page.evaluate("src=>{document.querySelector('#view-pitch').click();state.title='Compo été U17';state.benchVisible=false;state.lanes=false;state.players[0].photo=src;state.players[0].x=25;state.players[0].y=50;state.color='#1265bc';state.arrows=[];render();document.querySelector('#composition-export').click()}",src)
 page.wait_for_function("compositionCanvas!==null&&!document.querySelector('#composition-export-png').disabled")
 with page.expect_download() as dl:page.locator('#composition-export-png').click()
 assert save_download(dl,OUT/'composition.png')=='Compo été U17-HD.png'
 with page.expect_download() as dl:page.locator('#composition-export-pdf').click()
 save_download(dl,OUT/'composition.pdf')
 png=Image.open(OUT/'composition.png').convert('RGB');assert png.size==(2560,1440)
 assert all(abs(a-b)<6 for a,b in zip(png.getpixel((1280,360)),(240,170,23)))
 pdf=fitz.open(OUT/'composition.pdf');assert len(pdf)==1;assert abs(pdf[0].rect.width/pdf[0].rect.height-16/9)<.001
 pix=pdf[0].get_pixmap(matrix=fitz.Matrix(2560/pdf[0].rect.width,1440/pdf[0].rect.height));raster=Image.frombytes('RGB',(pix.width,pix.height),pix.samples).resize(png.size)
 assert max(ImageStat.Stat(ImageChops.difference(png,raster)).mean)<4
 # Changing export options must retain the original snapshot, including the photo position.
 page.evaluate("state.players[0].x=80;state.players[0].photo='';state.title='Autre document';state.color='#ed1010'")
 page.locator('#composition-export-arrows').check();page.wait_for_function("compositionCanvas!==null&&!document.querySelector('#composition-export-png').disabled")
 assert page.evaluate("()=>{const p=compositionCanvas.getContext('2d').getImageData(1280,360,1,1).data;return p[0]>220&&p[1]>150&&p[2]<50&&compositionExportName==='Compo été U17'}")
 for fmt,dimensions in [('portrait',(595.28,841.89)),('landscape',(841.89,595.28))]:
  page.locator('#composition-export-format').select_option(fmt);page.wait_for_function("compositionCanvas!==null&&!document.querySelector('#composition-export-pdf').disabled")
  with page.expect_download() as dl:page.locator('#composition-export-pdf').click()
  save_download(dl,OUT/(fmt+'.pdf'));doc=fitz.open(OUT/(fmt+'.pdf'));assert len(doc)==1;assert abs(doc[0].rect.width-dimensions[0])<.1 and abs(doc[0].rect.height-dimensions[1])<.1
 page.locator('#composition-export-close').click()
 page.evaluate("state.players[0].photo='data:image/png;base64,bad';document.querySelector('#composition-export').click()")
 page.wait_for_function("document.querySelector('#composition-export-status').textContent.includes('photo affichée')")
 assert page.locator('#composition-export-png').is_disabled();assert page.evaluate('compositionCanvas===null')
 page.locator('#composition-export-close').click();page.evaluate("state.players[0].photo='';")
 assert page.evaluate("async()=>{const broken={photo:'data:image/png;base64,bad',role:'sub'};const hidden=await compositionImages({players:[broken]}, {bench:false});const minimal=await compositionImages({boardKind:'plan',players:[broken]}, {bench:true});return hidden.size===0&&minimal.size===0}")
 # Real exercise video contains both phases and releases its capture stream.
 page.evaluate("""()=>{window.exportBoard={version:1,lines:true,seconds:.5,frames:[{objects:[{id:'p',type:'blue',x:25,y:50,rotation:0,scale:1,label:'7',color:'#2373d7'}]},{objects:[{id:'p',type:'blue',x:75,y:50,rotation:90,scale:1,label:'7',color:'#2373d7'}]}]};window.exportHost=document.createElement('div');document.body.append(exportHost);const native=HTMLCanvasElement.prototype.captureStream;HTMLCanvasElement.prototype.captureStream=function(...args){window.lastExportStream=native.apply(this,args);return lastExportStream;};}""")
 with page.expect_download(timeout=15000) as dl:page.evaluate("void exportExerciseVideo(exportBoard,'Exercice été',exportHost)")
 ext=dl.value.suggested_filename.split('.')[-1];path=OUT/('exercise.'+ext);save_download(dl,path);video_info(path,2400,1500)
 assert page.evaluate("!exportExerciseVideo.busy&&lastExportStream.getTracks().every(t=>t.readyState==='ended')")
 for suffix,expected_x in [('first',600),('last',1800)]:
  pixels=np.asarray(Image.open(OUT/('exercise-'+suffix+'.png')).convert('RGB')).astype(int);mask=(pixels[:,:,2]>pixels[:,:,0]+40)&(pixels[:,:,2]>pixels[:,:,1]+40)&(pixels[:,:,2]>140)
  assert abs(np.where(mask)[1].mean()-expected_x)<60
 # Constructor error and cancellation cannot leave a busy flag or capture track alive.
 assert page.evaluate("async()=>{const native=MediaRecorder;window.MediaRecorder=class{static isTypeSupported(){return true;}constructor(){throw Error('codec')}};try{await exportExerciseVideo(exportBoard,'Erreur',exportHost);return !exportExerciseVideo.busy&&lastExportStream.getTracks().every(t=>t.readyState==='ended')}finally{window.MediaRecorder=native}}")
 page.evaluate("void exportExerciseVideo(exportBoard,'Annulation',exportHost)");page.get_by_role('button',name='Annuler la vidéo',exact=True).click();page.wait_for_function('!exportExerciseVideo.busy')
 assert page.evaluate("lastExportStream.getTracks().every(t=>t.readyState==='ended')")
 # Simple tactical video: snapshot name and category remain frozen during encoding.
 page.evaluate("()=>{document.querySelector('#mode-simple').click();document.querySelector('#simple-scenario').value='press';document.querySelector('#simple-scenario').dispatchEvent(new Event('change'));simpleState.sequenceTitle='Pressing vidéo';document.querySelector('#animation-speed').value='2';workspaceFlows.terrain.go(2)}")
 with page.expect_download(timeout=20000) as dl:
  page.locator('#export-video').click();page.wait_for_timeout(100);page.evaluate("simpleState.sequenceTitle='Nom modifié pendant export';state.category='Autre catégorie'")
 assert dl.value.suggested_filename.startswith('Pressing vidéo.');path=OUT/('tactical.'+dl.value.suggested_filename.split('.')[-1]);save_download(dl,path);video_info(path,1920,1080)
 assert page.evaluate('videoExportJob===null')
 # Generate an actual multi-page report with long text, observations and table rows.
 page.evaluate("""()=>{document.querySelector('#view-reports').click();currentReport=newReport();Object.assign(currentReport.info,{team:'Stade Mayennais',opponent:'Laval',goalsFor:'2',goalsAgainst:'1',date:'2026-10-22'});currentReport.title='Bilan PDF';currentReport.analysis.staff=('Observation détaillée avec accents. ').repeat(90);currentReport.events=Array.from({length:45},(_,i)=>({minute:String(i),type:'Autre',detail:'Action observée '+i}));currentReport.plan.summary='FIN DU RAPPORT VÉRIFIÉE';renderReportContent();prepareReportPrint();}""")
 page.pdf(path=str(OUT/'report.pdf'),print_background=True,prefer_css_page_size=True)
 report=fitz.open(OUT/'report.pdf');text='\n'.join(x.get_text() for x in report);assert len(report)>=2 and 'FIN DU RAPPORT VÉRIFIÉE' in text and 'Action observée 44' in text
 assert 'STADE MAYENNAIS' in text.upper()
 assert page.evaluate("()=>{document.title='Espace Stade Mayennais';const original=window.print;window.print=()=>{dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('afterprint'));};try{document.querySelector('#report-pdf').click();return document.title==='Espace Stade Mayennais'&&document.querySelector('#report-print table thead')!==null}finally{window.print=original}}")
 # Actual session PDF includes the equipment drawing and its last instruction.
 page.evaluate("""()=>{document.querySelector('#view-training').click();currentTraining=newTraining();currentTraining.title='Séance PDF';currentTraining.notes='Conserver et progresser';currentTraining.blocks=[{id:crypto.randomUUID(),exerciseId:'custom',duration:30,notes:'FIN DE SÉANCE VÉRIFIÉE',custom:{title:'Jeu dessiné',goal:'Progresser',organisation:'Deux équipes',instructions:('Passe et déplacement. ').repeat(40),material:'Coupelles et deux buts',success:'Franchir la ligne',kind:'game',width:30,length:40,board:exportBoard}}];syncTrainingForm();prepareTrainingPrint();}""")
 page.pdf(path=str(OUT/'training.pdf'),print_background=True,prefer_css_page_size=True)
 training=fitz.open(OUT/'training.pdf');text='\n'.join(x.get_text() for x in training);assert 'FIN DE SÉANCE VÉRIFIÉE' in text and 'Jeu dessiné' in text;assert any(len(x.get_drawings())>20 for x in training)
 for document in [report,training]:
  for sheet in document:
   for block in sheet.get_text('blocks'):
    assert block[0]>=-1 and block[2]<=sheet.rect.width+1,(sheet.number,block)
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 assert not errors,errors
 browser.close();print('PASS actual exports: PNG/PDF pixels, 3 paper sizes, photo fidelity, frozen snapshots, corrupt-photo refusal, decoded videos, cancel/codec cleanup, multipage reports/session diagrams and mobile. Canva account import not performed.')
