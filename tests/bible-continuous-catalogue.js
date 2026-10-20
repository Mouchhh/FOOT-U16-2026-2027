// All four sequences, real layouts and independent ball-flight timing.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context=vm.createContext({console});
for(const name of ['training-data.js','training-knowledge.js','training-adaptation.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js'])vm.runInContext(fs.readFileSync(name,'utf8'),context);
const result=vm.runInContext(`(()=>{
 const check=(v,m)=>{if(!v)throw Error(m)},seen=new Set();let cases=0,valid=0,flights=0,rotations=0;
 for(const e of trainingExercises)for(const players of [4,8,14,24,40])for(const sequenceIndex of [0,1,2,3]){
  const session={players,keepers:Math.min(2,Math.floor(players/5)),space:'full',age:players===4?13:18,level:players===4?'discovery':'developing'};
  for(const g of biblePlan(e,session,{organisation:'auto'}).groups){
   const plan=bibleAnimationPlan(e,g,{sequenceIndex});cases++;seen.add(e.id);if(!plan.available)continue;valid++;
   const initial=new Map(plan.initial.players.map(p=>[p.number,p])),f=plan.field;
   check(!plan.steps.some(s=>s.reference!==undefined),e.id+' automatic freeze remains');
   for(const step of plan.steps){
    const start=bibleAnimationState(plan,step.start),almost=bibleAnimationState(plan,Math.min(plan.duration,step.start+.000001));
    for(const [i,p]of start.players.entries())check(Math.hypot(p.x-almost.players[i].x,p.y-almost.players[i].y)<.02,e.id+' player jump');
    for(const [i,b]of start.balls.entries())check(Math.hypot(b.x-almost.balls[i].x,b.y-almost.balls[i].y)<.02,e.id+' ball jump');
    for(const m of step.motions){
     if(m.kind==='player')check(Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/f.scale/step.duration<=3.801,e.id+' sprint speed');
     if(m.kind==='ball'&&m.follow===undefined&&m.easing!=='run'){
      const span=m.duration||step.duration,delay=m.delay||0;
      for(const boundary of [step.start+delay,step.end]){const before=bibleAnimationState(plan,Math.max(0,boundary-.000001)).balls.find(b=>b.id===m.id),after=bibleAnimationState(plan,Math.min(plan.duration,boundary+.000001)).balls.find(b=>b.id===m.id);check(Math.hypot(before.x-after.x,before.y-after.y)<.02,e.id+' flight boundary jump');}
      if(m.fromPlayer){const begin=bibleAnimationState(plan,step.start).players.find(p=>p.number===m.fromPlayer),end=bibleAnimationState(plan,step.end).players.find(p=>p.number===m.toPlayer);check(Math.hypot(begin.x-m.from.x,begin.y-m.from.y)<plan.playerRadius+13,e.id+' station passer');check(Math.hypot(end.x-m.to.x,end.y-m.to.y)<plan.playerRadius+13,e.id+' station receiver');}check(Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/f.scale/span<=12.1,e.id+' unrealistic flight');
      const t=step.start+delay+span*.5,state=bibleAnimationState(plan,t),b=state.balls.find(b=>b.id===m.id);check(Math.hypot(b.x-(m.from.x+m.to.x)/2,b.y-(m.from.y+m.to.y)/2)<.01,e.id+' flight clock');flights++;
     }
    }
    if(step.action==='rotation')rotations++;
   }
   for(let tick=0;tick<=30;tick++){
    const state=bibleAnimationState(plan,plan.duration*tick/30);check(state.players.length===g.players,e.id+' lost player');check(state.balls.length===plan.initial.balls.length,e.id+' new ball');
    for(const p of state.players){const orig=initial.get(p.number);check(orig&&orig.team===p.team&&orig.keeper===p.keeper,e.id+' renamed player');if(!p.rotation)check(p.x>=f.fx-1e-6&&p.x<=f.fx+f.fw+1e-6&&p.y>=f.fy-1e-6&&p.y<=f.fy+f.fh+1e-6,e.id+' out of bounds');}
   }
   if(['passes','scan-receive'].includes(e.id)){
    const end=bibleAnimationState(plan,plan.duration);for(const p of end.players){const orig=initial.get(p.number);check(Math.hypot(p.x-orig.x,p.y-orig.y)<.001,e.id+' incomplete rotation');}
    const moved=new Set(plan.steps.flatMap(s=>s.motions.filter(m=>m.kind==='player').map(m=>m.id)));check(moved.size===g.players,e.id+' player omitted from rotation');
   }
  }
 }
 return {exercises:seen.size,cases,valid,flights,rotations};
})()`,context);
assert.equal(result.exercises,61);assert(result.valid>1000);assert(result.rotations>100);console.log('PASS catalogue continuity:',result);
