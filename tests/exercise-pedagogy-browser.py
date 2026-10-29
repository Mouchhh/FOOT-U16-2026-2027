"""Shipped catalogue: live brief, exact diagram roster, load control, print and mobile."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
fixtures=json.loads(Path('/tmp/exercise-review-ledger.json').read_text())['ledger']
out=Path('/tmp/exercise-review');(out/'diagrams').mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof exercisePedagogy==='object'")
 page.locator('#view-training').click();page.locator('#training-step-link-0').click()
 page.locator('#training-coaching-load').select_option('light');assert page.evaluate('currentTraining.coachingLoad')=='light'
 page.reload();page.wait_for_function("typeof exercisePedagogy==='object'");assert page.evaluate('currentTraining.coachingLoad')=='light'
 # Run real library sheets without the surrounding drawer to examine every diagram.
 page.evaluate("document.body.className=''")
 page.add_style_tag(content='body{margin:0!important;padding:0!important;background:#edf2f7!important}body>*:not(#exercise-review-surface):not(script):not(style){display:none!important}#exercise-review-surface{display:block!important;max-width:1000px;margin:0 auto;padding:20px;box-sizing:border-box}#exercise-review-surface>svg{display:block!important;width:100%!important;height:auto!important}#exercise-review-surface h2{font:700 22px Arial;color:#23415f}#exercise-review-surface .bible-detail{display:block!important}#exercise-review-surface .bible-diagram-svg{max-height:none!important}#exercise-review-surface .training-diagram-print{display:none!important}')
 page.evaluate("()=>{const host=document.createElement('main');host.id='exercise-review-surface';document.body.append(host)}")
 counts={'players':0,'equipment':0,'steps':0}
 for n,row in enumerate(fixtures):
  result=page.evaluate('''r=>{
   const host=document.querySelector('#exercise-review-surface');host.querySelectorAll('.bible-diagram').forEach(f=>f.bibleDispose?.());host.replaceChildren();
   const e=trainingExercises.find(e=>e.id===r.id),s={...currentTraining,...r.reference.session,id:'review-'+e.id,coachingLoad:'normal'},plan=biblePlan(e,s,{organisation:'single'}),g=plan.groups[0];
   host.append(el('h2','',e.title));const svg=e.id==='wall-pass'?createReferenceCombinationSVG(createReferenceCombination({players:g.players,width:g.width,length:g.length,designIndex:0}),{keepers:(g.keeperSlots||[]).map(s=>s.index+1)}):bibleDiagramSVG(e,g,{designIndex:0,sequenceIndex:1});host.append(svg);
   const actualPlayers=svg.querySelectorAll('.bible-player').length;
   if(actualPlayers!==g.players)throw Error(e.id+' incorrect drawn roster');
   const types={ball:'balls',disc:'discs',cone:'cones',goal:'goals',miniGoal:'miniGoals',pole:'poles',dummy:'dummies',hurdle:'hurdles',ladder:'ladders',hoop:'hoops'};
   for(const [type,key]of Object.entries(types)){const actual=svg.querySelectorAll('[data-equipment="'+type+'"]'+(type==='ball'?', [data-ball="active"]':'')).length;if(actual!==(g.material[key]||0))throw Error(e.id+' incorrect '+type+': '+actual+'/'+g.material[key]);}
   let steps=0;
   for(let designIndex=0;designIndex<3;designIndex++){
    const figure=bibleDiagram(e,s,{plan,designIndex,sequenceIndex:1});host.append(figure);const animation=figure.bibleAnimation;
    if(e.id==='wall-pass'){
     const model=createReferenceCombination({players:g.players,width:g.width,length:g.length,designIndex});
     const staticSvg=createReferenceCombinationSVG(model),state=referenceCombinationState(model,model.duration*.4);
     if(staticSvg.querySelectorAll('.bible-player').length!==g.players||state.players.length!==g.players||!figure.querySelector('iframe'))throw Error('reference combination roster/player');
     steps+=model.passes.length;figure.bibleDispose();figure.remove();continue;
    }
    if(!animation?.plan.available)throw Error(e.id+' unavailable animation '+designIndex);
    let visible=false;for(const step of animation.plan.steps.filter(s=>s.motions.length)){animation.seek(step.start+step.duration*.5);if(figure.querySelector('.bible-live-actions path')){visible=true;break;}}if(!visible)throw Error(e.id+' no readable action');
    steps+=animation.plan.steps.length;figure.bibleDispose();figure.remove();
   }
   const context=bibleSequenceContext(e,s,{organisation:'single'},0),sequence=bibleTimeline(e,12,s).sequences[0];host.append(bibleExerciseEssentials(e,context,sequence));
   if(!host.textContent.includes(exercisePedagogy[e.id].task)||!host.textContent.includes(exercisePedagogy[e.id].observe))throw Error(e.id+' missing visible brief');
   return {players:actualPlayers,equipment:svg.querySelectorAll('[data-equipment]').length,steps};
  }''',row)
  for k in counts:counts[k]+=result[k]
  page.locator('#exercise-review-surface > svg').screenshot(path=str(out/'diagrams'/f'{n:02}-{row["id"]}.png'))
  if row['id'] in ['cutback','press-cover-three','video-bounce-2v2','video-coordination-shot','rondo-expand']:
   page.locator('#exercise-review-surface').screenshot(path=str(out/f'fiche-{row["id"]}.png'))
 # A fixed-format drill may use part of the group, without losing the others.
 page.evaluate('''()=>{
  const e=trainingExercises.find(e=>e.id==='rondo-expand'),s={...currentTraining,players:14,keepers:0,space:'full'},c=bibleSequenceContext(e,s,{sequenceSettings:[{players:13,keepers:0,organisation:'single'}]},0);
  if(!c.fits||c.offPlayers!==1||c.plan.totalPlayers!==13)throw Error('fixed-format active and outside players');
  const brief=bibleExerciseEssentials(e,c,bibleTimeline(e,12,s).sequences[0]);if(!brief.textContent.includes('1 hors exercice')||!brief.textContent.includes('dans un ordre fixe'))throw Error('outside rotation missing');
  const r=trainingExercises.find(e=>e.id==='rondo'),auto=bibleInitialVariant(r,s);if(auto.groups!==2)throw Error('new drill not adapted to fourteen');
  const custom={...auto,organisation:'single',groups:1,width:17,autoProfile:false};if(bibleInitialVariant(r,s,custom).width!==17||bibleInitialVariant(r,s,custom).organisation!=='single')throw Error('coach choice overwritten');
 }''')
 # The actual sequence UI must recompute its brief when the coach changes workshops.
 page.evaluate('''()=>{const host=document.querySelector('#exercise-review-surface');host.replaceChildren();const e=trainingExercises.find(e=>e.id==='rondo');host.append(bibleExerciseDetail(e,{...currentTraining,id:'review-live',players:14,keepers:0,space:'full',category:'U16',level:'developing'},{variant:bibleInitialVariant(e,{...currentTraining,players:14,keepers:0,space:'full'},null,true)}));}''')
 assert page.locator('.exercise-essentials').count()==1
 page.get_by_label('Atelier illustré · Conserver sous pression',exact=True).select_option('1')
 assert '7 affectés' in page.locator('.exercise-essentials').inner_text()
 for w in [320,390,768,1366]:
  page.set_viewport_size({'width':w,'height':900})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),w
 page.set_viewport_size({'width':1366,'height':1000});page.emulate_media(media='print');page.pdf(path=str(out/'fiche-exercice-rondo.pdf'),print_background=True)
 assert not errors,errors
 b.close()
print('PASS 65 live briefs, 195 demonstrations, exact drawn rosters/material, load persistence, workshop updates, mobile and print:',counts)
