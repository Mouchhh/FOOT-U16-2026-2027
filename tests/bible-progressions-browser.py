"""Worked decisions for overlaps, line breaking and safe pivot connections."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900});page.goto('http://127.0.0.1:3016/?mode=local')
 result=page.evaluate('''()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)};let cases=0;
  for(const id of ['overlap','break-lines','build-pivot'])for(const level of ['discovery','developing','advanced'])for(const players of [6,10,14])for(let index=0;index<4;index++){
   const e=trainingExercises.find(e=>e.id===id),s={players,keepers:0,category:'U17',level,age:16,space:'full'},g=biblePlan(e,s,{organisation:'single'}).groups[0];if(!g.fits)continue;
   const plan=bibleAnimationPlan(e,g,{sequenceIndex:index}),passes=plan.steps.filter(s=>s.action==='pass');check(plan.available,id+' missing demonstration');
   if(id==='overlap'){
    const entry=plan.steps.find(s=>s.title.includes('Appel intérieur')||s.title.includes('Dédoublement extérieur'));check(entry,id+' missing supporting run');
    check(index!==1||entry.title.includes('intérieur'),'Sequence 2 must illustrate interior choice');
    check(passes.length===1,'Pass must follow the supporting run');
    const s=bibleAnimationState(plan,passes[0].end),receiver=s.players.find(p=>p.number===passes[0].to);check(receiver.x>plan.field.fx+plan.field.fw*.6,'Runner must progress beyond carrier');
   }
   if(id==='break-lines'){
    if(index===2)check(plan.steps.some(s=>s.action==='carry'),'Open-lane sequence lacks a carry');
    const first=passes[0],receiver=bibleAnimationState(plan,first.end).players.find(p=>p.number===first.to);check(receiver.x>plan.field.fx+plan.field.fw/3,'Pass fails to break the first third');
    check(index!==3||bibleCoachScenario(e,g,index).score.includes('aucun bonus'),'Transfer must remove bonus');
   }
   if(id==='build-pivot'){
    const pivot=plan.initial.players.find(t=>t.team==='neutral');check(pivot,'Pivot missing');
    if(index===2)check(passes.every(p=>p.to!==pivot.number),'Marked pivot is forced');
    else{check(passes[0].to===pivot.number,'Pivot never receives');check(passes[1].from===pivot.number&&passes[1].to===passes[0].from,'No safe return to original support');}
   }
   cases++;
  }
  check(Object.hasOwn(biblePhases,bibleKnowledge['duel-renforts'].phase),'Video exercise not discoverable by game moment');
  return {cases};
 }''')
 print('PASS:',result)
 b.close()
