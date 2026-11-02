from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.trainingWizard')
 page.evaluate("()=>{trainingLibrary=Object.entries(bmfSubcategories).map(([key,c])=>({...newTraining(),title:c.label,bmfCategory:c.axis,bmfObjective:key}));trainingLibrary.push({...newTraining(),title:'Ludique enregistré',bmfCategory:'ludic'});window.sessionBaseline=JSON.stringify(trainingLibrary);renderTrainingLibrary()}")
 page.locator('#view-training').click();axis=page.locator('#training-session-theme-filter');sub=page.locator('#training-session-objective-filter')
 assert axis.is_visible();assert sub.is_visible()
 assert axis.locator('option').count()==6
 assert axis.locator('option').all_text_contents()[1:]==page.evaluate('Object.values(bmfCategories).map(c=>c.label)')
 assert page.locator('.training-saved-card').count()==13
 for key in ['ball','loss','win','off']:
  axis.select_option(key);assert sub.locator('option').count()==4;assert page.locator('.training-saved-card').count()==3
  for value in page.evaluate('axis=>Object.keys(bmfSubcategories).filter(k=>bmfSubcategories[k].axis===axis)',key):
   sub.select_option(value);assert page.locator('.training-saved-card').count()==1
 axis.select_option('ludic');assert sub.is_hidden();assert page.locator('.training-saved-card').count()==1
 axis.select_option('');assert sub.is_visible();assert sub.locator('option').count()==13
 sub.select_option('off-low');assert axis.input_value()=='off';assert page.locator('.training-saved-card').count()==1
 assert page.evaluate('JSON.stringify(trainingLibrary)')==page.evaluate('sessionBaseline')
 # Accurate imported exercise and historical data remain readable without rewriting.
 assert page.evaluate("()=>{const s={...newTraining(),themes:['Transitions'],blocks:[{exerciseId:'custom',custom:{importedExerciseId:'banide-contre',goal:'Aller vite'}}]};const i=trainingSessionIndex(s);return i.axes.includes('win')&&i.objectives.includes('win-forward')}")
 assert page.evaluate("()=>trainingSessionIndex({...newTraining(),bmfCategory:'finish'}).axes.includes('ball')")
 page.set_viewport_size({'width':390,'height':844});assert axis.is_visible();assert sub.is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors
 b.close();print('Shared five intentions/twelve subparts, dependent filters, classification, old/imported sessions, data preservation and mobile passed')
