"""An overcrowded exercise stays incompatible until the coach chooses a real organisation."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bibleAdaptationAlternatives==='function'")
 page.evaluate("()=>{Object.assign(currentTraining,{players:40,keepers:0,category:'U17',level:'developing',space:'full'});syncTrainingForm();document.querySelector('#view-training').click();trainingWizard.openCatalogue();openBibleSheet(trainingExercises.find(e=>e.id==='rondo'));}")
 sheet=page.locator('#bible-sheet-dialog');root=sheet.locator('.bible-detail')
 # Request a single game explicitly; new previews can already suggest valid workshops.
 root.locator('.bible-sequence-settings>summary').click();root.get_by_label('Organisation de la séquence',exact=True).select_option('single');root.get_by_role('button',name='Appliquer à toutes les séquences',exact=True).click();root.locator('.bible-sequence-settings>summary').click()
 assert root.evaluate('e=>e.bibleContext.plan.groups.length===1&&!e.bibleContext.fits')
 count=page.evaluate('currentTraining.blocks.length');sheet.get_by_role('button',name='+ Ajouter à la séance',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==count
 sheet.get_by_role('button',name='Voir les adaptations possibles',exact=True).click()
 choices=root.locator('.bible-distribution-choices');rotation=choices.locator('.bible-rotation-choice');assert rotation.count()==1
 assert choices.locator('.bible-alternative-exercise').count()>0
 settings=root.evaluate('e=>e.bibleVariant()');rotation.click()
 result=root.evaluate('e=>({fits:e.bibleContext.fits,active:e.bibleContext.activePlayers,off:e.bibleContext.offPlayers,roles:e.bibleContext.plan.groups[0].roles,count:e.bibleContext.plan.groups.length})')
 assert result['fits'] and result['active']+result['off']==40 and result['off']>0 and result['count']==1
 # Choice changes only this sequence. The next one still requires a coach decision.
 root.locator('.bible-sequence-tabs button').nth(1).click();assert not root.evaluate('e=>e.bibleContext.fits')
 root.locator('.bible-sequence-tabs button').nth(0).click();assert root.evaluate('e=>e.bibleContext.fits')
 sheet.get_by_role('button',name='+ Ajouter à la séance',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==count
 # Coach explicitly applies the active group to all sequences; the block can now be kept.
 root.locator('.bible-sequence-settings > summary').click()
 root.get_by_role('button',name='Appliquer à toutes les séquences',exact=True).click()
 assert root.evaluate("e=>e.bibleVariant().sequenceSettings.every(s=>s.players<40)")
 sheet.get_by_role('button',name='+ Ajouter à la séance',exact=True).click();assert page.evaluate('currentTraining.blocks.length')==count+1
 page.set_viewport_size({'width':390,'height':844});assert sheet.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
 assert not errors,errors
 b.close();print('PASS adaptation UI: overcrowding rejected, explicit rotation or workshops, alternative exercises, independent sequences, all-sequence validation, saved variant and mobile.')
