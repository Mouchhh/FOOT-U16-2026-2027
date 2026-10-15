// Animation interpolée des intentions ; les passes alternatives restent des choix.
let animationRun=null,animationStart=null,animationFrame=0,animationInternal=false;
function animationButtons(){
 const running=animationRun?.playing===true;
 $('animation-pause').disabled=!running;$('animation-play').textContent=animationRun&&!running?'▶ Reprendre la séquence':'▶ Lire la séquence';
 $('animation-step').disabled=running;$('animation-restart').disabled=!animationStart;
 $('animation-choice-wrap').hidden=simpleState.scenario!=='build';
}
function stopAnimation(clear=false){
 cancelAnimationFrame(animationFrame);if(animationRun)animationRun.playing=false;
 if(clear){animationRun=null;animationStart=null;$('animation-status').textContent='Prêt à animer';}
 else if(animationRun){$('animation-status').textContent='En pause · étape '+(simpleState.step+1);saveSimple();}
 animationButtons();
}
const renderSimpleBeforeAnimation=renderSimple;
renderSimple=function(){if(!animationInternal)stopAnimation(true);renderSimpleBeforeAnimation();animationButtons();};
function animationRender(){animationInternal=true;try{renderSimple();}finally{animationInternal=false;}}
function makeSegment(){
 const actions=simpleScenarios[simpleState.scenario].steps[simpleState.step][2];
 const moves=[],passes=[];
 actions.forEach(([index,x,y,type])=>{
  const token=simpleState.tokens.find(p=>p.id==='s'+index);if(!token)return;
  if(type==='move')moves.push({id:token.id,start:{x:token.x,y:token.y},end:{x,y}});
  else {const original=simpleScenarios[simpleState.scenario].tokens;const receiverIndex=original.findIndex(t=>t[1]===x&&t[2]===y);const receiver=receiverIndex<0?null:simpleState.tokens.find(p=>p.id==='s'+receiverIndex);passes.push(receiver?{x:receiver.x,y:receiver.y}:{x,y});}
 });
 // La sortie vers le 6 et le retour au gardien sont deux alternatives.
 const end=passes.length?passes[simpleState.scenario==='build'&&simpleState.step===2&&$('animation-choice').value==='back'?passes.length-1:0]:null;
 return {moves,ball:end?{start:{...simpleState.ball},end}:null,progress:0,last:null};
}
function positionAnimatedTokens(){
 for(const button of simpleTokens.children){const token=button.dataset.id==='ball'?simpleState.ball:simpleState.tokens.find(p=>p.id===button.dataset.id);if(token){button.style.left=token.x+'%';button.style.top=token.y+'%';}}
 renderSimpleArrows();
}
function animateTick(time){
 const run=animationRun;if(!run?.playing)return;
 const segment=run.segment;
 const delta=segment.last===null?0:Math.min(100,time-segment.last);segment.last=time;
 segment.progress=Math.min(1,segment.progress+delta*Number($('animation-speed').value)/2400);
 const progress=segment.progress;const eased=progress*progress*(3-2*progress);
 for(const move of segment.moves){const p=simpleState.tokens.find(p=>p.id===move.id);if(p){p.x=move.start.x+(move.end.x-move.start.x)*eased;p.y=move.start.y+(move.end.y-move.start.y)*eased;}}
 if(segment.ball){const {start,end}=segment.ball;simpleState.ball.x=start.x+(end.x-start.x)*eased;simpleState.ball.y=start.y+(end.y-start.y)*eased;}
 positionAnimatedTokens();
 if(progress<1){animationFrame=requestAnimationFrame(animateTick);return;}
 saveSimple();
 if(run.sequence&&simpleState.step<2){simpleState.step++;animationRender();run.segment=makeSegment();$('animation-status').textContent='Lecture · étape '+(simpleState.step+1)+' / 3';animationFrame=requestAnimationFrame(animateTick);}
 else{animationRun=null;$('animation-status').textContent=run.sequence?'Séquence terminée':'Étape terminée';animationButtons();}
}
function startAnimation(sequence){
 if(animationRun?.playing)return;
 if(animationRun){animationRun.sequence=sequence;animationRun.playing=true;animationRun.segment.last=null;}
 else{
  // Une nouvelle lecture après la fin revient au tableau de départ de la dernière lecture.
  if(animationStart&&simpleState.step===2&&sequence){simpleState=structuredClone(animationStart);animationRender();}
  animationStart=structuredClone(simpleState);
  animationRun={playing:true,sequence,segment:makeSegment()};
 }
 $('animation-status').textContent='Lecture · étape '+(simpleState.step+1)+' / 3';animationButtons();animationFrame=requestAnimationFrame(animateTick);
}
$('animation-play').onclick=()=>startAnimation(true);$('animation-step').onclick=()=>startAnimation(false);$('animation-pause').onclick=()=>stopAnimation();
$('animation-restart').onclick=()=>{if(!animationStart)return;const start=structuredClone(animationStart);stopAnimation(true);simpleState=start;animationRender();saveSimple();$('animation-status').textContent='Retour au départ';};
$('animation-choice').onchange=()=>stopAnimation(true);
// Toute modification manuelle repart d’une nouvelle intention, sans mouvement concurrent.
for(const id of ['simple-pitch','simple-label','simple-remove','simple-own','simple-away','simple-reset','simple-scenario','simple-opponents']){
 $(id).addEventListener(id==='simple-pitch'?'pointerdown':'input',()=>{if(animationRun)stopAnimation(true);},true);
}
for(const id of ['mode-team','mode-focus'])$(id).addEventListener('click',()=>stopAnimation(),true);
window.addEventListener('beforeprint',()=>stopAnimation());document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimation();});
animationButtons();

$('simple-pitch').addEventListener('keydown',e=>{if(boardKeyStep(e.key)&&animationRun)stopAnimation(true);},true);
