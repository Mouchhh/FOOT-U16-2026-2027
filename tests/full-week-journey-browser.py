"""One continuous UI journey, two local coach profiles: week -> match -> next week.
No direct mutation of application documents: setup seeds only the local coach profile.
These are automated scenarios, not trials performed by real educators or Supabase accounts.
"""
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:3016/?mode=local'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);receipts=[]
 for label,category,level,players,keepers,size in [('Découverte','U15','discovery',6,0,(1366,900)),('Confirmé','Seniors','advanced',12,1,(1024,768))]:
  ctx=browser.new_context(viewport={'width':size[0],'height':size[1]});page=ctx.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  ctx.add_init_script("if(!localStorage.getItem('vestiaire-coach-profiles')){localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'journey-coach',name:'Coach parcours'}]));localStorage.setItem('vestiaire-active-coach','journey-coach');}")
  page.goto(URL);page.wait_for_function("typeof workspaceNavigation==='object'")
  def menu(parent,name):
   page.locator('#'+parent).click()
   if parent=='view-training':
    page.locator('#task-training-prepare').click();page.locator('#training-step-link-0').click()
   elif parent=='view-coach-agenda':page.locator('#task-agenda-calendar').click()
   elif parent=='view-pitch':page.locator('#task-match-causerie').click()
   elif parent=='view-reports':page.locator('#report-tabs [data-report-tab='+('plan' if name=='Plan d’action' else 'general')+']').click()
  def add_exercise(eid,query):
   page.locator('#training-catalogue-toggle').click();page.locator('#training-search').fill(page.evaluate('id=>trainingExercises.find(e=>e.id===id).title',eid))
   before=page.evaluate('currentTraining.blocks.length')
   page.locator('[data-exercise="'+eid+'"]').get_by_role('button',name='+ Ajouter à la séance',exact=True).click()
   if page.evaluate('currentTraining.blocks.length')==before:
    assert eid=='warm' and players>10,(label,eid,page.locator('#toast').inner_text())
    page.locator('[data-exercise="'+eid+'"]').get_by_role('button',name='Créer ma variante',exact=True).click()
    variant=page.locator('#bible-variant-dialog');variant.locator('#bible-variant-organisation').select_option('stations')
    variant.locator('#bible-variant-groups').fill('2');variant.locator('#bible-variant-width').fill('20');variant.locator('#bible-variant-length').fill('20')
    variant.locator('button[type=submit]').click()
   assert page.evaluate('currentTraining.blocks.length')==before+1,(label,eid,page.locator('#toast').inner_text())
   page.locator('#training-catalogue-close').click()
  def balance():
   for i,minutes in enumerate([8,32,14]):
    card=page.locator('#training-blocks .training-block').nth(i)
    card.get_by_label('Activité + récupération (min)',exact=True).fill(str(minutes));card.get_by_label('Activité + récupération (min)',exact=True).blur()
    card.get_by_label('Installation avant (min)',exact=True).fill('2');card.get_by_label('Installation avant (min)',exact=True).blur()
   assert page.evaluate('trainingTotal()')==60
  # Prepare through Next/Previous, rather than jumping by internal state calls.
  menu('view-training','Mon équipe · catégorie et niveau')
  page.locator('#training-title').fill('Mardi · '+label);page.locator('#training-team').fill('Groupe '+label)
  page.locator('#training-category').fill(category);page.locator('#training-level').select_option(level)
  page.locator('#training-duration').fill('60');page.locator('#training-next').click()
  page.locator('#training-previous').click();assert page.locator('#training-title').input_value()=='Mardi · '+label
  page.locator('#training-next').click();page.locator('#training-manual').click()
  page.locator('#training-themes').get_by_label('Défense',exact=True).check();page.locator('#training-themes').get_by_label('Relance',exact=True).uncheck()
  page.locator('#training-next').click();page.locator('#training-date').fill('2026-10-20');page.locator('#training-time').fill('18:30')
  page.locator('#training-players').fill(str(players));page.locator('#training-keepers').fill(str(keepers))
  page.locator('#training-space-size').select_option('full');page.locator('#training-notes').fill('Garder une couverture derrière le premier défenseur.')
  page.locator('#training-next').click()
  add_exercise('warm','Activation avec ballon');add_exercise('possession-neutral','Conserver avec appuis');add_exercise('cool','Retour au calme')
  balance();page.locator('#training-next').click();page.locator('#training-next').click()
  original=page.evaluate('structuredClone(currentTraining)');assert page.evaluate('trainingLibrary.length')==1
  assert page.evaluate('trainingValid(currentTraining)')
  page.reload();page.wait_for_function("typeof workspaceNavigation==='object'")
  menu('view-coach-agenda','Mon calendrier et mes séances');page.locator('#coach-agenda-all').click()
  page.locator('#coach-agenda-week').fill('2026-10-20');page.locator('#coach-agenda-week').blur()
  card=page.locator('.coach-agenda-card[data-session-id="'+original['id']+'"]');card.get_by_role('button',name='Ouvrir la séance',exact=True).click()
  assert page.locator('#training-title').input_value()==original['title']
  # Build the match preparation from the composition and preserve it in a new report.
  menu('view-pitch','Préparation du match & réglages')
  page.locator('#club-profile > summary').click();page.locator('#club-category').fill(category);page.locator('#club-category').blur();page.locator('#club-profile > summary').click()
  page.locator('#task-match-causerie').click();page.locator('#match-plan-date').fill('2026-10-24')
  page.locator('#match-plan-opponent').fill('Adversaire parcours');page.locator('#match-plan-objective-0').fill('Fermer l’axe avec une couverture')
  page.locator('#match-plan-form button[type=submit]').click()
  composition=page.evaluate('structuredClone(getCompositionBoard())')
  assert page.evaluate('saves.some(s=>s.state.documentId===getCompositionBoard().documentId)')
  menu('view-reports','Le match');page.locator('#report-new').click()
  quick=page.locator('#report-quick-panel');quick.get_by_label('Buts marqués',exact=True).fill('2');quick.get_by_label('Buts encaissés',exact=True).fill('1')
  quick.locator('.report-essential-followup > summary').click();quick.get_by_label('La priorité à travailler',exact=True).fill('Réduire l’intervalle entre pression et couverture')
  quick.get_by_label('Comment observer les progrès ?',exact=True).fill('Le second défenseur protège l’axe sur trois actions observées.')
  page.locator('#report-save').click();report=page.evaluate('structuredClone(currentReport)')
  assert report['preparation']['plan']['opponent']=='Adversaire parcours'
  assert report['preparation']['objectives'][0]['text']=='Fermer l’axe avec une couverture'
  assert len(report['preparation']['roster'])==len(composition['players'])
  if level=='advanced':
   menu('view-reports','Plan d’action');page.locator('#report-to-training').click()
  else:quick.get_by_role('button',name='Choisir les exercices pour la prochaine séance',exact=True).click()
  dialog=page.locator('#report-training-dialog');dialog.get_by_label('Destination de la séance',exact=True).select_option('new')
  dialog.get_by_label('Date de la prochaine séance',exact=True).fill('2026-10-27');dialog.get_by_label('Horaire de la prochaine séance',exact=True).fill('18:45')
  dialog.get_by_label('Thème · Priorité de la semaine',exact=True).select_option('Défense')
  dialog.get_by_role('button',name='Voir les exercices adaptés',exact=True).click()
  assert dialog.locator('.report-training-proposal').count()==1
  dialog.get_by_role('button',name='Ajouter à ma préparation',exact=True).click()
  next_id=page.evaluate('currentTraining.id');assert next_id!=original['id']
  assert page.evaluate("currentTraining.date==='2026-10-27'&&currentTraining.time==='18:45'&&!currentTraining.attendance")
  assert page.evaluate('trainingLibrary.length')==1 # proposal remains a draft
  assert page.evaluate('workspaceRecoveryEntries().training.payload.id')==original['id']
  assert page.evaluate('currentTraining.blocks[0].matchSource.reportId')==report['id']
  # Complete the second session and save without changing the first week.
  add_exercise('warm','Activation avec ballon');add_exercise('cool','Retour au calme')
  page.locator('#training-blocks .training-block').nth(1).get_by_role('button',name='Monter cet exercice',exact=True).click()
  balance();page.locator('#training-next').click();page.locator('#training-next').click()
  assert page.evaluate('trainingLibrary.length')==2
  saved_old=page.evaluate('id=>trainingLibrary.find(s=>s.id===id)',original['id']);assert saved_old==original
  page.reload();page.wait_for_function("typeof workspaceNavigation==='object'")
  menu('view-reports','Le match')
  assert 'Séance enregistrée' in page.locator('#report-session-followup').inner_text()
  page.locator('#report-session-followup').get_by_role('button',name='Ouvrir cette séance',exact=True).click()
  assert page.evaluate('currentTraining.id')==next_id
  assert page.evaluate('currentTraining.blocks.some(b=>b.matchSource?.success===currentReport.plan.success)')
  menu('view-coach-agenda','Mon calendrier et mes séances');page.locator('#coach-agenda-all').click()
  page.locator('#coach-agenda-week').fill('2026-10-27');page.locator('#coach-agenda-week').blur()
  assert page.locator('.coach-agenda-card').count()==1
  assert page.locator('.coach-agenda-card').get_attribute('data-session-id')==next_id
  assert not errors,errors
  receipts.append({'profile':label,'players':players,'sessions':2,'reports':1,'originalPreserved':True,'matchLinked':True})
  ctx.close()
 browser.close();print('PASS complete week UI journeys:',receipts)
