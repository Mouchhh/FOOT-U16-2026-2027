// Visible cues refer to actual actors and distinguish interception from possession.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({console});
for(const f of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','coach-video-exercises.js','exercise-pedagogy.js','training-adaptation.js','bible-exercise-designs.js','reference-combination-model.js','bible-variant-demonstrations.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js','bible-coach-guide.js','bible-decision-guide.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const result=vm.runInContext(`(()=>{let clips=0,readings=0;const kinds=new Set();
for(const exercise of trainingExercises)for(const players of [6,10,18])for(const keepers of [0,1,2]){
 const session={players,keepers,space:'full',age:16,level:'developing'},installation=biblePlan(exercise,session,{organisation:'auto'});
 for(const group of installation.groups){const plan=bibleAnimationPlan(exercise,group,{sequenceIndex:1});if(!plan.available)continue;clips++;const before=JSON.stringify(plan);
 const start=bibleAnimationReading(plan,bibleAnimationState(plan,0));if(start.kind!=='start')throw Error(exercise.id+' missing start');
 for(const step of plan.steps){const state=bibleAnimationState(plan,step.start+.01),r=bibleAnimationReading(plan,state);readings++;kinds.add(r.kind);if(!r.text||r.text.includes('undefined')||r.text.includes('NaN'))throw Error(exercise.id+' unreadable action');
 for(const id of [...r.actors,...r.runners])if(!plan.initial.players.some(p=>p.number===id))throw Error(exercise.id+' imaginary actor');
 if(r.kind==='carry'&&r.runners.includes(step.from))throw Error(exercise.id+' carrier described as run without ball');
 if(state.phase==='interception'&&r.text.includes('en possession'))throw Error(exercise.id+' recovery announced too early');
 if(state.phase==='transition'&&!r.text.includes('réaction à la perte'))throw Error(exercise.id+' missing role change');
 }
 if(JSON.stringify(plan)!==before)throw Error('reading changed choreography');
 }
}
return {clips,readings,kinds:[...kinds]};})()`,c);
for(const kind of ['pass','carry','recovery','shot','control'])assert(result.kinds.includes(kind),'missing '+kind);
assert(result.clips>500);console.log('PASS diagram cues:',JSON.stringify(result));
