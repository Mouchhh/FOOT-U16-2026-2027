"""Exercise the actual sequence editor, animation lifecycle and saved documents.

The shared read is mocked at the authenticated HTTP boundary only. No live club
account, Supabase project or educator data is used by this test.
"""
import subprocess
from playwright.sync_api import sync_playwright


BASE = 'http://127.0.0.1:3016/?mode=local'


def group(page, players, keepers, space):
    if page.locator('#training-catalogue-drawer').is_visible():
        page.locator('#training-catalogue-close').click()
    page.locator('#training-step-link-2').click()
    page.locator('#training-keepers').fill('0')
    page.locator('#training-players').fill(str(players))
    page.locator('#training-keepers').fill(str(keepers))
    page.select_option('#training-space-size', space)
    page.locator('#training-step-title-2').click()
    assert page.evaluate('applyTrainingForm()')


def catalogue(page, title, exercise_id):
    page.locator('#training-bible-tab').click()
    page.locator('#training-search').fill(title)
    card = page.locator('.training-catalogue-card[data-exercise="'+exercise_id+'"]')
    card.locator('.bible-card-preview > summary').click()
    card.locator('.bible-detail').wait_for()
    return card, card.locator('.bible-detail')


def sequence(root, index):
    root.locator('.bible-sequence-tabs button').nth(index).click()
    assert root.get_attribute('data-sequence-index') == str(index)


def criteria(root, **values):
    settings = root.locator('.bible-sequence-settings')
    if settings.get_attribute('open') is None:
        settings.locator('summary').click()
    for key, value in values.items():
        control = settings.locator('[data-criterion="'+key+'"]')
        if key == 'organisation':
            control.select_option(str(value))
        else:
            control.fill(str(value))
    # Leave the last field through a normal user focus change. This explicitly
    # checks that adding/navigating immediately never loses a debounced edit.
    root.locator('.bible-facts').click()
    root.page.wait_for_timeout(180)


