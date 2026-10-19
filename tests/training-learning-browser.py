from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1100});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:3016/?mode=local');page.locator('#view-training').click()
    page.locator('#training-category').fill('U14');page.select_option('#training-level','discovery')
    assert page.evaluate('currentTraining.age')==14
    page.locator('#training-step-link-2').click();page.locator('#training-keepers').fill('0');page.locator('#training-players').fill('6');page.select_option('#training-space-size','full');page.locator('#training-step-title-2').click()
    page.locator('#training-bible-tab').click();page.locator('#training-search').fill('Conserver sous pression')
    card=page.locator('[data-exercise="rondo"]');card.locator('.bible-card-preview>summary').click();root=card.locator('.bible-detail')
    assert 'U14' in root.locator('.bible-learning-profile').inner_text()
    assert '3 passes' in root.locator('.bible-learning-profile').inner_text()
    assert root.evaluate('r=>r.bibleContext.plan.groups[0].teams.red')==1
    width=root.evaluate('r=>r.bibleContext.plan.groups[0].width')
    card.get_by_role('button',name='+ Ajouter à la séance',exact=True).click();page.locator('#training-catalogue-close').click()
    page.locator('#training-step-link-0').click();page.locator('#training-category').fill('Seniors');page.select_option('#training-level','advanced');page.locator('#training-step-link-3').click()
    root=page.locator('#training-blocks .bible-detail').first
    assert 'Seniors' in root.locator('.bible-learning-profile').inner_text() and 'Confirmé' in root.locator('.bible-learning-profile').inner_text()
    assert root.evaluate('r=>r.bibleContext.plan.groups[0].teams.red')==2
    assert root.evaluate('r=>r.bibleContext.plan.groups[0].width')<width
    settings=root.locator('.bible-sequence-settings');settings.locator('summary').click();settings.locator('[data-criterion="width"]').fill('26');settings.locator('[data-criterion="length"]').fill('26');root.locator('.bible-facts').click();page.wait_for_timeout(180)
    assert page.evaluate('currentTraining.blocks[0].bibleVariant.autoProfile') is False
    page.locator('#training-step-link-0').click();page.locator('#training-category').fill('U16');page.select_option('#training-level','discovery');page.locator('#training-step-link-3').click()
    root=page.locator('#training-blocks .bible-detail').first
    assert root.evaluate('r=>r.bibleContext.plan.groups[0].width')==26
    assert root.evaluate('r=>r.bibleContext.plan.groups[0].teams.red')==1
    assert 'U16' in root.locator('.bible-learning-profile').inner_text()
    page.locator('#training-save').click();page.reload();page.locator('#view-training').click();page.locator('#training-step-link-3').click()
    root=page.locator('#training-blocks .bible-detail').first
    assert root.evaluate('r=>r.bibleContext.plan.groups[0].width')==26
    assert 'U16' in root.locator('.bible-learning-profile').inner_text()
    assert not errors,errors;b.close()
print('PASS: visible profile, category age sync, real opponent change, automatic dimensions, manual overrides and reload.')
