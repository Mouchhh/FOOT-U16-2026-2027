// Browser-local H.264 recording. The caller supplies only a pitch drawing callback.
export async function recordPitch({ duration, render, width = 1280, height = 720, onProgress }) {
  const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4'].find(type =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type));
  if (!mime || !HTMLCanvasElement.prototype.captureStream)
    throw Error('Pour exporter une vidéo avec pause/reprise, utilisez Chrome, Edge ou Safari à jour, ou choisissez les trajectoires natives.');
  if(document.hidden)throw Error('Revenez sur cet onglet, puis relancez l’export vidéo.');
  const canvas = document.createElement('canvas');canvas.width=width;canvas.height=height;
  render(canvas,0);
  const cover=canvas.toDataURL('image/png'),stream=canvas.captureStream(30),chunks=[];
  let recorder,raf,timeout,watchdog,hidden;
  try {
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1500000});
    const blob=await new Promise((resolve,reject)=>{
      let failed=false;
      const abort=message=>{if(failed)return;failed=true;cancelAnimationFrame(raf);if(recorder.state!=='inactive')recorder.stop();reject(Error(message));};
      hidden=()=>{if(document.hidden)abort('Gardez cet onglet visible pendant la création des vidéos, puis relancez l’export.');};
      document.addEventListener('visibilitychange',hidden);
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onerror=()=>abort('La vidéo n’a pas pu être encodée. Réessayez dans Chrome, Edge ou Safari.');
      recorder.onstop=()=>{if(!failed)resolve(new Blob(chunks,{type:'video/mp4'}));};
      watchdog=setTimeout(()=>abort('L’encodeur vidéo ne répond plus. Relancez la génération dans cet onglet visible.'),duration+15000);
      recorder.start(100);const start=performance.now();let lastPercent=-1;
      const track=stream.getVideoTracks()[0];
      const tick=now=>{
        try {const elapsed=Math.max(0,Math.min(duration,now-start));render(canvas,elapsed);track?.requestFrame?.();const percent=Math.round(elapsed/duration*100);if(percent!==lastPercent){lastPercent=percent;onProgress?.(percent);}
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
    cancelAnimationFrame(raf);clearTimeout(timeout);clearTimeout(watchdog);document.removeEventListener('visibilitychange',hidden);
    if(recorder&&recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(track=>track.stop());
  }
}
