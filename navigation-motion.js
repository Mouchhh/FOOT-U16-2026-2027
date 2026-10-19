// Transitions courtes après le changement de vue ; les outils restent immédiatement utilisables.
const navigationMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let navigationMotionFrame=0,navigationEntryAnimation=null;
function stopNavigationMotion(){cancelAnimationFrame(navigationMotionFrame);navigationMotionFrame=0;navigationEntryAnimation?.cancel();navigationEntryAnimation=null;}
function navigationContent(){
 for(const [mode,id] of [['home-mode','club-home'],['training-mode','training-space'],['reports-mode','after-match'],['coach-agenda-mode','coach-agenda'],['club-network-mode','club-network-dialog']])if(document.body.classList.contains(mode))return $(id);
 return document.body.classList.contains('simple-mode')?$('simple-board'):document.querySelector('.workspace');
}
function animateNavigation(kind){
 stopNavigationMotion();
 if(kind==='main')window.scrollTo({top:0,behavior:navigationMotionPreference.matches?'instant':'smooth'});
 if(navigationMotionPreference.matches)return;
 navigationMotionFrame=requestAnimationFrame(()=>{
  navigationMotionFrame=0;let target;
  if(kind==='report')target=$('report-content');
  else if(kind==='tools')target=[...document.querySelectorAll('.tactic-tool-panel')].find(panel=>!panel.hidden);
  else target=navigationContent();
  if(!target||!target.getClientRects().length||typeof target.animate!=='function')return;
  const frames=target.matches('.flow-root,.report-flow')||target.querySelector('.flow-root')?[{opacity:.45},{opacity:1}]:[{opacity:.45,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}];
  const animation=target.animate(frames,{duration:kind==='tools'?170:280,easing:'cubic-bezier(.2,.8,.2,1)'});
  navigationEntryAnimation=animation;animation.finished.then(()=>{if(navigationEntryAnimation===animation)navigationEntryAnimation=null;}).catch(()=>{});
 });
}
// Constater l'onglet actif avant que son gestionnaire ne mette à jour les boutons.
// Un clic répété conserve la vue sans relancer son animation d'entrée.
const navigationRepeatedClicks=new WeakSet();
document.addEventListener('click',event=>{
 const button=event.target.closest('.app-navigation>button');
 if(button?.getAttribute('aria-pressed')==='true')navigationRepeatedClicks.add(event);
},true);
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 if(button.matches('.app-navigation>button')){if(!navigationRepeatedClicks.has(event))animateNavigation('main');}
 else if(button.matches('.mode-switch button'))animateNavigation('mode');
 else if(button.matches('#report-tabs button'))animateNavigation('report');
 else if(button.matches('.tactic-tabs button'))animateNavigation('tools');
});
navigationMotionPreference.addEventListener('change',event=>{if(event.matches)stopNavigationMotion();});
