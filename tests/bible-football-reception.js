// Football-specific reception criteria: distinguish block lines and actual finish phases.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({console});
for(const f of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','training-adaptation.js','bible-exercise-designs.js','bible-variant-demonstrations.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js','bible-coach-guide.js','bible-decision-guide.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const result=vm.runInContext(`(()=>{
 const check=(ok,label)=>{if(!ok)throw Error(label)};let blocks=0,finishes=0,transitions=0;
 for(const id of ['block','block-two-lines'])for(const players of [8,10,12,14])for(const designIndex of [0,1,2]){
  const e=trainingExercises.find(e=>e.id===id),p=biblePlan(e,{players,keepers:0,space:'full',age:17,category:'U17',level:'developing'},{organisation:'auto'});
  for(const g of p.groups){const a=bibleAnimationPlan(e,g,{designIndex});if(!a.available)continue;
   const red=a.initial.players.filter(p=>p.team==='red'&&!p.rotation&&(!p.keeper||p.fieldKeeper));
   if(red.length<4)continue;blocks++;
   const xs=red.map(p=>(p.x-a.field.fx)/a.field.fw).sort((x,y)=>x-y),split=Math.ceil(red.length/2),front=xs.slice(0,split),back=xs.slice(split);
   check(Math.max(...front)-Math.min(...front)<.08,id+' first line not recognizable');
   check(Math.max(...back)-Math.min(...back)<.08,id+' '+players+' V'+designIndex+' cover line not recognizable '+xs.join(','));
   check(Math.min(...back)-Math.max(...front)>.12,id+' lines not staggered');
   const end=bibleAnimationState(a,a.duration);check(end.team==='blue',id+' invented regain');
   check(!a.steps.some(s=>s.action==='recovery'),id+' automatic recovery');
   if(designIndex===1)check(a.steps.some(s=>s.title.includes('se recentre')),id+' missing response to return pass');
   if(designIndex===2){check(a.steps.some(s=>s.caption.includes('Exemple d’erreur')),id+' failed block presented as good defending');check(a.steps.some(s=>s.title.includes('couverture gagne du temps')),id+' no cover after breakthrough');}
   const coaching=bibleDesignCoaching(e,designIndex,bibleCoachScenario(e,g,0));check(coaching.observation&&coaching.correction,id+' missing observation/correction');
  }
 }
 for(const id of ['finish','finish-opposition','keeper-duel','box-combine','finish-rebound','cutback','far-post','defend-cross']){
  const e=trainingExercises.find(e=>e.id===id);let g;
  for(const players of [e.target,10,12,14]){if(g)break;const p=biblePlan(e,{players,keepers:1,space:'full',age:17,category:'U17',level:'developing'},{organisation:'auto'});g=p.groups.find(g=>g.fits&&bibleAnimationPlan(e,g,{designIndex:0}).available);}
  check(g,id+' no representative finish');const a=bibleAnimationPlan(e,g,{designIndex:0}),shot=a.steps.find(s=>s.action==='shot');
  check(shot,id+' finish has no actual shot');check(shot.phase==='shot',id+' shot labelled as possession');
  check(a.initial.players.some(p=>p.number===shot.from),id+' unidentified shooter');
  check(shot.motions.some(m=>m.kind==='ball'),id+' ball never leaves shooter');finishes++;
  if(id==='finish-rebound'){const loose=a.steps.find(s=>s.action==='clearance'),control=a.steps.find(s=>s.action==='control');check(loose?.phase==='loose'&&control?.start>=loose.end,'second ball lacks explicit loose/control phases');}
 }
 for(const id of ['transition','counterpress-escape'])for(const count of [4,6,8,12,24])for(const level of ['discovery','developing','advanced']){
  const e=trainingExercises.find(e=>e.id===id),p=biblePlan(e,{players:count,keepers:0,space:'full',age:17,category:'U17',level},{organisation:'auto'});
  for(const g of p.groups)for(const designIndex of [0,1,2]){
   const a=bibleAnimationPlan(e,g,{designIndex});if(!a.available)continue;transitions++;
   check(!a.steps.some(s=>s.title==='Préparer l’action'),id+' unexplained restart');
   if(designIndex===2){check(a.steps.some(s=>s.caption.includes('déjà récupéré')),id+' safe regain must state the opening assumption');continue;}
   const recovery=a.steps.find(s=>s.action==='recovery');check(recovery?.phase==='interception'&&recovery.intendedTo,id+' no visible intercepted pass');
   const after=bibleAnimationState(a,recovery.end+.001);check(after.team==='red',id+' missing change of roles');
   const carry=a.steps.find(s=>s.action==='carry'&&s.start>=recovery.end);check(carry,id+' missing opponent exit');
   const blues=a.initial.players.filter(p=>p.team==='blue'&&!p.rotation);
   const reactions=carry.motions.filter(m=>m.kind==='player'&&blues.some(p=>p.number===m.id));
   check(reactions.length>=Math.min(2,blues.length),id+' team waits until the opponent has finished carrying');
   check(!a.steps.some(s=>s.action==='recovery'&&s.to!==recovery.to),id+' fabricated automatic blue recovery');
   if(designIndex===0)check(carry.caption.includes('sans but imposé'),id+' imaginary attacking target in conservation');
  }
 }
 return {blockScenarios:blocks,finishMechanisms:finishes,transitionScenarios:transitions};
})()`,c);
assert(result.blockScenarios>=12);assert.equal(result.finishMechanisms,8);assert(result.transitionScenarios>=60);console.log('PASS football reception:',result);
