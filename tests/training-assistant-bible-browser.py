"""The assistant fills sequences with Bible exercises (original diagrams), keeps time and space, and can swap or restore one sequence."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.trainingAssistantAZ && window.exerciseReferenceIndex')
 # Pure selection: roles by stage, no duplicate source, valid sessions, unchanged durations, no extra stage warnings.
 report=page.evaluate('''()=>{
  const out=[];
  for(const [objs,org,players,space,level] of [[['ball-build'],'auto','14 + 2','half','U16'],[['ball-build','win-forward'],'two','14 + 2','half','U16'],[['loss-press'],'auto','10 + 1','quarter','U12'],[['ball-build'],'auto','4','quarter','U16']]){
   const s=trainingAssistantGenerate({objectives:objs,level,players,space,organisation:org});
   const n=trainingAssistantNeeds({goal:'Séance',objective:objs[0],level,players,space});
   const r=trainingAssistantUseBible(s,n,objs),bible=r.session.blocks.filter(b=>b.assistantSource==='bible');
   if(!trainingValid(r.session))throw Error('invalid '+org);
   if(r.session.duration!==s.duration)throw Error('duration changed');
   if(new Set(bible.map(b=>b.assistantSourceId)).size!==bible.length)throw Error('duplicate exercise');
   if(bible.some(b=>!b.custom.board||!b.custom.importedExerciseId))throw Error('missing diagram');
   for(const blk of bible){if(/^Séries pour le groupe : /m.test(blk.custom.instructions))throw Error('stale reference series saved');{const src=suppliedExerciseEngine.getExercise(blk.custom.importedExerciseId,blk.custom.importedExerciseView||0),txt=clubTrainingBlockSeries(blk,src);if(src.series?!txt.startsWith('Rythme de référence de la fiche'):txt)throw Error('sheet rhythm');}const plan=suppliedExerciseEngine.adapt(exerciseReferenceIndex.resolve(exerciseReferenceIndex.entries.find(e=>e.source_id===blk.assistantSourceId).id),{players:blk.workshopPlayers??n.total,keepers:blk.workshopKeepers??n.keepers,category:n.level,level:'dev',moment:'libre',space:n.bounds});if(plan.groups.some(g=>g.k<(plan.needK||0)))throw Error('subgroup without keeper');if(blk.assistantWarnings&&!(blk.assistantWarnings.every(w=>/^Fiche conçue pour /.test(w))&&blk.custom.instructions.startsWith('À adapter : ')))throw Error('non-age warning or lost warning');}
   const before=trainingSessionStages(s).map(st=>trainingStageReview(st,s).warnings.length),after=trainingSessionStages(r.session).map(st=>trainingStageReview(st,r.session).warnings.length);
   if(after.some((w,i)=>w>before[i]))throw Error('new stage warning');
   const strip=list=>JSON.stringify(list.map(({assistantRole,...b})=>b));if(r.generated.length!==s.blocks.length||strip(r.generated)!==strip(s.blocks))throw Error('written copy altered');
   const roles=trainingAssistantBibleRoles(r.session);
   for(const st of trainingSessionStages(r.session))if(new Set(st.blocks.map(b=>roles.get(b.id))).size!==1)throw Error('mixed roles in a stage');
   out.push([org,players,bible.length,r.session.blocks.length]);
  }
  return out;}''')
 assert report[0][2]>=3 and report[1][2]>=8,report
 # Chosen duration is respected, and the warm-up is a passing exercise (circuit, triangle, square…).
 warm=page.evaluate('''()=>{const out=[];for(const d of [60,75,90,120]){const s=trainingAssistantGenerate({objectives:['ball-build'],level:'U16',players:'14 + 2',space:'half',organisation:'auto',duration:d});const n=trainingAssistantNeeds({goal:'Séance',objective:'ball-build',level:'U16',players:'14 + 2',space:'half'});const r=trainingAssistantUseBible(s,n,['ball-build']);if(r.session.duration!==d||trainingSessionStages(r.session).at(-1).end!==d)throw Error('duration '+d);const w=r.generated[0].custom.instructions;if(!w.includes('Total : '+(d>=75?15:12)+' minutes'))throw Error('warm-up text '+d);if(r.session.blocks[0].assistantSource==='bible'&&!r.session.blocks[0].custom.title.startsWith('Échauffement · '))throw Error('warm-up title');out.push(r.session.blocks[0].custom.title);}return out;}''')
 assert all(t.startswith('Échauffement') for t in warm),warm
 # The warm-up varies between generations (random draw among the best warm-ups).
 variety=page.evaluate('''()=>{const t=new Set();for(let k=0;k<10;k++){const s=trainingAssistantGenerate({objectives:['ball-build'],level:'U16',players:'14 + 2',space:'half',organisation:'auto'});const n=trainingAssistantNeeds({goal:'Séance',objective:'ball-build',level:'U16',players:'14 + 2',space:'half'});t.add(trainingAssistantUseBible(s,n,['ball-build']).session.blocks[0].custom.title);}return t.size;}''')
 assert variety>=4,variety
 fixed=page.evaluate('''()=>{const pick=()=>{const s=trainingAssistantGenerate({objectives:['ball-build'],level:'U16',players:'14 + 2',space:'half',organisation:'auto'});const n=trainingAssistantNeeds({goal:'Séance',objective:'ball-build',level:'U16',players:'14 + 2',space:'half'});return trainingAssistantUseBible(s,n,['ball-build'],()=>0).session.blocks[0].custom.title;};return pick()===pick();}''')
 assert fixed
 assert report[3][2]<=report[3][3],report
 # FFF order: opposition-free warm-up, then increasing size, largest last; physical option placed and timed.
 order=page.evaluate('''()=>{const out=[];for(const [phys,objs] of [[null,['ball-build','win-forward']],['speed',['ball-build']],['endurance',['loss-press']]]){let s=trainingAssistantGenerate({objectives:objs,level:'U16',players:'14 + 2',space:'half',organisation:'auto',duration:90});const n=trainingAssistantNeeds({goal:'Séance',objective:objs[0],level:'U16',players:'14 + 2',space:'half'});s=trainingAssistantAssignRoles(s);if(phys)s=trainingAssistantAddPhysical(s,phys,n);const r=trainingAssistantUseBible(s,n,objs),roles=trainingAssistantBibleRoles(r.session),bl=r.session.blocks;
  if(r.session.duration!==90||trainingSessionStages(r.session).at(-1).end!==90)throw Error('duration '+phys);
  const w=bl[0];if(w.assistantMetaId){const m=exerciseReferenceIndex.get(w.assistantMetaId);if(!trainingAssistantOppositionFree(m,exerciseReferenceIndex.resolve(m.id)))throw Error('warm-up with opposition');}
  const sizes=bl.filter(b=>['workshop','game'].includes(roles.get(b.id))&&b.assistantMetaId).map(b=>trainingAssistantSize(exerciseReferenceIndex.get(b.assistantMetaId)));if(sizes.some((x,i)=>i&&x<sizes[i-1]))throw Error('not increasing '+sizes);
  const pi=bl.findIndex(b=>roles.get(b.id)==='physical');if(phys==='speed'&&pi!==1)throw Error('speed not after warm-up');if(phys==='endurance'&&pi!==bl.length-2)throw Error('endurance not before cool-down');
  if(phys&&bl[pi].assistantPhysical!==phys)throw Error('physical subtype lost');
  out.push(sizes.length);}return out;}''')
 assert all(x>=1 for x in order),order
 # UI: generation shows diagrams, swap one sequence, restore the written exercise, save without markers.
 page.locator('#view-training').evaluate('e=>e.click()');page.locator('#training-assistant-open').click();form=page.locator('.training-assistant-form')
 # Warm-up, motor work and cool-down are not selectable intentions; physical work is an option.
 assert form.locator('input[value=ludic-activation]').count()==0 and form.locator('input[value=ludic-motor]').count()==0 and form.locator('input[value=ludic-cool]').count()==0
 assert form.get_by_label('Travail physique (facultatif)',exact=True).count()==1
 assert 'doit être adaptée' in page.locator('.training-assistant-advice').inner_text()
 form.locator('[data-intention=ball]').evaluate('(node)=>node.open=true');form.locator('input[value=ball-build]').check()
 form.get_by_label('Niveau du groupe',exact=True).fill('U16');form.get_by_label('Joueurs de champ + gardiens',exact=True).fill('14 + 2')
 form.get_by_label('Durée de la séance',exact=True).select_option('75')
 form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 assert '· 75 min ·' in page.locator('.training-assistant-preview > .hint').first.inner_text()
 preview=page.locator('.training-assistant-preview');assert preview.locator('.training-assistant-stage svg').count()>=3
 assert page.locator('.training-assistant-references').count()==0
 assert 'la Bible n’a pas de fiche de ce type' in preview.locator('.training-assistant-stage').last.inner_text()
 duration=page.locator('.training-assistant-preview > .hint').first.inner_text()
 # « Autre exercice » swaps the sequence for another usable Bible sheet, time unchanged.
 another=preview.locator('.training-assistant-bible-another');assert another.count()==4 and not another.nth(3).is_visible()
 seen=[preview.locator('.training-assistant-stage').nth(1).locator('h3').first.inner_text()]
 for _ in range(5):
  preview.locator('.training-assistant-bible-another').nth(1).click();seen.append(preview.locator('.training-assistant-stage').nth(1).locator('h3').first.inner_text())
 assert len(set(seen))==len(seen),seen  # no back-and-forth while other sheets remain
 assert '· 75 min ·' in page.locator('.training-assistant-preview > .hint').first.inner_text()
 preview.locator('.training-assistant-bible-list').nth(1).evaluate('d=>d.open=true')
 chooser=preview.locator('.training-assistant-bible-choice select').nth(1);before=preview.locator('.training-assistant-stage').nth(1).locator('h3,h4').first.inner_text()
 chooser.select_option(index=2);after=preview.locator('.training-assistant-stage').nth(1).locator('h3,h4').first.inner_text();assert after!=before
 preview.locator('.training-assistant-bible-list').nth(1).evaluate('d=>d.open=true')
 preview.locator('.training-assistant-bible-choice select').nth(1).select_option('__generated')
 assert 'Construire le jeu' in preview.locator('.training-assistant-stage').nth(1).inner_text()
 assert page.locator('.training-assistant-preview > .hint').first.inner_text()==duration
 page.get_by_role('button',name='Enregistrer dans Mes séances',exact=True).click()
 assert page.evaluate("!JSON.stringify(trainingLibrary[0]).includes('assistantSource')")
 assert page.evaluate("trainingLibrary[0].blocks.filter(b=>b.custom?.board).length")>=2
 # Saved series stay visible on the card in the editor.
 assert page.evaluate("(()=>{const s=trainingLibrary[0],i=s.blocks.findIndex(b=>b.custom?.importedExerciseId);return clubTrainingBlockCard(s.blocks[i],i,{details:false,session:s}).innerText.includes(s.blocks[i].custom.title)})()")
 # « Créer mon exercice ici »: blank dialog on that block in the editor; the rest of the session is kept.
 page.locator('#training-assistant-open').click();form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 titles=preview.locator('.training-assistant-stage h3').all_inner_texts()
 preview.locator('.training-assistant-bible-own').nth(1).click();assert page.locator('#custom-training-dialog').is_visible()
 assert page.locator('#custom-training-title').input_value()==''
 page.locator('#custom-training-title').fill('Mon exercice');page.evaluate("document.querySelector('#custom-training-form').requestSubmit()")
 blk=page.evaluate("currentTraining.blocks[1]");assert blk['custom']['title']=='Mon exercice' and 'importedExerciseId' not in blk['custom'] and 'adaptation' not in blk['custom']
 assert page.evaluate("currentTraining.blocks.length")==len(titles) and page.evaluate("trainingSessionStages(currentTraining).at(-1).end")==75
 # « Modifier cet exercice » opens the dialog prefilled with that exercise.
 page.locator('#training-assistant-open').click();form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click()
 name=preview.locator('.training-assistant-stage').nth(1).locator('h3').first.inner_text();preview.locator('.training-assistant-bible-edit').nth(1).click()
 assert page.locator('#custom-training-title').input_value()==name;page.evaluate("document.getElementById('custom-training-dialog').close()")
 # Mobile: chooser fits 390 px.
 page.set_viewport_size({'width':390,'height':844});page.locator('#training-assistant-open').click()
 form.get_by_role('button',name='Générer la séance avec l’Assistant',exact=True).click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors;b.close();print('PASS: Bible exercises per stage, no duplicates, stable time/space, swap and restore, clean save, mobile.')
