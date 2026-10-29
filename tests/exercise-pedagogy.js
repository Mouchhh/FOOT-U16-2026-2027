// Contracts for the complete shipped catalogue, not just field presence.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({console});
const files=['training-data.js','training-knowledge.js','bible-additional-exercises.js','coach-video-exercises.js','exercise-pedagogy.js','training-adaptation.js','bible-exercise-designs.js','reference-combination-model.js','bible-variant-demonstrations.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js','bible-coach-guide.js','bible-decision-guide.js'];
for(const f of files)vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const result=vm.runInContext(`(()=>{
 const check=(v,m)=>{if(!v)throw Error(m)},ledger=[],issues=[];let cases=0,animations=0;
 check(trainingExercises.length===65,'Unexpected catalogue coverage');
 check(Object.keys(exercisePedagogy).length===trainingExercises.length,'Missing editorial review');
 check(new Set(Object.values(exercisePedagogy).map(p=>p.observe)).size===65,'Copied observation criteria');
 for(const e of trainingExercises){
  const p=exercisePedagogy[e.id];for(const key of ['task','observe','question','correction','invariant','easier','harder','family'])check(p[key]?.length>3,e.id+' missing '+key);
  const configurations=[];let representative;
  for(const players of [6,8,11,13,14,16,18,22])for(const keepers of [0,1,2])for(const level of ['discovery','advanced'])for(const space of ['half','full']){
   const session={players,keepers,category:'U16',age:16,level,space,coachingLoad:'normal'},plan=biblePlan(e,session,{organisation:'auto'});cases++;
   check(plan.groups.reduce((n,g)=>n+g.players,0)===players,e.id+' lost players');
   check(plan.groups.reduce((n,g)=>n+g.keepers,0)===keepers,e.id+' invented keepers');
   for(const g of plan.groups){
    check(g.teams.blue+g.teams.red+g.teams.neutral+g.activeKeepers+g.rotatingKeepers===g.players,e.id+' allocation');
    const activity=bibleExerciseActivity(e,g);check(activity.engaged+activity.waiting===g.players&&activity.waiting>=0,e.id+' hidden waiting');
    if(!g.fits)continue;
    check(g.actorsFit&&g.pedagogyFits&&g.players>=g.format.min&&g.players<=g.format.max,e.id+' false compatibility');
    check(g.teams.red>=g.minDefenders&&g.teams.blue>=g.minTeamAttackers,e.id+' missing tactical role');
    if(e.id==='rondo-expand')check(g.players===13&&g.teams.blue===8&&g.teams.red===5,e.id+' fixed roles');
    if(e.id==='possession-quadrants')check(g.players===11&&g.teams.blue===4&&g.teams.red===4&&g.teams.neutral===3,e.id+' fixed roles');
   }
   if(plan.fits&&space==='full'&&level==='advanced')configurations.push({players,keepers,groups:plan.groups.map(g=>({players:g.players,keepers:g.keepers,roles:g.roles,width:g.width,length:g.length}))});
  }
  // All three demonstrated problems need an actual compatible reference setup.
  for(const players of [...new Set([e.target,6,7,8,9,10,11,12,13,14,16,18,22])]){
   if(representative)break;
   for(const keepers of [1,2,0]){
    const session={players,keepers,category:'U16',age:16,level:'developing',space:'full'},plan=biblePlan(e,session,{organisation:'single'}),g=plan.groups[0];if(!plan.fits)continue;
    const variants=[0,1,2].map(designIndex=>bibleAnimationPlan(e,g,{designIndex,sequenceIndex:1}));
    if(!variants.every(a=>a.available))continue;
    representative={session,group:g,variants};break;
   }
  }
  check(representative,e.id+' no valid representative for all variants');
  const {session,group,variants}=representative;
  const references=e.id==='wall-pass'?[0,1,2].map(designIndex=>createReferenceCombination({players:group.players,width:group.width,length:group.length,designIndex})):null;
  for(const a of variants){
   if(references){
    const ref=references[variants.indexOf(a)];animations++;check(ref.actors.length===group.players,'Reference combination roster');
    for(const pass of ref.passes)for(const t of [pass.start,pass.end]){const before=referenceCombinationState(ref,Math.max(0,t-1e-7)),after=referenceCombinationState(ref,t+1e-7);check(Math.hypot(before.ball.x-after.ball.x,before.ball.y-after.ball.y)<.001,'Reference ball teleport');}
    const end=referenceCombinationState(ref,ref.duration);check(ref.actors.every(p=>{const last=end.players.find(a=>a.id===p.id);return Math.hypot(p.initial.x-last.x,p.initial.y-last.y)<.001;}),'Reference incomplete rotation');continue;
   }
   animations++;check(a.initial.players.length===group.players,e.id+' drawing invents players');
   check(new Set(a.initial.players.map(p=>p.number)).size===group.players,e.id+' duplicate identity');
   for(const step of a.steps){
    const before=bibleAnimationState(a,step.start),after=bibleAnimationState(a,step.start+1e-7);
    check(before.players.every((p,i)=>Math.hypot(p.x-after.players[i].x,p.y-after.players[i].y)<.01),e.id+' player teleport');
    check(before.balls.every((b,i)=>Math.hypot(b.x-after.balls[i].x,b.y-after.balls[i].y)<.01),e.id+' ball teleport');
   }
  }
  const dose=bibleExerciseDose(e,session),light=bibleExerciseDose(e,{...session,coachingLoad:'light'});
  check(light.workSeconds<=dose.workSeconds&&light.restSeconds>=dose.restSeconds,e.id+' light load increases effort');
  for(const minutes of [4,8,12,20,40])for(const coachingLoad of ['normal','light']){
   const s={...session,coachingLoad},t=bibleTimeline(e,minutes,s),cap=bibleExerciseDose(e,s).workSeconds;
   check(t.totalWorkSeconds+t.totalRestSeconds===minutes*60,e.id+' time budget');
   for(const seq of t.sequences){check(seq.intervals.reduce((n,i)=>n+i.workSeconds+i.restSeconds,0)===seq.workSeconds,e.id+' internal budget');if(!['warm','cool'].includes(e.id))check(seq.intervals.every(i=>i.workSeconds>0&&i.workSeconds<=cap),e.id+' repetition exceeds dose');}
  }
  for(const level of ['discovery','developing','advanced'])for(const minutes of [4,8,12,20,40])for(const sequences of [undefined,1,2,3,4]){
   const normal=bibleTimeline(e,minutes,{...session,level,coachingLoad:'normal'},{sequences}),light=bibleTimeline(e,minutes,{...session,level,coachingLoad:'light'},{sequences});
   check(light.totalWorkSeconds<=normal.totalWorkSeconds,e.id+' light load increases active time at '+minutes+' min / '+sequences+' sequences');
  }
  const scenario=bibleCoachScenario(e,group,1);
  check(scenario.task===p.task&&scenario.look===p.observe,e.id+' coach and catalogue diverge');
  ledger.push({id:e.id,title:e.title,objective:bibleExerciseKnowledge(e).objective,task:p.task,observe:p.observe,question:p.question,correction:p.correction,invariant:p.invariant,easier:p.easier,harder:p.harder,family:p.family,reference:{session,players:group.players,keepers:group.keepers,roles:group.roles,width:group.width,length:group.length,material:group.material,activity:bibleExerciseActivity(e,group)},dose,variants:variants.map((a,i)=>({title:bibleExerciseDesign(e,i).title,actions:references?references[i].passes.length:a.steps.length,seconds:references?references[i].duration:a.duration})),configurations});
 }
 const get=id=>trainingExercises.find(e=>e.id===id),base={category:'U16',age:16,level:'developing',space:'full'};
 check(!biblePlan(get('cover'),{...base,players:3,keepers:0},{organisation:'single'}).fits,'Coverage with one defender accepted');
 check(!biblePlan(get('press-cover-three'),{...base,players:4,keepers:0},{organisation:'single'}).fits,'Three defensive roles with two defenders accepted');
 check(!biblePlan(get('block-two-lines'),{...base,players:6,keepers:0},{organisation:'single'}).fits,'Two lines with three defenders accepted');
 check(!biblePlan(get('cutback'),{...base,players:6,keepers:1},{organisation:'single'}).fits,'Cross and two arrivals without three attackers accepted');
 for(const id of ['keeper-feet','keeper-duel','keeper-distribute','video-coordination-shot'])check(!biblePlan(get(id),{...base,players:8,keepers:0}).fits,id+' without keeper accepted');
 check(bibleExerciseDose(get('duel'),base).workSeconds<bibleExerciseDose(get('rondo'),base).workSeconds,'Same duration for duel and rondo');
 return {cases,animations,ledger};
})()`,c);
assert.equal(result.ledger.length,65);fs.writeFileSync('/tmp/exercise-review-ledger.json',JSON.stringify(result,null,2));
console.log(`PASS ${result.ledger.length} authored exercise reviews, ${result.cases} configurations, ${result.animations} demonstrations, role requirements, light load and exact timing.`);
