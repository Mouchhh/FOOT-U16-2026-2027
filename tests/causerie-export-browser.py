"""Real PPTX download: exact texts, pagination, diagrams, frozen snapshot and local-only data."""
import re
import hashlib
import struct
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from playwright.sync_api import sync_playwright

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
OUT = Path('/tmp/causerie-export-test.pptx')

def slide_texts(path):
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
        files = sorted((n for n in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
                       key=lambda n: int(re.search(r'(\d+)\.xml', n).group(1)))
        slides = []
        for name in files:
            root = ET.fromstring(archive.read(name))
            slides.append(['\n'.join(''.join(t.text or '' for t in p.findall('.//a:t', NS))
                                     for p in body.findall('a:p', NS))
                           for body in root.iter() if body.tag.endswith('}txBody')])
        images = [n for n in archive.namelist() if n.startswith('ppt/media/') and n.endswith('.png')]
        assert images, 'Missing pitch image'
        for name in images:
            assert archive.read(name).startswith(b'\x89PNG\r\n\x1a\n')
        pitch_images={hashlib.sha256(archive.read(name)).hexdigest() for name in images
                      if struct.unpack('>II',archive.read(name)[16:24])==(1920,1080)}
        assert pitch_images, 'Missing full landscape pitch'
        theme=archive.read('ppt/theme/theme1.xml').decode()
        assert 'Calistoga' in theme and 'Montserrat' in theme
        assert any('214FA0' in archive.read(name).decode() for name in files)
        return slides, len(pitch_images)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1366, 'height': 900}, accept_downloads=True,
                            reduced_motion='reduce')
    page.route('**/canva-config.js*', lambda route: route.fulfill(content_type='application/javascript', body="window.CLUB_CANVA_GATEWAY='';"))
    errors, uploads = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda req: uploads.append(req.url) if req.method in ('POST', 'PUT', 'PATCH') else None)
    page.goto('http://127.0.0.1:3016/?mode=local')
    page.wait_for_function("typeof causerieExport==='object'")
    assert page.locator('[data-causerie-export]').count() == 3
    page.evaluate("document.querySelector('#view-pitch').click();workspaceFlows.terrain.go(2)")
    page.locator('#personal-canva-download>summary').click()
    for width in [390, 1366]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert page.locator('#causerie-last-page').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.locator('#causerie-last-page').click()
    assert page.locator('#causerie-dialog').is_visible()
    page.get_by_role('button', name='Fermer la préparation Canva', exact=True).click()
    page.locator('#personal-canva-create').click()
    assert 'attend l’activation' in page.locator('#causerie-status').inner_text()
    page.get_by_role('button', name='Fermer la préparation Canva', exact=True).click()
    assert page.evaluate("typeof PptxGenJS==='undefined'"), 'Library must load on demand'
    fixture = page.evaluate(r"""() => {
      state.documentId='causerie-test';state.title='Causerie exacte – U16';
      state.notes=('  Consigne <sans reformulation> & précision : éàç ⚽\n\n').repeat(170);
      state.matchPreparation=newMatchPreparation();
      for(const key of Object.keys(matchPlanFields))state.matchPreparation[key]=key==='date'?'2026-10-28':'  '+key+' : Texte EXACT <&>\nDeuxième ligne.  ';
      state.matchPreparation.objectives=['1er objectif exact','','Troisième idée','  Quatrième idée  '];
      state.players[0].name='Prénom exact';state.players[1].role='sub';state.players[1].name='Remplaçant';
      ensureOpponents().visible=true;state.arrows=[[20,70,40,50]];state.benchVisible=true;
      render();persist();
      gamePlanBoard=structuredClone(state);gamePlanBoard.boardKind='plan';gamePlanBoard.documentId='linked-plan';
      gamePlanBoard.sourceCompositionId=state.documentId;gamePlanBoard.title='Vue liée EXACTE';gamePlanBoard.notes='Note propre à la vue épurée';
      return causerieExport.capture();
    }""")
    expected = page.evaluate('snapshot=>causerieExport.collect(snapshot.board)', fixture)
    complete = '\n'.join(entry['value'] for entry in expected)
    # Independent coverage: every authored preparation field and nonempty objective
    # must be present, even if the inventory or grouping implementation changes.
    for key in ['date', 'title', 'match', 'context', 'opponent', 'defensive', 'offensive', 'specific']:
        assert fixture['board']['matchPreparation'][key] in complete, key
    for value in fixture['board']['matchPreparation']['objectives']:
        if value:
            assert value in complete
    assert 'Prénom exact' in complete and 'Remplaçant' in complete
    for entry in expected:
        assert page.evaluate('value=>causerieExport.textPages(value).join(\'\')', entry['value']) == entry['value']
    before = page.evaluate('JSON.stringify({state,gamePlanBoard})')
    page.evaluate("document.querySelector('[data-causerie-export]').click()")
    assert page.locator('#causerie-linked').is_checked()
    page.locator('#causerie-linked').uncheck()
    with page.expect_download(timeout=30000) as download:
        page.locator('#causerie-download').click()
    download.value.save_as(OUT)
    assert download.value.suggested_filename.endswith('.pptx')
    slides, image_count = slide_texts(OUT)
    assert image_count == 1
    # Extract the body from every labelled slide, including every continuation page.
    for entry in expected:
        bodies = [texts[-1] for texts in slides if texts and (texts[0] == entry['label'] or
                   texts[0].startswith(entry['label']+' · '))]
        assert ''.join(bodies) == entry['value'], (entry['label'], repr(''.join(bodies)[:100]))
    assert not any('Vue liée EXACTE' in text for texts in slides for text in texts)
    assert page.evaluate('JSON.stringify({state,gamePlanBoard})') == before
    # The snapshot remains frozen even if the draft changes while the dialog is open.
    page.evaluate("state.notes='NOUVELLE VERSION À NE PAS EXPORTER';render()")
    page.locator('#causerie-linked').check()
    with page.expect_download(timeout=30000) as linked_download:
        page.locator('#causerie-download').click()
    linked_path = Path('/tmp/causerie-linked-test.pptx');linked_download.value.save_as(linked_path)
    linked_slides, linked_images = slide_texts(linked_path)
    assert linked_images == 2
    assert any('Vue liée EXACTE' == text for texts in linked_slides for text in texts)
    assert not any('NOUVELLE VERSION À NE PAS EXPORTER' in text for texts in linked_slides for text in texts)
    # Responsive dialog, retained inventory and visible, honest account status.
    for width in [320, 390, 768, 1366]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), width
        assert page.locator('#causerie-dialog').evaluate('e=>e.scrollWidth<=e.clientWidth+1'), width
    assert 'Compte Canva non connecté' in page.locator('#causerie-dialog').inner_text()
    assert not uploads, uploads
    assert not errors, errors
    page.get_by_role('button', name='Fermer la préparation Canva', exact=True).click()
    # A broken photo must abort; do not silently omit a visible portrait.
    page.evaluate("state.players[0].photo='data:image/png;base64,invalid';document.querySelector('[data-causerie-export]').click()")
    page.locator('#causerie-download').click()
    page.wait_for_function("document.querySelector('#causerie-status').textContent.startsWith('Export impossible')")
    assert 'Aucun fichier incomplet' in page.locator('#causerie-status').inner_text()
    assert not page.locator('#causerie-download').is_disabled()
    page.get_by_role('button', name='Fermer la préparation Canva', exact=True).click()
    page.evaluate("state.players[0].photo='';state.clubLogo='data:image/png;base64,invalid';document.querySelector('[data-causerie-export]').click()")
    page.locator('#causerie-download').click()
    page.wait_for_function("document.querySelector('#causerie-status').textContent.includes('logo de votre équipe')")
    assert 'Aucun fichier incomplet' in page.locator('#causerie-status').inner_text()
    browser.close()
    print('PASS: exact PPTX text including long notes/whitespace/accents, pagination, pitch PNG, linked plan selection, frozen draft, mobile dialog and no uploads.')
