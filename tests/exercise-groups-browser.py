"""Manual unequal groups persist independently in each exercise and sequence."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bibleGroupRosterValid==='function'")
 page.locator('#view-training').click();page.evaluate("currentTraining.players=18;currentTraining.keepers=2;currentTraining.space='full';syncTrainingForm();saveTrainingDraft();trainingWizard.openCatalogue();openBibleSheet(trainingExercises.find(e=>e.id==='rondo'))")
 root=page.locator('#bible-sheet-dialog');settings=root.locator('.bible-sequence-settings');settings.locator('summary').click()
 settings.get_by_label('Organisation de la séquence',exact=True).select_option('manual')
 settings.get_by_label('Nombre de groupes de la séquence',exact=True).fill('2')
 settings.get_by_label('Joueurs du groupe 1',exact=True).fill('8');settings.get_by_label('Gardiens du groupe 1',exact=True).fill('1')
 settings.get_by_label('Joueurs du groupe 2',exact=True).fill('6');settings.get_by_label('Gardiens du groupe 2',exact=True).fill('0');settings.get_by_label('Gardiens du groupe 2',exact=True).blur()
 page.wait_for_function("document.querySelector('#bible-sheet-dialog .bible-detail').bibleVariant().sequenceSettings?.[0]?.groupRoster?.[0]?.players===8")
 expected=[{'players':8,'keepers':1},{'players':6,'keepers':0}]
 assert root.locator('.bible-detail').evaluate('e=>e.bibleVariant().sequenceSettings[0].groupRoster')==expected
 assert '4 joueur(s) en rotation, dont 1 G' in settings.locator('.bible-group-status').inner_text()
 assert root.locator('.training-diagram-screen .bible-player').count()==8
 root.get_by_label('Atelier illustré · Conserver sous pression',exact=True).select_option('1');assert root.locator('.training-diagram-screen .bible-player').count()==6
 settings.get_by_role('button',name='Appliquer à toutes les séquences',exact=True).click()
 root.locator('.bible-sequence-tabs button').nth(1).click();assert settings.get_by_label('Joueurs du groupe 1',exact=True).input_value()=='8'
 settings.get_by_label('Joueurs du groupe 1',exact=True).fill('5');settings.get_by_label('Joueurs du groupe 1',exact=True).blur()
 root.locator('.bible-sequence-tabs button').nth(0).click();assert settings.get_by_label('Joueurs du groupe 1',exact=True).input_value()=='8'
 # A rejected over-allocation cannot show a working diagram or invent players.
 settings.get_by_label('Joueurs du groupe 1',exact=True).fill('15');settings.get_by_label('Joueurs du groupe 1',exact=True).blur()
 page.wait_for_function("!document.querySelector('#bible-sheet-dialog .training-diagram-screen')")
 assert 'en trop' in settings.locator('.bible-group-status').inner_text()
 settings.get_by_label('Joueurs du groupe 1',exact=True).fill('8');settings.get_by_label('Joueurs du groupe 1',exact=True).blur()
 root.get_by_role('button',name='+ Ajouter à la séance',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==1
 root.get_by_role('button',name='Fermer',exact=True).click()
 # A second drill receives its own group settings.
 page.evaluate("openBibleSheet(trainingExercises.find(e=>e.id==='cover'))")
 root.locator('.bible-sequence-settings>summary').click();root.get_by_label('Organisation de la séquence',exact=True).select_option('manual')
 root.get_by_label('Nombre de groupes de la séquence',exact=True).fill('2')
 for n in [1,2]:
  root.get_by_label(f'Joueurs du groupe {n}',exact=True).fill('7');root.get_by_label(f'Gardiens du groupe {n}',exact=True).fill('1')
 root.get_by_label('Gardiens du groupe 2',exact=True).blur();root.get_by_role('button',name='+ Ajouter à la séance',exact=True).click()
 root.get_by_role('button',name='Fermer',exact=True).click()
 assert page.evaluate('currentTraining.blocks[0].bibleVariant.sequenceSettings[0].groupRoster')==expected
 assert page.evaluate('currentTraining.blocks[1].bibleVariant.sequenceSettings[0].groupRoster')==[{'players':7,'keepers':1},{'players':7,'keepers':1}]
 page.locator('#training-catalogue-close').click();page.locator('#training-save').click();page.reload();page.wait_for_function('currentTraining.blocks.length===2')
 assert page.evaluate('currentTraining.blocks[0].bibleVariant.sequenceSettings[0].groupRoster')==expected
 assert page.evaluate('trainingLibrary[0].blocks[0].bibleVariant.sequenceSettings[1].groupRoster[0].players')==5
 # Reopen the saved block through the production detail renderer; automatic mode can be restored.
 page.evaluate("trainingWizard.go(3);window.groupHost=document.createElement('dialog');groupHost.className='bible-sheet-dialog';groupHost.id='group-test-host';document.body.append(groupHost);const block=currentTraining.blocks[0];groupHost.append(bibleExerciseDetail(trainingExercises.find(e=>e.id===block.exerciseId),currentTraining,{blockId:block.id,variant:block.bibleVariant}));groupHost.showModal();")
 host=page.locator('#group-test-host');host.locator('.bible-sequence-settings>summary').click()
 assert host.get_by_label('Organisation de la séquence',exact=True).input_value()=='manual'
 assert host.get_by_label('Joueurs du groupe 1',exact=True).input_value()=='8'
 for w,h in [(320,740),(390,844),(844,390),(1280,720)]:
  page.set_viewport_size({'width':w,'height':h});host.scroll_into_view_if_needed();assert host.locator('.bible-group-roster').evaluate('e=>e.scrollWidth<=e.clientWidth'),(w,h)
 host.get_by_label('Organisation de la séquence',exact=True).select_option('auto');host.get_by_label('Organisation de la séquence',exact=True).blur();page.wait_for_timeout(180)
 assert page.evaluate('!currentTraining.blocks[0].bibleVariant.sequenceSettings[0].groupRoster')
 assert page.evaluate('currentTraining.blocks[1].bibleVariant.sequenceSettings[0].groupRoster[0].players')==7
 # Different rosters with the same totals must both survive print deduplication.
 assert page.evaluate("""()=>{const e=trainingExercises.find(e=>e.id==='cover'),v=structuredClone(currentTraining.blocks[1].bibleVariant),a={players:14,keepers:1,groups:2,organisation:'stations',groupRoster:[{players:8,keepers:1},{players:6,keepers:0}]},z={...structuredClone(a),groupRoster:[{players:6,keepers:0},{players:8,keepers:1}]};v.sequenceSettings=[a,z,structuredClone(a),structuredClone(a)];const print=bibleExerciseDetail(e,currentTraining,{printing:true,variant:v});return print.querySelector('.bible-sequence-print').textContent.includes('Installation · séquence 2');}""")
 assert not errors,errors
 b.close()
print('PASS unequal groups/keepers, accurate diagrams and remaining players, per-sequence/all-sequence settings, validation, separate exercises, save/reload, responsive controls and automatic reset.')
