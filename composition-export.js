// Rendu indépendant de la page : dimensions fixes, photos incorporées, aucun découpage d’impression.
let compositionCanvas=null,compositionRenderVersion=0,compositionObjectURL=null;
function compositionFit(ctx,text,max){let value=text;while(value.length>1&&ctx.measureText(value).width>max)value=value.slice(0,-1);return value===text?value:value.slice(0,-1)+'…';}
async function compositionImages(snapshot){
 const sources=[snapshot.clubLogo,...snapshot.players.map(p=>p.photo)].filter(Boolean);const images=new Map();
 await Promise.all([...new Set(sources)].map(async source=>{try{const img=new Image();img.src=source;await img.decode();images.set(source,img);}catch{}}));return images;
}
function compositionPortrait(ctx,p,x,y,r,images,color){
 ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();const img=images.get(p.photo);
 if(img){ctx.save();ctx.clip();const side=Math.min(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,x-r,y-r,r*2,r*2);ctx.restore();}
 ctx.strokeStyle='white';ctx.lineWidth=Math.max(3,r*.06);ctx.stroke();
 const hex=color.slice(1),luma=parseInt(hex.slice(0,2),16)*.299+parseInt(hex.slice(2,4),16)*.587+parseInt(hex.slice(4,6),16)*.114;
 if(!img){ctx.fillStyle=luma>170?'#18345b':'white';ctx.font='bold '+Math.round(r*.82)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.number,x,y+1);}
 else{const nr=r*.37,nx=x+r*.78,ny=y+r*.75;ctx.beginPath();ctx.arc(nx,ny,nr,0,Math.PI*2);ctx.fillStyle='#214d93';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='white';ctx.font='bold '+Math.round(nr*1.12)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.number,nx,ny+1);}
 ctx.restore();
}
function compositionPitch(ctx,rect,landscape,snapshot,images,options){
 const {x,y,w,h}=rect;ctx.fillStyle='#28513b';ctx.fillRect(x,y,w,h);
 for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#305c43':'#2b553d';if(landscape)ctx.fillRect(x+i*w/10,y,w/10+.5,h);else ctx.fillRect(x,y+i*h/10,w,h/10+.5);}
 ctx.save();if(landscape){ctx.translate(x+w,y);ctx.rotate(Math.PI/2);ctx.scale(h/680,w/840);}else{ctx.translate(x,y);ctx.scale(w/680,h/840);}
 ctx.strokeStyle='#d3e5d2';ctx.fillStyle='#d3e5d2';ctx.lineWidth=1.8;
 document.querySelectorAll('#pitch>.markings>*').forEach(shape=>{const n=k=>Number(shape.getAttribute(k));ctx.beginPath();if(shape.tagName.toLowerCase()==='path'){ctx.stroke(new Path2D(shape.getAttribute('d')));return;}if(shape.tagName.toLowerCase()==='rect')ctx.rect(n('x'),n('y'),n('width'),n('height'));else ctx.arc(n('cx'),n('cy'),n('r'),0,Math.PI*2);if(shape.classList.contains('spot'))ctx.fill();else ctx.stroke();});ctx.restore();
 const xy=(px,py)=>landscape?[x+(100-py)*w/100,y+px*h/100]:[x+px*w/100,y+py*h/100];
 if(options.arrows)snapshot.arrows.forEach(([x1,y1,x2,y2])=>{const [ax,ay]=xy(x1,y1),[bx,by]=xy(x2,y2),a=Math.atan2(by-ay,bx-ax);ctx.strokeStyle='#ffe6a0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(bx-18*Math.cos(a-.5),by-18*Math.sin(a-.5));ctx.moveTo(bx,by);ctx.lineTo(bx-18*Math.cos(a+.5),by-18*Math.sin(a+.5));ctx.stroke();});
 const radius=Math.min(w,h)*.038;
 if(options.opponents&&snapshot.opponents)snapshot.opponents.players.forEach(p=>{const [px,py]=xy(p.x,p.y);compositionPortrait(ctx,p,px,py,radius*.7,images,snapshot.opponents.color);});
 snapshot.players.filter(p=>p.role!=='sub').forEach(p=>{const [px,py]=xy(p.x,p.y);compositionPortrait(ctx,p,px,py,radius,images,snapshot.color);
 ctx.font='bold '+Math.round(radius*.45)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';const name=compositionFit(ctx,p.name,w*.22),tw=ctx.measureText(name).width;const height=radius*.67;ctx.fillStyle='#102b20';ctx.fillRect(px-tw/2-14,py+radius+10,tw+28,height);ctx.fillStyle='#fff';ctx.fillText(name,px,py+radius+10+height/2);
 });
}
function compositionBench(ctx,subs,rect,images,color,vertical){
 const {x,y,w,h}=rect;ctx.fillStyle='#e7eef9';ctx.fillRect(x,y,w,h);ctx.fillStyle='#214d93';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font='bold '+(vertical?24:30)+'px Arial';ctx.fillText('IMPACTEURS / FINISSEURS',x+24,y+42);
 const cols=vertical?2:Math.min(6,subs.length),rows=Math.ceil(subs.length/cols);const cw=(w-30)/cols,ch=(h-76)/rows,r=Math.min(cw*.21,ch*.27,vertical?39:53);
 subs.forEach((p,i)=>{const cx=x+15+(i%cols+.5)*cw,cy=y+72+Math.floor(i/cols)*ch+r;compositionPortrait(ctx,p,cx,cy,r,images,color);ctx.fillStyle='#18345b';ctx.font='bold '+Math.min(26,Math.max(16,r*.48))+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(compositionFit(ctx,p.name,cw-20),cx,cy+r+26);});
}
async function renderCompositionExport(){
 const version=++compositionRenderVersion;compositionCanvas=null;for(const id of ['composition-export-png','composition-export-pdf'])$(id).disabled=true;
 $('composition-export-status').textContent='Préparation de l’aperçu…';
 try{
 const snapshot=structuredClone(state);if(snapshot.boardKind==='plan')snapshot.players.forEach(p=>p.photo='');const format=$('composition-export-format').value;
 const options={bench:$('composition-export-bench').checked,opponents:$('composition-export-opponents').checked,arrows:$('composition-export-arrows').checked};
 const images=await compositionImages(snapshot);if(version!==compositionRenderVersion)return;
 const canvas=document.createElement('canvas');const portrait=format==='portrait';[canvas.width,canvas.height]=format==='slides'?[2560,1440]:portrait?[2480,3508]:[3508,2480];const {width:W,height:H}=canvas;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#f7f9fd';ctx.fillRect(0,0,W,H);const unit=W/2560,margin=70*unit,header=170*unit;
 ctx.fillStyle='#214d93';ctx.fillRect(0,0,W,18*unit);let titleX=margin;const logo=images.get(snapshot.clubLogo);
 if(logo){const size=108*unit,scale=Math.min(size/logo.naturalWidth,size/logo.naturalHeight);ctx.drawImage(logo,margin,45*unit,logo.naturalWidth*scale,logo.naturalHeight*scale);titleX+=140*unit;}
 ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle='#667892';ctx.font='bold '+Math.round(20*unit)+'px Arial';ctx.fillText(snapshot.boardKind==='plan'?'STADE MAYENNAIS · PLAN DE JEU':'STADE MAYENNAIS · COMPOSITION',titleX,70*unit);ctx.fillStyle='#18345b';ctx.font='bold '+Math.round(48*unit)+'px Arial';ctx.fillText(compositionFit(ctx,snapshot.title||snapshot.team||'Mon équipe',W-titleX-margin),titleX,130*unit);
 ctx.font=Math.round(24*unit)+'px Arial';ctx.fillStyle='#526b8c';ctx.fillText((snapshot.category?snapshot.category+' · ':'')+'Formation '+snapshot.formation+' · '+snapshot.players.filter(p=>p.role!=='sub').length+' titulaires',margin,header+25*unit);
 const subs=options.bench?snapshot.players.filter(p=>p.role==='sub'):[];const top=header+65*unit,bottom=H-80*unit;
 let pitchSpace={x:margin,y:top,w:W-2*margin,h:bottom-top},bench=null;
 if(subs.length){if(portrait){const bh=100*unit+Math.ceil(subs.length/6)*185*unit;bench={x:margin,y:bottom-bh,w:W-2*margin,h:bh};pitchSpace.h-=bh+40*unit;}else{const bw=500*unit;bench={x:W-margin-bw,y:top,w:bw,h:Math.min(bottom-top,(100+Math.ceil(subs.length/2)*180)*unit)};pitchSpace.w-=bw+40*unit;}}
 const ratio=portrait?680/840:840/680;const pw=Math.min(pitchSpace.w,pitchSpace.h*ratio),ph=pw/ratio;compositionPitch(ctx,{x:pitchSpace.x+(pitchSpace.w-pw)/2,y:pitchSpace.y+(pitchSpace.h-ph)/2,w:pw,h:ph},!portrait,snapshot,images,options);
 if(bench)compositionBench(ctx,subs,bench,images,snapshot.color,!portrait);
 ctx.fillStyle='#667892';ctx.font=Math.round(18*unit)+'px Arial';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('LE COLLECTIF AVANT TOUT',margin,H-30*unit);
 if(options.opponents&&snapshot.opponents){ctx.textAlign='right';ctx.fillText(snapshot.opponents.name+' · '+snapshot.opponents.formation,W-margin,H-30*unit);}
 compositionCanvas=canvas;if(compositionObjectURL)URL.revokeObjectURL(compositionObjectURL);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(version!==compositionRenderVersion)return;if(!blob)throw Error();compositionObjectURL=URL.createObjectURL(blob);$('composition-export-preview').src=compositionObjectURL;$('composition-export-status').textContent=W+' × '+H+' px · photos et numéros incorporés · 1 page';
 for(const id of ['composition-export-png','composition-export-pdf'])$(id).disabled=false;
 }catch{$('composition-export-status').textContent='Impossible de préparer l’export. Réessayez après avoir vérifié les photos.';}
}
// PDF autonome : une image JPEG incorporée à une seule page, sans police externe.
async function compositionPDF(canvas){
 const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.97));if(!jpeg)throw Error();const image=new Uint8Array(await jpeg.arrayBuffer()),enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 const add=part=>{const bytes=typeof part==='string'?enc.encode(part):part;parts.push(bytes);length+=bytes.length;};
 const object=(id,body)=>{offsets[id]=length;add(id+' 0 obj\n'+body+'\nendobj\n');};
 const [w,h]=canvas.width===2480?[595.28,841.89]:canvas.width===3508?[841.89,595.28]:[960,540];add('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+w+' '+h+'] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
 offsets[4]=length;add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+image.length+' >>\nstream\n');add(image);add('\nendstream\nendobj\n');
 const stream='q\n'+w+' 0 0 '+h+' 0 0 cm\n/Im0 Do\nQ\n';object(5,'<< /Length '+enc.encode(stream).length+' >>\nstream\n'+stream+'endstream');const xref=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');return new Blob(parts,{type:'application/pdf'});
}
$('composition-export').onclick=()=>{if(state.boardKind==='plan'){$('composition-export-arrows').checked=true;$('composition-export-opponents').checked=!!state.opponents?.visible;$('composition-export-bench').checked=false;}$('composition-export-dialog').showModal();renderCompositionExport();};$('composition-export-close').onclick=()=>$('composition-export-dialog').close();
for(const id of ['composition-export-format','composition-export-bench','composition-export-opponents','composition-export-arrows'])$(id).onchange=renderCompositionExport;
$('composition-export-png').onclick=()=>{const canvas=compositionCanvas;if(canvas)canvas.toBlob(blob=>{if(blob)mediaDownload(blob,namedDocumentFilename((state.title||state.team)+'-HD','png'));},'image/png');};
$('composition-export-pdf').onclick=async()=>{const canvas=compositionCanvas;if(!canvas)return;try{mediaDownload(await compositionPDF(canvas),namedDocumentFilename(state.title||state.team,'pdf'));}catch{notify('Impossible de créer le PDF. Essayez l’image PNG.');}};
