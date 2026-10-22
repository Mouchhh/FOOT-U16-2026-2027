// Rendu indépendant de la page : dimensions fixes, photos incorporées, aucun découpage d’impression.
let compositionCanvas=null,compositionRenderVersion=0,compositionObjectURL=null,compositionExportName='Composition',compositionExportSnapshot=null;
function compositionFit(ctx,text,max){let value=text;while(value.length>1&&ctx.measureText(value).width>max)value=value.slice(0,-1);return value===text?value:value.slice(0,-1)+'…';}
async function compositionImages(snapshot,options={bench:true}){
 const sources=snapshot.boardKind==='plan'?[]:snapshot.players.filter(p=>options.bench||p.role!=='sub').map(p=>p.photo).filter(Boolean),images=new Map();let failed=false;
 await Promise.all([...new Set(sources)].map(async source=>{try{const img=new Image();img.src=source;await img.decode();images.set(source,img);}catch{failed=true;}}));
 if(failed)throw Error('Une photo affichée ne peut pas être lue. Fermez cet aperçu et remplacez ou retirez cette photo avant de réessayer.');return images;
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
 if(options.lanes){
  const labels=['Couloir latéral','Demi-espace','Couloir central','Demi-espace','Couloir latéral'];
  for(let i=0;i<5;i++){const lx=24+i*632/5;ctx.fillStyle=i%2?'#163d5466':'#c8e0ff15';ctx.fillRect(lx,37,632/5,766);if(i){ctx.beginPath();ctx.setLineDash([8,8]);ctx.strokeStyle='#ffffff77';ctx.lineWidth=1;ctx.moveTo(lx,37);ctx.lineTo(lx,803);ctx.stroke();ctx.setLineDash([]);}
   ctx.save();ctx.translate(lx+632/10,420);ctx.rotate(-Math.PI/2);ctx.fillStyle='#ffffffaa';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText(labels[i],0,0);ctx.restore();}
 }
 ctx.strokeStyle='#d3e5d2';ctx.fillStyle='#d3e5d2';ctx.lineWidth=1.8;
 document.querySelectorAll('#pitch>.markings>*').forEach(shape=>{const n=k=>Number(shape.getAttribute(k));ctx.beginPath();if(shape.tagName.toLowerCase()==='path'){ctx.stroke(new Path2D(shape.getAttribute('d')));return;}if(shape.tagName.toLowerCase()==='rect')ctx.rect(n('x'),n('y'),n('width'),n('height'));else ctx.arc(n('cx'),n('cy'),n('r'),0,Math.PI*2);if(shape.classList.contains('spot'))ctx.fill();else ctx.stroke();});ctx.restore();
 const xy=(px,py)=>landscape?[x+(100-py)*w/100,y+px*h/100]:[x+px*w/100,y+py*h/100];
 if(options.arrows)snapshot.arrows.forEach(([x1,y1,x2,y2])=>{const [ax,ay]=xy(x1,y1),[bx,by]=xy(x2,y2),a=Math.atan2(by-ay,bx-ax);ctx.strokeStyle='#ffe6a0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(bx-18*Math.cos(a-.5),by-18*Math.sin(a-.5));ctx.moveTo(bx,by);ctx.lineTo(bx-18*Math.cos(a+.5),by-18*Math.sin(a+.5));ctx.stroke();});
 const minimal=snapshot.boardKind==='plan',radius=Math.min(w,h)*(minimal?.025:.038);
 if(options.opponents&&snapshot.opponents)snapshot.opponents.players.forEach(p=>{const [px,py]=xy(p.x,p.y);compositionPortrait(ctx,p,px,py,radius*.7,images,snapshot.opponents.color);});
 const players=snapshot.players.filter(p=>p.role!=='sub');
 if(options.bench)snapshot.players.filter(p=>p.role==='sub').forEach((p,i)=>players.push({...p,x:p.benchX??92-Math.floor(i/7)*11,y:p.benchY??20+(i%7)*10,name:'I/F · '+p.name}));
 players.forEach(p=>{const [px,py]=xy(p.x,p.y),r=p.role==='sub'?radius*.75:radius;compositionPortrait(ctx,minimal?{...p,photo:''}:p,px,py,r,images,snapshot.color);
 if(minimal)return;
 ctx.font='bold '+Math.round(r*.45)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';const name=compositionFit(ctx,p.name,w*.22),tw=ctx.measureText(name).width,height=r*.67;
 const left=Math.max(x+6,Math.min(x+w-tw-34,px-tw/2-14)),top=Math.min(y+h-height-6,py+r+10);
 ctx.fillStyle='#102b20';ctx.fillRect(left,top,tw+28,height);ctx.fillStyle='#fff';ctx.fillText(name,left+(tw+28)/2,top+height/2);
 });
}
async function renderCompositionExport(){
 const version=++compositionRenderVersion;compositionCanvas=null;for(const id of ['composition-export-png','composition-export-pdf'])$(id).disabled=true;
 $('composition-export-preview').removeAttribute('src');$('composition-export-status').textContent='Préparation de l’aperçu…';
 try{
 const snapshot=structuredClone(compositionExportSnapshot||state),format=$('composition-export-format').value;
 const options={lanes:$('composition-export-lanes').checked,bench:$('composition-export-bench').checked,opponents:$('composition-export-opponents').checked,arrows:$('composition-export-arrows').checked};
 const images=await compositionImages(snapshot,options);if(version!==compositionRenderVersion)return;
 const canvas=document.createElement('canvas');const portrait=format==='portrait';[canvas.width,canvas.height]=format==='slides'?[2560,1440]:portrait?[2480,3508]:[3508,2480];const {width:W,height:H}=canvas;const ctx=canvas.getContext('2d');
 compositionPitch(ctx,{x:0,y:0,w:W,h:H},!portrait,snapshot,images,options);
 compositionCanvas=canvas;compositionExportName=snapshot.title||snapshot.team;if(compositionObjectURL)URL.revokeObjectURL(compositionObjectURL);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(version!==compositionRenderVersion)return;if(!blob)throw Error();compositionObjectURL=URL.createObjectURL(blob);$('composition-export-preview').src=compositionObjectURL;$('composition-export-status').textContent=W+' × '+H+' px · terrain seul · 1 page';
 for(const id of ['composition-export-png','composition-export-pdf'])$(id).disabled=false;
 }catch(error){if(version!==compositionRenderVersion)return;compositionCanvas=null;$('composition-export-status').textContent=error.message||'Impossible de préparer l’export. Réessayez après avoir vérifié les photos.';}
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
$('composition-export').onclick=()=>{
 compositionExportSnapshot=structuredClone(state);
 $('composition-export-arrows').checked=state.arrows.length>0;
 $('composition-export-opponents').checked=!!state.opponents?.visible;
 $('composition-export-bench').checked=state.benchVisible!==false&&state.boardKind!=='plan';
 $('composition-export-lanes').checked=state.lanes!==false;
 $('composition-export-dialog').showModal();renderCompositionExport();};$('composition-export-close').onclick=()=>$('composition-export-dialog').close();
$('composition-export-dialog').addEventListener('close',()=>{if($('composition-export-dialog').open)return;compositionRenderVersion++;compositionCanvas=null;compositionExportSnapshot=null;$('composition-export-preview').removeAttribute('src');if(compositionObjectURL)URL.revokeObjectURL(compositionObjectURL);compositionObjectURL=null;});
$('pdf').onclick=()=>$('composition-export').click();
for(const id of ['composition-export-format','composition-export-bench','composition-export-opponents','composition-export-arrows','composition-export-lanes'])$(id).onchange=renderCompositionExport;
$('composition-export-png').onclick=()=>{const canvas=compositionCanvas,name=namedDocumentFilename(compositionExportName+'-HD','png');if(canvas)canvas.toBlob(blob=>{if(blob)mediaDownload(blob,name);else notify('Impossible de créer l’image. Réessayez.');},'image/png');};
$('composition-export-pdf').onclick=async()=>{const canvas=compositionCanvas,name=namedDocumentFilename(compositionExportName,'pdf');if(!canvas)return;try{mediaDownload(await compositionPDF(canvas),name);}catch{notify('Impossible de créer le PDF. Essayez l’image PNG.');}};
