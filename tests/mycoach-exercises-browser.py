"""Immutable supplied MyCoach source/data/functions and classification-only integration."""
from pathlib import Path
import re,hashlib,json
from playwright.sync_api import sync_playwright
raw=Path('assets/exercises/mycoach-original.html').read_bytes();manifest=json.loads(Path('docs/mycoach-source.json').read_text())
assert hashlib.sha256(raw).hexdigest()==manifest['sha256']
s=raw.decode();script=re.search(r'<script\b[^>]*>([\s\S]*?)</script\s*>',s,re.I)[1];core=script[:script.index("if (typeof EXOS !== 'undefined') renderBundle")]
assert core.encode() in Path('supplied-mycoach-engine.js').read_bytes()
assert re.search(r'<style[^>]*>([\s\S]*?)</style>',s,re.I)[1].encode()==Path('supplied-mycoach-base.css').read_bytes()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.suppliedMyCoachExerciseEngine && typeof suppliedCatalogueExercises==="function"')
 assert page.evaluate('suppliedMyCoachExerciseEngine.exercises.length')==manifest['exercises']
 assert page.evaluate('suppliedMyCoachExerciseEngine.exercises.flatMap(suppliedMyCoachExerciseEngine.viewsOf).length')==manifest['pedagogicalViews']
 assert page.evaluate('suppliedExerciseEngine.exercises.length')==manifest['totalExercises']
 # Exact original functions and object content, not a rewritten transcription.
 page.evaluate("core=>{window.originalMyCoach=new Function(core+';return {exercises:EXOS,viewsOf,adapt,buildExerciseModel};')();}",core)
 assert page.evaluate('''()=>{
  const serial=x=>JSON.stringify(x,(k,v)=>typeof v==='function'?v.toString():v);
  window.mycoachBefore=serial(suppliedMyCoachExerciseEngine.exercises);
  const canonical=m=>{let text=serial(m);m.tokens.forEach((t,i)=>text=text.replaceAll(t.id,'token-'+i));return text;};
  return originalMyCoach.exercises.every(base=>originalMyCoach.viewsOf(base).every((e,i)=>{
   const actual=suppliedExerciseEngine.getExercise(base.id,i);if(serial(e)!==serial(actual))return false;
   return [8,16,22].every(players=>{
    const ctx={players,keepers:e.keepers||0,category:'U17',level:'dev',moment:'libre',space:[68,105]};
    return canonical(originalMyCoach.buildExerciseModel(originalMyCoach.adapt(e,ctx)))===canonical(suppliedExerciseEngine.buildExerciseModel(suppliedExerciseEngine.adapt(actual,ctx)));
   });
  }));
 }''')
 page.locator('#view-training').click();page.locator('#task-training-bible').click()
 family=page.get_by_label('Bibliothèque d’exercices',exact=True);family.select_option('mycoach')
 assert page.locator('#bible-results').inner_text()==str(manifest['exercises'])+' exercice(s) trouvé(s)'
 assert page.locator('.supplied-original-download').is_visible()
 page.locator('.bible-search-options').evaluate('e=>e.open=true')
 for axis in ['ball','loss','win','off','ludic']:
  page.locator('#bible-bmf-category').select_option(axis)
  expected=page.evaluate('axis=>suppliedCatalogueExercises({source:"mycoach",axis}).length',axis)
  assert expected>0 and page.locator('#bible-results').inner_text()==str(expected)+' exercice(s) trouvé(s)'
 # Every native tactical angle is found under the matching axis/subpart; sections remain complementary.
 assert page.evaluate('''()=>suppliedMyCoachExerciseEngine.exercises.every(base=>suppliedMyCoachExerciseEngine.viewsOf(base).every(e=>{
  const axis=suppliedMomentAxes[e.moment];
  if(!axis)return suppliedCatalogueExercises({source:'mycoach',section:e.moment==='physique'?'physical':'warm'}).some(x=>x.id===e.id);
  return suppliedCatalogueExercises({source:'mycoach',axis,objective:suppliedObjective(e)}).some(x=>x.id===e.id);
 }))''')
 page.locator('#bible-bmf-category').select_option('ball');page.locator('#training-filter').select_option('ball-build');page.locator('#training-search').fill('Seul ou ça vient')
 card=page.locator('[data-exercise="mc-seul-ca-vient"]');card.locator('.bible-card-picture').click();dialog=page.locator('#bible-sheet-dialog');assert dialog.is_visible()
 assert 'Seul ou ça vient' in dialog.inner_text();assert dialog.locator('.xs-board svg').count()>0
 dialog.locator('.view-play').click();dialog.locator('.view-play').click()
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 dialog.get_by_role('button',name='+ Ajouter à la séance',exact=True).click();dialog.wait_for(state='detached')
 assert page.evaluate("currentTraining.blocks.at(-1).custom.importedExerciseId")=='mc-seul-ca-vient'
 assert page.evaluate('trainingValid(currentTraining)')
 assert page.evaluate("suppliedMyCoachExerciseEngine.exercises.every(e=>trainingCustomValid({...currentTraining.blocks.at(-1).custom,importedExerciseId:e.id}))")
 assert page.evaluate("JSON.stringify(suppliedMyCoachExerciseEngine.exercises,(k,v)=>typeof v==='function'?v.toString():v)===mycoachBefore")
 page.reload();page.wait_for_function('window.suppliedMyCoachExerciseEngine && typeof suppliedCatalogueExercises==="function"');assert page.evaluate("currentTraining.blocks.at(-1).custom.importedExerciseId")=='mc-seul-ca-vient'
 page.locator('#view-training').click();page.locator('#task-training-bible').click()
 page.locator('#bible-reset').click();assert family.input_value()==''
 family.select_option('banide');assert page.locator('#bible-results').inner_text()=='7 exercice(s) trouvé(s)'
 assert not errors,errors
 b.close()
print('1000 untouched MyCoach exercises with native views, original source/CSS/functions/models, intentions, sections, family filter, native animation, valid session copy and mobile passed')