def audit(root, players, keepers, off, groups=1):
    actual = root.evaluate('''r=>{
      const c=r.bibleContext,p=c.plan;
      return {valid:c.valid,players:c.activePlayers,keepers:c.activeKeepers,
        off:c.offPlayers,offKeepers:c.offKeepers,groups:p?.groups.length,
        roles:p?.groups.reduce((s,g)=>s+g.teams.blue+g.teams.red+g.teams.neutral+g.activeKeepers+g.rotatingKeepers,0),
        bibs:p?.groups.reduce((s,g)=>s+g.material.bibsBlue+g.material.bibsRed+g.material.bibsNeutral+g.material.bibsKeeper,0),
        allocatedKeepers:p?.groups.reduce((s,g)=>s+g.keepers,0),
        materialBalls:p?.totalMaterial.balls,
        drawnPlayers:r.querySelectorAll('.training-diagram-screen .bible-player').length,
        drawnKeepers:[...r.querySelectorAll('.training-diagram-screen .bible-player')].filter(p=>p.dataset.keeper==='true').length,
        fit:!p?.fits||(p.footprint.width<=p.available.width&&p.footprint.length<=p.available.length),
        dimensions:p?.groups.map(g=>[g.width,g.length])};
    }''')
    assert actual['valid'], actual
    assert (actual['players'], actual['keepers'], actual['off'], actual['groups']) == (players, keepers, off, groups), actual
    assert actual['roles'] == actual['bibs'] == players, actual
    assert actual['allocatedKeepers'] == keepers, actual
    assert actual['fit'], actual
    if groups == 1:
        assert actual['drawnPlayers'] == players, actual
        assert actual['drawnKeepers'] == keepers, actual
    return actual


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440, 'height':1050})
    errors, console_errors = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def console_error(msg):
        if msg.type != 'error':
            return
        url = msg.location.get('url', '')
        if url.startswith('https://fonts.googleapis.com/') or url.endswith('/favicon.ico'):
            return
        console_errors.append({'text':msg.text, 'location':msg.location})
    page.on('console', console_error)
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(BASE)
    page.locator('#view-training').click()
    page.locator('#training-step-link-0').click()
    page.locator('#training-title').fill('Séquences adaptées · contrôle terrain')
    group(page, 40, 2, 'full')
    before_match = page.evaluate('JSON.stringify([state,simpleState,gamePlanBoard])')

    # A large squad stays in one game unless the coach chooses workshops.
    card, root = catalogue(page, 'Jeu de réinvestissement', 'freegame')
    assert root.locator('.bible-sequence-tabs button').count() >= 3
    audit(root, 40, 2, 0)
    assert root.evaluate('r=>r.bibleContext.options.organisation') == 'single'
    criteria(root, players=10, keepers=0, width=32, length=24)
    a = audit(root, 10, 0, 30)
    assert a['dimensions'] == [[32,24]], a
    assert a['offKeepers'] == 2
    assert '30 hors exercice' in root.locator('.bible-facts').inner_text()
    sequence(root, 1)
    audit(root, 40, 2, 0)
    criteria(root, players=20, keepers=2, width=48, length=36)
    a = audit(root, 20, 2, 20)
    assert a['dimensions'] == [[48,36]], a
    sequence(root, 2)
    audit(root, 40, 2, 0)
    criteria(root, width=60, length=80)
    a = audit(root, 40, 2, 0)
    assert a['dimensions'] == [[60,80]], a
    sequence(root, 0)
    audit(root, 10, 0, 30)
    assert root.locator('[data-criterion="width"]').input_value() == '32'

    # The demonstration moves actual numbered tokens and the ball. Scrubbing,
    # stepping, pausing and returning to the installation must be reversible.
    figure = root.locator('.bible-diagram')
    assert figure.locator('.bible-animation-play').is_visible()
    start = figure.evaluate('r=>r.bibleAnimation.state')
    figure.locator('.bible-animation-play').click()
    page.wait_for_function('document.querySelector(\'.training-catalogue-card[data-exercise="freegame"] .bible-diagram\')?.bibleAnimation?.state.time>.25')
    figure.locator('.bible-animation-play').click()
    assert figure.get_attribute('data-animation-state') == 'paused'
    paused = figure.evaluate('r=>r.bibleAnimation.state.time')
    page.wait_for_timeout(180)
    assert figure.evaluate('r=>r.bibleAnimation.state.time') == paused
    figure.locator('.bible-animation-speed').select_option('2')
    figure.locator('.bible-animation-next').click()
    assert figure.evaluate('r=>r.bibleAnimation.state.time') > paused
    figure.locator('.bible-animation-progress').fill('3')
    advanced = figure.evaluate('r=>r.bibleAnimation.state')
    assert advanced['players'] != start['players'] or advanced['ball'] != start['ball']
    assert figure.locator('.bible-animation-caption').inner_text()
    figure.locator('.bible-animation-reset').click()
    assert figure.get_attribute('data-animation-state') == 'idle'
    assert figure.evaluate('r=>r.bibleAnimation.state.players') == start['players']
    assert figure.evaluate('r=>r.bibleAnimation.state.ball') == start['ball']
    figure.locator('.bible-animation-play').click()
    page.evaluate('window.__oldBibleFigure=document.querySelector(\'.training-catalogue-card[data-exercise="freegame"] .bible-diagram\')')
    sequence(root, 1)
    assert page.evaluate('window.__oldBibleFigure.bibleAnimation===null')
    assert root.locator('.bible-diagram').get_attribute('data-animation-state') == 'idle'
    root.locator('.training-diagram-screen').scroll_into_view_if_needed()
    page.screenshot(path='/tmp/bible-sequences-desktop.png', animations='disabled')

    # Catalogue criteria survive the normal Add action, rather than only the
    # older explicit variant modal. Modifying a saved block writes its draft.
    card.get_by_role('button', name='+ Ajouter à la séance', exact=True).click()
    assert page.evaluate('currentTraining.blocks.length') == 1
    variant = page.evaluate('structuredClone(currentTraining.blocks[0].bibleVariant)')
    assert variant['organisation'] == 'single'
    assert [s.get('players') for s in variant['sequenceSettings'][:3]] == [10,20,40]
    assert page.evaluate('trainingValid(currentTraining)')
    page.locator('#training-catalogue-close').click()
    block = page.locator('#training-blocks .training-block').first
    root = block.locator('.bible-detail')
    sequence(root, 1)
    criteria(root, players=22)
    audit(root, 22, 2, 18)
    assert page.evaluate('currentTraining.blocks[0].bibleVariant.sequenceSettings[1].players') == 22
    page.locator('#training-save').click()
    saved = page.evaluate('structuredClone(currentTraining)')
    assert page.evaluate('JSON.stringify([state,simpleState,gamePlanBoard])') == before_match
    page.reload()
    page.locator('#view-training').click()
    page.locator('#training-step-link-3').click()
    # The initial unsaved match generates fresh UUIDs on reload. Take a new
    # baseline now, then continue requiring exact isolation for all operations.
    before_match = page.evaluate('JSON.stringify([state,simpleState,gamePlanBoard])')
    assert page.evaluate('currentTraining.blocks') == saved['blocks']
    assert page.evaluate('trainingLibrary[0].blocks') == saved['blocks']
    root = page.locator('#training-blocks .training-block').first.locator('.bible-detail')
    audit(root, 10, 0, 30)
    sequence(root, 1)
    audit(root, 22, 2, 18)
    sequence(root, 2)
    audit(root, 40, 2, 0)

    # Printed/shared documents have every distinct installation and dimension,
    # not just the currently selected sequence or a live animation control.
    document_audit = page.evaluate('''()=>{
      const d=trainingDocument();
      return {text:d.textContent,controls:d.querySelectorAll('.bible-animation-play,.bible-animation-progress,.bible-sequence-settings').length,
        sources:d.querySelectorAll('.bible-sources a').length,drawings:[...d.querySelectorAll('.training-diagram-print svg')].map(s=>s.dataset.players)};
    }''')
    assert document_audit['controls'] == 0, document_audit
    assert document_audit['sources'] > 0
    for token in ['10 joueurs', '22 joueurs', '40 joueurs', '32 × 24', '48 × 36', '60 × 80', '30 hors exercice', '18 hors exercice']:
        assert token in document_audit['text'], token
    page.evaluate('window.print=()=>{}')
    page.locator('#training-pdf').click()
    page.emulate_media(media='print')
    page.pdf(path='/tmp/bible-sequences-session.pdf', prefer_css_page_size=True, print_background=True)
    printed = subprocess.check_output(['pdftotext','-layout','/tmp/bible-sequences-session.pdf','-'], text=True)
    for token in ['32 × 24', '48 × 36', '60 × 80', 'Sources', 'chasuble']:
        assert token in printed, token
    assert 'Lire la démonstration' not in printed
    page.emulate_media(media='screen')
    page.evaluate('document.body.classList.remove("training-printing")')
    shared = page.evaluate('''async()=>{
      const before=JSON.stringify(currentTraining),request=clubNetworkRequest,session=clubNetworkSession,
        payload=structuredClone(currentTraining);payload.title='Séquences du collègue';
      const row={id:'sequence-fixture',owner_id:'11111111-1111-4111-8111-111111111111',kind:'training',source_id:payload.id,title:payload.title,payload,revision:1};
      try{clubNetworkRequest=async()=>[row];clubNetworkSession={user:{id:'22222222-2222-4222-8222-222222222222'}};
        await clubNetworkOpen({id:row.id});return {same:before===JSON.stringify(currentTraining),text:document.querySelector('#club-network-preview-content').textContent};
      }finally{clubNetworkRequest=request;clubNetworkSession=session;document.querySelector('#club-network-preview').close();}
    }''')
    assert shared['same']
    for token in ['Séquences du collègue', '10 joueurs', '22 joueurs', '40 joueurs', '32 × 24', '48 × 36', '60 × 80']:
        assert token in shared['text'], token

    # Smaller group: excluded keepers are never silently turned into additional
    # field players. Sequence settings, stations and proposed sizes stay local.
    group(page, 12, 2, 'half')
    card, root = catalogue(page, 'Conserver sous pression', 'rondo')
    audit(root, 12, 2, 0)
    criteria(root, players=8, keepers=1, width=24, length=24)
    audit(root, 8, 1, 4)
    sequence(root, 1)
    criteria(root, players=12, keepers=2, width=30, length=30)
    audit(root, 12, 2, 0)
    sequence(root, 0)
    audit(root, 8, 1, 4)
    criteria(root, players=12, keepers=0)
    assert not root.evaluate('r=>r.bibleContext.valid')
    assert 'joueurs de champ' in root.locator('.bible-sequence-warning').inner_text()
    assert root.locator('.bible-animation-play').count() == 0
    criteria(root, keepers=2)
    audit(root, 12, 2, 0)
    criteria(root, organisation='stations', groups=2, width=18, length=18)
    audit(root, 12, 2, 0, groups=2)
    assert root.locator('.bible-diagram-selection select').count() == 1
    criteria(root, organisation='single', width=30, length=30)
    audit(root, 12, 2, 0)
    sequence(root, 1)
    assert root.evaluate('r=>r.bibleContext.options.organisation') == 'single'
    assert root.evaluate('r=>r.bibleContext.plan.groups.length') == 1
    criteria(root, players=13)
    assert root.locator('[data-criterion="players"]').input_value() == '13'
    assert root.locator('.bible-sequence-warning .training-alert').is_visible()
    assert root.locator('.bible-animation-play').count() == 0
    criteria(root, players=12)
    audit(root, 12, 2, 0)
    # The coach can request a coherent size rather than calculating it, then
    # explicitly share those criteria across all sequences when appropriate.
    criteria(root, width=6, length=6)
    assert not root.evaluate('r=>r.bibleContext.fits')
    assert root.locator('.bible-animation-play').count() == 0
    root.get_by_role('button', name='Proposer les dimensions', exact=True).click()
    proposed = audit(root, 12, 2, 0)
    assert proposed['dimensions'][0] != [6,6]
    assert root.evaluate('r=>r.bibleContext.fits')
    root.get_by_role('button', name='Appliquer à toutes les séquences', exact=True).click()
    common = root.evaluate('r=>r.bibleVariant().sequenceSettings')
    assert len(common) == 4 and all(s == common[0] for s in common), common
    sequence(root, 0)
    audit(root, 12, 2, 0)
    assert root.evaluate('r=>r.bibleContext.plan.groups.map(g=>[g.width,g.length])') == proposed['dimensions']

    # Bad input must not be coerced into an invented participant count.
    malformed = page.evaluate('''()=>{
      const e=trainingExercises.find(e=>e.id==='rondo'),s={...currentTraining,players:12,keepers:2};
      return [{players:13},{players:12,keepers:0},{keepers:3},{players:'8'},{width:0},{length:121},{organisation:'unknown'},null]
        .map(setting=>{const c=bibleSequenceContext(e,s,{sequenceSettings:[setting]},0);return {valid:c.valid,plan:c.plan,errors:c.errors};});
    }''')
    assert all(not c['valid'] and c['plan'] is None and c['errors'] for c in malformed), malformed
    page.set_viewport_size({'width':390, 'height':844})
    # Responsive pagination rebuilds the list; the visual preview opens the full sheet.
    card.locator('.bible-card-picture').click()
    sheet = page.locator('#bible-sheet-dialog')
    root = sheet.locator('.bible-detail')
    sequence(root, 0)
    criteria(root, players=8, keepers=1, width=24, length=24)
    audit(root, 8, 1, 4)
    assert sheet.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert root.locator('.bible-sequence-settings').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert root.locator('.bible-animation').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    root.locator('.bible-animation-play').click()
    page.wait_for_timeout(200)
    assert root.locator('.bible-diagram').get_attribute('data-animation-state') == 'playing'
    page.screenshot(path='/tmp/bible-sequences-mobile.png', animations='disabled')
    sheet.get_by_role('button', name='Fermer', exact=True).click()
    assert page.evaluate('[...bibleAnimationControllers].every(c=>c.state.time===0||c.element.closest("figure")?.dataset.animationState!=="playing")')
    assert page.evaluate('JSON.stringify([state,simpleState,gamePlanBoard])') == before_match
    assert not errors, errors
    assert not console_errors, console_errors
    print('PASS: independent sequence participants and keepers, single-group default, chosen workshops, exact material and diagrams, dimensions, animation playback/pause/seek/reset/disposal, malformed counts, drafts/save/reload, complete PDF and shared view, match isolation and mobile.')
    browser.close()
