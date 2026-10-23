"""Coach video reconstructions in the actual library, reader, saved session and free studio."""
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/coach-video-delivery');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof coachVideoDemonstration==='function'")
 for id,players,keepers,query in [('video-bounce-2v2',6,0,'appuis de fond'),('video-coordination-shot',9,1,'coordination relais')]:
  page.evaluate("([players,keepers])=>{Object.assign(currentTraining,{players,keepers,space:'full',age:17,category:'U17',level:'developing'});syncTrainingForm();document.querySelector('#view-training').click();trainingWizard.openCatalogue();}",[players,keepers])
  page.locator('#training-search').fill(query);card=page.locator('#training-catalogue [data-exercise='+id+']');assert card.count()==1
  card.locator('.bible-card-picture').click();dialog=page.locator('#bible-sheet-dialog');assert dialog.is_visible()
  for variant in [0,1,2]:
   dialog.get_by_label('Variante de l’exercice',exact=True).select_option(str(variant))
   record=dialog.evaluate("""(d)=>{const f=d.querySelector('.bible-diagram'),c=f.bibleAnimation,plan=c.plan,svg=f.querySelector('.training-diagram-screen svg'),print=f.querySelector('.training-diagram-print').innerHTML;
    const shot=plan.steps.find(s=>s.action==='shot');c.seek(shot.start+shot.duration*.5);
    const material=[...svg.querySelectorAll('[data-equipment]')].reduce((out,e)=>(out[e.dataset.equipment]=(out[e.dataset.equipment]||0)+1,out),{});
    const phase=f.querySelector('.bible-game-state').textContent;c.seek(plan.duration);const end=f.querySelector('.bible-game-state').textContent;
    if(print!==f.querySelector('.training-diagram-print').innerHTML)throw Error('Print changed');
    c.seek(0);return {material,phase,end,metrics:f.querySelector('.bible-scene-metrics').textContent,match:f.querySelector('.bible-matchup')?.textContent||'',stages:plan.steps.map(s=>({title:s.title,start:s.start,duration:s.duration,action:s.action}))};}""")
   assert 'Finition' in record['phase'] and 'tir des' in record['phase'],record
   assert 'Fin de vague' in record['end'] and 'ballon aux' not in record['end'],record
   assert f'{players} joueurs' in record['metrics']
   if id=='video-bounce-2v2':
    assert record['material'].get('miniGoal')==4 and '2 bleus + 1 appui' in record['match'],record
   else:
    assert all(record['material'].get(k)==v for k,v in [('goal',1),('hurdle',6),('ladder',2),('cone',3)]),record
    assert 'VS' not in record['match'],record
   for stage_name in ['Installation','haie 2','Servir le départ','Viser','Frapper','Retour séparé']:
    stage=next((s for s in record['stages'] if stage_name in s['title']),None)
    if not stage:continue
    dialog.evaluate("(d,t)=>d.querySelector('.bible-diagram').bibleAnimation.seek(t)",stage['start']+stage['duration']*.5)
    dialog.locator('.training-diagram-screen').screenshot(path=str(OUT/f'{id}-v{variant+1}-{stage_name.split()[0]}.png'))
  before=page.evaluate('currentTraining.blocks.length');dialog.get_by_role('button',name='+ Ajouter à la séance',exact=True).click()
  assert page.evaluate('currentTraining.blocks.length')==before+1
  assert page.evaluate('currentTraining.blocks.at(-1).bibleVariant.designChoices[0]')==2
  page.set_viewport_size({'width':390,'height':844});assert dialog.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
  dialog.get_by_role('button',name='Fermer',exact=True).click();page.set_viewport_size({'width':1366,'height':900})
 # Actual named session persistence includes both exercises and chosen designs.
 page.evaluate("()=>{document.querySelector('#training-catalogue-close').click();currentTraining.title='Vidéos du coach';syncTrainingForm();document.querySelector('#training-save').click();}")
 page.reload();page.wait_for_function("typeof coachVideoDemonstration==='function'")
 assert page.evaluate("currentTraining.blocks.filter(b=>b.exerciseId.startsWith('video-')).length===2")
 assert page.evaluate("currentTraining.blocks.filter(b=>b.exerciseId.startsWith('video-')).every(b=>b.bibleVariant.designChoices[0]===2)")
 assert page.evaluate("['video-bounce-2v2','video-coordination-shot'].every(id=>bibleKnowledge[id].sourceIds.every(source=>bibleSources[source].checkedAt==='2026-10-23'))")
 assert not errors,errors
 b.close();print('PASS coach videos: library search, 3 real designs, 2v2+bounce labels, exact material, shot/end phases, saved session, source metadata, screenshots and mobile.')
