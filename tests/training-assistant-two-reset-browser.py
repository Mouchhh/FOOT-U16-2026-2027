"""Parallel groups preserve totals and time; successful saves reset, failed saves preserve work."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.trainingAssistantAZ')
 assert page.evaluate('''()=>{
 const before=JSON.stringify({currentTraining,trainingLibrary,trainingExercises});
 for(const players of ['8 + 0','19 + 3','28 + 2'])for(const space of ['quarter','half','full']){
  const s=trainingAssistantGenerate({objectives:['ball-build','off-low'],level:'U17 Régional',players,space,organisation:'two'});
  if(!trainingValid(s))throw Error('Invalid session');
  const stages=trainingSessionStages(s);
  if(stages.at(-1).end!==s.duration)throw Error('Parallel duration double counted');
  for(const stage of stages){
   const r=trainingStageReview(stage,s);
   if(stage.blocks.length!==2||r.players!==s.players||r.keepers!==s.keepers||r.warnings.length)throw Error('Bad group allocation or footprint');
   if(new Set(stage.blocks.map(b=>b.duration)).size!==1)throw Error('Clocks differ');
   for(const block of stage.blocks){const a=block.custom.adaptation;if(a.players!==block.workshopPlayers||a.keepers!==block.workshopKeepers||a.groups.length!==1)throw Error('Bad adaptation');}
  }
 }
 try{trainingAssistantGenerate({objectives:['ball-build'],level:'U17',players:'6',space:'half',organisation:'two'});throw Error('Should reject too few');}catch(e){if(!e.message.includes('8 joueurs'))throw e;}
 return before===JSON.stringify({currentTraining,trainingLibrary,trainingExercises});
 }''')
 page.locator('#view-training').click();page.locator('#task-training-assistant').click()
 form=page.locator('.training-assistant-form')
 def generate():
  form.locator('[data-intention=ball]').evaluate('(node)=>node.open=true')
  form.locator('input[value=ball-build]').check()
  form.get_by_label('Niveau du groupe',exact=True).fill('U17 Régional')
  form.get_by_label('Joueurs de champ + gardiens',exact=True).fill('19 + 3')
  form.get_by_label('Organisation du groupe',exact=True).select_option('two')
  form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 generate()
 assert not page.locator('#training-save').is_visible()
 assert not page.locator('.training-progress').is_visible()
 assert page.locator('.training-assistant-stage-parallel').count()==4
 assert page.locator('.training-assistant-phase').count()==8
 assert page.locator('.training-assistant-preview .training-sequence-more').count()==0
 page.evaluate('window.print=()=>{}')
 page.get_by_role('button',name='Exporter en PDF',exact=True).click()
 assert page.locator('#training-assistant-print .training-assistant-stage-parallel').count()==4
 page.evaluate("window.dispatchEvent(new Event('afterprint'))")
 # Simulated library failure must leave the generation and inputs intact.
 page.evaluate("window.originalStorageSet=coachStorageSet;coachStorageSet=(key,value)=>{if(key==='vestiaire-training-library')throw Error('test full');return originalStorageSet(key,value)}")
 page.get_by_role('button',name='Enregistrer dans Mes séances',exact=True).click()
 assert page.locator('#training-assistant-az').is_visible() and page.locator('.training-assistant-preview .training-assistant-phase').count()==8
 assert page.evaluate('trainingLibrary.length')==0
 page.evaluate("coachStorageSet=(key,value)=>{if(key==='vestiaire-training-draft')throw Error('test draft full');return originalStorageSet(key,value)}")
 page.get_by_role('button',name='Enregistrer dans Mes séances',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==1
 assert page.locator('#training-assistant-az').is_visible()
 assert page.locator('.training-assistant-preview .training-assistant-phase').count()==8
 page.evaluate('coachStorageSet=originalStorageSet')
 page.get_by_role('button',name='Enregistrer dans Mes séances',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==1
 assert page.evaluate('trainingLibrary[0].blocks.length')==8
 saved=page.evaluate('JSON.stringify(trainingLibrary[0])')
 assert not page.locator('#training-assistant-az').is_visible()
 assert page.evaluate('trainingWizard.step()')==0
 assert page.evaluate('currentTraining.blocks.length')==0
 assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-training-draft')).blocks.length") ==0
 page.locator('#task-training-assistant').click()
 assert form.locator('input:checked').count()==0
 assert form.get_by_label('Joueurs de champ + gardiens',exact=True).input_value()==''
 assert form.get_by_label('Organisation du groupe',exact=True).input_value()=='auto'
 assert page.locator('.training-assistant-preview').inner_text()==''
 # Manual/edited route resets too, but the archived document remains unchanged.
 page.evaluate("()=>{trainingAssistantAZ.reset();workspaceReplaceDraft('training',trainingLibrary[0]);trainingWizard.go(3)}")
 page.locator('#training-save').evaluate('(button)=>button.click()')
 page.wait_for_function('currentTraining.blocks.length===0')
 assert page.evaluate('trainingWizard.step()')==0
 assert page.evaluate('trainingLibrary.length')==1
 assert page.evaluate('trainingLibrary[0].blocks.length')==8
 page.reload();page.wait_for_function('window.trainingAssistantAZ')
 assert page.evaluate('currentTraining.blocks.length')==0
 assert page.evaluate('trainingLibrary[0].blocks.length')==8
 page.locator('#view-training').click();page.locator('#task-training-assistant').click();generate()
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':900})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('PASS: two parallel workshops, balanced groups and space, common clock, PDF, failure preservation, save reset, reload and mobile')
