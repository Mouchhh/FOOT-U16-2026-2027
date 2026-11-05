// Couleur du pion sélectionné, sans quitter le terrain ni ouvrir une modale.
document.addEventListener('DOMContentLoaded',()=>{
 const canvas=$('exercise-board-canvas'),dialog=$('custom-training-dialog');
 const bar=el('div','exercise-token-colors');bar.hidden=true;bar.setAttribute('role','group');bar.setAttribute('aria-label','Couleur du pion');
 bar.append(el('span','exercise-token-colors-title','Couleur du pion'));
 let target=null,press=null;
 const current=()=>exerciseDraft?.frames[exerciseFrame]?.objects.find(o=>o.id===target);
 function hide(){bar.hidden=true;target=null;}
 function apply(color){if(!/^#[0-9a-f]{6}$/i.test(color)||!current())return;exercisePlayback++;for(const frame of exerciseDraft.frames){const o=frame.objects.find(o=>o.id===target);if(o)o.color=color;}exerciseEnabled=true;exerciseEditorRefresh();sync();}
 function sync(){const o=current();if(!o)return hide();input.value=o.color;bar.querySelectorAll('[data-token-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tokenColor===o.color.toLowerCase())));}
 for(const [name,color]of [['Bleu club','#2855a2'],['Rouge club','#e41f28'],['Jaune','#edc641'],['Blanc','#ffffff'],['Marine','#0b192c'],['Violet','#8655c5']]){
  const b=el('button','exercise-token-swatch');b.type='button';b.dataset.tokenColor=color;b.style.setProperty('--token-color',color);b.title=name;b.setAttribute('aria-label',name);b.onclick=()=>apply(color);bar.append(b);
 }
 const label=el('label','exercise-token-custom','Autre'),input=document.createElement('input');input.type='color';input.setAttribute('aria-label','Couleur personnalisée du pion');input.oninput=input.onchange=()=>apply(input.value);label.append(input);bar.append(label);
 const close=el('button','exercise-token-color-close','');close.type='button';close.setAttribute('aria-label','Masquer le nuancier');close.onclick=hide;bar.append(close);dialog.append(bar);
 function show(){const o=exerciseDraft?.frames[exerciseFrame]?.objects.find(o=>o.id===exerciseSelected);if(!o||!['blue','red','keeper'].includes(o.type))return hide();target=o.id;bar.hidden=false;sync();
  const r=canvas.getBoundingClientRect(),v=exerciseDraft.view,start=v==='half'?50:v==='area'?73:0,x=r.left+(o.x-start)/(100-start)*r.width,y=r.top+o.y/100*r.height;
  const box=bar.getBoundingClientRect();bar.style.left=Math.max(8,Math.min(innerWidth-box.width-8,x-box.width/2))+'px';bar.style.top=Math.max(76,Math.min(innerHeight-box.height-8,y+34+box.height<innerHeight?y+34:y-box.height-30))+'px';
 }
 dialog.addEventListener('pointerdown',e=>{if(e.target!==canvas)return;hide();press={x:e.clientX,y:e.clientY};},true);
 canvas.addEventListener('pointerup',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<6)show();press=null;});
 canvas.addEventListener('pointercancel',()=>{press=null;hide();});
 canvas.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();show();}else if(e.key==='Escape')hide();});
 document.addEventListener('pointerdown',e=>{if(!bar.contains(e.target)&&e.target!==canvas)hide();});
 dialog.addEventListener('close',hide);new MutationObserver(()=>{if(!dialog.open||$('custom-training-form').dataset.studioMode!=='board')hide();}).observe(dialog,{attributes:true,subtree:true,attributeFilter:['open','data-studio-mode']});
 window.addEventListener('resize',hide);
});
