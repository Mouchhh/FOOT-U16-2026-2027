"""A failed upload retains the real animated file; over-limit files are not sent."""
import io,json,zipfile
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':1000});page=ctx.new_page();uploads=[];errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 ctx.route('**/canva-config.js*',lambda r:r.fulfill(content_type='application/javascript',body="window.CLUB_CANVA_GATEWAY='https://canva.test';"))
 def gateway(route):
  req=route.request;headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Design-Title','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}
  if req.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
  if req.url.endswith('/api/status'):route.fulfill(status=200,headers=headers,content_type='application/json',body=json.dumps({'connected':True}));return
  if req.url.endswith('/api/imports'):
   uploads.append(req.post_data_buffer);route.abort('failed');return
  raise AssertionError(req.url)
 ctx.route('https://canva.test/**',gateway)
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('typeof causerieExport?.createAndOpen==="function"')
 page.evaluate("""()=>{clubNetworkSession={access_token:'test',user:{id:'test'}};createCustomSequence();const e={id:'test-sequence',title:'Animation conservée',speed:'2',choice:'forward',updatedAt:new Date().toISOString(),state:structuredClone(simpleState)};e.state.customSteps=[[{id:e.state.tokens[0].id,x:70,y:30,type:'move'}]];const b=getCompositionBoard();b.title='Causerie animée test';b.causerieSlideAnimations={defensive:[e],offDef:[],offensive:[],defOff:[]};window.timeouts=[];const timeout=AbortSignal.timeout;AbortSignal.timeout=ms=>{timeouts.push(ms);return timeout(ms)};window.progress=[];new MutationObserver(()=>progress.push(document.getElementById('causerie-status').textContent)).observe(document.getElementById('causerie-status'),{childList:true,subtree:true})}""")
 before=page.evaluate('JSON.stringify(getCompositionBoard())')
 page.evaluate('causerieExport.createAndOpen()');page.wait_for_selector('#causerie-animated-backup',timeout=30000)
 assert len(uploads)==1 and 120000 in page.evaluate('timeouts')
 assert page.evaluate('progress.some(s=>s.includes("Vidéo tactique")&&s.includes("%"))')
 assert 'L’envoi' in page.locator('#causerie-status').inner_text()
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 with page.expect_download() as download:page.locator('#causerie-animated-backup').click()
 target='/tmp/canva-animated-recovery.pptx';download.value.save_as(target)
 with zipfile.ZipFile(target) as z:assert any(n.endswith('.mp4') for n in z.namelist())
 with zipfile.ZipFile(io.BytesIO(uploads[0])) as z:assert any(n.endswith('.mp4') for n in z.namelist())
 # A too-large file gets a precise error before a POST, with download still available.
 page.evaluate("""()=>{document.getElementById('causerie-dialog').close();getCompositionBoard().causerieSlideAnimations={defensive:[],offDef:[],offensive:[],defOff:[]};const Base=PptxGenJS;window.PptxGenJS=class extends Base{async write(){return new Blob([new Uint8Array(20*1024*1024+1)])}}}""")
 page.evaluate('causerieExport.createAndOpen()');page.wait_for_function('document.getElementById("causerie-status").textContent.includes("20 Mo")')
 assert len(uploads)==1
 assert page.locator('#causerie-animated-backup').is_visible()
 # An encoder that never emits stop must reject and release its capture tracks.
 watchdog=ctx.new_page();watchdog.goto('http://localhost:3016/fff-integration-check.html')
 outcome=watchdog.evaluate("""async()=>{
  const {recordPitch}=await import('./causerie-video.js?v=292');
  const timeout=window.setTimeout,NativeRecorder=window.MediaRecorder,capture=HTMLCanvasElement.prototype.captureStream;
  let tracks=[];HTMLCanvasElement.prototype.captureStream=function(...args){const stream=capture.apply(this,args);tracks=stream.getTracks();return stream};
  window.setTimeout=(fn,ms,...args)=>timeout(fn,ms>=15000?10:ms,...args);
  window.MediaRecorder=class{static isTypeSupported(){return true}constructor(){this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive'}};
  try{await recordPitch({duration:500,render(canvas){canvas.getContext('2d').fillRect(0,0,100,100)}});return {rejected:false}}
  catch(error){return {rejected:true,message:error.message,stopped:tracks.every(t=>t.readyState==='ended')}}
  finally{window.setTimeout=timeout;window.MediaRecorder=NativeRecorder;HTMLCanvasElement.prototype.captureStream=capture;}
 }""")
 assert outcome['rejected'] and outcome['stopped'] and 'encodeur vidéo' in outcome['message']
 assert not errors,errors;b.close()
print('PASS: animation progress, extended upload timeout, no POST retry, failed-upload animated PPTX download and preflight 20MB guard; remote service simulated')
