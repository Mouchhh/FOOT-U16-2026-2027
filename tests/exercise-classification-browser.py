from playwright.sync_api import sync_playwright
LABELS=['Mon équipe possède le ballon','Mon équipe perd le ballon','Mon équipe récupère le ballon','Mon équipe ne possède pas le ballon','Ludique']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bmfExerciseCategory==='function' && window.trainingWizard")
 result=page.evaluate('''()=>{
  const ids=Object.values(bmfExerciseGroups).flat();if(ids.length!==65||new Set(ids).size!==65||trainingExercises.some(e=>!ids.includes(e.id)))throw Error('Catalogue coverage');
  for(const [id,key]of [['rondo','ball'],['cutback','ball'],['counter','win'],['recovery-firstpass','win'],['transition','loss'],['rest-defence','loss'],['press','off'],['keeper-duel','off'],['warm','ludic']])if(bmfExerciseCategory(trainingExercises.find(e=>e.id===id))!==key)throw Error(id);
  for(const old of ['progress','finish','oppose','protect','complementary'])if(!trainingValid({...currentTraining,bmfCategory:old}))throw Error('Legacy session rejected');
  return Object.fromEntries(Object.entries(bmfExerciseGroups).map(([key,ids])=>[key,ids.length]));}''')
 assert page.locator('#training-bmf-category optgroup').count()==0
 assert page.locator('#training-bmf-category option').all_text_contents()[1:]==LABELS
 page.locator('#view-training').click();page.locator('#training-create-session').click();page.locator('#training-step-link-1').click()
 page.locator('#training-bmf-category').select_option('off');assert page.evaluate('currentTraining.bmfCategory')=='off';page.locator('#training-save').click()
 page.locator('#task-training-bible').click();assert page.locator('#bible-bmf-category').input_value()=='off'
 assert page.locator('#bible-bmf-category optgroup').count()==0
 assert page.locator('#bible-bmf-category option').all_text_contents()[1:]==LABELS
 for key in ['ball','loss','win','off','ludic']:
  page.locator('#bible-bmf-category').select_option(key)
  expected=result[key];assert str(expected)+' exercice' in page.locator('#bible-results').inner_text()
  assert page.locator('.bible-card').count()>0
  assert page.locator('.bible-card').evaluate_all('(cards)=>cards.every(c=>bmfExerciseCategory(trainingExercises.find(e=>e.id===c.dataset.exercise))===document.querySelector("#bible-bmf-category").value)')
 page.locator('#bible-bmf-category').select_option('ball');page.locator('#training-filter').select_option('Finition');assert page.locator('.bible-card').evaluate_all('(cards)=>cards.every(c=>trainingExercises.find(e=>e.id===c.dataset.exercise).theme==="Finition")')
 page.locator('#bible-reset').click();assert '65 exercices' in page.locator('#bible-results').inner_text()
 page.locator('.bible-search-options>summary').click();assert page.locator('#bible-phase-shortcuts button').all_text_contents()[1:]==LABELS
 page.locator('#bible-phase-shortcuts [data-category=loss]').click();assert page.locator('#bible-bmf-category').input_value()=='loss';assert '4 exercices' in page.locator('#bible-results').inner_text()
 for width in [320,390,1366]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  if width==390:page.screenshot(path='/tmp/exercise-game-axes-mobile.png',full_page=True)
 page.reload();page.wait_for_function("typeof bmfExerciseCategory==='function'");assert page.evaluate('currentTraining.bmfCategory')=='off'
 assert page.evaluate("trainingDocument().textContent.includes('Mon équipe ne possède pas le ballon')")
 # A historical Bible filter using an old key restores the corresponding new axis.
 page.locator('#view-training').click();page.locator('#task-training-bible').click();page.wait_for_function("history.state?.clubNavigation?.page?.panel==='bible'")
 page.evaluate("()=>{const h=structuredClone(history.state);h.clubNavigation.page.filters['bible-bmf-category']='finish';history.replaceState(h,'')}")
 page.locator('#view-reports').click();page.wait_for_function("history.state?.clubNavigation?.page?.view==='report'");page.go_back();page.wait_for_function("document.body.classList.contains('training-mode')&&document.querySelector('#bible-bmf-category').value==='ball'")
 # Loading an old intention changes its presentation without destroying or rewriting saved sessions.
 library=page.evaluate('JSON.stringify(trainingLibrary)');page.evaluate("currentTraining.bmfCategory='finish';saveTrainingDraft()");page.reload();page.wait_for_function("typeof bmfExerciseCategory==='function'")
 assert page.evaluate('currentTraining.bmfCategory')=='finish';assert page.locator('#training-bmf-category').input_value()=='ball';assert page.evaluate('JSON.stringify(trainingLibrary)')==library
 assert page.evaluate("trainingDocument().textContent.includes('Mon équipe possède le ballon')")
 assert not errors,errors
 print('PASS five flat image axes, unique 65-exercise coverage, transition classification, combined filters, shortcuts, persistence, legacy sessions, print and mobile:',result)
 b.close()
