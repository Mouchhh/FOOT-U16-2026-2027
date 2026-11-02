from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    accept=False
    page.on('dialog',lambda d:d.accept() if accept else d.dismiss())
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.externalModalClose')
    page.locator('#view-training').click();page.locator('#task-training-bible').click();page.locator('#training-custom-add').click()
    page.locator('#custom-training-title').fill('Atelier personnel');page.locator('#custom-training-form button[type=submit]').click()
    assert page.evaluate('trainingStoredPersonalExercises().length')==1
    page.evaluate("coachStorageSet('vestiaire-personal-exercises',JSON.stringify(trainingStoredPersonalExercises()))") # Legacy array format.
    # Include an independently identified copy in a saved session; both reference cards deduplicate.
    page.evaluate("()=>{const s=structuredClone(currentTraining);s.id=crypto.randomUUID();s.blocks[0].id=crypto.randomUUID();trainingLibrary=[s];coachStorageSet('vestiaire-training-library',JSON.stringify(trainingLibrary))}")
    saved=page.evaluate('JSON.stringify(trainingLibrary)')
    page.locator('#training-personal-exercises').click()
    draft=page.evaluate('JSON.stringify(currentTraining)')
    d=page.locator('#training-personal-library');remove=d.locator('.personal-exercise-delete')
    assert remove.count()==1
    remove.click();assert remove.count()==1 # Confirmation dismissed.
    accept=True;remove.click();assert remove.count()==0
    assert page.evaluate('trainingPersonalExercises().length')==0
    assert page.evaluate('trainingStoredPersonalExercises().length')==0
    assert page.evaluate('JSON.stringify(currentTraining)')==draft
    assert page.evaluate('JSON.stringify(trainingLibrary)')==saved
    d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
    page.reload();page.wait_for_function('window.externalModalClose')
    assert page.evaluate('trainingPersonalExercises().length')==0
    # A deliberate new creation/copy can use identical content without reviving deleted IDs.
    page.evaluate("()=>{const block=structuredClone(currentTraining.blocks[0]);block.id=crypto.randomUUID();trainingKeepPersonalExercise(block)}")
    assert page.evaluate('trainingPersonalExercises().length')==1
    raw=page.evaluate("coachStorageGet('vestiaire-personal-exercises')")
    page.evaluate("()=>{window.deleteRealSet=coachStorageSet;coachStorageSet=(key,value)=>{if(key==='vestiaire-personal-exercises')throw Error('quota');return deleteRealSet(key,value)}}")
    page.locator('#view-training').click();page.locator('#task-training-bible').click();page.locator('#training-personal-exercises').click()
    d=page.locator('#training-personal-library')
    page.set_viewport_size({'width':320,'height':844})
    assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
    d.locator('.personal-exercise-delete').click()
    assert d.locator('.personal-exercise-delete').count()==1
    assert page.evaluate("coachStorageGet('vestiaire-personal-exercises')")==raw
    page.evaluate('coachStorageSet=deleteRealSet')
    assert page.evaluate("trainingDeletePersonalExercise(trainingPersonalExercises()[0],'different-coach')") is False
    d.locator('.personal-exercise-delete').click();assert d.locator('.personal-exercise-delete').count()==0
    assert not errors,errors
    b.close()
print('Personal exercise confirmation/deletion, deduplication, persisted deletion, untouched sessions, new copies, quota rollback and owner guards passed')
