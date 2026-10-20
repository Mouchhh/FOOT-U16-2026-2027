"""Video-inspired progression: equipment, entrant roles, waiting players and playback."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1100,'height':900})
    page.set_content('<style>body{background:#f3f6fb;font-family:Arial}svg{width:100%;max-height:760px}main{max-width:1000px;margin:auto}</style><main></main>')
    for name in ['training-data.js','training-knowledge.js','training-adaptation.js','bible-diagrams.js','bible-animation.js']:
        page.add_script_tag(content=(ROOT/name).read_text())
    result=page.evaluate('''() => {
      const check=(ok,msg)=>{if(!ok)throw Error(msg)},e=trainingExercises.find(e=>e.id==='duel-renforts');let cases=0;
      for(const players of [5,9,13,20,40])for(const level of ['discovery','developing','advanced']){
        const s={players,keepers:1,space:'full',age:16,level},p=biblePlan(e,s,{organisation:'single'}),g=p.groups[0];
        check(g.teams.neutral===0,'No invented joker');check(g.material.goals===1&&g.material.miniGoals===2,'Mixed targets');
        check(g.teams.blue+g.teams.red+g.activeKeepers===players,'Every participant counted');
        const svg=bibleDiagramSVG(e,g),plan=bibleAnimationPlan(e,g,{scene:svg.bibleScene});
        check(plan.available,'Playable progression');check(plan.steps.some(s=>s.title.includes('2 contre 1')),'Blue reinforcement');check(plan.steps.some(s=>s.title.includes('2 contre 2')),'Red reinforcement');
        const movers=new Set(plan.steps.flatMap(s=>s.motions.filter(m=>m.kind==='player').map(m=>m.id)));
        check(movers.size===4,'Only four outfield players act in a wave');
        const goal=plan.initial.players.find(t=>t.keeper&&!t.fieldKeeper);check(goal.x>plan.field.fx+plan.field.fw*.8,'Keeper protects big goal');
        check(svg.querySelectorAll('[data-equipment="miniGoal"]').length===2,'Two mini goals drawn');
        check(svg.querySelectorAll('[data-equipment="goal"]').length===1,'One big goal drawn');cases++;
      }
      const g=biblePlan(e,{players:9,keepers:1,space:'full',age:16,level:'developing'},{organisation:'single'}).groups[0];
      document.querySelector('main').append(bibleDiagramSVG(e,g));return {cases};
    }''')
    page.screenshot(path='/tmp/bible-renforts.png',full_page=True)
    print('PASS',result)
    browser.close()
