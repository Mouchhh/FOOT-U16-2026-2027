// Séquences créées par le coach : un départ et jusqu'à 12 étapes de déplacements.
let customTool=simpleState.scenario==='custom'?'arrow':'move',customArrowDrag=null,customLayoutDrag=false;
function customRestoreSnapshot(snapshot,step){
 snapshot.tokens=structuredClone(snapshot.customBase.tokens);snapshot.ball=structuredClone(snapshot.customBase.ball);
 for(let i=0;i<step;i++)for(const action of snapshot.customSteps[i]){const p=action.id==='ball'?snapshot.ball:snapshot.tokens.find(t=>t.id===action.id);if(p){p.x=action.x;p.y=action.y;}}
 snapshot.step=step;return snapshot;
}
function customRestoreStep(step){return customRestoreSnapshot(simpleState,step);}
function customSelectStep(step){stopAnimation(true);customRestoreStep(step);simpleSelected=null;renderSimple();saveSimple();}
function createCustomSequence(){
 stopAnimation(true);const source=structuredClone(simpleState);simpleState={scenario:'custom',step:0,showOpponents:source.showOpponents!==false,tokens:source.tokens,ball:source.ball,customBase:{tokens:structuredClone(source.tokens),ball:structuredClone(source.ball)},customSteps:[[]]};
 // Une nouvelle séquence ne doit pas écraser celle dont elle provient.
 if(source.sequenceTitle)simpleState.sequenceTitle=source.sequenceTitle+' · personnalisée';
 if(simpleState.sequenceTitle)simpleState.sequenceTitle=simpleState.sequenceTitle.slice(0,100);
 customTool='arrow';simpleSelected=null;renderSimple();saveSimple();
}
function renderCustomTools(){
 const custom=simpleState.scenario==='custom';$('custom-step-add').hidden=!custom;$('custom-clear').hidden=!custom;
 $('custom-arrow').classList.toggle('active',customTool==='arrow'&&custom);$('custom-arrow').setAttribute('aria-pressed',String(customTool==='arrow'&&custom));
 $('custom-move').classList.toggle('active',customTool==='move'||!custom);$('custom-move').setAttribute('aria-pressed',String(customTool==='move'||!custom));
 $('custom-help').textContent=custom?'Tracez depuis un pion ou le ballon jusqu’à sa destination. Ajoutez une étape pour enchaîner, puis cliquez sur Lire la séquence. Pour replacer les pions au départ, choisissez Déplacer les pions.':'Choisissez Flèches de déplacement pour créer votre propre séquence à partir des pions présents.';
}
const renderSimpleBeforeCustom=renderSimple;
renderSimple=function(){renderSimpleBeforeCustom();renderCustomTools();};
const saveSimpleBeforeCustom=saveSimple;
saveSimple=function(){
 if(simpleState.scenario==='custom'){
  // Garder noms, numéros, ajouts et retraits dans le départ sans écraser ses positions pendant la lecture.
  const base=simpleState.customBase;const previous=new Map(base.tokens.map(t=>[t.id,t]));
  base.tokens=simpleState.tokens.map(t=>({...t,x:previous.get(t.id)?.x??t.x,y:previous.get(t.id)?.y??t.y}));
  const ids=new Set(simpleState.tokens.map(t=>t.id));simpleState.customSteps=simpleState.customSteps.map(actions=>actions.filter(a=>a.id==='ball'||ids.has(a.id)));
 }
 return saveSimpleBeforeCustom();
};
$('custom-arrow').onclick=()=>{if(simpleState.scenario!=='custom')createCustomSequence();else customSelectStep(simpleState.step);customTool='arrow';renderCustomTools();};
$('custom-move').onclick=()=>{if(simpleState.scenario==='custom')customSelectStep(0);customTool='move';renderCustomTools();};
$('custom-step-add').onclick=()=>{
 if(simpleState.customSteps.length>=12)return notify('12 étapes maximum par séquence.');
 stopAnimation(true);simpleState.customSteps.push([]);customTool='arrow';customSelectStep(simpleState.customSteps.length-1);
};
$('custom-clear').onclick=()=>{if(!confirm('Effacer les flèches de cette étape ?'))return;stopAnimation(true);simpleState.customSteps[simpleState.step]=[];customSelectStep(simpleState.step);};
function customSetAction(id,x,y){
 const actions=simpleState.customSteps[simpleState.step],next={id,x:Math.max(5,Math.min(95,x)),y:Math.max(6,Math.min(93,y)),type:id==='ball'?'pass':'move'};
 const index=actions.findIndex(a=>a.id===id);if(index<0)actions.push(next);else actions[index]=next;
}
$('simple-pitch').addEventListener('pointerdown',event=>{
 if(simpleState.scenario!=='custom'||event.button!==0)return;
 const button=event.target.closest('.simple-token');if(!button)return;
 if(customTool==='move'){customLayoutDrag=true;return;}
 event.preventDefault();event.stopImmediatePropagation();stopAnimation(true);
 const id=button.dataset.id;customRestoreStep(simpleState.step);positionAnimatedTokens();selectSimple(id);
 const p=id==='ball'?simpleState.ball:simpleState.tokens.find(t=>t.id===id);
 const line=document.createElementNS(simpleSvg.namespaceURI,'line');for(const [k,v] of Object.entries({x1:p.x,y1:p.y,x2:p.x,y2:p.y,stroke:'#ffe59c','stroke-width':.6,'marker-end':'url(#simple-head)'}))line.setAttribute(k,v);
 simpleLines.append(line);customArrowDrag={pointer:event.pointerId,id,line};$('simple-pitch').setPointerCapture(event.pointerId);
},true);
$('simple-pitch').addEventListener('pointermove',event=>{
 if(!customArrowDrag||customArrowDrag.pointer!==event.pointerId)return;event.preventDefault();event.stopImmediatePropagation();const [x,y]=simplePoint(event);customArrowDrag.line.setAttribute('x2',Math.max(5,Math.min(95,x)));customArrowDrag.line.setAttribute('y2',Math.max(6,Math.min(93,y)));
},true);
for(const type of ['pointerup','pointercancel'])$('simple-pitch').addEventListener(type,event=>{
 if(customArrowDrag?.pointer===event.pointerId){event.preventDefault();event.stopImmediatePropagation();if(type==='pointerup'){const [x,y]=simplePoint(event);customSetAction(customArrowDrag.id,x,y);}customArrowDrag=null;renderSimpleArrows();saveSimple();}
 else if(customLayoutDrag){customLayoutDrag=false;if(type==='pointerup'&&simpleState.scenario==='custom'){simpleState.customBase={tokens:structuredClone(simpleState.tokens),ball:structuredClone(simpleState.ball)};saveSimple();}}
},true);
$('simple-pitch').addEventListener('keydown',event=>{
 const d=boardKeyStep(event.key),button=event.target.closest('.simple-token');if(!d||!button||simpleState.scenario!=='custom'||customTool!=='arrow')return;
 event.preventDefault();event.stopImmediatePropagation();stopAnimation(true);customRestoreStep(simpleState.step);
 const id=button.dataset.id,p=id==='ball'?simpleState.ball:simpleState.tokens.find(t=>t.id===id),action=simpleState.customSteps[simpleState.step].find(a=>a.id===id)||p;
 customSetAction(id,action.x+d[0],action.y+d[1]);renderSimpleArrows();saveSimple();
},true);
$('simple-pitch').addEventListener('keydown',event=>{if(boardKeyStep(event.key)&&simpleState.scenario==='custom'&&customTool==='move'){simpleState.customBase={tokens:structuredClone(simpleState.tokens),ball:structuredClone(simpleState.ball)};saveSimple();}});
renderCustomTools();
