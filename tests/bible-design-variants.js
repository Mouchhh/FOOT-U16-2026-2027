// Three actual scenarios, persistent identities, no hidden enlargement of the group.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx=vm.createContext({console});
for(const file of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','training-adaptation.js','bible-exercise-designs.js','bible-variant-demonstrations.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const out=vm.runInContext(`(()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};let cases=0,playable=0;const signatures={},issues=[];
 for(const e of trainingExercises){
  check(bibleExerciseDesigns[e.id]?.length===3,e.id+' missing three designs');
  for(const players of [4,8,11,13,14,24,40])for(const level of ['discovery','advanced']){
   const session={players,keepers:e.id==='duel-renforts'||e.kind==='keeper'?1:Math.min(2,Math.floor(players/6)),space:'full',age:17,level};
   const plan=biblePlan(e,session,{organisation:'auto'});
   for(const group of plan.groups)for(let designIndex=0;designIndex<3;designIndex++){
    const p=bibleAnimationPlan(e,group,{designIndex,sequenceIndex:1});cases++;
    if(!p.available)continue;playable++;check(p.initial.players.length===group.players,e.id+' invented actor');
    for(const step of p.steps){
     const before=bibleAnimationState(p,step.start),after=bibleAnimationState(p,step.start+1e-7);
     for(let i=0;i<before.players.length;i++)check(Math.hypot(before.players[i].x-after.players[i].x,before.players[i].y-after.players[i].y)<.01,e.id+' player jumps');
     for(let i=0;i<before.balls.length;i++)check(Math.hypot(before.balls[i].x-after.balls[i].x,before.balls[i].y-after.balls[i].y)<.01,e.id+' ball jumps '+designIndex+' '+step.title);
     for(const m of step.motions){check(Number.isFinite(m.to.x)&&Number.isFinite(m.to.y),e.id+' nonfinite');if(m.kind==='player')check(Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/p.field.scale/step.duration<=3.801,e.id+' speed');}
    }
    if(group.template==='circuit'&&!['warm','cool'].includes(e.id)){const final=bibleAnimationState(p,p.duration);for(const actor of p.initial.players){const last=final.players.find(a=>a.number===actor.number);check(Math.hypot(actor.x-last.x,actor.y-last.y)<.001,e.id+' incomplete station rotation '+designIndex);}}
    if(e.id==='retreat-delay'&&designIndex===0){const carrier=p.initial.players.find(a=>a.team==='red'),end=bibleAnimationState(p,p.duration).players.find(a=>a.number===carrier.number);check(end.x<carrier.x,'Repli: red attacks wrong target');}
    if(e.id==='possession-quadrants')for(let t=0;t<=p.duration;t+=.2){const state=bibleAnimationState(p,t);for(const actor of state.players.filter(a=>a.team!=='neutral')){const original=p.initial.players.find(a=>a.number===actor.number),f=p.field;check((actor.x>f.fx+f.fw/2)===(original.x>f.fx+f.fw/2)&&(actor.y>f.fy+f.fh/2)===(original.y>f.fy+f.fh/2),'quadrant abandoned');}}
    if(e.id!=='wall-pass'&&players===(e.id==='rondo-expand'?13:e.id==='possession-quadrants'?11:14)&&level==='advanced'&&group.index===1){signatures[e.id]??=[];signatures[e.id][designIndex]=JSON.stringify([p.initial.players.map(a=>[a.x,a.y]),p.steps.map(s=>s.motions)]);}
   }
  }
 }
 for(const [id,s]of Object.entries(signatures))check(s.length===3&&new Set(s).size===3,id+' equivalent scenarios');
 return {exercises:trainingExercises.length,cases,playable,distinct:Object.keys(signatures).length};
})()`,ctx);
assert.equal(out.exercises,63);assert(out.playable>1000);console.log('PASS designs',out);
const {createReferenceCombination,referenceCombinationState}=require('../reference-combination-model.js');
for(const players of [3,6,8])assert.equal(new Set([0,1,2].map(designIndex=>JSON.stringify(createReferenceCombination({players,designIndex})))).size,3);
for(const players of [3,6,8])for(const designIndex of [0,1,2]){
 const p=createReferenceCombination({players,designIndex});
 for(const pass of p.passes){for(const t of [pass.start,pass.end]){const a=referenceCombinationState(p,Math.max(0,t-1e-7)),b=referenceCombinationState(p,t+1e-7);assert(Math.hypot(a.ball.x-b.ball.x,a.ball.y-b.ball.y)<.001,'reference ball jump');}}
 const final=referenceCombinationState(p,p.duration);for(const a of p.actors){const b=final.players.find(b=>b.id===a.id);assert(Math.hypot(a.initial.x-b.x,a.initial.y-b.y)<.001);}
}
console.log('PASS reference variants: three rosters, three layouts, continuous passes and full rotations');
