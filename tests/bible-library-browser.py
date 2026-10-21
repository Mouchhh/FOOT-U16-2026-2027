"""Real browser journey through the Bible library, its adaptations and saved sessions.

The shared-document check stubs only the authenticated row read; it exercises the
real payload validator, shared preview renderer and currentTraining restoration.
It deliberately does not claim to validate a live Supabase project.
"""
import subprocess
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3016/?mode=local'
LEGACY_IDS = {'warm', 'cool', 'passes', 'rondo', 'triangle', 'build', 'press',
              'trap', 'cover', 'block', 'transition', 'counter', 'switch',
              'overlap', 'finish', 'cutback', 'duel', 'support', 'cpa-attack',
              'cpa-defence', 'keeper-feet', 'keeper-duel', 'touch', 'freegame'}


def catalogue(page):
    page.locator('#training-bible-tab').click()
    assert page.locator('#training-step-3').is_visible()
    assert page.locator('#training-catalogue-drawer').is_visible()


def reset_filters(page):
    if page.locator('#bible-reset').is_visible():
        page.locator('#bible-reset').click()


def group(page, players, keepers=0, space='half', width=None, length=None):
    if page.locator('#training-catalogue-drawer').is_visible():
        page.locator('#training-catalogue-close').click()
    page.locator('#training-step-link-2').click()
    # Lower the number of keepers first, so reducing the group never leaves an
    # intermediate invalid form which would block the next input's change event.
    page.locator('#training-keepers').fill('0')
    page.locator('#training-players').fill(str(players))
    page.locator('#training-keepers').fill(str(keepers))
    page.select_option('#training-space-size', space)
    if space == 'custom':
        page.locator('#training-space-width').fill(str(width))
        page.locator('#training-space-length').fill(str(length))
    page.locator('#training-step-title-2').click()
    assert page.evaluate('applyTrainingForm()')
    assert page.evaluate('currentTraining.players') == players
    assert page.evaluate('currentTraining.keepers') == keepers


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1100})
    errors, console_errors = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def console_error(msg):
        if msg.type != 'error':
            return
        # These pre-existing resources are unrelated to library execution:
        # cloud egress may block Google Fonts, and Python's static server has no
        # fallback favicon. Every other error remains a test failure.
        url = msg.location.get('url', '')
        if url.startswith('https://fonts.googleapis.com/') or url.endswith('/favicon.ico'):
            return
        console_errors.append({'text':msg.text, 'location':msg.location})
    page.on('console', console_error)
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(BASE)
    page.locator('#view-training').click()

    # A rich library cannot silently lose the exercise IDs of existing sessions.
    ids = page.evaluate('trainingExercises.map(e=>e.id)')
    assert len(ids) >= 60, len(ids)
    assert len(ids) == len(set(ids)), 'Duplicate exercise IDs'
    assert LEGACY_IDS <= set(ids), LEGACY_IDS - set(ids)
    data_audit = page.evaluate('''() => {
      const failures=[];
      for(const e of trainingExercises){
        const k=bibleKnowledge[e.id];
        if(!k){failures.push(e.id+': no knowledge');continue;}
        if(!e.title||!e.goal||!e.success||!e.rules?.length||!e.cues?.length)
          failures.push(e.id+': incomplete practical card');
        if(!k.objective||!k.context||!k.systems||!k.principles?.length)
          failures.push(e.id+': no tactical context');
        if(k.sequences?.length!==4||k.sequences.some(s=>!s.title||!s.rule||!s.observe))
          failures.push(e.id+': incomplete sequence progression');
        if(!k.sourceIds?.length||k.sourceIds.some(id=>!bibleSources[id]?.url?.startsWith('https://')))
          failures.push(e.id+': invalid provenance');
      }
      return failures;
    }''')
    assert not data_audit, data_audit
    catalog_plans = page.evaluate('''() => {
      const failures=[];let cases=0;
      for(const exercise of trainingExercises)for(const n of [2,7,14,40,60,80])
      for(const keepers of [0,Math.min(2,n-2)])for(const space of ['small','half','full']){
        const plan=biblePlan(exercise,{players:n,keepers,space,age:16,level:'developing'});
        const fail=message=>failures.push(exercise.id+' '+n+'/'+keepers+' '+space+': '+message);
        if(plan.groups.reduce((s,g)=>s+g.players,0)!==n)fail('missing or duplicate player');
        if(plan.groups.reduce((s,g)=>s+g.keepers,0)!==keepers)fail('missing keeper');
        if(plan.fits&&(plan.footprint.width>plan.available.width||plan.footprint.length>plan.available.length))
          fail('compatible footprint exceeds available space');
        for(const g of plan.groups){
          if(g.teams.blue+g.teams.red+g.teams.neutral+g.activeKeepers+g.rotatingKeepers!==g.players)
            fail('roles do not match participants');
          if(g.material.bibsBlue+g.material.bibsRed+g.material.bibsNeutral+g.material.bibsKeeper!==g.players)
            fail('bibs do not match participants');
        }
        cases++;
      }
      return {failures,cases};
    }''')
    assert not catalog_plans['failures'], catalog_plans['failures']

    # Preserve both entry paths: a blank personal exercise and the existing library.
    page.locator('#training-step-link-1').click()
    page.locator('#training-manual').click()
    assert page.evaluate('currentTraining.creationMode') == 'manual'
    page.locator('#training-step-link-0').click()
    page.locator('#training-title').fill('Bible · préparation collective')
    page.locator('#training-duration').fill('60')
    group(page, 12, 2)
    catalogue(page)
    assert page.locator('.training-catalogue-card').count() == 3
    # Details are genuinely lazy: no hidden full SVG for every result.
    assert page.locator('#training-catalogue .bible-detail').count() == 0
    page.locator('#bible-more').click()
    assert page.locator('.training-catalogue-card').count() == 3
    assert page.locator('#training-custom-add').is_visible()

    # Search is accent-insensitive, and the coach can use familiar possession and
    # transition words rather than needing the internal theme names.
    page.locator('#training-search').fill('possession')
    assert page.locator('.training-catalogue-card').count() > 0
    assert page.locator('.training-catalogue-card[data-exercise="rondo"]').count() == 1
    page.locator('#training-search').fill('démarquage')
    accented = page.locator('.training-catalogue-card').evaluate_all('(es)=>es.map(e=>e.dataset.exercise)')
    page.locator('#training-search').fill('demarquage')
    assert page.locator('.training-catalogue-card').evaluate_all('(es)=>es.map(e=>e.dataset.exercise)') == accented
    assert accented
    page.locator('#training-search').fill('transition offensive')
    transition_ids = page.locator('.training-catalogue-card').evaluate_all('(es)=>es.map(e=>e.dataset.exercise)')
    assert transition_ids
    assert page.evaluate('(ids)=>ids.every(id=>bibleKnowledge[id].phase==="win")', transition_ids)
    reset_filters(page)

    page.select_option('#bible-phase', 'loss')
    phase_ids = page.locator('.training-catalogue-card').evaluate_all('(es)=>es.map(e=>e.dataset.exercise)')
    assert phase_ids
    assert page.evaluate('(ids)=>ids.every(id=>bibleKnowledge[id].phase==="loss")', phase_ids)
    reset_filters(page)
    page.select_option('#training-filter', 'Conservation')
    assert page.locator('.training-catalogue-card').count() > 0
    assert page.evaluate('''() => [...document.querySelectorAll('.training-catalogue-card')]
      .every(card=>trainingExercises.find(e=>e.id===card.dataset.exercise).theme==='Conservation')''')
    page.locator('.bible-search-options > summary').click()
    page.select_option('#bible-method', 'Jeu')
    assert page.locator('.training-catalogue-card').count() > 0
    assert page.evaluate('''() => [...document.querySelectorAll('.training-catalogue-card')]
      .every(card=>trainingExercises.find(e=>e.id===card.dataset.exercise).method==='Jeu')''')
    reset_filters(page)

    # Read an actual adapted card and its source links before personalising it.
    page.locator('#training-search').fill('Conserver sous pression')
    rondo = page.locator('.training-catalogue-card[data-exercise="rondo"]')
    rondo.locator('.bible-card-preview > summary').click()
    rondo.locator('.bible-detail').wait_for()
    assert rondo.locator('.bible-extra[open]').count() == 0
    assert rondo.locator('.bible-sources a[href^="https://"]').count() > 0
    source_urls = rondo.locator('.bible-sources a').evaluate_all('(es)=>es.map(e=>e.href)')
    assert all('fifa' in u or 'fff' in u or 'uefa' in u or 'thefa' in u for u in source_urls), source_urls
    tabs = rondo.locator('.bible-sequence-tabs button')
    assert tabs.count() >= 2
    tabs.nth(1).click()
    assert tabs.nth(1).get_attribute('aria-pressed') == 'true'
    assert tabs.first.get_attribute('aria-pressed') == 'false'
    assert rondo.locator('.training-diagram-screen svg').get_attribute('data-sequence') == '1'
    page.screenshot(path='/tmp/bible-desktop.png', animations='disabled')

    rondo.get_by_role('button', name='Créer ma variante', exact=True).click()
    variant = page.locator('#bible-variant-dialog')
    assert variant.is_visible()
    variant.locator('#bible-variant-name').fill('Rondo · angles du mardi')
    for key, value in {'width':18, 'length':18, 'groups':2, 'duration':12, 'sequences':3, 'rest':60}.items():
        variant.locator('#bible-variant-'+key).fill(str(value))
    variant.locator('details > summary').click()
    variant.locator('#bible-variant-rule-0').fill('Trouver deux angles de passe avant de recevoir.')
    assert 'compatible' in variant.locator('#bible-variant-preview').inner_text()
    variant.locator('button[type=submit]').click()
    assert variant.is_hidden()
    assert page.evaluate('currentTraining.blocks.length') == 1
    saved_variant = page.evaluate('structuredClone(currentTraining.blocks[0].bibleVariant)')
    assert saved_variant['groups'] == 2 and saved_variant['width'] == saved_variant['length'] == 18
    assert saved_variant['sequences'] == 3 and saved_variant['restSeconds'] == 60
    assert saved_variant['sequenceRules'][0] == 'Trouver deux angles de passe avant de recevoir.'
    plan = page.evaluate('biblePlan(trainingExerciseForBlock(currentTraining.blocks[0]),currentTraining,currentTraining.blocks[0].bibleVariant)')
    assert plan['fits'], plan['warnings']
    assert sum(g['players'] for g in plan['groups']) == 12
    assert sum(g['keepers'] for g in plan['groups']) == 2
    assert plan['footprint']['width'] <= plan['available']['width']
    assert plan['footprint']['length'] <= plan['available']['length']
    assert page.evaluate('trainingValid(currentTraining)')
    timeline = page.evaluate('bibleEffectiveTimeline(trainingExerciseForBlock(currentTraining.blocks[0]),12,currentTraining,currentTraining.blocks[0].bibleVariant)')
    assert len(timeline['sequences']) == 3
    assert sum(s['workSeconds']+s['restSeconds'] for s in timeline['sequences']) == 720
    assert timeline['sequences'][0]['rule'] == saved_variant['sequenceRules'][0]

    page.locator('#training-catalogue-close').click()
    block = page.locator('#training-blocks .training-block').first
    assert 'Rondo · angles du mardi' in block.locator('h3').inner_text()
    assert block.locator('.bible-sequence-tabs button').count() == 3
    # A coach is still free to build a personal situation without a source card.
    page.locator('#training-custom-add').click()
    page.locator('#custom-training-title').fill('Création entièrement libre')
    page.locator('#custom-training-goal').fill('Inventer ma propre situation de match.')
    page.locator('#custom-training-instructions').fill('Mes règles, mes choix.')
    page.locator('#custom-training-form button[type=submit]').click()
    assert page.evaluate('currentTraining.blocks[1].exerciseId') == 'custom'

    # An inspired exercise can also become a fully editable personal board,
    # while keeping provenance and the group-by-group installation instructions.
    before_match = page.evaluate('JSON.stringify([state,simpleState,gamePlanBoard])')
    catalogue(page)
    page.locator('#training-search').fill('Conserver sous pression')
    rondo = page.locator('.training-catalogue-card[data-exercise="rondo"]')
    rondo.locator('.bible-card-preview > summary').click()
    rondo.get_by_role('button',name='Agrandir la fiche',exact=True).click()
    page.screenshot(path='/tmp/bible-desktop.png', animations='disabled')
    page.locator('#bible-sheet-dialog').get_by_role('button',name='Ouvrir dans l’atelier libre',exact=True).click()
    assert page.locator('#custom-training-dialog').is_visible()
    assert page.evaluate('validExerciseBoard(serializeExerciseBoard())')
    copied_board = page.evaluate('structuredClone(serializeExerciseBoard())')
    assert len(copied_board['frames'][0]['objects']) > 6
    assert 'Emprise totale' in page.locator('#custom-training-organisation').input_value()
    assert 'Total séance' in page.locator('#custom-training-material').input_value()
    page.locator('#custom-training-title').fill('Mon rondo dans l’atelier')
    page.locator('#custom-training-form button[type=submit]').click()
    assert page.evaluate('currentTraining.blocks[2].custom.bibleOrigin.exerciseId') == 'rondo'
    assert page.evaluate('currentTraining.blocks[2].custom.board') == copied_board
    assert page.evaluate('JSON.stringify([state,simpleState,gamePlanBoard])') == before_match
    page.locator('#training-catalogue-close').click()
    page.locator('#training-save').click()
    saved = page.evaluate('structuredClone(currentTraining)')
    page.reload()
    page.locator('#view-training').click()
    assert page.evaluate('currentTraining.blocks') == saved['blocks']
    assert page.evaluate('trainingLibrary[0].blocks') == saved['blocks']
    page.locator('#training-step-link-3').click()
    copied_block = page.locator('#training-blocks .training-block').nth(2)
    assert copied_block.locator('.bible-sources a').count() > 0
    copied_block.get_by_role('button',name='Modifier mon exercice',exact=True).click()
    page.locator('#studio-tab-sheet').click()
    page.locator('#custom-training-instructions').fill('Mon ajustement personnel après observation du groupe.')
    page.locator('#custom-training-form button[type=submit]').click()
    assert page.evaluate('currentTraining.blocks[2].custom.bibleOrigin') == saved['blocks'][2]['custom']['bibleOrigin']
    assert page.evaluate('currentTraining.blocks[2].custom.board') == copied_board
    assert page.evaluate('currentTraining.blocks[2].custom.instructions') == 'Mon ajustement personnel après observation du groupe.'

    # Export through the real printable document path, including hidden details.
    page.evaluate('window.print=()=>{}')
    page.locator('#training-pdf').click()
    page.emulate_media(media='print')
    page.pdf(path='/tmp/bible-library-session.pdf', prefer_css_page_size=True, print_background=True)
    printed = subprocess.check_output(['pdftotext','-layout','/tmp/bible-library-session.pdf','-'], text=True)
    assert 'Rondo' in printed and 'angles du mardi' in printed
    assert '18 m de largeur' in printed and '18 m de longueur' in printed
    assert 'chasuble' in printed and 'coupelle' in printed
    assert 'Trouver deux angles de passe' in printed
    assert 'Sources' in printed and 'récupération' in printed
    assert 'Création entièrement libre' in printed
    page.emulate_media(media='screen')
    page.evaluate('document.body.classList.remove("training-printing")')

    # Shared rendering must preserve the current coach's exact draft. Only the
    # row fetch is mocked; no actual educator account or live DB is exercised.
    shared_result = page.evaluate('''async () => {
      const before=JSON.stringify(currentTraining),request=clubNetworkRequest,session=clubNetworkSession;
      const payload=structuredClone(currentTraining);payload.title='Séance du collègue';
      const row={id:'bible-fixture',owner_id:'11111111-1111-4111-8111-111111111111',
        kind:'training',source_id:payload.id,title:payload.title,payload,revision:2};
      try{
        clubNetworkRequest=async()=>[row];
        clubNetworkSession={user:{id:'22222222-2222-4222-8222-222222222222'}};
        await clubNetworkOpen({id:row.id});
        return {same:before===JSON.stringify(currentTraining),text:document.querySelector('#club-network-preview-content').textContent,
          sources:document.querySelectorAll('#club-network-preview-content .bible-sources a').length};
      }finally{clubNetworkRequest=request;clubNetworkSession=session;document.querySelector('#club-network-preview').close();}
    }''')
    assert shared_result['same']
    assert 'Séance du collègue' in shared_result['text'] and 'Rondo · angles du mardi' in shared_result['text']
    assert shared_result['sources'] > 0

    # Tiny real-world spaces cannot be silently declared compatible with large
    # groups, and dimensions supplied by the coach survive saving and reloading.
    group(page, 60, 0, 'custom', 6, 6)
    catalogue(page)
    reset_filters(page)
    if not page.locator('#bible-fit-only').is_visible():
        page.locator('.bible-search-options > summary').click()
    page.locator('#bible-fit-only').check()
    assert page.locator('.training-catalogue-card').count() == 0
    assert '0 exercice' in page.locator('#bible-results').inner_text()
    page.locator('#bible-fit-only').uncheck()
    assert page.locator('.bible-fit-warning').count() > 0
    group(page, 40, 2, 'custom', 48, 40)
    assert page.evaluate('currentTraining.spaceWidth') == 48
    assert page.evaluate('currentTraining.spaceLength') == 40
    page.reload()
    page.locator('#view-training').click()
    page.locator('#training-step-link-2').click()
    assert page.locator('#training-space-width').input_value() == '48'
    assert page.locator('#training-space-length').input_value() == '40'
    for n in [2, 40, 60, 80]:
        group(page, n, 0)
        assert page.evaluate('trainingValid(currentTraining)')
        audit = page.evaluate('''() => {
          const p=biblePlan(trainingExercises.find(e=>e.id==='rondo'),currentTraining);
          return {players:p.groups.reduce((s,g)=>s+g.players,0),keepers:p.groups.reduce((s,g)=>s+g.keepers,0),
            allocation:p.groups.every(g=>g.teams.blue+g.teams.red+g.teams.neutral+g.activeKeepers+g.rotatingKeepers===g.players),
            fit:!p.fits||(p.footprint.width<=p.available.width&&p.footprint.length<=p.available.length)};
        }''')
        assert audit == {'players':n,'keepers':0,'allocation':True,'fit':True}, audit
    assert not page.evaluate('trainingValid({...currentTraining,players:81})')
    assert not page.evaluate('trainingValid({...currentTraining,players:1})')

    # The library and adaptation dialog remain usable on a phone.
    group(page, 12, 2)
    page.set_viewport_size({'width':390,'height':844})
    catalogue(page)
    reset_filters(page)
    page.locator('#training-search').fill('Conserver sous pression')
    rondo = page.locator('.training-catalogue-card[data-exercise="rondo"]')
    rondo.get_by_role('button', name='Créer ma variante', exact=True).click()
    variant = page.locator('#bible-variant-dialog')
    bounds = variant.bounding_box()
    assert bounds['x'] >= 0 and bounds['x']+bounds['width'] <= 391, bounds
    assert bounds['y'] >= 0 and bounds['height'] <= 844, bounds
    assert variant.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/bible-mobile.png', animations='disabled')
    variant.get_by_role('button',name='Fermer',exact=True).click()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    # Read the complete mobile sheet, change the active sequence and zoom only
    # its diagram. A readable large SVG must scroll inside its own container,
    # without widening either the modal or the page.
    rondo.locator('.bible-card-preview > summary').click()
    rondo.get_by_role('button',name='Agrandir la fiche',exact=True).click()
    sheet = page.locator('#bible-sheet-dialog')
    assert sheet.is_visible()
    bounds = sheet.bounding_box()
    assert bounds['x'] >= 0 and bounds['x']+bounds['width'] <= 391, bounds
    assert bounds['y'] >= 0 and bounds['height'] <= 844, bounds
    assert sheet.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    sheet.locator('.bible-sequence-tabs button').nth(1).click()
    assert sheet.locator('.training-diagram-screen svg').get_attribute('data-sequence') == '1'
    sheet.get_by_role('button',name='Agrandir le schéma',exact=True).click()
    diagram = sheet.locator('.bible-diagram')
    assert 'bible-diagram-zoomed' in diagram.get_attribute('class')
    assert sheet.get_by_role('button',name='Réduire le schéma',exact=True).get_attribute('aria-pressed') == 'true'
    assert diagram.locator('.training-diagram-screen').evaluate('(e)=>e.scrollWidth>e.clientWidth')
    assert sheet.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    diagram.locator('.training-diagram-screen').evaluate('(e)=>{e.scrollLeft=e.scrollWidth;}')
    assert diagram.locator('.training-diagram-screen').evaluate('(e)=>e.scrollLeft>0')
    page.screenshot(path='/tmp/bible-mobile-zoom.png', animations='disabled')
    sheet.get_by_role('button',name='Réduire le schéma',exact=True).click()
    assert 'bible-diagram-zoomed' not in diagram.get_attribute('class')
    assert sheet.get_by_role('button',name='Agrandir le schéma',exact=True).get_attribute('aria-pressed') == 'false'
    page.screenshot(path='/tmp/bible-mobile-sheet.png', animations='disabled')
    sheet.get_by_role('button',name='Fermer',exact=True).click()
    assert not errors, errors
    assert not console_errors, console_errors
    print('PASS: sourced catalogue and legacy IDs, lazy cards, search/phase/theme/form filters, pagination, free creation, exact player/keeper allocations, named variants and sequence timings, persistence, PDF, read-only shared rendering, custom spaces, small/large groups, validation and mobile.')
    browser.close()
