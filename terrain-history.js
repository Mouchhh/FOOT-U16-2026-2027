// Histories stay in memory: no additional photo copies in browser storage.
const terrainHistories=new Map();let terrainHistoryApplying=false;
function terrainHistoryContext(simple=document.body.classList.contains('simple-mode')){return simple?{kind:'simple',value:simpleState,key:'vestiaire-simple',id:simpleState.sequenceId||simpleState.scenario}:{kind:terrainBoardKind,value:state,key:terrainBoardKind==='plan'?'vestiaire-gameplan-draft':'vestiaire-draft',id:state.documentId||'draft'};}
function terrainHistoryRecord(context=terrainHistoryContext()){
 if(terrainHistoryApplying)return;const key=activeCoach.id+':'+context.kind,text=JSON.stringify(context.value);let h=terrainHistories.get(key);
 if(!h||h.id!==context.id){h={id:context.id,items:[text],at:0,field:null,time:0};terrainHistories.set(key,h);}
 else if(h.items[h.at]!==text){const field=document.activeElement?.matches('input,textarea')?document.activeElement.id:null,now=Date.now(),coalesce=field&&field===h.field&&now-h.time<750&&h.at===h.items.length-1&&h.at>0;h.items=h.items.slice(0,h.at+1);if(coalesce)h.items[h.at]=text;else{h.items.push(text);h.at++;}while(h.items.length>20||h.items.length>2&&h.items.reduce((n,s)=>n+s.length,0)>8000000){h.items.shift();h.at--;}h.field=field;h.time=now;}
 terrainHistoryButtons();
}
function terrainHistoryButtons(){for(const group of document.querySelectorAll('[data-terrain-history]')){const simple=group.dataset.terrainHistory==='simple',c=terrainHistoryContext(simple),h=terrainHistories.get(activeCoach.id+':'+c.kind);group.children[0].disabled=!h||h.id!==c.id||h.at===0;group.children[1].disabled=!h||h.id!==c.id||h.at>=h.items.length-1;}}
function terrainHistoryMove(direction){
 const c=terrainHistoryContext(),h=terrainHistories.get(activeCoach.id+':'+c.kind);if(!h||h.id!==c.id||h.at+direction<0||h.at+direction>=h.items.length)return false;const next=JSON.parse(h.items[h.at+direction]);
 try{coachStorageSet(c.key,JSON.stringify(next));}catch{notify('Modification non annulée : le stockage est indisponible.');return false;}
 terrainHistoryApplying=true;try{if(c.kind==='simple'){stopAnimation(true);simpleState=next;renderSimple();}else{state=next;render();}h.at+=direction;h.field=null;}finally{terrainHistoryApplying=false;}terrainHistoryButtons();return true;
}
const terrainHistoryPersist=persistTerrainWorkspace;
persistTerrainWorkspace=function(){const ok=terrainHistoryPersist();if(ok)terrainHistoryRecord(terrainHistoryContext(false));return ok;};persist=persistTerrainWorkspace;
const terrainHistorySimpleSave=saveSimple;
saveSimple=function(){const ok=terrainHistorySimpleSave();if(ok)terrainHistoryRecord(terrainHistoryContext(true));return ok;};
const terrainHistoryRender=render;render=function(){terrainHistoryRender();if(!terrainHistoryApplying)terrainHistoryRecord(terrainHistoryContext(false));};
function terrainHistoryInstall(){for(const [selector,kind]of [['.board-toolbar .tools','board'],['.simple-toolbar','simple']]){const target=document.querySelector(selector);if(!target)continue;const group=el('span','terrain-history');group.dataset.terrainHistory=kind;for(const [label,dir]of [['↶ Annuler',-1],['↷ Rétablir',1]]){const button=el('button','tool',label);button.type='button';button.title='Historique récent de ce terrain, conservé pendant cette visite';button.onclick=()=>terrainHistoryMove(dir);group.append(button);}target.append(group);}terrainHistoryRecord(terrainHistoryContext(false));terrainHistoryRecord(terrainHistoryContext(true));}
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey||e.target.closest('input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]')||!$('view-pitch').classList.contains('active'))return;const key=e.key.toLowerCase();if(key==='z'||key==='y'){e.preventDefault();terrainHistoryMove(key==='y'||e.shiftKey?1:-1);}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',terrainHistoryInstall);else terrainHistoryInstall();
