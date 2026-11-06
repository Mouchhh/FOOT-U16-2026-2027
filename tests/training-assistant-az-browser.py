from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.trainingAssistantAZ')
 result=page.evaluate('''()=>{
 const before=JSON.stringify({currentTraining,trainingLibrary,trainingExercises});
 for(const goal of ['Sortie de balle','Pressing haut','Transitions','Finition','Défendre bas']) for(const players of ['14 + 2','15 + 0','8 + 1','4 + 0']) for(const space of ['quarter','half','full']) {
  const s=trainingAssistantGenerate({goal,players,level:'U17 Régional',space});
  if(!trainingValid(s)||s.blocks.length!==4||s.blocks.reduce((n,b)=>n+b.duration+(b.setupMinutes||0),0)!==s.duration)throw Error('Invalid generated session');
  for(const b of s.blocks){const a=b.custom.adaptation;if(a.groups.reduce((n,g)=>n+g.players,0)!==s.players||a.groups.reduce((n,g)=>n+g.keepers,0)!==s.keepers)throw Error('Lost/duplicated participants');if(b.custom.organisation.includes('undefined'))throw Error('Undefined group setup');}
 }
 if(before!==JSON.stringify({currentTraining,trainingLibrary,trainingExercises}))throw Error('Generation mutated existing data');
 return true;
 }''');assert result
 page.locator('#view-training').click();page.locator('#task-training-assistant').click()
 form=page.locator('.training-assistant-form');assert form.locator('.training-assistant-objectives input[type=checkbox]').count()>=12
 form.locator('[data-intention=ball]').evaluate('(node)=>node.open=true')
 form.locator('input[value=ball-build]').check()
 form.get_by_label('Niveau du groupe',exact=True).fill('U17 Régional')
 form.get_by_label('Joueurs de champ + gardiens',exact=True).fill('14 + 2')
 form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 assert page.locator('.training-assistant-phase').count()==4
 page.get_by_role('button',name='Enregistrer dans Mes séances',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==1 and page.evaluate('trainingLibrary[0].libraryOnly')
 assert not page.evaluate("agendaCalendarAllEvents({from:trainingLibrary[0].date,to:trainingLibrary[0].date}).some(e=>e.session?.id===trainingLibrary[0].id)")
 assert page.evaluate('currentTraining.blocks.length')==0 and page.evaluate('trainingWizard.step()')==0
 assert not page.locator('#training-assistant-az').is_visible()
 def generate():
  page.locator('#task-training-assistant').click()
  form.locator('[data-intention=ball]').evaluate('(node)=>node.open=true')
  form.locator('input[value=ball-build]').check()
  form.get_by_label('Niveau du groupe',exact=True).fill('U17 Régional')
  form.get_by_label('Joueurs de champ + gardiens',exact=True).fill('14 + 2')
  form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 generate()
 page.get_by_role('button',name='Enregistrer dans l’agenda',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==2 and not page.evaluate('trainingLibrary[0].libraryOnly')
 assert page.evaluate("agendaCalendarAllEvents({from:trainingLibrary[0].date,to:trainingLibrary[0].date}).some(e=>e.session?.id===trainingLibrary[0].id)")
 assert not page.locator('#training-assistant-az').is_visible()
 generate()
 # PDF uses the same four generated blocks without replacing the current editor.
 previous=page.evaluate('currentTraining.id');page.evaluate('window.print=()=>{}')
 page.get_by_role('button',name='Exporter en PDF',exact=True).click()
 assert page.locator('#training-assistant-print').inner_text().count('Retour au calme')>=1
 assert page.evaluate('currentTraining.id')==previous
 page.evaluate("document.body.classList.remove('training-assistant-printing')")
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 page.get_by_role('button',name='Ajuster dans l’éditeur',exact=True).click()
 assert page.evaluate('currentTraining.blocks.length')==4
 assert not page.locator('#training-assistant-az').is_visible()
 assert not errors,errors;b.close()
print('Four-field assistant, five themes and group/space variants, balanced participants/duration, library vs agenda, PDF isolation, editor and mobile passed')
