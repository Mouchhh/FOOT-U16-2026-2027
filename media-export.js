// Export local sur canvas : aucun compte, aucune photo ni donnée envoyée à Canva.
let videoExportJob=null;
function mediaDownload(blob,name){const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function mediaName(extension){return namedDocumentFilename(simpleState.sequenceTitle?.trim()||'stade-mayennais-'+simpleState.scenario,extension);}
function wrapMediaText(ctx,text,x,y,maxWidth,lineHeight){
 let line='';for(const word of text.split(/\s+/)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;line=word;}else line=candidate;}if(line){ctx.fillText(line,x,y);y+=lineHeight;}return y;
}
function renderMedia(canvas,snapshot,landscape){
 const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;const s=simpleScenarios[snapshot.scenario];
 ctx.fillStyle='#f0f4fb';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#2855a2';ctx.font='bold 22px Arial';ctx.fillText('STADE MAYENNAIS · '+(state.category||'FOOTBALL À 11')+' · TABLEAU TACTIQUE',48,48);
 ctx.fillStyle='#18345b';ctx.font='bold 36px Arial';ctx.fillText(snapshot.sequenceTitle?.trim()||s.title,48,100,1250);
 const maxW=1250,maxH=860;const aspect=landscape?840/680:680/840;const w=Math.min(maxW,maxH*aspect),h=w/aspect;
 const x=48+(maxW-w)/2,y=148;
 ctx.fillStyle='#294d37';ctx.fillRect(x,y,w,h);
 for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#2e533c':'#294d37';if(landscape)ctx.fillRect(x+i*w/10,y,w/10+.5,h);else ctx.fillRect(x,y+i*h/10,w,h/10+.5);}
 ctx.save();if(landscape){ctx.translate(x+w,y);ctx.rotate(Math.PI/2);ctx.scale(h/680,w/840);}else{ctx.translate(x,y);ctx.scale(w/680,h/840);}
 ctx.strokeStyle='#b3c7ad';ctx.fillStyle='#b3c7ad';ctx.lineWidth=1.5;
 document.querySelectorAll('#simple-pitch .markings>*').forEach(shape=>{
  const n=k=>Number(shape.getAttribute(k));const tag=shape.tagName.toLowerCase();ctx.beginPath();
  if(tag==='rect')ctx.rect(n('x'),n('y'),n('width'),n('height'));
  else if(tag==='circle')ctx.arc(n('cx'),n('cy'),n('r'),0,Math.PI*2);
  else if(tag==='path'){ctx.stroke(new Path2D(shape.getAttribute('d')));return;}
  if(shape.classList.contains('spot'))ctx.fill();else ctx.stroke();
 });ctx.restore();
 const xy=(px,py)=>landscape?[x+(100-py)*w/100,y+px*h/100]:[x+px*w/100,y+py*h/100];
 s.steps[snapshot.step][2].forEach(([index,ex,ey,type])=>{
  const p=snapshot.tokens.find(p=>p.id==='s'+index);if(!p)return;const [ax,ay]=xy(p.x,p.y),[bx,by]=xy(ex,ey);if(Math.hypot(bx-ax,by-ay)<6)return;
  ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.setLineDash(type==='pass'?[10,8]:[]);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.setLineDash([]);
  const a=Math.atan2(by-ay,bx-ax);ctx.beginPath();ctx.moveTo(bx-13*Math.cos(a-.45),by-13*Math.sin(a-.45));ctx.lineTo(bx,by);ctx.lineTo(bx-13*Math.cos(a+.45),by-13*Math.sin(a+.45));ctx.stroke();ctx.restore();
 });
 snapshot.tokens.filter(p=>p.side!=='away'||snapshot.showOpponents!==false).forEach(p=>{
  const [cx,cy]=xy(p.x,p.y);ctx.beginPath();ctx.arc(cx,cy,23,0,Math.PI*2);ctx.fillStyle=p.side==='own'?'#2855a2':'#c83f4f';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 17px Arial';ctx.fillText(p.label.length<=4?p.label:p.label.slice(0,4),cx,cy);
  if(p.label.length>4){ctx.font='15px Arial';ctx.fillStyle='#102819';const tw=ctx.measureText(p.label).width;ctx.fillRect(cx-tw/2-5,cy+27,tw+10,23);ctx.fillStyle='#fff';ctx.fillText(p.label,cx,cy+38);}
 });
 const [ballX,ballY]=xy(snapshot.ball.x,snapshot.ball.y);ctx.beginPath();ctx.arc(ballX,ballY,12,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#142c22';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(ballX,ballY,4,0,Math.PI*2);ctx.fillStyle='#142c22';ctx.fill();
 ctx.textAlign='left';ctx.textBaseline='alphabetic';const tx=1360,tw=510;
 ctx.fillStyle='#2855a2';ctx.font='bold 20px Arial';ctx.fillText(s.free?'TABLEAU LIBRE · 11 CONTRE 11':'ÉTAPE '+(snapshot.step+1)+' / 3',tx,190);
 ctx.fillStyle='#18345b';ctx.font='bold 30px Arial';let ty=wrapMediaText(ctx,s.steps[snapshot.step][0],tx,245,tw,40);
 ctx.font='24px Arial';ty=wrapMediaText(ctx,s.steps[snapshot.step][1],tx,ty+28,tw,36);
 ctx.fillStyle='#667892';ctx.font='20px Arial';wrapMediaText(ctx,s.goal,tx,ty+45,tw,30);
 ctx.font='18px Arial';ctx.fillText(landscape?'Bleus →   Adversaires ←':'Bleus ↑   Adversaires ↓',tx,900);ctx.fillText('Trait plein : course · Pointillés : passe',tx,938);
 ctx.fillStyle='#667892';ctx.font='16px Arial';ctx.fillText('Schéma pédagogique à adapter à votre équipe.',48,H-24);
}
function createMediaCanvas(){const c=document.createElement('canvas');c.width=1920;c.height=1080;return c;}
$('export-image').onclick=()=>{
 stopAnimation();const canvas=createMediaCanvas();renderMedia(canvas,structuredClone(simpleState),document.body.classList.contains('landscape-mode'));
 canvas.toBlob(blob=>{if(blob){mediaDownload(blob,mediaName('png'));$('media-status').textContent='Image PNG téléchargée · prête à importer dans Canva.';}else notify('Impossible de créer l’image.');},'image/png');
};
function videoMime(){if(typeof MediaRecorder==='undefined')return '';return ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';}
function exportSegments(snapshot,branch){
 const segments=[];
 for(let step=snapshot.step;step<3;step++){
  snapshot.step=step;const start=structuredClone(snapshot),end=structuredClone(snapshot);const passes=[];
  simpleScenarios[snapshot.scenario].steps[step][2].forEach(([i,x,y,type])=>{
   const token=end.tokens.find(p=>p.id==='s'+i);if(!token)return;
   if(type==='move'){token.x=x;token.y=y;}
   else{const receiverIndex=simpleScenarios[snapshot.scenario].tokens.findIndex(p=>p[1]===x&&p[2]===y);const receiver=start.tokens.find(p=>p.id==='s'+receiverIndex);passes.push(receiver?{x:receiver.x,y:receiver.y}:{x,y});}
  });
  if(passes.length)end.ball=passes[snapshot.scenario==='build'&&step===2&&branch==='back'?passes.length-1:0];
  segments.push({start,end});snapshot=structuredClone(end);
 }return segments;
}
function interpolateMedia(segment,t){const state=structuredClone(segment.start);const k=t*t*(3-2*t);for(const p of state.tokens){const end=segment.end.tokens.find(q=>q.id===p.id);p.x+=(end.x-p.x)*k;p.y+=(end.y-p.y)*k;}state.ball.x+=(segment.end.ball.x-state.ball.x)*k;state.ball.y+=(segment.end.ball.y-state.ball.y)*k;return state;}
function lockMedia(locked){
 for(const selector of ['.simple-toolbar','.animation-controls','.simple-edit','.simple-steps','.mode-switch','#landscape-toggle','#simple-pitch'])document.querySelector(selector).inert=locked;
 $('export-video').disabled=locked;$('export-image').disabled=locked;$('cancel-video').hidden=!locked;
}
$('cancel-video').onclick=()=>{if(videoExportJob){videoExportJob.cancelled=true;videoExportJob.cancel?.();}};
$('export-video').onclick=async()=>{
 if(videoExportJob)return;const mime=videoMime();if(!mime){notify('Export vidéo indisponible dans ce navigateur. Essayez une version récente de Chrome, Edge ou Safari.');return;}
 stopAnimation();const input=structuredClone(simpleState),landscape=document.body.classList.contains('landscape-mode'),speed=Number($('animation-speed').value);
 const canvas=createMediaCanvas();const segments=exportSegments(input,$('animation-choice').value);const duration=2400/speed,total=500+segments.length*duration+800;
 let stream,recorder;const job={cancelled:false};videoExportJob=job;lockMedia(true);$('media-status').textContent='Création de la vidéo… Gardez cet onglet visible.';
 try{
  renderMedia(canvas,segments[0].start,landscape);stream=canvas.captureStream(30);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});const chunks=[];
  const finished=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=resolve;recorder.onerror=()=>reject(new Error('Encodage vidéo indisponible.'));});
  finished.catch(()=>{});
  recorder.start(250);const start=performance.now();let last=0;
  await new Promise((resolve,reject)=>{
   job.cancel=()=>{job.cancelled=true;resolve();};
   function tick(now){try{
    if(document.hidden)job.cancelled=true;
    if(job.cancelled){resolve();return;}
    const elapsed=now-start,relative=Math.max(0,elapsed-500),index=Math.min(segments.length-1,Math.floor(relative/duration));const t=Math.min(1,(relative-index*duration)/duration);
    renderMedia(canvas,interpolateMedia(segments[index],t),landscape);
    const percent=Math.min(100,Math.floor(elapsed/total*10)*10);if(percent!==last){last=percent;$('media-status').textContent='Création de la vidéo : '+percent+' % · gardez cet onglet visible.';}
    if(elapsed>=total){resolve();return;}requestAnimationFrame(tick);
   }catch(error){reject(error);}}requestAnimationFrame(tick);
  });
  if(recorder.state!=='inactive')recorder.stop();await finished;
  if(job.cancelled){$('media-status').textContent='Export annulé. Votre tableau est conservé.';return;}
  const blob=new Blob(chunks,{type:recorder.mimeType});if(!blob.size)throw new Error('Vidéo vide.');const extension=recorder.mimeType.includes('mp4')?'mp4':'webm';mediaDownload(blob,mediaName(extension));$('media-status').textContent='Vidéo '+extension.toUpperCase()+' téléchargée · importez-la dans Canva.';
 }catch(error){$('media-status').textContent='Export vidéo impossible. Essayez un navigateur récent ou exportez une image PNG.';}
 finally{if(recorder&&recorder.state!=='inactive')recorder.stop();stream?.getTracks().forEach(t=>t.stop());videoExportJob=null;lockMedia(false);}
};
if(!videoMime()){$('export-video').disabled=true;$('media-status').textContent='Ce navigateur ne permet pas l’export vidéo. L’image PNG reste disponible.';}

document.addEventListener('visibilitychange',()=>{if(document.hidden&&videoExportJob){videoExportJob.cancelled=true;videoExportJob.cancel?.();}});
