// Extension de présentation et de dessin des exercices personnels uniquement.
(() => {
 const baseValid=validExerciseBoard;
 validExerciseBoard=b=>baseValid(b)&&(!b.view||['full','half','area'].includes(b.view))&&(!b.surface||['grass','synthetic','indoor'].includes(b.surface))&&(!b.zoning||['none','corridors','halfspaces','thirds'].includes(b.zoning))&&(!b.drawings||Array.isArray(b.drawings)&&b.drawings.length<=200&&b.drawings.every(d=>d&&['pass','run','zone','text'].includes(d.type)&&['x','y','xx','yy'].every(k=>Number.isFinite(d[k])&&d[k]>=0&&d[k]<=100)&&typeof d.text==='string'&&d.text.length<=120));
 const render=drawExerciseBoard;
 drawExerciseBoard=function(canvas,board,objects,previous){
  render(canvas,board,objects,previous);
  const c=canvas.getContext('2d');c.save();
  if(board.surface==='synthetic'||board.surface==='indoor'){c.fillStyle=board.surface==='indoor'?'#ad885955':'#09654b33';c.fillRect(0,0,1200,750);}
  c.strokeStyle='#ffffff65';c.lineWidth=2;c.setLineDash([9,8]);
  const cuts=board.zoning==='halfspaces'?[20,40,60,80]:board.zoning==='corridors'?[33.33,66.67]:[];
  for(const y of cuts){c.beginPath();c.moveTo(30,y*7.5);c.lineTo(1170,y*7.5);c.stroke();}
  if(board.zoning==='thirds')for(const x of [410,790]){c.beginPath();c.moveTo(x,30);c.lineTo(x,720);c.stroke();}
  for(const d of board.drawings||[]){const x=d.x*12,y=d.y*7.5,xx=d.xx*12,yy=d.yy*7.5;c.strokeStyle=c.fillStyle='#ffffff';c.lineWidth=3;c.setLineDash(d.type==='run'?[12,8]:[]);
   if(d.type==='zone'){c.fillStyle='#e41f282b';c.fillRect(x,y,xx-x,yy-y);c.strokeRect(x,y,xx-x,yy-y);}
   else if(d.type==='text'){c.font='600 22px Arial';c.fillText(d.text,x,y);}
   else {c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();const a=Math.atan2(yy-y,xx-x);c.setLineDash([]);c.beginPath();c.moveTo(xx-18*Math.cos(a-.45),yy-18*Math.sin(a-.45));c.lineTo(xx,yy);c.lineTo(xx-18*Math.cos(a+.45),yy-18*Math.sin(a+.45));c.stroke();}
  }c.restore();
  if(board.view&&board.view!=='full'&&canvas.dataset.portrait!=='true'){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);c.setTransform(1,0,0,1,0,0);const start=board.view==='half'?.5:.73;c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(copy,canvas.width*start,0,canvas.width*(1-start),canvas.height,0,0,canvas.width,canvas.height);}
 };
 const refresh=exerciseEditorRefresh;
 exerciseEditorRefresh=function(){
  refresh();
  if(exerciseDraft.view&&exerciseDraft.view!=='full'){
   const canvas=$('exercise-board-canvas');
   drawExerciseBoard(canvas,exerciseDraft,exerciseDraft.frames[exerciseFrame].objects,exerciseFrame?exerciseDraft.frames[exerciseFrame-1].objects:null);
   const o=exerciseDraft.frames[exerciseFrame].objects.find(o=>o.id===exerciseSelected);
   if(o){const c=canvas.getContext('2d'),start=exerciseDraft.view==='half'?.5:.73;c.save();c.setTransform(1,0,0,1,0,0);c.strokeStyle='#ffffff';c.lineWidth=3;c.setLineDash([7,5]);c.strokeRect((o.x/100-start)/(1-start)*canvas.width-35,o.y/100*canvas.height-35,70,70);c.restore();}
  }
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const form=$('custom-training-form'),dialog=$('custom-training-dialog'),layout=form.querySelector('.studio-board-layout'),toolbar=form.querySelector('.studio-toolbar'),canvas=$('exercise-board-canvas');
  dialog.classList.add('tactical-exercise-workspace');
  const left=el('nav','tactical-tools');left.setAttribute('aria-label','Outils de dessin');
  const right=el('aside','tactical-options');right.append(el('h3','','Options du terrain'));
  for(const [key,label,options]of [['view','Vue du terrain',[['full','Terrain complet'],['half','Demi-terrain'],['area','Surface']]],['zoning','Découpage',[['none','Aucun'],['corridors','Couloirs'],['halfspaces','Demi-espaces'],['thirds','3 zones']]],['surface','Revêtement',[['grass','Gazon naturel'],['synthetic','Synthétique'],['indoor','Salle']]]]){
   const field=el('label','',label),select=document.createElement('select');select.id='exercise-field-'+key;for(const [v,t]of options)select.add(new Option(t,v));field.append(select);right.append(field);select.onchange=()=>{exerciseDraft[key]=select.value;exerciseEnabled=true;exerciseEditorRefresh();};
  }
  const textField=el('label','','Texte à placer'),textInput=document.createElement('input');textInput.id='exercise-drawing-text';textInput.maxLength=120;textInput.placeholder='Votre annotation';textField.append(textInput);right.append(textField);
  const oldInspector=form.querySelector('.studio-inspector'),inspector=el('section','studio-inspector');for(const child of [...oldInspector.children])inspector.append(child);oldInspector.remove();right.append(inspector);
  const palette=form.querySelector('.studio-tools');palette.querySelector('summary').textContent='Autre matériel';right.append(palette);
  layout.prepend(left);layout.append(right);
  let tool='select',start=null;
  function choose(next){tool=next;left.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));canvas.style.cursor=tool==='select'?'default':'crosshair';}
  for(const [key,icon,label]of [['select','↖','Sélection / déplacer'],['blue','●','Joueur bleu'],['red','●','Joueur rouge'],['ball','◉','Ballon'],['pass','↗','Passe'],['run','⇢','Course'],['zone','▱','Zone'],['text','T','Texte'],['delete','⌫','Supprimer la sélection']]){
   const b=el('button','',icon);const paths={select:'M5 3v17l5-6 6-2Z',blue:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',red:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',ball:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 8l5 4-2 5H9l-2-5Z',pass:'M4 20 20 4M9 4h11v11',run:'M4 18h3m3-4 3-3m3-3 4-4M12 4h8v8',zone:'M4 5h16v14H4Z',text:'M5 5h14M12 5v15M8 20h8',delete:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7'};
   b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[key]+'"/></svg>';
   b.type='button';b.dataset.tool=key;b.title=label;b.setAttribute('aria-label',label);b.onclick=()=>{if(key==='delete'){if(exerciseSelected)$('exercise-delete').click();else if(exerciseDraft.drawings?.length){exerciseDraft.drawings.pop();exerciseEditorRefresh();}return;}choose(key);};left.append(b);
  }choose('select');
  const point=e=>{const r=canvas.getBoundingClientRect(),start=exerciseDraft.view==='half'?50:exerciseDraft.view==='area'?73:0;return{x:Math.max(0,Math.min(100,start+(e.clientX-r.left)/r.width*(100-start))),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))};};
  canvas.addEventListener('pointerdown',e=>{
   if(tool==='select')return;e.preventDefault();e.stopImmediatePropagation();exercisePlayback++;const p=point(e);canvas.setPointerCapture(e.pointerId);
   if(['blue','red','ball'].includes(tool)){const buttons=[...$('exercise-palette').querySelectorAll('button')];buttons.find(b=>b.getAttribute('aria-label')==='Ajouter : '+exerciseEquipment[tool]).click();for(const f of exerciseDraft.frames){const o=f.objects.find(o=>o.id===exerciseSelected);o.x=p.x;o.y=p.y;if(tool==='red')o.color='#e41f28';}exerciseEditorRefresh();choose('select');return;}
   if(tool==='text'){const text=textInput.value;if(!text.trim()){textInput.focus();return;}if(text.trim())addDrawing({...p,xx:p.x,yy:p.y,type:'text',text:text.trim().slice(0,120)});return;}
   start={...p,type:tool};
  },true);
  canvas.addEventListener('pointermove',e=>{if(!start)return;const p=point(e);drawExerciseBoard(canvas,{...exerciseDraft,drawings:[...(exerciseDraft.drawings||[]),{...start,xx:p.x,yy:p.y,text:''}]},exerciseDraft.frames[exerciseFrame].objects);});
  canvas.addEventListener('pointerup',e=>{if(!start)return;e.stopImmediatePropagation();const p=point(e);addDrawing({...start,xx:p.x,yy:p.y,text:''});start=null;},true);
  canvas.addEventListener('pointercancel',()=>{start=null;exerciseEditorRefresh();});
  function addDrawing(d){exerciseDraft.drawings||=[];if(exerciseDraft.drawings.length>=200)return notify('200 tracés maximum.');exerciseDraft.drawings.push(d);exerciseEnabled=true;exerciseEditorRefresh();}
  const clear=$('exercise-clear').onclick;$('exercise-clear').onclick=()=>{const before=exerciseDraft.frames;clear();if(before!==exerciseDraft.frames){exerciseDraft.drawings=[];exerciseEditorRefresh();}};
  const open=openCustomTrainingExercise;openCustomTrainingExercise=function(block=null){open(block);if(!dialog.open)return;choose('select');start=null;for(const key of ['view','zoning','surface'])$('exercise-field-'+key).value=exerciseDraft[key]||({view:'full',zoning:'none',surface:'grass'}[key]);exerciseEditorRefresh();};
  form.querySelector('button[type=submit]').textContent='Enregistrer l’exercice';
 });
})();
