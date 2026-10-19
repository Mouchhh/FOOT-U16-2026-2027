"""Real local SVG animation: continuity, football roles and player lifecycle."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1100,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('''<style>body{margin:0;background:#eef3f9;font-family:Arial}main{max-width:920px;margin:20px auto}.training-diagram{margin:0}.training-diagram-controls{display:flex;gap:8px;flex-wrap:wrap}.training-diagram-svg{display:block;width:100%;height:auto}.training-diagram-print{display:none}select{max-width:100%}figcaption{font-size:12px}.bible-animation{padding:12px}.bible-animation-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.bible-animation-controls button,.bible-animation-controls select{padding:10px;border:1px solid #dce4f2;border-radius:8px;background:white;color:#245187}.bible-animation-progress{width:100%}.bible-animation-caption{font-size:13px;line-height:1.5}.bible-animation-status{margin-left:auto;font-size:12px}</style><main></main>''')
    for name in ['training-data.js','training-knowledge.js','training-adaptation.js','bible-diagrams.js','bible-animation.js']:
        page.add_script_tag(content=(ROOT/name).read_text())
    result=page.evaluate('''() => {
      const assert=(ok,message)=>{if(!ok)throw new Error(message);};let cases=0,available=0,continuousPasses=0;
      for(const exercise of trainingExercises)for(const players of [4,14,40])for(const organisation of ['single','auto']){
        const session={players,keepers:Math.min(2,Math.floor(players/5)),space:'full',age:18,level:'developing'};
        const grouped=biblePlan(exercise,session,{organisation});
        assert(grouped.groups.reduce((n,g)=>n+g.players,0)===players,exercise.id+' group accounting');
        for(const group of grouped.groups){
          const before=JSON.stringify({exercise,group}),svg=bibleDiagramSVG(exercise,group),scene=svg.bibleScene;
          const pure=bibleAnimationScene(exercise,group);
          assert(pure.tokens.length===scene.tokens.length,exercise.id+' pure actor count');
          for(let i=0;i<scene.tokens.length;i++)assert(Math.hypot(pure.tokens[i].x-scene.tokens[i].x,pure.tokens[i].y-scene.tokens[i].y)<1e-6,exercise.id+' pure/static actor start');
          assert(Math.hypot(pure.ball.x-scene.ball.x,pure.ball.y-scene.ball.y)<1e-6,exercise.id+' pure/static ball start '+JSON.stringify({pure:pure.ball,scene:scene.ball}));
          const plan=bibleAnimationPlan(exercise,group,{scene,sequenceIndex:1});
          assert(before===JSON.stringify({exercise,group}),exercise.id+' input mutation');
          assert(plan.initial.players.length===group.players,exercise.id+' missing participant');
          assert(plan.initial.players.filter(t=>t.keeper).length===group.keepers,exercise.id+' keeper accounting');
          if(!plan.available){assert(group.fits===false||group.pedagogyFits===false||!scene.activeBalls,exercise.id+' unexplained disabled demo');cases++;continue;}
          available++;assert(plan.duration>3&&plan.steps.length>=3,exercise.id+' no meaningful steps');
          const field=plan.field,byId=new Map(plan.initial.players.map(t=>[t.number,t]));
          for(let tick=0;tick<=40;tick++){
            const state=bibleAnimationState(plan,plan.duration*tick/40);
            assert(state.players.length===group.players,exercise.id+' changed player count');
            for(const token of state.players){
              const start=byId.get(token.number);assert(start&&start.team===token.team&&start.keeper===token.keeper,exercise.id+' changed role');
              if(token.rotation)assert(token.x===start.x&&token.y===start.y,exercise.id+' rotating keeper enters play');
              else assert(token.x>=field.fx-1e-7&&token.x<=field.fx+field.fw+1e-7&&token.y>=field.fy-1e-7&&token.y<=field.fy+field.fh+1e-7,exercise.id+' player outside pitch');
            }
            assert(Number.isFinite(state.ball.x)&&Number.isFinite(state.ball.y),exercise.id+' bad ball');
            assert(state.ball.x>=field.fx-1e-7&&state.ball.x<=field.fx+field.fw+1e-7&&state.ball.y>=field.fy-1e-7&&state.ball.y<=field.fy+field.fh+1e-7,exercise.id+' ball outside pitch');
          }
          for(const step of plan.steps){
            const atStart=bibleAnimationState(plan,step.start),after=bibleAnimationState(plan,Math.min(plan.duration,step.start+.000001));
            assert(Math.hypot(atStart.ball.x-after.ball.x,atStart.ball.y-after.ball.y)<.01,exercise.id+' ball teleports at step');
            for(const motion of step.motions.filter(m=>m.kind==='ball')){
              const state=bibleAnimationState(plan,step.start+step.duration/2),ball=state.balls.find(b=>b.id===motion.id),middle={x:(motion.from.x+motion.to.x)/2,y:(motion.from.y+motion.to.y)/2};
              if(motion.follow!==undefined){const carrier=state.players.find(p=>p.number===motion.follow);assert(carrier&&Math.hypot(ball.x-carrier.x,ball.y-carrier.y)<scene.playerRadius+13,exercise.id+' carried ball detaches from player');}
              else{assert(ball&&Math.hypot(ball.x-middle.x,ball.y-middle.y)<1e-6,exercise.id+' pass does not travel through midpoint');continuousPasses++;}
            }
            if(step.action==='pass'){
              const before=bibleAnimationState(plan,step.start),after=bibleAnimationState(plan,step.end),from=before.players.find(p=>p.number===step.from),to=after.players.find(p=>p.number===step.to);
              assert(Math.hypot(before.ball.x-from.x,before.ball.y-from.y)<scene.playerRadius+13,exercise.id+' pass starts away from passer');
              assert(Math.hypot(after.ball.x-to.x,after.ball.y-to.y)<scene.playerRadius+13,exercise.id+' pass misses receiver');
            }
            for(const m of step.motions.filter(m=>m.kind==='player'))assert(Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/plan.field.scale/step.duration<=4.201,exercise.id+' impossible running pace');
          }
          cases++;
        }
      }
      // An activation with one ball per player cannot turn into a pass toward
      // someone who already has a ball. Every ball follows its actual carrier.
      const warm=trainingExercises.find(e=>e.id==='warm'),wg=biblePlan(warm,{players:14,keepers:2,space:'full',age:18,level:'developing'},{organisation:'single'}).groups[0],wp=bibleAnimationPlan(warm,wg),ws=bibleAnimationState(wp,wp.duration*.6);
      assert(ws.balls.length===14,'activation ball count');
      for(const ball of ws.balls){const player=ws.players.find(p=>p.number===ball.owner);assert(player&&Math.hypot(player.x-ball.x,player.y-ball.y)<35,'activation ball separated from its carrier');}
      // Keeper distribution must travel to a member of the keeper's team or a neutral.
      for(const id of ['keeper-feet','keeper-distribute']){
        const exercise=trainingExercises.find(e=>e.id===id),group=biblePlan(exercise,{players:14,keepers:1,space:'full',age:18,level:'developing'},{organisation:'single'}).groups[0],plan=bibleAnimationPlan(exercise,group),keeper=plan.initial.players.find(t=>t.keeper&&!t.rotation),distribution=plan.steps.find(s=>s.title.includes('Distribuer'));
        assert(keeper&&distribution,id+' distribution absent');
        const ball=bibleAnimationState(plan,distribution.end).ball,state=bibleAnimationState(plan,distribution.end),friends=state.players.filter(t=>!t.keeper&&(t.team===keeper.team||t.team==='neutral'));
        assert(friends.some(t=>Math.hypot(ball.x-t.x,ball.y-t.y)<35),id+' keeper distributes to an opponent');
      }
      return {cases,available,continuousPasses};
    }''')
    assert result['cases']>=360,result
    assert result['available']>=100,result
    assert result['continuousPasses']>=150,result
    page.evaluate('''() => {
      const e=trainingExercises.find(e=>e.id==='triangle'),session={players:14,keepers:1,space:'full',age:18,level:'developing'};
      window.figure=bibleDiagram(e,session,{plan:biblePlan(e,session,{organisation:'single'})});document.querySelector('main').append(figure);
      window.startTransforms=[...figure.querySelectorAll('.training-diagram-screen .bible-player')].map(e=>e.getAttribute('transform'));
      window.printStart=figure.querySelector('.training-diagram-print').innerHTML;
    }''')
    assert page.locator('figure').get_attribute('data-animation-state')=='idle'
    assert page.locator('.bible-animation-play').inner_text()=='▶ Lire'
    page.locator('.bible-animation-play').click()
    page.wait_for_timeout(1600)
    assert page.locator('figure').get_attribute('data-animation-state')=='playing'
    assert page.evaluate('figure.bibleAnimation.state.time>1')
    page.locator('.bible-animation-play').click()
    paused=page.evaluate('figure.bibleAnimation.state.time')
    page.wait_for_timeout(250)
    assert page.evaluate('figure.bibleAnimation.state.time')==paused
    assert page.locator('figure').get_attribute('data-animation-state')=='paused'
    assert page.evaluate("figure.querySelector('.training-diagram-print').innerHTML===printStart")
    page.locator('.bible-animation-speed').select_option('2')
    page.locator('.bible-animation-next').click()
    assert page.evaluate('figure.bibleAnimation.state.time')>paused
    page.locator('.bible-animation-previous').click()
    assert page.evaluate('figure.bibleAnimation.state.time')<=paused+.01
    page.locator('.bible-animation-reset').click()
    assert page.locator('figure').get_attribute('data-animation-state')=='idle'
    assert page.evaluate("JSON.stringify(startTransforms)===JSON.stringify([...figure.querySelectorAll('.training-diagram-screen .bible-player')].map(e=>e.getAttribute('transform')))")
    # Scrubbing and keyboard buttons keep a fixed point that cannot drift.
    page.evaluate('figure.bibleAnimation.seek(4.1)')
    assert page.locator('figure').get_attribute('data-animation-state')=='paused'
    page.locator('.bible-animation-reset').focus()
    page.keyboard.press('Enter')
    assert page.evaluate('figure.bibleAnimation.state.time')==0
    # A changed sequence disposes the old controller; a new diagram always starts idle.
    page.evaluate('window.oldAnimation=figure.bibleAnimation;figure.bibleAnimation.play();figure.bibleSetSequence(1)')
    assert page.locator('figure').get_attribute('data-animation-state')=='idle'
    old=page.evaluate('oldAnimation.state.time')
    page.wait_for_timeout(150)
    assert page.evaluate('oldAnimation.state.time')==old
    # Closing a dialog cancels its animation even while the node stays connected.
    page.evaluate("window.dialog=document.createElement('dialog');document.querySelector('main').append(dialog);dialog.append(figure);dialog.showModal();figure.bibleAnimation.play()")
    page.wait_for_timeout(100)
    page.evaluate('dialog.close()')
    page.wait_for_timeout(50)
    assert page.locator('figure').get_attribute('data-animation-state') in ['idle','paused']
    page.evaluate("document.querySelector('main').append(figure);dialog.remove()")
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/bible-animation-mobile.png',full_page=True)
    # All actual participants remain on the single 40-player drawing.
    page.evaluate('''() => {
      const e=trainingExercises.find(e=>e.id==='freegame'),s={players:40,keepers:2,space:'full',age:18,level:'developing'};
      window.large=bibleDiagram(e,s,{plan:biblePlan(e,s,{organisation:'single'})});document.querySelector('main').replaceChildren(large);
    }''')
    assert page.locator('.training-diagram-screen .bible-player').count()==40
    assert page.locator('.training-diagram-screen [data-keeper="true"]').count()==2
    page.evaluate('large.bibleAnimation.play()')
    page.wait_for_timeout(150)
    page.evaluate('window.removedController=large.bibleAnimation;large.remove()')
    removed=page.evaluate('removedController.state.time')
    page.wait_for_timeout(150)
    assert page.evaluate('removedController.state.time')==removed
    # Printing/read-only mount is explicitly free of animation controls/listeners.
    assert page.evaluate('''() => {const e=trainingExercises[0],s={players:14,keepers:0,space:'full'};const f=bibleDiagram(e,s,{animation:false});return !f.querySelector('.bible-animation-host')&&!f.bibleAnimation;}''')
    page.emulate_media(reduced_motion='reduce')
    assert page.evaluate('''() => {const e=trainingExercises[0],s={players:14,keepers:0,space:'full'};const f=bibleDiagram(e,s);document.querySelector('main').append(f);return f.dataset.animationState==='idle'&&f.bibleAnimation.state.time===0;}''')
    assert not errors,errors
    print('PASS:',result,'continuous actor/ball animations; exact roles/equipment/static print, single 40-player view, playback/pause/seek/speed/steps/reset, sequence disposal, dialog/removal stop, keyboard/mobile and reduced motion.')
    browser.close()
