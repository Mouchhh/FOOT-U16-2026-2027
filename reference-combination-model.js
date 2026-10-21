/* Original pedagogical reconstruction of the coach's technical-combination recording.
   One clock, persistent identities, authored runs, passes and queue rotations. */
(function(root){
'use strict';
function createReferenceCombination(options={}){
 const count=Math.round(Number(options.players)||6);if(count<3||count>8)throw Error('Ce modèle demande 3 à 8 joueurs par atelier.');
 const width=Number(options.width)||24,length=Number(options.length)||32;
 if(width<20||width>105||length<28||length>120)throw Error('Choisir au moins 20 m de largeur et 28 m de longueur pour installer le matériel.');
 const designIndex=Math.max(0,Math.min(2,Number(options.designIndex)||0)),scale=p=>({x:p.x*width/24,y:p.y*length/32}),top=scale({x:12,y:designIndex===1?4:6}),middle=scale({x:designIndex===2?8:12,y:15});
 const queueGap=Math.min(2.2,8/(count-3)),queueSlot=i=>scale({x:12,y:22+i*queueGap});
 const actors=Array.from({length:count},(_,i)=>({id:i+1,number:i+1,initial:i===0?{...top}:i===1?{...middle}:queueSlot(i-2)}));
 let roles=actors.map(a=>a.id);const cycles=[],shifts=[],period=count===3?8:6;
 for(let i=0;i<count;i++){
  const [receiver,passer,next,...rest]=roles,t=i*period,after=[...rest,receiver];
  cycles.push({index:i,start:t,receiver,passer,next,side:i%2?'right':'left',queueBefore:roles.slice(2),queueAfter:after,ready:t+12.2});
  shifts.push({time:t+4.5,queue:after});roles=[passer,next,...after];
 }
 const motions=[],passes=[],cues=[];
 const move=(id,start,end,from,to,kind='run')=>motions.push({id,start,end,from:{...from},to:{...to},kind});
 const cue=(start,end,title,detail,cycle,ids)=>cues.push({start,end,title,detail,cycle,ids});
 const returning=(id,t)=>cycles.some(c=>c.receiver===id&&t>=c.start+3.55&&t<c.ready);
 for(const c of cycles){
  const t=c.start,sign=c.side==='left'?-1:1,wide=scale({x:12+sign*(designIndex===1?6:5),y:8}),away=scale({x:12+sign*5,y:14}),support=scale({x:12+(designIndex===2?sign*2:-sign*2),y:10}),agilityX=c.side==='left'?4.5:19.5;
  move(c.receiver,t+.65,t+1.5,top,wide);move(c.passer,t+.65,t+1.75,middle,support);
  move(c.receiver,t+2.15,t+3.2,wide,away);move(c.passer,t+3.4,t+5.7,support,top);
  move(c.receiver,t+3.55,t+5,away,scale({x:agilityX,y:20}));
  let previousAgility=scale({x:agilityX,y:20});for(let rung=0;rung<7;rung++){const nextAgility=scale({x:agilityX+(rung%2?-.12:.12),y:20+6*(rung+1)/7});move(c.receiver,t+5+rung*.5,t+5+(rung+1)*.5,previousAgility,nextAgility,c.side==='left'?'ladder':'hurdles');previousAgility=nextAgility;}
  // The returning player joins the queue's real slot at that time, not an old slot.
  const latest=shifts.filter(s=>s.time<=c.ready).at(-1),index=latest.queue.indexOf(c.receiver);if(index<0)throw Error('Rotation incohérente.');
  const destination=queueSlot(index),approach=scale({x:c.side==='left'?8:16,y:30});
  move(c.receiver,t+8.5,t+9.2,scale({x:agilityX+.12,y:26}),scale({x:agilityX,y:30}));
  move(c.receiver,t+9.2,t+10.4,scale({x:agilityX,y:30}),approach);
  move(c.receiver,t+10.4,t+11.5,approach,{x:approach.x,y:destination.y});
  move(c.receiver,t+11.5,c.ready,{x:approach.x,y:destination.y},destination);
  move(c.next,t+4.5,t+5.8,queueSlot(0),middle,'carry');
  c.queueAfter.forEach((id,index)=>{if(returning(id,t+4.5))return;const previous=c.queueBefore.indexOf(id);if(previous>=0)move(id,t+4.5,t+5.8,queueSlot(previous),queueSlot(index),'queue');});
  for(const [start,end,from,to,label]of [[0,.65,c.passer,c.receiver,'Passe vers l’appui'],[1.6,2.15,c.receiver,c.passer,'Remise au soutien'],[2.8,3.35,c.passer,c.receiver,'Passe dans l’appel'],[3.55,4.35,c.receiver,c.next,'Trouver le suivant']])passes.push({start:t+start,end:t+end,from,to,label,cycle:c.index});
  cue(t,t+.65,'1 · Donner à l’appui','Le joueur '+c.passer+' donne au '+c.receiver+'. Son déplacement commence après la passe.',c.index,[c.passer,c.receiver]);
  cue(t+.65,t+1.6,'2 · Créer deux angles','Le '+c.receiver+' s’écarte ; le '+c.passer+' avance en soutien. Les courses se déroulent ensemble.',c.index,[c.passer,c.receiver]);
  cue(t+1.6,t+2.8,'3 · Remettre et repartir','L’appui remet au soutien puis poursuit son déplacement autour du piquet.',c.index,[c.receiver,c.passer]);
  cue(t+2.8,t+3.55,'4 · Servir le joueur lancé','La passe arrive dans l’appel du '+c.receiver+'. Le soutien prépare déjà sa montée au poste haut.',c.index,[c.passer,c.receiver]);
  cue(t+3.55,t+4.5,'5 · Relier au suivant','Le '+c.receiver+' sert le '+c.next+' puis rejoint '+(c.side==='left'?'l’échelle':'les trois haies')+'.',c.index,[c.receiver,c.next]);
  cue(t+4.5,t+period,'6 · Continuer sans arrêter','Le '+c.next+' conduit au poste de départ, le '+c.passer+' prend le poste haut. Le '+c.receiver+' poursuit son retour : la répétition suivante commence de l’autre côté.',c.index,[c.passer,c.receiver,c.next]);
 }
 motions.sort((a,b)=>a.start-b.start||a.end-b.end);passes.sort((a,b)=>a.start-b.start);
 const duration=cycles.at(-1).ready;
 cues.push({start:count*period,end:duration,title:'Terminer les retours',detail:'Les dernières combinaisons sont terminées. Les joueurs finissent l’agilité et retrouvent leur place ; le ballon reste au joueur de départ.',cycle:count-1,ids:[]});
 const material={balls:1,poles:6,discs:2,ladders:1,hurdles:3,bibs:count};
 const poles=[{x:10,y:6},{x:14,y:6},{x:6,y:11},{x:18,y:11},{x:10,y:16},{x:14,y:16}].map(scale);
 return {version:1,period,players:count,field:{width,length},actors,motions,passes,cues,cycles,duration,material,poles,discs:[scale({x:12,y:21}),scale({x:12,y:31})],agility:{left:{from:scale({x:4.5,y:20}),to:scale({x:4.5,y:26})},right:{from:scale({x:19.5,y:20}),to:scale({x:19.5,y:26})}},initialOwner:2};
}
function referencePlayerAt(plan,id,time){
 const actor=plan.actors.find(a=>a.id===id);if(!actor)throw Error('Joueur inconnu.');let p={...actor.initial};
 for(const motion of plan.motions){if(motion.id!==id||motion.start>time)continue;if(time>=motion.end){p={...motion.to};continue;}const t=(time-motion.start)/(motion.end-motion.start);p={x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t};}
 return p;
}
function referenceCombinationState(plan,input){
 const time=Math.max(0,Math.min(plan.duration,Number(input)||0)),players=plan.actors.map(a=>({...a,...referencePlayerAt(plan,a.id,time)})),at=(id,t)=>referencePlayerAt(plan,id,t),foot=(id,t)=>{const p=at(id,t);return{x:p.x+.85*plan.field.width/24,y:p.y+.3*plan.field.length/32};};
 let owner=plan.initialOwner,flight=null;
 for(const pass of plan.passes){if(pass.start>time)break;if(time>=pass.end){owner=pass.to;continue;}flight=pass;owner=null;break;}
 let ball;if(flight){const a=foot(flight.from,flight.start),b=foot(flight.to,flight.end),t=(time-flight.start)/(flight.end-flight.start);ball={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};flight={...flight,fromPoint:a,toPoint:b};}else ball=foot(owner,time);
 const cue=plan.cues.find(c=>time>=c.start&&time<c.end)||plan.cues.at(-1),moving=plan.motions.filter(m=>time>m.start&&time<m.end).map(m=>m.id);
 return {time,players,ball,owner,flight,cue,moving,ended:time>=plan.duration};
}
const api={createReferenceCombination,referenceCombinationState,referencePlayerAt};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof window==='object'?window:globalThis);
