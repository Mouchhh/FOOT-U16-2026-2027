"""Check football outcomes rather than only SVG counts or animation continuity."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':900})
    page.goto('http://127.0.0.1:3016/?mode=local')
    result=page.evaluate(r'''()=>{
      const check=(ok,message)=>{if(!ok)throw Error(message);};let cases=0,windows=0;
      const ids=['receive-back','escape-turn','rondo-direction','defend-outnumbered','finish-rebound','trap','wide-isolate','box-combine'];
      for(const id of ids)for(const level of ['discovery','developing','advanced'])for(const players of [8,14,25])for(let sequenceIndex=0;sequenceIndex<4;sequenceIndex++){
        const e=trainingExercises.find(e=>e.id===id),group=biblePlan(e,{players,keepers:id==='finish-rebound'?1:0,level,category:'U17',space:'full'},{organisation:'auto'}).groups[0];
        if(!group.fits)continue;
        const plan=bibleAnimationPlan(e,group,{sequenceIndex}),passes=plan.steps.filter(s=>s.action==='pass'),initial=plan.initial.players,reds=initial.filter(t=>t.team==='red'),scenario=bibleCoachScenario(e,group,sequenceIndex);
        check(plan.available,id+' missing worked example');
        if(id==='receive-back'||id==='escape-turn'&&sequenceIndex===2){
          check(passes.length>=2,id+' no return option');check(passes[0].from===passes[1].to&&passes[0].to===passes[1].from,id+' return misses original support');
          const at=bibleAnimationState(plan,passes[1].end);check(at.players.find(p=>p.number===passes[1].to).y!==initial.find(p=>p.number===passes[1].to).y,id+' support never changed angle');
        }
        if(id==='escape-turn'&&sequenceIndex!==2)check(plan.steps.some(s=>s.action==='carry'&&s.from===passes[0].to),id+' receiver never turns with ball');
        if(id==='rondo-direction'){
          const pass=passes[0],state=bibleAnimationState(plan,pass.start),a=state.players.find(t=>t.number===pass.from),b=bibleAnimationState(plan,pass.end).players.find(t=>t.number===pass.to);
          check(reds.every(r=>a.x<r.x&&r.x<b.x),id+' pass never goes beyond pressure');
          for(let i=0;i<=30;i++){
            const state=bibleAnimationState(plan,pass.start+pass.duration*i/30);
            check(state.players.filter(t=>t.team==='red').every(r=>Math.hypot(r.x-state.ball.x,r.y-state.ball.y)>plan.field.scale*.5+12),id+' pass goes through a defender');
          }
          check(sequenceIndex!==3||scenario.score.includes('Retirer le bonus'),id+' bonus survives transfer sequence');windows++;
        }
        if(id==='defend-outnumbered'){
          check(group.teams.blue>group.teams.red,id+' no actual numerical disadvantage');
          const state=bibleAnimationState(plan,plan.duration),ball=state.ball;
          check(state.players.filter(t=>t.team==='red').every(r=>r.x>ball.x),id+' defenders abandon depth');
          check(!passes.length,id+' demonstration invents a defensive recovery');
        }
        if(id==='finish-rebound'){
          const motions=plan.steps.flatMap(s=>s.motions).filter(m=>m.kind==='ball');
          check(motions.some(m=>Math.abs(m.to.x-plan.field.fx-plan.field.fw)<1),id+' no shot');
          check(motions.some(m=>m.from.x>m.to.x+plan.field.fw*.1),id+' no actual rebound');
          const last=bibleAnimationState(plan,plan.duration),support=last.players.find(p=>p.number===plan.steps.at(-2).owner);
          check(support&&Math.hypot(last.ball.x-support.x,last.ball.y-support.y)<40,id+' rebound never controlled');
        }
        if(id==='trap')check(plan.steps.some(s=>s.motions.some(m=>m.kind==='player'&&reds.some(r=>r.number===m.id))),id+' no coordinated defensive movement');
        if(id==='wide-isolate'&&sequenceIndex===2)check(passes.length===2&&passes[0].from===passes[1].to,id+' no support when channel closes');
        if(id==='box-combine')check(passes.length===2&&passes[0].from===passes[1].to&&plan.steps.some(s=>s.motions.some(m=>m.kind==='ball'&&m.to.x===plan.field.fx+plan.field.fw)),id+' combination never leads to target');
        cases++;
      }
      const e=trainingExercises.find(e=>e.id==='cpa-attack'),group=biblePlan(e,{players:14,keepers:2,space:'full'},{organisation:'auto'}).groups[0],reds=new Set(bibleAnimationPlan(e,group).initial.players.filter(t=>t.team==='red').map(t=>t.number));
      const rehearsal=bibleAnimationPlan(e,group,{sequenceIndex:0}),live=bibleAnimationPlan(e,group,{sequenceIndex:2});
      check(!rehearsal.steps.some(s=>s.motions.some(m=>m.kind==='player'&&reds.has(m.id))),'first corner: active defence despite passive instructions');
      check(live.steps.some(s=>s.motions.some(m=>m.kind==='player'&&reds.has(m.id))),'live corner lacks active defence');
      const rebound=trainingExercises.find(e=>e.id==='finish-rebound'),noKeeper=biblePlan(rebound,{players:8,keepers:0,space:'full'},{organisation:'single'});
      check(!noKeeper.fits&&!bibleAnimationPlan(rebound,noKeeper.groups[0]).available,'rebound shown as equivalent without a goalkeeper');
      const rondo=trainingExercises.find(e=>e.id==='rondo'),rg=biblePlan(rondo,{players:6,keepers:0,space:'full'},{organisation:'single'}).groups[0];
      check(bibleCoachScenario(rondo,rg).score.includes('arrêter la série'),'rondo recovery has inconsistent roles');
      return {cases,windows,passiveAndActiveCorners:true};
    }''')
    browser.close();print('PASS:',result,'football-specific demonstrations.')
