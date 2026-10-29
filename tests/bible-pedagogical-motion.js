// Football contracts, beyond continuity: no successful pass through a defender,
// no unexplained change of ball holder, real calls, real pivot and real restarts.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c=vm.createContext({console});
for(const file of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','exercise-pedagogy.js','training-adaptation.js','bible-exercise-designs.js','bible-variant-demonstrations.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
const result=vm.runInContext(`(()=>{
 const failures=[],seen=new Set();let cases=0,passes=0,delayedCalls=0;
 const check=(ok,label)=>{if(!ok)failures.push(label)};
 function inspect(exercise,group,designIndex,label){
  const plan=bibleAnimationPlan(exercise,group,{designIndex,sequenceIndex:1});if(!plan.available)return;
  cases++;seen.add(exercise.id);check(!plan.steps.some(s=>s.title==='Préparer l’action'),label+' unexplained holder reset');
  for(const step of plan.steps){
   for(const m of step.motions.filter(m=>m.kind==='player')){const span=m.duration||step.duration;check(Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/plan.field.scale/span<=3.801,label+' actual running speed');if(m.delay>0)delayedCalls++;}
   if(step.action!=='pass')continue;
   const flight=step.motions.find(m=>m.kind==='ball');if(!flight)continue;passes++;if(flight.loft){check(step.delivery==='aerial'&&flight.loft>=2,'aerial cross lacks height');const mid=bibleAnimationState(plan,step.start+(flight.delay||0)+(flight.duration||step.duration)/2);check(mid.ball.height>2,'aerial cross stays on the ground');continue;}
   const from=plan.initial.players.find(p=>p.number===step.from),team=from?.team==='neutral'?step.team:from?.team;
   // Tight pressure at departure/reception is permitted; inspect the middle 80% of flight.
   // All relevant clocks are piecewise linear. Check the exact closest approach
   // on each interval, rather than potentially missing a fast crossing in samples.
   const departure=step.start+(flight.delay||0),span=flight.duration||step.duration,begin=departure+span*.1,end=departure+span*.9,times=[begin,end];
   for(const m of step.motions.filter(m=>m.kind==='player'))for(const t of [step.start+(m.delay||0),step.start+(m.delay||0)+(m.duration||step.duration)])if(t>begin&&t<end)times.push(t);
   times.sort((a,b)=>a-b);
   for(let i=1;i<times.length;i++){
    const lo=times[i-1],hi=times[i],a=bibleAnimationState(plan,lo),b=bibleAnimationState(plan,hi);
    for(const d of a.players.filter(p=>!p.rotation&&['red','blue'].includes(p.team)&&p.team!==team)){
     const e=b.players.find(p=>p.number===d.number),r={x:a.ball.x-d.x,y:a.ball.y-d.y},v={x:b.ball.x-e.x-r.x,y:b.ball.y-e.y-r.y},f=Math.max(0,Math.min(1,-(r.x*v.x+r.y*v.y)/(v.x*v.x+v.y*v.y||1))),distance=Math.hypot(r.x+v.x*f,r.y+v.y*f)/plan.field.scale;
     check(distance>=.65,label+' pass crosses defender '+d.number+' ('+distance.toFixed(2)+'m) · '+step.title);
    }
   }
  }
 }
 for(const exercise of trainingExercises){const k=bibleKnowledge[exercise.id],keepers=k.format.keeperMode==='feet'?0:k.format.keeperMode==='single'?1:Math.min(2,k.format.goals||0);
  for(const age of [14,18])for(const level of ['discovery','developing','advanced'])for(const players of [...new Set([k.format.ideal,14,24])]){
   const session={players,keepers,space:'full',age,level};for(const group of biblePlan(exercise,session,{organisation:'auto'}).groups)for(let v=0;v<3;v++)inspect(exercise,group,v,exercise.id+' V'+(v+1)+' '+age+'/'+level+' '+group.players+'p');
  }
 }
 const fixture=(id,designIndex=0,keepers=0)=>{const e=trainingExercises.find(e=>e.id===id),g=biblePlan(e,{players:bibleKnowledge[id].format.ideal,keepers,space:'full',age:17,level:'developing'},{organisation:'single'}).groups[0];return {e,g,p:bibleAnimationPlan(e,g,{designIndex,sequenceIndex:1})};};
 for(const id of ['overlap','underlap','forward-runs']){const {p}=fixture(id),calls=p.steps.filter(s=>s.action==='pass'&&s.motions.some(m=>m.kind==='player'&&m.id===s.to&&m.delay>0));check(calls.length>0,id+' no call during pass');}
 const pivot=fixture('build-pivot',2),firstPass=pivot.p.steps.find(s=>s.action==='pass');check(pivot.p.initial.players.find(p=>p.number===firstPass.to).team==='neutral','pivot variant turns the wrong player');
 const press=fixture('press-goalkick',0,1),scene=bibleAnimationScene(press.e,press.g,{designIndex:0}),goal=scene.goals.find(g=>g.type==='full'),keeper=scene.tokens.find(p=>p.keeper&&!p.rotation);check(goal.side==='left'&&keeper.team==='blue'&&scene.balls[0].owner===keeper.number,'restart has no real blue goalkeeper at left');check(scene.goals.filter(g=>g.type==='mini'&&g.side==='right').length===2,'restart exits incorrect');check(!biblePlan(press.e,{players:10,keepers:0,space:'full'},{organisation:'single'}).fits,'goalkeeper restart accepted without goalkeeper');
 for(const id of ['overlap','underlap','duel']){const {p}=fixture(id,2);check(p.steps.filter(s=>s.action==='carry').length>=2&&!p.steps.some(s=>s.action==='pass'),id+' carry variant forces an unwanted pass');}
 const second=fixture('corner-secondball',1,1).p;check(second.steps.some(s=>s.action==='clearance')&&second.steps.some(s=>s.action==='control'),'second ball skips clearance or control');
 if(failures.length)throw Error(JSON.stringify(failures.slice(0,35),null,2)+'; total '+failures.length);
 return {exercises:seen.size,cases,passes,delayedCalls};
})()`,c);
assert.equal(result.exercises,63);console.log('PASS pedagogical motion:',result);
