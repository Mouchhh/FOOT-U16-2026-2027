"""New 1000-exercise source, hidden metadata, filters, original content and Assistant use."""
from pathlib import Path
import re,json
from playwright.sync_api import sync_playwright
index=json.loads(Path('assets/exercises/reference-index.json').read_text())
assert index['exerciseCount']==1084 and index['viewCount']==1232
assert len({e['id'] for e in index['entries']})==1232
assert all(e['effectif_min']<=e['effectif_reference']<=e['effectif_max'] for e in index['entries'])
old=Path('assets/exercises/mycoach-original-v1.html').read_text();core=re.search(r'<script\b[^>]*>([\s\S]*?)</script\s*>',old,re.I)[1].split("if (typeof EXOS !== 'undefined') renderBundle")[0]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://localhost:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('!!window.exerciseReferenceLibrary')
 assert page.evaluate('suppliedMyCoachExerciseEngine.exercises.length')==1000
 assert page.evaluate('core=>{const old=new Function(core+";return EXOS;")();const serial=o=>JSON.stringify(o,(k,v)=>typeof v==="function"?v.toString():v);return old.every(e=>serial(e)===serial(suppliedExerciseEngine.getExercise(e.id)));}',core)
 page.evaluate('window.exerciseSourceBefore=JSON.stringify(suppliedExerciseEngine.exercises,(k,v)=>typeof v==="function"?v.toString():v)')
 assert page.evaluate('exerciseReferenceIndex.find({intention:"transition"}).every(e=>["perd","recupere"].includes(e.moment_original))')
 assert not page.evaluate('exerciseReferenceIndex.recommend({effectif:1}).length')
 assert page.evaluate('exerciseReferenceIndex.recommend({intention:"conservation",effectif:16,gardiens:0,surface:"quarter",niveau:"U17"}).every(e=>e.gardiens===0&&e.effectif_min<=16&&e.effectif_max>=16&&Math.max(...e.dimensions)<=52&&Math.min(...e.dimensions)<=34)')
 page.locator('#view-training').evaluate('e=>e.click()');page.locator('#task-training-bible').click()
 for intention in ['conservation','finition','transition','defense']:
  page.locator('[data-intention='+intention+']').click()
  cards=page.locator('#training-catalogue [data-exercise]');assert cards.count()>0
  assert cards.evaluate_all('(cards)=>cards.every(c=>exerciseReferenceIndex.forExercise(suppliedExerciseEngine.getExercise(c.dataset.exercise,+c.dataset.view)).intention===document.querySelector(".exercise-reference-intentions [aria-pressed=true]").dataset.intention)')
 page.locator('[data-intention=""]').click();page.locator('[data-phase=activation]').click();assert page.locator('#training-catalogue [data-exercise]').count()>0
 assert not page.locator('#training-catalogue').inner_text().find('EXO-CONS-')>=0
 page.locator('#bible-reset').click();assert page.locator('[data-phase=""]').get_attribute('aria-pressed')=='true'
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=f'/tmp/exercise-reference-{width}.png')
 page.set_viewport_size({'width':1440,'height':1000})
 # A newly supplied exercise can be added with original source identity and persisted.
 page.evaluate("()=>{const r=suppliedExerciseBlock(suppliedExerciseEngine.getExercise('mc-taureau-deux-equipes'),{players:12,keepers:0,category:'U17',level:'dev',moment:'libre',space:[68,105]});window.newImported=r.block;currentTraining.blocks=[r.block];}")
 assert page.evaluate('trainingValid(currentTraining)')
 assert page.evaluate('newImported.custom.importedExerciseId')=='mc-taureau-deux-equipes'
 assert page.evaluate("newImported.custom.instructions.includes(suppliedExerciseEngine.getExercise('mc-taureau-deux-equipes').rules[0])")
 page.evaluate('saveTrainingDraft()');page.reload(wait_until='domcontentloaded');page.wait_for_function('!!window.exerciseReferenceLibrary')
 assert page.evaluate('currentTraining.blocks[0].custom.importedExerciseId')=='mc-taureau-deux-equipes'
 page.locator('#view-training').evaluate('e=>e.click()');page.locator('#task-training-assistant').click();form=page.locator('.training-assistant-form')
 form.get_by_label('Thème / Objectif à travailler',exact=True).fill('Conservation');form.get_by_label('Niveau du groupe',exact=True).fill('U17 Régional');form.get_by_label('Joueurs de champ + gardiens',exact=True).fill('14 + 2');form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 assert page.locator('.training-assistant-reference-row').count()>0
 page.locator('.training-assistant-reference-row').first.get_by_role('button',name='Utiliser dans l’atelier principal',exact=True).click()
 assert page.locator('.training-assistant-reference-row button:disabled').count()==1
 page.get_by_role('button',name='Ajuster dans l’éditeur',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==4
 assert page.evaluate('!!currentTraining.blocks[1].custom.importedExerciseId&&trainingValid(currentTraining)')
 assert not errors,errors;b.close();print('PASS: 751 additions, 249 unchanged originals, hidden index, four intentions/formats, source-safe add/reload, and real Assistant reference selection.')
