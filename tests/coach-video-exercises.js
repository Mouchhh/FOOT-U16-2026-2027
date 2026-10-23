// Reception of the two accessible coach recordings: roles, real actions, targets and material.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({console});
for(const f of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','coach-video-exercises.js','training-adaptation.js','bible-exercise-designs.js','bible-variant-demonstrations.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js','bible-coach-guide.js','bible-decision-guide.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const result=vm.runInContext(`(()=>{
 const check=(ok,message)=>{if(!ok)throw Error(message)};let cases=0,passes=0;
 for(const id of ['video-bounce-2v2','video-coordination-shot'])for(const players of [6,7,9,12,14,24,40])for(const level of ['discovery','developing','advanced'])for(const age of [14,18])for(const organisation of ['single','auto']){
  const e=trainingExercises.find(e=>e.id===id),plan=biblePlan(e,{players,keepers:id==='video-coordination-shot'?1:0,space:'full',age,level},{organisation});
  for(const g of plan.groups)for(let designIndex=0;designIndex<3;designIndex++){
   const a=bibleAnimationPlan(e,g,{designIndex});check(a.available===(g.fits!==false&&g.pedagogyFits!==false),id+' incompatible format played');if(!a.available)continue;cases++;
   const label=id+' '+players+'/'+level+'/'+age+'/'+organisation+' V'+designIndex;
   check(a.initial.players.length===g.players,label+' missing participant');check(a.initial.balls.length===1,label+' multiple active balls');
   check(!a.steps.some(s=>s.title==='Préparer l’action'),label+' unexplained reset');
   for(const waiting of a.initial.players.filter(p=>p.rotation&&!p.keeper))check(waiting.x<a.field.fx||waiting.x>a.field.fx+a.field.fw,label+' waiting player still inside live area');check(a.steps.some(s=>s.action==='shot'),label+' no actual shot');
   const ids=a.initial.players.map(p=>p.number).join(',');
   if(id==='video-bounce-2v2'){
    check(g.material.miniGoals===4&&g.material.goals===0,label+' targets');
    for(const team of ['blue','red']){const active=a.initial.players.filter(p=>p.team===team&&!p.rotation);check(active.length===3,label+' changed 2v2+own bounce');const appui=active[2];for(let t=0;t<=a.duration;t+=.5){const p=bibleAnimationState(a,t).players.find(p=>p.number===appui.number);check(Math.hypot(p.x-appui.x,p.y-appui.y)<.001,label+' bounce leaves end line');}}
    const shot=a.steps.find(s=>s.action==='shot'),target=shot.motions.find(m=>m.kind==='ball').to;check(Math.abs(target.x-(designIndex===2?a.field.fx:a.field.fx+a.field.fw))<.01,label+' wrong direction');
   }else{
    check(g.material.goals===1&&g.material.hurdles===6&&g.material.ladders===2&&g.material.cones===3,label+' equipment count');
    check(a.steps.filter(s=>s.title.includes('haie ')).length===3,label+' hurdles skipped');
    const slalom=a.steps.filter(s=>s.action==='carry');check(slalom.length===4,label+' no slalom/last contact');
    check(a.steps.filter(s=>s.action==='pass').length===3,label+' missing relay, return or diagonal');
    const scenario=bibleCoachScenario(e,g,0);check(!scenario.start.includes('défenseur'),label+' imaginary defender');check(!g.learning.constraint.includes('sous opposition'),label+' contradictory adaptation');
    check(a.steps.some(s=>s.title.includes('Retour séparé')),label+' no separate return');
   }
   for(let t=0;t<=a.duration;t+=.2){const state=bibleAnimationState(a,t);check(state.players.map(p=>p.number).join(',')===ids,label+' player renumbered');for(const p of state.players)check(Number.isFinite(p.x+p.y),label+' invalid path');}
   for(const step of a.steps){
    for(const m of step.motions.filter(m=>m.kind==='player'))check(Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/a.field.scale/(m.duration||step.duration)<=3.801,label+' player teleport');
    if(step.action!=='pass')continue;passes++;
    const flight=step.motions.find(m=>m.kind==='ball'),start=step.start+(flight.delay||0),span=flight.duration||step.duration,from=a.initial.players.find(p=>p.number===step.from),team=from.team;
    for(let f=.1;f<.91;f+=.04){const state=bibleAnimationState(a,start+span*f);for(const d of state.players.filter(p=>!p.rotation&&!p.keeper&&p.team!==team))check(Math.hypot(d.x-state.ball.x,d.y-state.ball.y)/a.field.scale>=.65,label+' successful pass through defender '+d.number+' · '+step.title);}
   }
  }
 }
 const e=trainingExercises.find(e=>e.id==='video-coordination-shot');const g=biblePlan(e,{players:9,keepers:1,space:'full',age:17,level:'developing'},{organisation:'single'}).groups[0];check(JSON.stringify(bibleAnimationPlan(e,g,{sequenceIndex:1}).steps.map(s=>s.motions))===JSON.stringify(bibleAnimationPlan(e,g,{sequenceIndex:1,designIndex:0}).steps.map(s=>s.motions)),'default sequence changes choreography without matching installation');check(!biblePlan(e,{players:9,keepers:0,space:'full',age:17,level:'developing'},{organisation:'single'}).groups.some(g=>g.pedagogyFits),'coordination should require keeper');
 return {cases,passes};
})()`,c);
assert(result.cases>100);console.log('PASS coach videos:',result);
