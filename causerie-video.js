// Browser-local H.264 recording. The caller supplies only a pitch drawing callback.
export async function recordPitch({ duration, render, width = 1280, height = 720 }) {
  const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4'].find(type =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type));
  if (!mime || !HTMLCanvasElement.prototype.captureStream)
    throw Error('Pour exporter une vidéo avec pause/reprise, utilisez Chrome, Edge ou Safari à jour, ou choisissez les trajectoires natives.');
  if(document.hidden)throw Error('Revenez sur cet onglet, puis relancez l’export vidéo.');
  const canvas = document.createElement('canvas');canvas.width=width;canvas.height=height;
  render(canvas,0);
  const cover=canvas.toDataURL('image/png'),stream=canvas.captureStream(30),chunks=[];
  let recorder,raf,timeout,hidden;
  try {
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3500000});
    const blob=await new Promise((resolve,reject)=>{
      let failed=false;
      const abort=message=>{if(failed)return;failed=true;cancelAnimationFrame(raf);if(recorder.state!=='inactive')recorder.stop();reject(Error(message));};
      hidden=()=>{if(document.hidden)abort('Gardez cet onglet visible pendant la création des vidéos, puis relancez l’export.');};
      document.addEventListener('visibilitychange',hidden);
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onerror=()=>abort('La vidéo n’a pas pu être encodée. Réessayez dans Chrome, Edge ou Safari.');
      recorder.onstop=()=>{if(!failed)resolve(new Blob(chunks,{type:'video/mp4'}));};
      recorder.start(100);const start=performance.now();
      const tick=now=>{
        try {const elapsed=Math.max(0,Math.min(duration,now-start));render(canvas,elapsed);
          if(elapsed<duration)raf=requestAnimationFrame(tick);
          else timeout=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},100);
        }catch(error){abort(error.message);}
      };
      raf=requestAnimationFrame(tick);
    });
    if(!blob.size)throw Error('Vidéo vide : aucune animation exportée.');
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Lecture de la vidéo encodée impossible.')); r.readAsDataURL(blob);});
    return {data,cover};
  } finally {
    cancelAnimationFrame(raf);clearTimeout(timeout);document.removeEventListener('visibilitychange',hidden);
    if(recorder&&recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(track=>track.stop());
  }
}
