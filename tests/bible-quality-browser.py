"""Catalogue-wide accounting and football outcomes, plus guided playback."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1100})
    page.goto('http://127.0.0.1:3016/?mode=local')
    result=page.evaluate(r"""()=>{
      const check=(ok,message)=>{if(!ok)throw Error(message);};let cases=0,fits=0,groups=0,endzones=0;
      for(const e of trainingExercises){
        const k=bibleKnowledge[e.id];check(k&&k.context&&k.objective&&k.sourceIds?.length,e.id+' missing editorial context or source');
        for(const category of ['U14','U17','Seniors'])for(const level of ['discovery','developing','advanced'])for(const players of [6,14,25,40]){
          const session={category,age:18,level,players,keepers:2,space:'full'},plan=biblePlan(e,session,{organisation:'auto'}),timeline=bibleTimeline(e,12,session);
          check(plan.groups.reduce((n,g)=>n+g.players,0)===players,e.id+' lost players');
          check(plan.groups.reduce((n,g)=>n+g.keepers,0)===2,e.id+' lost keepers');
          check(timeline.sequences.reduce((n,s)=>n+s.workSeconds+s.restSeconds,0)===720,e.id+' wrong block duration');
          check(timeline.sequences.every(s=>!s.rule.includes('Repère de difficulté')),e.id+' stacked competing rules');
          for(const g of plan.groups){
            groups++;check(g.learning.profile.level===level,e.id+' incorrect level');
            check(g.learning.profile.age===(category==='U14'?14:category==='U17'?17:18),e.id+' incorrect age');
            check(g.material.bibsBlue+g.material.bibsRed+g.material.bibsNeutral+g.material.bibsKeeper===g.players,e.id+' bib accounting');
            check(g.teams.blue+g.teams.red+g.teams.neutral+g.activeKeepers+g.rotatingKeepers===g.players,e.id+' role accounting');
            const scenario=bibleCoachScenario(e,g);check(scenario.roles===g.roles&&scenario.liveBalls===g.material.activeBalls,e.id+' coaching/plan divergence');
            if(!g.fits)continue;
            check(g.width>=g.recommendedMinimum.width&&g.length>=g.recommendedMinimum.length,e.id+' too cramped but marked fitting');
            if(g.template==='endzones'&&!g.material.goals&&!g.material.miniGoals&&!g.material.gates&&g.teams.blue>=2){
              const demo=bibleAnimationPlan(e,g),middle=g.zoneDimensions[1],end=g.zoneDimensions.at(-1);
              check(demo.available,e.id+' missing demo');
              check(demo.initial.players.filter(t=>!t.rotation).every(t=>t.x>=demo.field.fx+middle.x*demo.field.scale&&t.x<=demo.field.fx+(middle.x+middle.length)*demo.field.scale),e.id+' waiting in endzone');
              const final=bibleAnimationState(demo,demo.duration),lastPass=demo.steps.filter(s=>s.action==='pass').at(-1),receiver=final.players.find(t=>t.number===lastPass?.to);
              check(receiver&&receiver.team==='blue',e.id+' no scoring teammate');
              check(receiver.x>=demo.field.fx+end.x*demo.field.scale,e.id+' no reception inside target');
              check(Math.hypot(final.ball.x-receiver.x,final.ball.y-receiver.y)<40,e.id+' ball not controlled');endzones++;
            }
          }
          cases++;if(plan.fits)fits++;
        }
      }
      return {exercises:trainingExercises.length,cases,groups,fits,endzones};
    }""")
    # Isolate the actual player to test the optional teaching mode without a hidden parent.
    page.evaluate("""()=>{
      const e=trainingExercises.find(e=>e.id==='possession-endzones'),session={players:10,keepers:0,category:'U14',level:'discovery',space:'full'};
      window.qualityFigure=bibleDiagram(e,session,{plan:biblePlan(e,session,{organisation:'single'}),sequenceIndex:1});
      const d=document.createElement('dialog');d.style.width='850px';d.append(qualityFigure);document.body.append(d);d.showModal();
    }""")
    page.get_by_label('Arrêt après chaque action',exact=True).check()
    page.locator('dialog .bible-animation-speed').select_option('2')
    page.locator('dialog .bible-animation-play').click()
    page.wait_for_function("qualityFigure.dataset.animationState==='paused'&&qualityFigure.bibleAnimation.state.time>0")
    assert page.evaluate('qualityFigure.bibleAnimation.state.time<qualityFigure.bibleAnimation.plan.duration')
    before=page.evaluate('qualityFigure.bibleAnimation.state.time')
    page.wait_for_timeout(150)
    assert page.evaluate('qualityFigure.bibleAnimation.state.time')==before
    assert page.locator('dialog .bible-animation-play').inner_text()=='▶ Action suivante'
    page.locator('dialog .bible-animation-play').click()
    page.wait_for_function('(before)=>qualityFigure.dataset.animationState===\'paused\'&&qualityFigure.bibleAnimation.state.time>before',arg=before)
    page.locator('dialog .bible-animation-reset').click()
    assert page.evaluate('qualityFigure.bibleAnimation.state.time')==0
    browser.close()
    print('PASS:',json.dumps(result),'and guided action-by-action pause/resume/reset.')
