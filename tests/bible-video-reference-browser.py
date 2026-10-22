"""Every exercise / variant: clean reader, unchanged installation, metric cues and orientation.
Optional --gallery writes contact sheets to /tmp/club-bible-reference-review.
"""
from pathlib import Path
import json,sys
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/club-bible-reference-review');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1200,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bibleAnimationMount==='function'")
 exercises=page.evaluate('trainingExercises.map(e=>({id:e.id,title:e.title}))');ledger=[]
 for i,entry in enumerate(exercises):
  for variant in range(3):
   record=page.evaluate('''({id,variant})=>{
    const old=document.querySelector('#video-reference-review');if(old){old.querySelector('figure')?.bibleAnimation?.dispose();old.querySelector('figure')?.bibleDispose?.();old.remove();}
    const exercise=trainingExercises.find(e=>e.id===id);let session,group;
    for(const players of [exercise.target,14,13,11,8,10,6,24]){if(group)break;for(const keepers of [2,1,0]){
     const candidate={players,keepers,category:'U17',age:17,level:'developing',space:'full'};
     const plan=biblePlan(exercise,candidate,{organisation:'auto'}),found=plan.groups.find(g=>g.fits&&bibleAnimationPlan(exercise,g,{designIndex:variant}).available);
     if(found){group=found;session=candidate;break;}
    }}
    if(!group)throw Error(id+' no compatible demonstration');
    const host=document.createElement('div');host.id='video-reference-review';host.style='position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;padding:12px;width:1000px';
    const figure=bibleDiagram(exercise,session,{organisation:'auto',groupIndex:group.index-1,designIndex:variant});host.append(figure);document.body.append(host);
    if(id==='wall-pass'){
     const model=createReferenceCombination({players:group.players,width:group.width,length:group.length,designIndex:variant});
     const ids=referenceCombinationState(model,0).players.map(p=>p.id).join(',');
     for(const t of [0,model.duration*.5,model.duration])if(referenceCombinationState(model,t).players.map(p=>p.id).join(',')!==ids)throw Error('Reference identities changed');
     const display=figure.querySelector('.training-diagram-screen');figure.bibleDispose();display.replaceChildren(createReferenceCombinationSVG(model,{time:model.duration*.5}));
     return {id,variant,title:exercise.title,variantTitle:bibleExerciseDesign(exercise,variant).title,players:group.players,dimensions:[group.length,group.width],renderer:'reference-combination',seconds:model.duration};
    }
    const svg=figure.querySelector('.training-diagram-screen svg'),controller=figure.bibleAnimation,plan=controller.plan;
    const print=figure.querySelector('.training-diagram-print').innerHTML;
    const action=plan.steps.filter(s=>s.motions.length)[Math.floor(plan.steps.filter(s=>s.motions.length).length/2)];
    if(!action)throw Error(id+' no action');controller.seek(action.start+action.duration*.55);
    if(print!==figure.querySelector('.training-diagram-print').innerHTML)throw Error(id+' animation alters print');
    if(svg.querySelectorAll('.bible-installation-legend[display=none]').length!==1)throw Error(id+' legend visible in reader');
    if(figure.querySelector('.training-diagram-print [data-reader]'))throw Error(id+' print loses annotations');
    const metrics=figure.querySelector('.bible-scene-metrics').textContent;
    if(!metrics.includes(' m · '+group.players+' joueurs'))throw Error(id+' missing dimensions/count');
    for(const orientation of [false,true,false]){
     bibleDiagramOrient(svg,orientation);
     for(const player of svg.querySelectorAll('.bible-player-model')){const m=player.getScreenCTM();if(Math.abs(Math.atan2(m.b,m.a))>.001)throw Error(id+' rotated number');}
     for(const label of svg.querySelectorAll('[data-reader-zone]')){const m=label.getScreenCTM();if(Math.abs(Math.atan2(m.b,m.a))>.001)throw Error(id+' rotated zone');}
    }
    const moves=action.motions.filter(m=>m.kind==='player').length;
    return {id,variant,title:exercise.title,variantTitle:bibleExerciseDesign(exercise,variant).title,players:group.players,dimensions:[group.length,group.width],steps:plan.steps.length,seconds:plan.duration,action:action.title,moves};
   }''',{'id':entry['id'],'variant':variant})
   ledger.append(record)
   if '--gallery' in sys.argv:page.locator('#video-reference-review .training-diagram-screen').screenshot(path=str(OUT/f'{i}-{variant}.png'))
 page.evaluate("document.querySelector('#video-reference-review figure').bibleAnimation.dispose()")
 assert not errors,errors
 browser.close()
(OUT/'ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2))
if '--gallery' in sys.argv:
 from PIL import Image,ImageDraw
 for start in range(0,len(exercises),9):
  sheet=Image.new('RGB',(1440,9*200),'#e8edf4');draw=ImageDraw.Draw(sheet)
  for index in range(start,min(start+9,len(exercises))):
   for v in range(3):
    image=Image.open(OUT/f'{index}-{v}.png');image.thumbnail((470,174));x=v*480;y=(index-start)*200
    sheet.paste(image,(x+(470-image.width)//2,y+25));draw.text((x+6,y+5),f'{exercises[index]["id"]} · V{v+1}',fill='black')
  sheet.save(OUT/f'gallery-{start//9}.jpg')
print(f'PASS {len(exercises)} exercises / {len(ledger)} demonstrations: continuous scene, dimensions, upright numbers and zones, independent print. Gallery: {"--gallery" in sys.argv}')
