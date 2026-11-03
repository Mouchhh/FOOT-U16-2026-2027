"""Direct current-causerie PPTX next to Canva, without a duplicate in the Canva dialog."""
from pathlib import Path
exec(Path(__file__).with_name('causerie-export-browser.py').read_text().split('with sync_playwright() as p:')[0])
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':900},accept_downloads=True,reduced_motion='reduce');errors=[];uploads=[]
    page.on('pageerror',lambda error:errors.append(str(error)));page.on('request',lambda request:uploads.append(request.url) if request.method in ('POST','PUT','PATCH') else None)
    page.route('**/canva-config.js*',lambda route:route.fulfill(content_type='application/javascript',body="window.CLUB_CANVA_GATEWAY='';"))
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.causerieExport?.downloadCurrent && window.externalModalClose')
    page.locator('#view-pitch').click();page.locator('#task-match-causerie').click()
    page.evaluate(r"""()=>{state.documentId='ppt-direct-test';state.title='Causerie précise';state.matchPreparation={...newMatchPreparation(),date:'2026-11-07',opponent:'Adversaire',defensive:'  Défendre ensemble <&>\nSans reformulation.  ',offensive:'Progresser côté libre',objectives:['Idée 1','','Idée 3','']};state.notes='Consigne exacte éàç';state.players[0].name='Capitaine';render();persist();gamePlanBoard={...structuredClone(state),documentId:'ppt-linked-test',boardKind:'plan',sourceCompositionId:state.documentId,title:'Vue liée',notes:'Plan lié exact'};}""")
    row=page.locator('.causerie-direct-actions');assert row.locator('[data-causerie-export]').count()==1 and row.locator('#causerie-download').count()==1
    assert page.locator('#causerie-dialog #causerie-download').count()==0
    original=page.evaluate('JSON.stringify({state,gamePlanBoard})')
    with page.expect_download(timeout=60000) as download:page.locator('#causerie-download').click()
    path=Path('/tmp/causerie-direct-placement.pptx');download.value.save_as(path);assert download.value.suggested_filename.endswith('.pptx')
    texts,images=slide_texts(path);joined='\n'.join(text for slide in texts for text in slide)
    for value in ['Défendre ensemble <&>','Sans reformulation.','Progresser côté libre','Consigne exacte éàç','Capitaine','Plan lié exact']:assert value in joined,value
    assert images==2 and page.evaluate('JSON.stringify({state,gamePlanBoard})')==original
    assert not page.locator('#causerie-dialog').is_visible()
    # Existing include-linked choice remains effective, while each download takes fresh content.
    row.locator('[data-causerie-export]').click();dialog=page.locator('#causerie-dialog');assert dialog.is_visible();assert dialog.get_by_role('button',name='PowerPoint (.pptx)',exact=True).count()==0
    page.locator('#causerie-linked').uncheck();cross=dialog.locator('.external-modal-close');cross.wait_for();assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)';cross.click()
    page.evaluate("state.notes='Nouvelle consigne exacte';render()")
    with page.expect_download(timeout=60000) as download:page.locator('#causerie-download').click()
    path=Path('/tmp/causerie-direct-fresh.pptx');download.value.save_as(path);texts,images=slide_texts(path);joined='\n'.join(text for slide in texts for text in slide)
    assert images==1 and 'Nouvelle consigne exacte' in joined and 'Consigne exacte éàç' not in joined
    # Blue/white controls stay side by side on touch screens with no horizontal overflow.
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844});canva=row.locator('[data-causerie-export]').bounding_box();ppt=row.locator('#causerie-download').bounding_box()
        assert abs(canva['y']-ppt['y'])<2 and canva['width']>=44 and ppt['height']>=44
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert page.locator('#causerie-download').evaluate('e=>getComputedStyle(e).borderLeftColor')=='rgb(228, 31, 40)'
        page.locator('#causerie-download').scroll_into_view_if_needed();page.screenshot(path=f'/tmp/causerie-ppt-placement-{width}.png')
    assert not uploads and not errors,(uploads,errors)
    browser.close()
print('Direct real PPTX next to Canva, no duplicate dialog action, exact current texts, linked choice, read-only generation and mobile placement passed')
