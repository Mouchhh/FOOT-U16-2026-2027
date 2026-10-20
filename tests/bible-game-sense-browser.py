"""Direction, scoring targets and possession must agree with the demonstrated play."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local')
 result=page.evaluate('''()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)};let cases=0;
  const e=trainingExercises.find(e=>e.id==='duel-renforts');
  for(const players of [5,9,13])for(const level of ['discovery','developing','advanced'])for(let i=0;i<4;i++){
   const s={players,keepers:1,space:'full',age:16,category:'U17',level},g=biblePlan(e,s,{organisation:'single'}).groups[0],plan=bibleAnimationPlan(e,g,{sequenceIndex:i}),shot=plan.steps.find(s=>s.action==='shot');
   check(plan.available,'No worked situation');check(shot,'No demonstrated finish');
   check(!plan.steps.some(s=>s.title==='Préparer l’action'),'Unexplained ball reset inside a wave');
   const phases=plan.steps.map(s=>s.format);check(phases.indexOf('1 contre 1')<phases.indexOf('2 contre 1')&&phases.indexOf('2 contre 1')<phases.indexOf('2 contre 2'),'Reinforcements out of order');
   const final=bibleAnimationState(plan,plan.duration),flight=shot.motions.find(m=>m.kind==='ball');
   check(final.phase==='end','Wave never terminates');
   if(i<2){
    check(!plan.steps.some(s=>s.action==='recovery'),'Invented turnover in finish example');
    check(final.team==='blue','Wrong team credited');
    check(Math.abs(flight.to.x-(plan.field.fx+plan.field.fw))<.01&&flight.to.x>flight.from.x,'Blue shoots away from the big goal');
    check(Math.abs(flight.to.y-(plan.field.fy+plan.field.fh*.5))<=7.32*plan.field.scale/2,'Shot misses the big goal opening');
   }else{
    const recovery=plan.steps.find(s=>s.action==='recovery');check(recovery,'Missing turnover');
    const at=bibleAnimationState(plan,recovery.end+.01),collector=at.players.find(p=>p.number===recovery.to);
    check(collector.team==='red'&&at.team==='red','Possession fails to change after interception');
    check(Math.hypot(at.ball.x-collector.x,at.ball.y-collector.y)<plan.playerRadius+13,'Red does not control the ball');
    const intercepted=recovery.motions.find(m=>m.kind==='ball'),u={x:recovery.intendedTo.x-intercepted.from.x,y:recovery.intendedTo.y-intercepted.from.y},v={x:intercepted.to.x-intercepted.from.x,y:intercepted.to.y-intercepted.from.y};
    check(Math.abs(u.x*v.y-u.y*v.x)/(Math.hypot(u.x,u.y)||1)<.1,'Interception is not on the intended pass line');
    check(final.team==='red','Counterattack returns ball to blue');
    check(Math.abs(flight.to.y-plan.field.fy)<.01,'Red shoots at the big goal instead of a side mini-goal');
    check(Math.abs(flight.to.x-(plan.field.fx+plan.field.fw*.52))<.01,'Red misses lateral mini-goal opening');
   }
   cases++;
  }
  for(const id of ['rondo','warm','possession-neutral']){
   const ex=trainingExercises.find(e=>e.id===id),g=biblePlan(ex,{players:9,keepers:0,age:16,level:'developing',space:'full'},{organisation:'single'}).groups[0],svg=bibleDiagramSVG(ex,g);
   check(!svg.querySelector('[data-feature="play-direction"]'),'Invented direction in '+id);
  }
  const s={players:9,keepers:1,category:'U17',age:16,level:'developing',space:'full'},g=biblePlan(e,s,{organisation:'single'}).groups[0];
  const dialog=document.createElement('dialog');dialog.id='game-sense-demo';dialog.style.width='950px';window.gameSenseFigure=bibleDiagram(e,s,{plan:{groups:[g]},sequenceIndex:2});dialog.append(gameSenseFigure);document.body.append(dialog);dialog.showModal();
  return {cases};
 }''')
 f=page.locator('#game-sense-demo .bible-diagram')
 assert 'Attaquer le grand but' in f.locator('.bible-game-direction').inner_text()
 assert 'mini-but latéral' in f.locator('.bible-game-direction').inner_text()
 assert f.locator('.bible-game-state').get_attribute('data-team')=='blue'
 page.evaluate("gameSenseFigure.bibleAnimation.seek(gameSenseFigure.bibleAnimation.plan.steps.find(s=>s.action==='recovery').end+.05)")
 assert f.locator('.bible-game-state').get_attribute('data-team')=='red'
 assert 'changement de rôle' in f.locator('.bible-game-state').inner_text()
 screen=f.locator('.training-diagram-screen');screen.scroll_into_view_if_needed();screen.screenshot(path='/tmp/bible-game-sense.png')
 page.evaluate('gameSenseFigure.bibleAnimation.seek(gameSenseFigure.bibleAnimation.plan.duration)')
 assert 'Fin de vague' in f.locator('.bible-game-state').inner_text()
 f.locator('.bible-animation-reset').click()
 assert f.locator('.bible-game-state').get_attribute('data-team')=='blue'
 f.locator('.bible-diagram-orientation').click()
 assert '→' in f.locator('.bible-direction-blue').inner_text()
 page.evaluate("document.getElementById('game-sense-demo').close()")
 assert not errors,errors
 print('PASS:',result,'target direction, real interception, possession switch, red counterattack, wave ending, nondirectional exercises and live coaching cues.')
 b.close()
