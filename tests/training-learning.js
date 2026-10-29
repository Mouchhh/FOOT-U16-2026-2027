const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),c=vm.createContext({});
for(const f of ['training-data.js','training-knowledge.js','exercise-pedagogy.js','training-adaptation.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(root,'training.js'),'utf8').split('let currentTraining=')[0]+fs.readFileSync(path.join(root,'local-coach-rules.js'),'utf8')+';globalThis.exercises=trainingExercises;',c);
const base={version:1,id:'learning',updatedAt:'',team:'Club',category:'U14',age:18,date:'2026-10-19',time:'18:30',duration:90,players:14,keepers:2,space:'half',level:'discovery',context:'District',themes:['Relance'],notes:'',blocks:[]};
const youth=c.bibleTrainingProfile(base),senior=c.bibleTrainingProfile({...base,category:'Seniors',level:'advanced'});
assert.equal(youth.age,14);assert.equal(senior.band,'adult');assert.equal(c.bibleTrainingProfile({...base,category:'U14 / U15'}).age,15);
assert.equal(c.bibleTrainingProfile({...base,context:'National'}).level,'discovery','League does not override observed skill');
const e=c.exercises.find(e=>e.id==='rondo'),s={...base,players:6,keepers:0},novice=c.biblePlan(e,s,{organisation:'single'}).groups[0],advanced=c.biblePlan(e,{...s,level:'advanced'},{organisation:'single'}).groups[0];
assert.equal(novice.teams.blue,5);assert.equal(novice.teams.red,1);assert.equal(advanced.teams.blue,4);assert.equal(advanced.teams.red,2);assert.ok(novice.width>advanced.width);
assert.equal(c.biblePlan(e,s,{width:24,length:25,organisation:'single'}).groups[0].width,24,'Explicit coach dimensions retained');
const a=c.localCoachPlan(base),b=c.localCoachPlan({...base,category:'Seniors',level:'advanced'}),youngAdvanced=c.localCoachPlan({...base,level:'advanced'});
assert.notDeepEqual(a.blocks.map(b=>b.exerciseId),b.blocks.map(b=>b.exerciseId));assert.notDeepEqual(youngAdvanced.blocks.map(b=>b.exerciseId),b.blocks.map(b=>b.exerciseId));
for(const proposal of [a,b,youngAdvanced])assert.equal(proposal.blocks.reduce((n,b)=>n+b.duration,0),90);
assert.ok(a.summary.includes('U14')&&b.summary.includes('Seniors'));
const t=c.bibleTimeline(e,12,s),u=c.bibleTimeline(e,12,{...s,category:'Seniors',level:'advanced'});
assert.notEqual(t.sequences.length,u.sequences.length);assert.notEqual(t.sequences[0].rule,u.sequences[0].rule);
for(const level of ['discovery','developing','advanced'])for(const category of ['U14','U16','Seniors'])for(const minutes of [8,12,20,40]){
 const session={...s,level,category},timeline=c.bibleTimeline(e,minutes,session);let total=0;
 for(const seq of timeline.sequences){assert.equal(seq.intervals.reduce((n,i)=>n+i.workSeconds+i.restSeconds,0),seq.workSeconds);total+=seq.workSeconds+seq.restSeconds;assert.ok(seq.intervals.every(i=>i.workSeconds>0&&i.restSeconds>=0));}
 assert.equal(total,minutes*60);
}
const long=c.bibleTimeline(e,20,s);assert.ok(long.sequences.some(s=>s.intervals.length>1),'Long teaching phase must have short repetitions');
const warm=c.exercises.find(e=>e.id==='warm');assert.ok(!/passe/i.test(c.bibleExerciseLearning(warm,s).constraint),'Individual activation remains coherent');
console.log('PASS: category, skill, actual drill selection, opposition, space, rules, recovery, short repetitions and exact session duration.');
