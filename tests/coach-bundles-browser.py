from pathlib import Path
from hashlib import sha256
import json,re
from playwright.sync_api import sync_playwright
manifest=json.loads(Path('docs/coach-bundles-manifest.json').read_text())
for bundle in manifest:
    source=Path('imported-'+bundle['key']+'-view.html').read_text().replace('<link rel="stylesheet" href="imported-exercises-theme.css?v=coach-bundles-166">\n','')
    assert sha256(source.encode()).hexdigest()==bundle['sha256']
    script=re.search(r'<script>([\s\S]*?)</script>',source).group(1)
    core=script[:script.index("if (typeof EXOS !== 'undefined') renderBundle")]
    assert core in Path('supplied-'+bundle['key']+'-engine.js').read_text()
    assert re.search(r'<style>([\s\S]*?)</style>',source).group(1)==Path('supplied-'+bundle['key']+'-base.css').read_text()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('typeof suppliedCatalogueExercises!=="undefined"')
    assert page.evaluate('suppliedExerciseEngine.exercises.length')==84
    assert page.evaluate('suppliedExerciseEngine.exercises.reduce((n,e)=>n+suppliedExerciseEngine.viewsOf(e).length,0)')==125
    for bundle in manifest:
        assert page.evaluate("""name=>window[name].exercises.every(base=>window[name].viewsOf(base).every((e,index)=>{
            const actual=suppliedExerciseEngine.getExercise(base.id,index);
            const serial=x=>JSON.stringify(x,(k,v)=>typeof v==='function'?v.toString():v);
            if(serial(e)!==serial(actual))return false;
            const canonical=model=>{let text=serial(model);model.tokens.forEach((t,i)=>text=text.replaceAll(t.id,'token-'+i));return text};
            return [e.players[1],e.players[1]+4].every(players=>{
                const ctx={players,keepers:e.keepers||0,category:'U17',level:'dev',moment:'libre',space:[68,105]};
                return canonical(window[name].buildExerciseModel(window[name].adapt(e,ctx)))===canonical(suppliedExerciseEngine.buildExerciseModel(suppliedExerciseEngine.adapt(actual,ctx)));
            });
        }))""",bundle['global'])
    assert page.evaluate("suppliedCircuitExerciseEngine.exercises.every(e=>suppliedCatalogueExercises({section:'warm'}).some(x=>x.id===e.id))")
    assert page.evaluate("suppliedGamesExerciseEngine.exercises.every(e=>suppliedCatalogueExercises({section:'ludic'}).some(x=>x.id===e.id))")
    assert page.evaluate("suppliedExerciseEngine.exercises.every(e=>suppliedExerciseEngine.viewsOf(e).every(a=>a.moment!=='physique'||suppliedCatalogueExercises({section:'physical'}).some(x=>x.id===a.id)))")
    assert page.evaluate("suppliedCatalogueExercises({section:'finish'}).some(e=>e.id==='phy-sprint-frappe')")
    page.locator('#view-training').click();page.locator('#task-training-bible').click()
    for section in ['warm','physical','ludic','finish','tactical']:
        page.locator(f'.supplied-section-filters [data-section="{section}"]').click()
        expected=page.evaluate('(section)=>suppliedCatalogueExercises({section}).length',section)
        assert page.locator('#bible-results').inner_text()==str(expected)+' exercice(s) trouvé(s)'
        assert page.evaluate('(section)=>{let ids=suppliedCatalogueExercises({section}).map(e=>e.id);return new Set(ids).size===ids.length}',section)
    # Every source angle is saveable with its own reference roster; no document is committed here.
    assert page.evaluate("""()=>{const commit=trainingCommitBlocks,before=structuredClone(currentTraining);trainingCommitBlocks=fn=>{const blocks=[];fn(blocks);return blocks.every(b=>trainingCustomValid(b.custom))};try{return suppliedExerciseEngine.exercises.every(base=>suppliedExerciseEngine.viewsOf(base).every(e=>{currentTraining.players=e.players[1];currentTraining.keepers=e.keepers||0;syncTrainingForm();return !!addSuppliedExercise(e)}))}finally{currentTraining=before;syncTrainingForm();saveTrainingDraft();trainingCommitBlocks=commit}}""")
    # Every new bundle opens an original animated sheet and can be copied into a session.
    for bundle in manifest:
        exercise_id=bundle['ids'][0]
        page.evaluate('(id)=>openSuppliedSheet(suppliedExerciseEngine.getExercise(id))',exercise_id)
        d=page.locator('#bible-sheet-dialog');assert d.is_visible() and d.locator('.xs-board svg').count()>0
        d.get_by_role('tab',name='Coaching',exact=True).click();assert d.locator('.f-posture').is_visible()
        d.get_by_role('button',name='Adapter',exact=True).click();d.locator('#sim-players').fill('18')
        d.locator('.view-play').click();d.locator('.view-play').click()
        d.get_by_role('button',name='+ Ajouter à la séance',exact=True).click()
    # Choose the coach's second angle; its objective/coaching and view index survive save/reload/reuse.
    page.evaluate("openSuppliedSheet(suppliedExerciseEngine.getExercise('jeu-portes'))")
    page.get_by_label('Intention de cette fiche').select_option('1')
    page.wait_for_function("document.querySelector('.supplied-angle-picker select').value==='1'")
    page.locator('#bible-sheet-dialog').get_by_role('button',name='+ Ajouter à la séance',exact=True).click()
    assert page.evaluate('currentTraining.blocks.length')==6
    assert page.evaluate("currentTraining.blocks.at(-1).custom.importedExerciseView") == 1
    assert page.evaluate("currentTraining.blocks.at(-1).custom.instructions.includes(suppliedExerciseEngine.getExercise('jeu-portes',1).posture)")
    page.reload();page.wait_for_function('typeof suppliedCatalogueExercises!=="undefined"')
    assert page.evaluate('currentTraining.blocks.length')==6
    page.evaluate("trainingReuseExercise(currentTraining.blocks.at(-1),currentTraining,'Mon exercice')")
    assert page.get_by_label('Intention de cette fiche').input_value()=='1'
    page.locator('#bible-sheet-dialog').get_by_role('button',name='Fermer',exact=True).click()
    page.locator('#view-training').click();page.locator('#task-training-bible').click()
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844})
        page.locator('.supplied-section-filters [data-section=finish]').click()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.locator('#training-search').fill('Course au point')
        page.locator('.supplied-exercise-card .bible-card-picture').first.click()
        page.wait_for_function("!!document.querySelector('#bible-sheet-dialog .external-modal-close')")
        assert page.locator('#bible-sheet-dialog .external-modal-close').evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        page.screenshot(path=f'/tmp/coach-bundles-{width}.png')
        page.locator('#bible-sheet-dialog').get_by_role('button',name='Fermer',exact=True).click()
    assert not errors,errors
    b.close()
print('Five exact sources, 84 exercises/125 angles, compartments, original models/animations, saved variants, reuse and mobile red external closes passed')
