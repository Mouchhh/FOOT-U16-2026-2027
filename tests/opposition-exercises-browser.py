from pathlib import Path
from hashlib import sha256
import re
from playwright.sync_api import sync_playwright

source=Path('imported-opposition-view.html').read_text().replace('<link rel="stylesheet" href="imported-exercises-theme.css?v=folders-148">\n','')
assert sha256(source.encode()).hexdigest()=='a6b5adaf1e8c25b274c90e09e34508e2509a940f716f6d1b5b23be27ffadff02'
script=re.search(r'<script>([\s\S]*?)</script>',source).group(1)
core=script[:script.index("if (typeof EXOS !== 'undefined') renderBundle")]
assert core in Path('supplied-opposition-engine.js').read_text()
assert re.search(r'<style>([\s\S]*?)</style>',source).group(1)==Path('supplied-opposition-base.css').read_text()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:3016/?mode=local')
    page.wait_for_function('window.suppliedOppositionExerciseEngine && typeof suppliedExerciseIds!=="undefined"')
    assert page.evaluate('suppliedOppositionExerciseEngine.exercises.length')==10
    assert page.evaluate('suppliedExerciseEngine.exercises.length')==28
    # All supplied data (including functions), and every adapted model, match the source engine.
    assert page.evaluate("""()=>suppliedOppositionExerciseEngine.exercises.every(e=>{
      const integrated=suppliedExerciseEngine.exercises.find(x=>x.id===e.id);
      const serial=x=>JSON.stringify(x,(k,v)=>typeof v==='function'?v.toString():v);
      if(serial(e)!==serial(integrated))return false;
      const canonical=model=>{let text=serial(model);model.tokens.forEach((t,i)=>text=text.replaceAll(t.id,'token-'+i));return text};
      return [8,16,22].every(players=>{
        const ctx={players,keepers:0,category:'U17',level:'dev',moment:'libre',space:[68,105]};
        return canonical(suppliedOppositionExerciseEngine.buildExerciseModel(suppliedOppositionExerciseEngine.adapt(e,ctx)))===canonical(suppliedExerciseEngine.buildExerciseModel(suppliedExerciseEngine.adapt(e,ctx)));
      });
    })""")
    page.locator('#view-training').click();page.locator('#task-training-bible').click()
    page.locator('#training-search').fill('Opposition')
    assert page.locator('#bible-results').inner_text()=='10 exercice(s) trouvé(s)'
    palette={'possede':'rgb(40, 85, 162)','perd':'rgb(180, 83, 9)','recupere':'rgb(36, 115, 66)','nepossede':'rgb(185, 38, 53)','ludique':'rgb(242, 201, 76)'}
    for e in page.evaluate('suppliedOppositionExerciseEngine.exercises.map(e=>({id:e.id,title:e.title,moment:e.moment}))'):
        page.evaluate('(id)=>openSuppliedSheet(suppliedExerciseEngine.exercises.find(e=>e.id===id))',e['id'])
        d=page.locator('#bible-sheet-dialog')
        assert d.locator('.f-title').inner_text()==e['title']
        assert d.locator('.xs-board svg').count()>0
        expected={'possede':'#2855a2','perd':'#b45309','recupere':'#247342','nepossede':'#b92635','ludique':'#f2c94c'}[e['moment']]
        d.locator('.f-card').wait_for()
        page.wait_for_function('(color)=>{let c=document.querySelector(".supplied-original-sheet").shadowRoot.querySelector(".f-card");return getComputedStyle(c).getPropertyValue("--band").trim()===color}',arg=expected)
        d.get_by_role('tab',name='Coaching',exact=True).click()
        assert d.locator('.f-posture').is_visible()
        d.get_by_role('button',name='Adapter',exact=True).click()
        d.locator('#sim-players').fill('18')
        d.locator('.view-play').click();d.locator('.view-play').click()
        d.get_by_role('button',name='Fermer',exact=True).click()
        # Add through the same integration as Banide; exercise source is never mutated.
        assert page.evaluate('(id)=>!!addSuppliedExercise(suppliedExerciseEngine.exercises.find(e=>e.id===id))',e['id'])
    assert page.evaluate('currentTraining.blocks.length')==10
    assert page.evaluate('currentTraining.blocks.every(b=>trainingCustomValid(b.custom)&&b.custom.board.frames.length>1)')
    page.reload();page.wait_for_function('typeof suppliedExerciseIds!=="undefined"')
    assert page.evaluate('currentTraining.blocks.length')==10
    page.locator('#view-training').click();page.locator('#task-training-bible').click()
    page.locator('#training-search').fill('Opposition · version de base')
    card=page.locator('.supplied-exercise-card');assert card.count()==1
    assert card.evaluate('e=>getComputedStyle(e).borderTopColor')==palette['ludique']
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844})
        card.locator('.bible-card-picture').click()
        d=page.locator('#bible-sheet-dialog');assert d.is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert d.locator('.f-card').evaluate('e=>e.scrollWidth<=e.clientWidth+2')
        page.screenshot(path=f'/tmp/opposition-sheet-{width}.png',full_page=True)
        d.get_by_role('button',name='Fermer',exact=True).click()
    assert not errors,errors
    b.close()
print('Exact Opposition source/functions/CSS, 10 variants and adapted models, sheets/animation, add/reload and mobile passed')
