"""Compact plan owns pitch sizing, fits the page and grows again on resize."""
import os
from playwright.sync_api import sync_playwright
BASE = os.environ.get('TEST_BASE_URL', 'http://127.0.0.1:3016')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(BASE+'/') else route.abort())
    page.goto(BASE+'/?mode=local')
    page.wait_for_function('!!window.tacticFullscreen')
    page.locator('#view-pitch').click()
    page.evaluate("document.getElementById('document-entry-resume')?.click()")
    composition=page.evaluate('JSON.stringify(getCompositionBoard())')
    original=page.locator('#pitch').bounding_box()
    page.locator('#task-match-tactics').click()
    page.get_by_role('button',name='Placement tactique',exact=True).click()
    def measure():
        page.wait_for_timeout(800)
        result=page.evaluate("""()=>{const page=document.getElementById('terrain-page-0'),pitch=document.getElementById('pitch');return {client:page.clientHeight,scroll:page.scrollHeight,pitch:pitch.getBoundingClientRect().height,width:document.documentElement.scrollWidth}}""")
        assert result['scroll']<=result['client']+2,result
        return result
    initial=measure()
    page.evaluate('render();render();render()')
    repeated=measure()
    assert abs(repeated['pitch']-initial['pitch'])<=2,(initial,repeated)
    page.set_viewport_size({'width':1366,'height':768})
    small=measure()
    page.set_viewport_size({'width':1440,'height':1050})
    large=measure()
    assert large['pitch']>small['pitch']+80,(small,large)
    page.set_viewport_size({'width':1440,'height':900})
    restored=measure()
    assert abs(restored['pitch']-initial['pitch'])<=2,(initial,restored)
    # Opening real settings remains allowed to scroll: never conceal the form.
    page.locator('#task-match-settings > summary').click()
    assert page.locator('#task-match-settings').evaluate('(e)=>e.open')
    assert page.locator('#task-match-settings .settings').is_visible()
    assert page.locator('#task-match-settings input:visible, #task-match-settings select:visible').count()>0
    page.locator('#task-match-settings > summary').click()
    measure()
    page.locator('.tactic-fs-open-button:visible').click()
    before=page.locator('#pitch').bounding_box()['height']
    page.get_by_role('button',name='Zoomer sur le terrain').click()
    assert page.locator('#pitch').bounding_box()['height']>before*1.4
    page.keyboard.press('Escape')
    measure()
    page.locator('#task-match-composition').click()
    page.wait_for_timeout(800)
    assert page.evaluate('JSON.stringify(getCompositionBoard())')==composition
    assert abs(page.locator('#pitch').bounding_box()['height']-original['height'])<=2
    # Animation tools and mobile large editor remain reachable.
    page.locator('#task-match-tactics').click()
    page.get_by_role('button',name='Animations',exact=True).click()
    page.locator('.tactic-fs-open-button:visible').click()
    for width in (390,320):
        page.set_viewport_size({'width':width,'height':844})
        page.wait_for_timeout(300)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert page.locator('#custom-arrow').is_visible()
    page.get_by_role('button',name='Fermer le grand écran').click()
    assert not page.evaluate('tacticFullscreen.isOpen()')
    assert not errors,errors
    browser.close()
    print('PASS compact fit, repeated renders, shrink/grow/restore, settings, zoom, unchanged composition and mobile animations',initial,small,large)
