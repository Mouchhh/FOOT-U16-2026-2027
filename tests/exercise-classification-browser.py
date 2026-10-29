from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bmfExerciseCategory==='function'")
 result=page.evaluate('''()=>{
  const ids=Object.values(bmfExerciseGroups).flat();if(ids.length!==65||new Set(ids).size!==65||trainingExercises.some(e=>!ids.includes(e.id)))throw Error('Catalogue coverage');
  for(const [id,key]of [['rondo','progress'],['cutback','finish'],['press','oppose'],['keeper-duel','protect'],['warm','complementary']])if(bmfExerciseCategory(trainingExercises.find(e=>e.id===id))!==key)throw Error(id);
  return Object.fromEntries(Object.entries(bmfExerciseGroups).map(([key,ids])=>[key,ids.length]));}''')
 page.locator('#view-training').click();page.get_by_role('menuitem',name='Thèmes & objectifs',exact=True).click()
 page.locator('#training-bmf-category').select_option('protect');assert page.evaluate('currentTraining.bmfCategory')=='protect'
 page.locator('#view-training').click();page.get_by_role('menuitem',name='La Bible de l’éduc',exact=True).click()
 assert page.locator('#bible-bmf-category').input_value()=='protect'
 for key in ['progress','finish','oppose','protect','complementary']:
  page.locator('#bible-bmf-category').select_option(key)
  expected=result[key];assert str(expected)+' exercice' in page.locator('#bible-results').inner_text()
  assert page.locator('.bible-card').count()>0
  assert page.locator('.bible-card').evaluate_all('(cards)=>cards.every(c=>bmfExerciseCategory(trainingExercises.find(e=>e.id===c.dataset.exercise))===document.querySelector("#bible-bmf-category").value)')
 page.locator('#bible-bmf-category').select_option('finish');page.locator('#training-filter').select_option('Finition');assert page.locator('.bible-card').evaluate_all('(cards)=>cards.every(c=>trainingExercises.find(e=>e.id===c.dataset.exercise).theme==="Finition")')
 page.locator('#bible-reset').click();assert '65 exercices' in page.locator('#bible-results').inner_text()
 for width in [320,390,1366]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 page.reload();page.wait_for_function("typeof bmfExerciseCategory==='function'");assert page.evaluate('currentTraining.bmfCategory')=='protect'
 assert page.evaluate("trainingDocument().textContent.includes('S’opposer pour protéger son but')")
 assert not errors,errors
 print('PASS complete 65-exercise classification, combined category/theme filters, reset, session persistence, print and mobile:',result)
 b.close()
