const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({console});
for(const f of ['training-data.js','training-knowledge.js','bible-additional-exercises.js','coach-video-exercises.js','exercise-pedagogy.js','training-adaptation.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const result=vm.runInContext(`(()=>{
 const check=(v,m)=>{if(!v)throw Error(m)},base={age:16,category:'U16',level:'developing',space:'full'},rondo=trainingExercises.find(e=>e.id==='rondo');let cases=0;
 for(const e of trainingExercises)for(const first of [2,4,6,8])for(const second of [3,5,7,9]){
  const roster=[{players:first,keepers:first>=6?1:0},{players:second,keepers:second>=7?1:0}],session={...base,players:first+second,keepers:roster.reduce((n,g)=>n+g.keepers,0)},before=JSON.stringify(roster),p=biblePlan(e,session,{organisation:'stations',groups:2,groupRoster:roster});
  check(p.groups.length===2&&p.groups.every((g,i)=>g.players===roster[i].players&&g.keepers===roster[i].keepers),e.id+' silently redistributes');check(JSON.stringify(roster)===before,'input mutated');
  check(p.groups.reduce((n,g)=>n+g.players,0)===session.players,e.id+' missing player');cases++;
 }
 const roster=[{players:6,keepers:0},{players:8,keepers:1}],session={...base,players:18,keepers:2},v={sequenceSettings:[{groupRoster:roster}]},ctx=bibleSequenceContext(rondo,session,v,0);
 check(ctx.valid&&ctx.fits&&ctx.activePlayers===14&&ctx.activeKeepers===1&&ctx.offPlayers===4&&ctx.offKeepers===1&&ctx.offFieldPlayers===3,'outside players / keepers');
 check(ctx.plan.groups[0].players===6&&ctx.plan.groups[1].players===8,'unequal groups changed');
 check(!bibleSequenceContext(rondo,{...base,players:12,keepers:1},v,0).valid,'too many assigned players accepted');
 check(!bibleSequenceContext(rondo,{...base,players:18,keepers:0},v,0).valid,'invented keeper');
 check(!bibleSequenceContext(rondo,{...base,players:18,keepers:8},v,0).valid,'invented field players');
 check(!bibleSequenceContext(rondo,session,{sequenceSettings:[{groupRoster:roster,groups:3}]},0).valid,'conflicting count accepted');
 check(!bibleGroupRosterValid([{players:4,keepers:5}]),'more keepers than players accepted');
 check(!bibleGroupRosterValid([{players:1,keepers:0}]),'single player group accepted');
 const oversize=biblePlan(rondo,{...base,players:18,keepers:0},{groupRoster:[{players:6,keepers:0},{players:12,keepers:0}]});check(!oversize.fits&&oversize.groups[1].players===12,'incompatible group silently repaired');
 const wrong=biblePlan(rondo,{...base,players:18,keepers:0},{groupRoster:[{players:6,keepers:0},{players:8,keepers:0}]});check(!wrong.fits,'direct API bad totals accepted');
 const finish=trainingExercises.find(e=>e.id==='finish-opposition'),one=bibleSequenceContext(finish,{...base,players:14,keepers:1},{sequenceSettings:[{groupRoster:[{players:8,keepers:1},{players:6,keepers:0}]}]},0);check(one.valid&&!one.fits,'finishing group without goalkeeper accepted');
 const two=bibleSequenceContext(finish,{...base,players:14,keepers:2},{sequenceSettings:[{groupRoster:[{players:8,keepers:1},{players:6,keepers:1}]}]},0);check(two.fits,'two valid finishing groups rejected');
 return {cases};
})()`,c);
assert.equal(result.cases,1040);console.log('PASS exact per-exercise groups:',result);
