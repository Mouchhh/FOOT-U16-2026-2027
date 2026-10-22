"""Construct a timed session, reorder/replace/remove safely and retain it after reload."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof trainingReplaceBlock==='function'")
 page.evaluate("()=>{currentTraining={...newTraining(),players:6,keepers:0,space:'full',notes:'Offrir deux angles au porteur',duration:60,themes:['Conservation'],blocks:[]};for(const [id,duration]of [['warm',10],['rondo',30],['cool',14]]){const e=trainingExercises.find(e=>e.id===id);currentTraining.blocks.push({id:'block-'+id,exerciseId:id,duration,setupMinutes:2,notes:'Notes '+id,bibleVariant:bibleInitialVariant(e,currentTraining)});}syncTrainingForm();saveTrainingDraft();document.querySelector('#view-training').click();trainingWizard.go(3);renderTrainingBlocks();}")
 assert page.evaluate("trainingValid(currentTraining)&&trainingTotal()===60&&trainingFinish()==='19:30'")
 assert page.evaluate("()=>{const b=trainingBudget();return b.setup===360&&b.work+b.rest+b.setup+b.unallocated===3600&&b.rest>0}")
 assert 'installation' in page.locator('.training-block-budget').nth(1).inner_text()
 card=page.locator('.training-block').nth(1)
 card.get_by_label('Installation avant (min)',exact=True).fill('3');card.get_by_label('Installation avant (min)',exact=True).blur()
 assert page.evaluate('trainingTotal()')==61
 card.get_by_label('Activité + récupération (min)',exact=True).fill('29');card.get_by_label('Activité + récupération (min)',exact=True).blur()
 assert page.evaluate('trainingTotal()')==60
 card.get_by_role('button',name='Monter cet exercice',exact=True).click()
 assert page.evaluate("currentTraining.blocks[0].id==='block-rondo'&&trainingReview(currentTraining).issues.some(i=>i.code==='progression')")
 page.locator('.training-block').first.get_by_role('button',name='Descendre cet exercice',exact=True).click()
 original=page.evaluate('JSON.stringify(currentTraining.blocks[1])')
 page.locator('.training-block').nth(1).get_by_role('button',name='Remplacer',exact=True).click()
 d=page.locator('#training-replace-dialog');d.get_by_role('button',name='Annuler',exact=True).click()
 assert page.evaluate('JSON.stringify(currentTraining.blocks[1])')==original
 page.locator('.training-block').nth(1).get_by_role('button',name='Remplacer',exact=True).click()
 assert d.get_by_label('Exercice compatible',exact=True).locator('option').count()>0
 d.get_by_role('button',name='Confirmer le remplacement',exact=True).click()
 assert page.evaluate("currentTraining.blocks[1].id==='block-rondo'&&currentTraining.blocks[1].exerciseId!=='rondo'&&currentTraining.blocks[1].duration===29&&currentTraining.blocks[1].setupMinutes===3&&currentTraining.blocks[1].notes==='Notes rondo'&&currentTraining.notes==='Offrir deux angles au porteur'")
 assert page.evaluate("workspaceRecoveryEntries().training.payload.blocks[1].exerciseId==='rondo'")
 # Reject edits rather than announcing success when persistence fails.
 assert page.evaluate("()=>{const before=JSON.stringify(currentTraining),writer=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};try{return !trainingCommitBlocks(blocks=>blocks.reverse())&&JSON.stringify(currentTraining)===before}finally{coachStorageSet=writer}}")
 page.locator('.training-block').nth(1).get_by_role('button',name='Remplacer',exact=True).click();page.evaluate("currentTraining.blocks[1].notes='Modifié pendant la sélection'")
 d.get_by_role('button',name='Confirmer le remplacement',exact=True).click();assert 'a changé' in d.inner_text();d.get_by_role('button',name='Annuler',exact=True).click()
 # Removal keeps a recoverable previous session.
 page.locator('.training-block').last.get_by_role('button',name='Retirer l’exercice',exact=True).click()
 assert page.evaluate('currentTraining.blocks.length===2&&workspaceRecoveryEntries().training.payload.blocks.length===3')
 page.evaluate('trainingFitDuration()');assert page.evaluate('trainingTotal()')==60
 assert page.evaluate("currentTraining.blocks.every(b=>b.duration>=trainingMinimumMinutes(b))")
 assert page.evaluate("()=>{const next=structuredClone(currentTraining);next.blocks[0].setupMinutes=-1;return !trainingValid(next)}")
 assert page.evaluate("trainingDocument().textContent.includes('installation')&&trainingDocument().textContent.includes('récupération')")
 page.reload();page.wait_for_function("typeof trainingReplaceBlock==='function'");assert page.evaluate('trainingTotal()===60&&currentTraining.blocks.length===2&&currentTraining.blocks[1].setupMinutes===3')
 assert page.evaluate("trainingAllocateMinutes(currentTraining.blocks,1)===null")
 assert page.evaluate("()=>{const custom={title:'Mon jeu',goal:'Garder deux solutions',organisation:'3 contre 3',instructions:'Trouver le partenaire libre',material:'Coupelles',success:'Deux soutiens visibles',kind:'game',width:20,length:20},block={id:'custom-test',exerciseId:'custom',duration:12,setupMinutes:2,notes:'',custom};const missing=trainingBlockBudget(block);block.recoveryMinutes=3;const known=trainingBlockBudget(block);const copy=structuredClone(currentTraining);copy.blocks=[block];return missing.unallocated===720&&known.work===540&&known.rest===180&&known.setup===120&&trainingValid(copy)&&trainingReview({...copy,duration:30}).issues.some(i=>i.code==='duration')}")
 page.evaluate("()=>{window.builderBeforeCustom=structuredClone(currentTraining);const custom={title:'Mon jeu',goal:'Deux soutiens',organisation:'3 contre 3',instructions:'Passer au partenaire libre',material:'Coupelles',success:'Deux angles',kind:'game',width:20,length:20};currentTraining.blocks=[{id:'custom-duration-check',exerciseId:'custom',duration:12,recoveryMinutes:3,setupMinutes:2,notes:'',custom}];syncTrainingForm();saveTrainingDraft();renderTrainingBlocks();openCustomTrainingExercise(currentTraining.blocks[0]);}")
 page.locator('#custom-training-duration').fill('2')
 page.locator('#custom-training-form').evaluate("e=>e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))")
 assert page.locator('#custom-training-dialog').is_visible() and page.evaluate('currentTraining.blocks[0].duration===12')
 assert 'récupération' in page.locator('#toast').inner_text()
 page.locator('#custom-training-close').click();page.evaluate('currentTraining=builderBeforeCustom;syncTrainingForm();saveTrainingDraft();renderTrainingBlocks()')
 page.screenshot(path='/tmp/training-builder-desktop.png')
 page.set_viewport_size({'width':390,'height':844});page.evaluate("document.querySelector('#view-training').click();trainingWizard.go(3)")
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 page.screenshot(path='/tmp/training-builder-mobile.png')
 assert not errors,errors
 b.close();print('PASS session builder: installation/work/recovery totals, exact schedule, reorder and progression, compatible replacement, cancellation/stale guard, failed write rollback, recovery after remove, fit preserving rest, reload, print and mobile.')
