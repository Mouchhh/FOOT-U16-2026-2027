"""Shared club taxonomy, original source integrity, multi-objective generation and concise output."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.clubExerciseIndex&&window.trainingAssistantAZ')
 page.evaluate('window.sourceExercisesBefore=JSON.stringify(suppliedExerciseEngine.exercises,(k,v)=>typeof v==="function"?v.toString():v)')
 result=page.evaluate('''()=>{
 const entries=clubExerciseIndex.entries();if(entries.length!==1232)throw Error('Incomplete index');
 for(const e of entries){if(!bmfCategories[e.intention]||bmfSubcategories[e.sous_partie]?.axis!==e.intention)throw Error('Unclassified source: '+e.id);}
 for(const keys of [['ball-build'],['ball-control','loss-press'],['off-low','win-forward','ball-finish'],['ball-build','off-high','loss-slow','win-score']])for(const players of ['14 + 2','8 + 1','4 + 0'])for(const level of ['U15 Départemental','U17 Régional']){
  const s=trainingAssistantGenerate({objectives:keys,level,players,space:'half'});
  if(!trainingValid(s)||s.blocks.length!==keys.length+3||s.blocks.reduce((n,b)=>n+b.duration+(b.setupMinutes||0),0)!==s.duration)throw Error('Unbalanced session');
  if(keys.some(k=>!trainingSessionIndex(s).objectives.includes(k)))throw Error('Lost objective');
  for(const block of s.blocks){if(block.custom.adaptation.groups.reduce((n,g)=>n+g.players,0)!==s.players)throw Error('Lost player');}
 }
 for(const objectives of [[],['fake'],['ball-build','ball-build']]){let error=false;try{trainingAssistantGenerate({objectives,level:'U17',players:'14 + 2',space:'half'});}catch{error=true;}if(!error)throw Error('Invalid choices accepted');}
 return {views:entries.length,intentions:[...new Set(entries.map(e=>e.intention))]};
 }''')
 assert result['views']==1232 and len(result['intentions'])==5
 page.locator('#view-training').click();page.locator('#task-training-bible').click()
 for axis,sub in [('ball','ball-build'),('loss','loss-press'),('win','win-forward'),('off','off-low'),('ludic','ludic-activation')]:
  page.locator('.exercise-reference-intentions [data-intention='+axis+']').click();page.get_by_label('Sous-partie des exercices',exact=True).select_option(sub)
  assert page.locator('#training-catalogue [data-exercise]').count()>0
  assert page.locator('#training-catalogue [data-exercise]').evaluate_all('(cards)=>cards.every(c=>clubExerciseClassification(suppliedExerciseEngine.getExercise(c.dataset.exercise,+c.dataset.view)).objective===document.querySelector(\"[aria-label=\\\"Sous-partie des exercices\\\"]\").value)')
 assert 'mycoach' not in page.locator('#training-catalogue').inner_text().lower()
 assert 'mycoach' not in page.locator('#supplied-source').text_content().lower()
 page.locator('#training-catalogue .bible-card-actions button').nth(1).click()
 shadow=page.locator('#bible-sheet-dialog .supplied-original-sheet').evaluate('e=>e.shadowRoot.textContent')
 assert 'mycoach' not in shadow.lower()
 assert 'Échauffement / Activation' in page.locator('.club-exercise-location').inner_text()
 page.locator('#bible-sheet-dialog').get_by_role('button',name='Fermer',exact=True).click()
 page.locator('#task-training-assistant').click();form=page.locator('.training-assistant-form')
 for axis,key in [('ball','ball-build'),('loss','loss-press')]:
  form.locator('[data-intention='+axis+']').evaluate('(n)=>n.open=true');form.locator('input[value='+key+']').check()
 form.get_by_label('Niveau du groupe',exact=True).fill('U17 Régional');form.get_by_label('Joueurs de champ + gardiens',exact=True).fill('14 + 2');form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 assert page.locator('.training-club-sequence').count()==5
 assert page.locator('.training-sequence-more[open]').count()==0
 assert page.locator('.training-club-sequence').evaluate_all('(cards)=>cards.every(c=>c.querySelectorAll(\".training-sequence-rules li\").length<=2)')
 page.get_by_role('button',name='Enregistrer dans Mes séances',exact=True).click()
 assert page.evaluate('trainingLibrary[0].assistantObjectives')==['ball-build','loss-press']
 assert page.evaluate('trainingSessionIndex(trainingLibrary[0]).axes.includes("loss")')
 page.evaluate('window.print=()=>{}');page.get_by_role('button',name='Exporter en PDF',exact=True).click()
 assert page.locator('#training-assistant-print .training-club-sequence').count()==5
 assert page.locator('#training-assistant-print .training-sequence-more').count()==0
 page.evaluate('window.dispatchEvent(new Event("afterprint"))')
 for width in [1440,820,390,320]:
  page.set_viewport_size({'width':width,'height':1100});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
  page.screenshot(path=f'/tmp/training-club-{width}.png',full_page=True)
 assert page.evaluate('JSON.stringify(suppliedExerciseEngine.exercises,(k,v)=>typeof v==="function"?v.toString():v)===sourceExercisesBefore')
 page.reload();page.wait_for_function('window.clubExerciseIndex&&window.trainingAssistantAZ')
 assert page.evaluate('trainingLibrary[0].assistantObjectives')==['ball-build','loss-press']
 page.locator('#view-training').click();page.evaluate('trainingWizard.openLibrary()')
 page.locator('#training-session-theme-filter').select_option('loss');page.locator('#training-session-objective-filter').select_option('loss-press')
 assert page.locator('.training-saved-card').count()==1
 page.locator('#training-session-theme-filter').select_option('ball');page.locator('#training-session-objective-filter').select_option('ball-build')
 assert page.locator('.training-saved-card').count()==1
 page.locator('#training-session-theme-filter').select_option('ludic')
 assert page.locator('#training-session-objective-filter').is_visible()

 assert not errors,errors;b.close()
print('PASS: 1232 club-classified views, five intentions and subparts, source content intact, multi-objective generation/participants/timing, brief sequences, stored multi-filter metadata, source-label cleanup, concise PDF and mobile.')
