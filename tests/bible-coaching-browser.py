"""Coach chooses a balanced organisation, reads an action and removes a block."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1050})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('dialog', lambda d: d.accept())
    page.goto('http://127.0.0.1:3016/?mode=local')
    page.locator('#view-training').click()
    page.locator('#training-step-link-2').click()
    page.locator('#training-keepers').fill('0')
    page.locator('#training-players').fill('19')
    page.locator('#training-keepers').fill('2')
    page.select_option('#training-space-size','full')
    page.locator('#training-step-title-2').click()
    page.locator('#training-bible-tab').click()
    page.locator('#training-search').fill('Jeu de réinvestissement')
    card = page.locator('[data-exercise="freegame"]')
    card.locator('.bible-card-preview > summary').click()
    root = card.locator('.bible-detail')
    root.locator('.bible-distributions > summary').click()
    choice = root.locator('.bible-distribution-choice[data-groups="2"]')
    assert choice.is_enabled()
    choice.click()
    c = root.evaluate('r=>r.bibleContext')
    groups = c['plan']['groups']
    assert len(groups) == 2 and c['fits']
    assert sum(g['players'] for g in groups) == 19
    assert sum(g['keepers'] for g in groups) == 2
    assert max(g['players'] for g in groups)-min(g['players'] for g in groups) <= 1
    assert all(g['keepers'] == 1 for g in groups)
    root.locator('.bible-sequence-tabs button').nth(1).click()
    assert root.evaluate('r=>r.bibleContext.plan.groups.length') == 1
    root.locator('.bible-sequence-tabs button').first.click()
    assert root.evaluate('r=>r.bibleContext.plan.groups.length') == 2
    card.get_by_role('button', name='+ Ajouter à la séance', exact=True).click()
    card.get_by_role('button', name='+ Ajouter à la séance', exact=True).click()
    assert page.locator('.training-overview-row').count() == 2
    blocks = page.evaluate('structuredClone(currentTraining.blocks)')
    page.locator('#training-catalogue-close').click()
    first = page.locator('#training-blocks .training-block').first
    figure = first.locator('.bible-diagram')
    phase = figure.locator('.bible-animation-phase').first
    phase.click()
    assert phase.get_attribute('aria-pressed') == 'true'
    assert figure.locator('.bible-live-actions path').count() > 0
    assert figure.get_attribute('data-animation-state') == 'paused'
    figure.locator('.bible-animation-reset').click()
    assert figure.locator('.bible-live-actions path').count() == 0
    page.evaluate('window.__removedFigure=document.querySelector("#training-blocks .bible-diagram")')
    page.locator('.training-overview-remove').first.click()
    assert page.evaluate('currentTraining.blocks.length') == 1
    assert page.evaluate('currentTraining.blocks[0].id') == blocks[1]['id']
    assert page.evaluate('trainingTotal()') == blocks[1]['duration']
    assert page.evaluate('window.__removedFigure.bibleAnimation===null')
    assert page.locator('.training-overview-row').count() == 1
    page.locator('#training-save').click()
    page.reload()
    page.locator('#view-training').click()
    assert page.evaluate('currentTraining.blocks.length') == 1
    assert page.evaluate('currentTraining.blocks[0].bibleVariant.sequenceSettings[0].groups') == 2
    page.locator('#training-step-link-3').click()
    page.locator('#training-blocks').get_by_role('button', name='Retirer l’exercice', exact=True).click()
    assert page.evaluate('currentTraining.blocks.length') == 0
    assert page.locator('#training-block-overview').is_hidden()
    assert not errors, errors
    browser.close()
print('PASS: balanced groups and keeper counts, independent sequences, selected demonstration action, reset, both removal paths, duration, disposal and saved reload.')
