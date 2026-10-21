// Catalogue-wide adaptation contracts, including explicit rotation alternatives.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const c=vm.createContext({console});
for(const file of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','training-adaptation.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
const result=vm.runInContext(`(()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};let cases=0,alternatives=0;
 for(const e of trainingExercises)for(const level of ['discovery','advanced'])for(const players of [2,6,14,40])for(const space of ['small','full']){
  const session={category:level==='discovery'?'U14':'Seniors',age:18,level,players,keepers:Math.min(2,players-2),space};
  for(const organisation of ['single','auto']){
   const plan=biblePlan(e,session,{organisation});check(plan.totalPlayers===players,e.id+' lost total');
   check(plan.groups.reduce((n,g)=>n+g.players,0)===players,e.id+' lost players');
   if(organisation==='single')check(plan.groups.length===1,e.id+' silent split');
   for(const g of plan.groups){if(g.fits)check(g.players<=g.format.max&&g.players>=g.format.min,e.id+' format bypass');check(g.teams.blue+g.teams.red+g.teams.neutral+g.activeKeepers+g.rotatingKeepers===g.players,e.id+' roles');}
  }
  for(const choice of bibleAdaptationAlternatives(e,session)){
   const context=bibleSequenceContext(e,session,{sequenceSettings:[choice.settings]},0);check(context.valid&&context.fits,e.id+' unusable alternative');
   check(context.activePlayers+context.offPlayers===players,e.id+' hidden exclusions');check(context.activeKeepers+context.offKeepers===session.keepers,e.id+' lost keeper');
   check(context.offFieldPlayers>=0,e.id+' invented field players');alternatives++;
  }
  const time=bibleTimeline(e,24,session,{sequences:1});
  check(time.totalWorkSeconds+time.totalRestSeconds===1440,e.id+' incorrect time budget');
  check(time.totalWorkSeconds===time.sequences.flatMap(s=>s.intervals).reduce((n,i)=>n+i.workSeconds,0),e.id+' false work time');cases++;
 }
 const e=trainingExercises.find(e=>e.id==='rondo'),base={players:6,keepers:0,space:'full',category:'U14'};
 const novice=biblePlan(e,{...base,level:'discovery'},{organisation:'single'}).groups[0],advanced=biblePlan(e,{...base,level:'advanced'},{organisation:'single'}).groups[0];
 check(novice.teams.red<advanced.teams.red,'level must change actual pressure roles');
 check(novice.learning.rules!==advanced.learning.rules||novice.learning.profile.focus!==advanced.learning.profile.focus,'level constraint');
 check(novice.width!==advanced.width||novice.length!==advanced.length,'level dimensions');
 const many={...base,players:40};check(!biblePlan(e,many,{organisation:'single'}).fits,'40-player rondo falsely accepted');
 check(bibleAdaptationAlternatives(e,many).some(c=>c.kind==='rotation'),'missing single-field alternative');
 const time=bibleTimeline(e,24,{...base,level:'discovery'},{sequences:1});check(time.internalRestSeconds>0&&time.totalWorkSeconds<1440,'intermediate recovery ignored');
 return {exercises:trainingExercises.length,cases,alternatives};
})()`,c);assert.ok(result.alternatives>0);console.log('PASS final adaptation contracts:',result);
