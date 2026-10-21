// Replace the corresponding library animation, retaining the existing sequence editor.
(function(){
const previous=bibleDiagram;
bibleDiagram=function(exercise,session,options={}){
 if(exercise.id!=='wall-pass')return previous(exercise,session,options);
 const plan=options.plan||biblePlan(exercise,session,options),groups=plan.groups||[],root=el('figure','training-diagram bible-diagram reference-library-diagram');
 if(!groups.length){root.append(el('p','training-alert','Choisissez un groupe pour préparer cette combinaison.'));return root;}
 let index=Math.max(0,Math.min(groups.length-1,Number(options.groupIndex)||0)),sequence=Number(options.sequenceIndex)||0,frame=null,disposed=false,connected=false;
 const controls=el('div','training-diagram-controls'),heading=el('strong','','Combinaison · enchaînement continu'),workshop=el('select');workshop.setAttribute('aria-label','Atelier illustré · '+exercise.title);for(const [i,g]of groups.entries())workshop.append(new Option('Atelier '+g.index+' · '+g.players+' joueurs',String(i)));workshop.value=String(index);controls.append(heading);if(groups.length>1)controls.append(workshop);
 const display=el('div','training-diagram-screen reference-library-screen'),print=el('div','training-diagram-print'),caption=el('figcaption','bible-diagram-active-rule');root.append(controls,display,print,caption);
 const keepers=g=>(g.keeperSlots||[]).map(s=>s.index+1),model=g=>createReferenceCombination({players:g.players,width:g.width,length:g.length,designIndex:options.designIndex});
 function stop(){frame?.contentWindow?.postMessage({type:'club-reference-control',action:'pause'},'*');}
 function render(){
  stop();if(frame){frame.removeAttribute('src');frame.remove();frame=null;}display.replaceChildren();print.replaceChildren();
  const group=groups[index];root.dataset.groupIndex=String(index);root.dataset.sequenceIndex=String(sequence);
  if(group.fits===false||group.pedagogyFits===false||group.players<3||group.players>8||group.width<20||group.length<28){display.append(el('p','training-alert','Cette combinaison demande 3 à 8 joueurs par atelier et au moins 20 × 28 m. Modifiez les critères de la séquence ou choisissez une répartition en ateliers.'));caption.textContent='La séance et ses réglages restent conservés ; adaptez cette séquence pour lire le nouvel enchaînement.';return;}
  const reference=model(group),staticSvg=createReferenceCombinationSVG(reference,{keepers:keepers(group)});staticSvg.classList.add('reference-before-load');display.append(staticSvg);
  for(const g of groups){if(g.players<3||g.players>8||g.width<20||g.length<28){print.append(el('p','training-alert','Atelier '+g.index+' : organisation à adapter avant impression.'));continue;}const title=el('p','','Atelier '+g.index+' · '+g.players+' joueurs · '+g.width+' × '+g.length+' m');print.append(title,createReferenceCombinationSVG(model(g),{keepers:keepers(g)}));}
  const detail=bibleDiagramSequence(exercise,sequence);const design=typeof bibleExerciseDesign==='function'?bibleExerciseDesign(exercise,options.designIndex):null;caption.textContent=(design?design.title+' · '+design.rule+' ':'')+(detail.title?'Séquence '+(sequence+1)+' · '+detail.title+' : ':'')+(options.sequenceRule||detail.rule||'')+' Un ballon en jeu ; les numéros restent attachés aux joueurs pendant la rotation.';
  if(options.animation===false||options.printing)return;
  frame=el('iframe','reference-library-frame');frame.title='Animation continue · '+exercise.title+' · atelier '+group.index;frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('loading','eager');frame.hidden=true;
  const query=new URLSearchParams({embed:'1',players:String(group.players),width:String(group.width),length:String(group.length),keepers:keepers(group).join(','),design:String(options.designIndex||0)});frame.src='atelier-reference.html?'+query;
  const currentFrame=frame;frame.addEventListener('load',()=>{if(disposed||frame!==currentFrame||!currentFrame.isConnected)return;staticSvg.setAttribute('hidden','');currentFrame.hidden=false;},{once:true});display.append(frame);
 }
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>!e.isIntersecting))stop();});observer.observe(root);
 const removal=new MutationObserver(()=>{if(root.isConnected){connected=true;if(root.closest('details:not([open]),[hidden]'))stop();}else if(connected)dispose();});removal.observe(document.body,{childList:true,subtree:true});
 const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);
 function dispose(){if(disposed)return;disposed=true;stop();observer.disconnect();removal.disconnect();document.removeEventListener('visibilitychange',visibility);if(frame){frame.remove();frame=null;}}
 root.bibleSetGroup=i=>{index=Math.max(0,Math.min(groups.length-1,Number(i)||0));workshop.value=String(index);render();};root.bibleSetSequence=i=>{sequence=Math.max(0,Math.min(3,Number(i)||0));render();};root.bibleDispose=dispose;
 workshop.onchange=()=>{root.bibleSetGroup(workshop.value);options.onGroupChange?.(index);};render();return root;
};
})();
