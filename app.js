const $=id=>document.getElementById(id);
const layouts={'4-3-3':[[22,20],[50,15],[78,20],[25,43],[50,47],[75,43],[16,67],[38,71],[62,71],[84,67],[50,88]],'4-4-2':[[35,20],[65,20],[15,43],[38,46],[62,46],[85,43],[16,67],[38,71],[62,71],[84,67],[50,88]],'4-2-3-1':[[50,16],[20,33],[50,36],[80,33],[35,52],[65,52],[16,69],[38,73],[62,73],[84,69],[50,88]],'3-5-2':[[35,19],[65,19],[12,43],[32,46],[50,39],[68,46],[88,43],[25,69],[50,73],[75,69],[50,88]],'3-4-3':[[22,20],[50,15],[78,20],[15,46],[38,48],[62,48],[85,46],[25,69],[50,73],[75,69],[50,88]]};
const names=['Lucas','Hugo','Adam','Nathan','Louis','Raphaël','Arthur','Gabriel','Jules','Léo','Noah'];
let state={team:'Stade Mayennais U16',formation:'4-3-3',color:'#2855a2',lanes:true,benchVisible:true,clubLogo:'',notes:'',arrows:[],players:names.map((name,i)=>({id:crypto.randomUUID(),name,number:[7,9,11,8,6,10,3,4,5,2,1][i],photo:'',x:layouts['4-3-3'][i][0],y:layouts['4-3-3'][i][1]}))};
let saves=[],mode='move',editing=null,photo='',photoPending=false,toastTimer;
try{saves=JSON.parse(localStorage.getItem('vestiaire-saves')||'[]');if(!Array.isArray(saves))saves=[];const draft=JSON.parse(localStorage.getItem('vestiaire-draft')||'null');if(valid(draft))state=draft;}catch{ }
function valid(s){return s&&(s.benchVisible===undefined||typeof s.benchVisible==='boolean')&&(s.clubLogo===undefined||(typeof s.clubLogo==='string'&&(!s.clubLogo||/^data:image\/(jpeg|png|webp);base64,/.test(s.clubLogo))))&&(s.lanes===undefined||typeof s.lanes==='boolean')&&typeof s.team==='string'&&s.team.length<=50&&layouts[s.formation]&&/^#[0-9a-f]{6}$/i.test(s.color)&&typeof s.notes==='string'&&s.notes.length<20000&&Array.isArray(s.players)&&s.players.length<=30&&s.players.every(p=>(p.role===undefined||p.role==='starter'||p.role==='sub')&&typeof p.id==='string'&&typeof p.name==='string'&&p.name.length<=25&&Number.isInteger(p.number)&&p.number>=1&&p.number<=99&&Number.isFinite(p.x)&&p.x>=5&&p.x<=95&&Number.isFinite(p.y)&&p.y>=6&&p.y<=93&&typeof p.photo==='string'&&(!p.photo||/^data:image\/(jpeg|png|webp);base64,/.test(p.photo)))&&new Set(s.players.map(p=>p.id)).size===s.players.length&&Array.isArray(s.arrows)&&s.arrows.length<=200&&s.arrows.every(a=>Array.isArray(a)&&a.length===4&&a.every(n=>Number.isFinite(n)&&n>=0&&n<=100));}
function notify(msg){$('toast').textContent=msg;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000);}
function persist(){try{localStorage.setItem('vestiaire-draft',JSON.stringify(state));}catch{notify('Stockage plein : exportez votre composition.');}}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function avatar(p,cls){const e=el('span',cls);if(p.photo){const img=el('img');img.src=p.photo;img.alt=p.name;e.append(img);if(cls==='token')e.append(el('span','number-badge',p.number));}else e.textContent=p.number;return e;}
function render(){renderClub();document.documentElement.style.setProperty('--shirt',state.color);$('team').value=state.team;$('formation').value=state.formation;$('color').value=state.color;$('notes').value=state.notes;$('count').textContent=state.players.length+' joueurs';document.querySelector('.board-footer>span:last-child').textContent=state.players.filter(p=>p.role!=='sub').length+' SUR LE TERRAIN';$('players').replaceChildren();$('roster').replaceChildren();state.players.forEach(p=>{const token=el('button','player');token.dataset.id=p.id;token.setAttribute('aria-label',`${p.name}, numéro ${p.number}. Double-cliquez pour modifier. Flèches du clavier pour déplacer.`);token.style.left=p.x+'%';token.style.top=p.y+'%';token.append(avatar(p,'token'),el('span','player-name',p.name));token.addEventListener('dblclick',()=>openEditor(p.id));token.addEventListener('keydown',e=>{const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(steps[e.key]){e.preventDefault();p.x=Math.max(5,Math.min(95,p.x+steps[e.key][0]));p.y=Math.max(6,Math.min(93,p.y+steps[e.key][1]));token.style.left=p.x+'%';token.style.top=p.y+'%';persist();}});if(p.role!=='sub')$('players').append(token);const row=el('button','roster-row');row.append(avatar(p,'roster-avatar'));const info=el('span','player-info',p.name);info.append(el('small','',`N° ${p.number} · ${p.role==='sub'?'Remplaçant':p.number===1?'Gardien':'Titulaire'}`));row.append(info,el('span','edit','↗'));row.onclick=()=>openEditor(p.id);$('roster').append(row);});drawArrows();renderBench();}
function drawArrows(){const g=$('lines');g.replaceChildren();state.arrows.forEach(a=>{const line=document.createElementNS('http://www.w3.org/2000/svg','line');['x1','y1','x2','y2'].forEach((k,i)=>line.setAttribute(k,a[i]));line.setAttribute('stroke','#ffffff');line.setAttribute('stroke-width','.45');line.setAttribute('marker-end','url(#arrowhead)');g.append(line);});}
function point(e){const r=$('pitch').getBoundingClientRect();return [Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))];}
let drag=null;
$('pitch').addEventListener('pointerdown',e=>{if(e.button!==0)return;const token=e.target.closest('.player');if(mode==='move'&&!token)return;const pos=point(e);if(mode==='arrow'){if(state.arrows.length>=200){notify('Effacez les flèches pour en dessiner de nouvelles.');return;}state.arrows.push([...pos,...pos]);drag={pointer:e.pointerId,arrow:true};}else{const p=state.players.find(p=>p.id===token.dataset.id);drag={pointer:e.pointerId,p,token,dx:p.x-pos[0],dy:p.y-pos[1]};}e.preventDefault();$('pitch').setPointerCapture(e.pointerId);});
$('pitch').addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;const [x,y]=point(e);if(drag.arrow){const a=state.arrows.at(-1);a[2]=x;a[3]=y;drawArrows();}else{drag.p.x=Math.max(5,Math.min(95,x+drag.dx));drag.p.y=Math.max(6,Math.min(93,y+drag.dy));drag.token.style.left=drag.p.x+'%';drag.token.style.top=drag.p.y+'%';}});
function endDrag(e){if(!drag||drag.pointer!==e.pointerId)return;if(drag.arrow){const a=state.arrows.at(-1);if(Math.hypot(a[2]-a[0],a[3]-a[1])<2)state.arrows.pop();drawArrows();}drag=null;persist();}
$('pitch').addEventListener('pointerup',endDrag);$('pitch').addEventListener('pointercancel',endDrag);
for(const tool of ['move','arrow'])$(tool).onclick=()=>{mode=tool;$('move').classList.toggle('active',tool==='move');$('arrow').classList.toggle('active',tool==='arrow');$('pitch').style.cursor=tool==='arrow'?'crosshair':'';};
$('erase').onclick=()=>{state.arrows=[];drawArrows();persist();};
function reposition(){state.players.filter(p=>p.role!=='sub').forEach((p,i)=>{const pos=layouts[state.formation][i]||[10+(i-11)%6*15,7];[p.x,p.y]=pos;});render();persist();}
$('formation').onchange=e=>{state.formation=e.target.value;reposition();};$('reset').onclick=()=>{reposition();notify('Joueurs replacés selon la formation.');};
$('team').oninput=e=>{state.team=e.target.value;persist();};$('notes').oninput=e=>{state.notes=e.target.value;persist();};
function setColor(color){state.color=color;document.documentElement.style.setProperty('--shirt',color);$('color').value=color;persist();}
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>setColor(b.dataset.color));$('color').oninput=e=>setColor(e.target.value);
function openEditor(id,role='starter'){editing=id;const p=state.players.find(p=>p.id===id);$('player-role').value=p?.role||role;$('player-name').value=p?.name||'';$('player-number').value=p?.number||Math.min(99,state.players.length+1);photo=p?.photo||'';$('photo').value='';showPhoto();$('delete-player').hidden=!p;$('editor').showModal();}
function showPhoto(){$('photo-preview').hidden=!photo;$('photo-preview').src=photo;$('remove-photo').hidden=!photo;}
$('add').onclick=()=>{if(state.players.length>=30)return notify('30 joueurs maximum sur ce tableau.');openEditor(null);};$('close').onclick=()=>$('editor').close();$('remove-photo').onclick=()=>{photo='';showPhoto();};
$('photo').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!file.type.startsWith('image/')||file.size>15*1024*1024){notify('Choisissez une image de moins de 15 Mo.');return;}photoPending=true;const submit=$('edit-form').querySelector('[type=submit],button.primary');submit.disabled=true;try{const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');canvas.width=canvas.height=240;const side=Math.min(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,240,240);photo=canvas.toDataURL('image/jpeg',.8);bitmap.close();showPhoto();}catch{notify('Cette image ne peut pas être lue. Essayez un JPEG ou PNG.');}finally{photoPending=false;submit.disabled=false;}};
$('edit-form').onsubmit=e=>{e.preventDefault();if(photoPending)return;const name=$('player-name').value.trim();if(!name)return;const fields={name,number:Number($('player-number').value),photo,role:$('player-role').value};if(editing)Object.assign(state.players.find(p=>p.id===editing),fields);else state.players.push({id:crypto.randomUUID(),...fields,x:50,y:50});$('editor').close();render();persist();};
$('delete-player').onclick=()=>{state.players=state.players.filter(p=>p.id!==editing);$('editor').close();render();persist();};
function renderSaves(){$('saved').replaceChildren();if(!saves.length)$('saved').append(el('p','hint','Votre prochaine victoire commence ici. Enregistrez votre première compo.'));saves.forEach((s,i)=>{if(!valid(s.state))return;const row=el('div','saved-entry');const load=el('button','',s.state.team||'Mon équipe');load.append(el('small','',`${s.state.formation} · ${new Date(s.date).toLocaleDateString('fr-FR')}`));load.onclick=()=>{state=structuredClone(s.state);render();persist();notify('Composition chargée.');};const del=el('button','','×');del.setAttribute('aria-label','Supprimer '+s.state.team);del.onclick=()=>{if(!confirm('Supprimer cette composition enregistrée ?'))return;const next=saves.filter((_,j)=>j!==i);try{localStorage.setItem('vestiaire-saves',JSON.stringify(next));saves=next;renderSaves();}catch{notify('Impossible de supprimer cette sauvegarde.');}};row.append(load,del);$('saved').append(row);});}
$('save').onclick=()=>{const next=[{date:new Date().toISOString(),state:structuredClone(state)},...saves];try{localStorage.setItem('vestiaire-saves',JSON.stringify(next));saves=next;renderSaves();notify('Composition enregistrée sur cet appareil.');}catch{notify('Stockage plein : exportez votre composition.');}};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='composition.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>15*1024*1024)throw Error();const data=JSON.parse(await file.text());if(!valid(data))throw Error();state=data;render();persist();notify('Composition importée.');}catch{notify('Fichier de composition invalide.');}e.target.value='';};
render();renderSaves();

function renderClub(){
 const visible=state.lanes!==false;
 $('lanes').hidden=!visible;
 $('lanes-toggle').classList.toggle('active',visible);
 $('lanes-toggle').setAttribute('aria-pressed',String(visible));
 document.querySelectorAll('.club-logo').forEach(img=>{img.hidden=!state.clubLogo;if(state.clubLogo)img.src=state.clubLogo;else img.removeAttribute('src');});
 document.querySelector('.club-monogram').hidden=!!state.clubLogo;
}
$('lanes-toggle').onclick=()=>{state.lanes=state.lanes===false;renderClub();persist();};
$('club-logo-file').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 if(!file.type.startsWith('image/')||file.size>15*1024*1024){notify('Choisissez une image de moins de 15 Mo.');return;}
 try{
 const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');
 const ratio=Math.min(1,400/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
 canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 state.clubLogo=canvas.toDataURL('image/png');renderClub();persist();notify('Logo du club ajouté.');
 }catch{notify('Image illisible. Essayez un fichier PNG ou JPEG.');}e.target.value='';
};

function renderBench(){
 const visible=state.benchVisible!==false;
 $('bench').hidden=!visible;
 $('bench-toggle').classList.toggle('active',visible);
 $('bench-toggle').setAttribute('aria-pressed',String(visible));
 const subs=state.players.filter(p=>p.role==='sub');
 $('bench-count').textContent='· '+subs.length+' remplaçant'+(subs.length>1?'s':'');
 $('bench-players').replaceChildren();
 if(!subs.length)$('bench-players').append(el('p','hint','Votre banc est prêt. Ajoutez vos remplaçants avec leur photo.'));
 subs.forEach(p=>{
  const card=el('div','bench-card');
  const edit=el('button','bench-profile');edit.setAttribute('aria-label','Modifier '+p.name);
  edit.append(avatar(p,'token'),el('strong','',p.name),el('small','','N° '+p.number));edit.onclick=()=>openEditor(p.id);
  const enter=el('button','bench-enter','Faire entrer');enter.onclick=()=>chooseSub(p.id);
  card.append(edit,enter);$('bench-players').append(card);
 });
}
$('bench-toggle').onclick=()=>{state.benchVisible=state.benchVisible===false;renderBench();persist();};
$('add-sub').onclick=()=>{if(state.players.length>=30)return notify('30 joueurs maximum sur ce tableau.');openEditor(null,'sub');};
let incomingId=null;
function chooseSub(id){
 incomingId=id;const incoming=state.players.find(p=>p.id===id);
 const starters=state.players.filter(p=>p.role!=='sub');
 if(!starters.length){incoming.role='starter';render();persist();return;}
 $('incoming-name').textContent=incoming.name;$('swap-options').replaceChildren();
 starters.forEach(p=>{const b=el('button','roster-row');b.append(avatar(p,'roster-avatar'),el('span','',p.name+' · N° '+p.number));b.onclick=()=>{
  const sub=state.players.find(p=>p.id===incomingId);sub.role='starter';sub.x=p.x;sub.y=p.y;p.role='sub';
  $('substitution').close();render();persist();notify(sub.name+' entre à la place de '+p.name+'.');
 };$('swap-options').append(b);});$('substitution').showModal();
}
$('cancel-sub').onclick=()=>$('substitution').close();
function preparePrint(){
 $('print-team').textContent=state.team||'Stade Mayennais';
 $('print-formation').textContent='Formation '+state.formation+' · '+state.players.filter(p=>p.role!=='sub').length+' titulaires';
 $('print-notes').textContent=state.notes;
 document.querySelector('.print-notes').hidden=!state.notes.trim();
 document.title=(state.team||'Composition')+' — '+state.formation;
}
window.addEventListener('beforeprint',preparePrint);
$('pdf').onclick=async()=>{
 preparePrint();
 await Promise.all([...document.querySelectorAll('.board img,header img')].map(img=>img.decode().catch(()=>{})));
 window.print();
};
