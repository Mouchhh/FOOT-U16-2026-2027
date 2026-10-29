// Football contracts for the five pilot drills, including the actual animation paths.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({console});
for(const f of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','coach-video-exercises.js','exercise-pedagogy.js','training-adaptation.js','bible-exercise-designs.js','reference-combination-model.js','bible-variant-demonstrations.js','bible-diagrams.js','bible-circuit-animation.js','bible-animation.js','bible-coach-guide.js','bible-decision-guide.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const result=vm.runInContext(`(()=>{
 const ids=['rondo','build','finish-opposition','cover','transition'],check=(v,m)=>{if(!v)throw Error(m)};let cases=0,clips=0,passes=0;const examples=[];
 for(const id of ids){const e=trainingExercises.find(e=>e.id===id);
  for(const players of [4,6,8,10,14,18,22])for(const keepers of [0,1,2])for(const level of ['discovery','developing','advanced'])for(const space of ['small','half','full']){
   const s={players,keepers,level,space,category:'U16',age:16},p=biblePlan(e,s,{organisation:'auto'});cases++;
   check(p.groups.reduce((n,g)=>n+g.players,0)===players,id+' unassigned player');check(p.groups.reduce((n,g)=>n+g.keepers,0)===keepers,id+' lost keeper');
   if(level==='developing'&&space==='full'&&[6,8,10,14,18].includes(players)&&keepers===(id==='finish-opposition'?1:0))examples.push({id,players,keepers,fits:p.fits,groups:p.groups.map(g=>({players:g.players,teams:g.teams,activeKeepers:g.activeKeepers,rotatingKeepers:g.rotatingKeepers,width:g.width,length:g.length}))});
   if(!p.fits)continue;
   for(const g of p.groups){
    const profile=bibleCoachScenario(e,g,1);check(profile.review.actors.length===g.players,id+' mismatched actor brief');check(new Set(profile.review.actors.map(a=>a.number)).size===g.players,id+' duplicate numbers');
    if(id==='finish-opposition')check(g.activeKeepers===1&&g.material.goals===1&&g.teams.red>=1&&g.teams.blue>=2,id+' false finishing format');
    if(id==='finish-opposition'&&g.teams.blue!==g.teams.red)check(g.rotation.includes('sans inverser la supériorité'),'unequal rotation loses finishing roles');
    if(id==='transition')check(g.material.goals+g.material.gates+g.material.miniGoals===0&&profile.score.includes('passes'),id+' invented target');
    if(id==='rondo')check(g.teams.blue>g.teams.red&&profile.score.includes(String(g.learning.profile.passTarget)+' passes'),id+' score / superiority');
    for(const designIndex of [0,1,2]){
     const a=bibleAnimationPlan(e,g,{designIndex,sequenceIndex:1});clips++;check(a.available,id+' unavailable clip');check(a.initial.players.length===g.players,id+' missing drawn players');check(!a.steps.some(s=>s.title==='Préparer l’action'),id+' unexplained ball reset');
     for(const actor of a.initial.players)check(actor.role&&profile.review.actors.some(r=>r.number===actor.number),id+' unidentified actor');
     if(id==='build'){check(a.steps.at(-2).action==='carry'&&!a.steps.some(s=>s.action==='shot'),id+' gate crossing shown as shot');const end=bibleAnimationState(a,a.duration);check(end.ball.x>a.field.fx+a.field.fw*.96,id+' ball did not reach gate');}
     if(id==='cover'&&designIndex===0){const step=a.steps.find(s=>s.title.includes('Échanger cadrage')),state=bibleAnimationState(a,step.end),red=state.players.filter(t=>t.team==='red'&&!t.rotation),blue=state.players.filter(t=>t.team==='blue'&&!t.rotation);check(red[0].x>red[1].x&&red[1].x>blue[1].x,id+' cover not behind new presser');}
     for(const step of a.steps.filter(s=>s.action==='pass')){
      passes++;const flight=step.motions.find(m=>m.kind==='ball');if(!flight||flight.loft)continue;
      const team=a.initial.players.find(t=>t.number===step.from).team,own=team==='neutral'?step.team:team;
      for(let n=2;n<=18;n++){const t=step.start+(flight.delay||0)+(flight.duration||step.duration)*n/20,state=bibleAnimationState(a,t);
       for(const defender of state.players.filter(t=>!t.rotation&&t.team!=='neutral'&&t.team!==own))check(Math.hypot(state.ball.x-defender.x,state.ball.y-defender.y)/a.field.scale>=.65,id+' V'+designIndex+' '+players+'/'+keepers+'/'+level+'/'+space+' pass through defender '+defender.number+' · '+step.title);
      }
     }
    }
   }
   const normal=bibleTimeline(e,12,s),light=bibleTimeline(e,12,{...s,coachingLoad:'light'});check(normal.totalSeconds===720&&light.totalSeconds===720,id+' missing block time');check(light.totalWorkSeconds<=normal.totalWorkSeconds,id+' light load increases work');
  }
 }
 const finish=trainingExercises.find(e=>e.id==='finish-opposition'),large={players:18,keepers:1,level:'developing',category:'U16',age:16,space:'full'};
 check(!biblePlan(finish,large).fits,'18 players / 1 keeper silently split');check(!biblePlan(finish,{...large,players:8,keepers:0}).fits,'no-keeper finish accepted');
 const choice=bibleAdaptationAlternatives(finish,large).find(c=>c.kind==='rotation');check(choice&&choice.plan.fits,'no explicit rotation alternative');
 const context=bibleSequenceContext(finish,large,{sequenceSettings:[choice.settings]},0);check(context.fits&&context.activePlayers+context.offPlayers===18&&context.activeKeepers+context.offKeepers===1,'rotation loses players');
 return {cases,clips,passes,examples,rotation:{active:context.activePlayers,outside:context.offPlayers,keepers:context.activeKeepers}};
})()`,c);
assert.equal(result.examples.length,25);fs.writeFileSync('/tmp/exercise-five-review-audit.json',JSON.stringify(result,null,2));
console.log('PASS five-drill review:',{cases:result.cases,clips:result.clips,passes:result.passes,rotation:result.rotation});
