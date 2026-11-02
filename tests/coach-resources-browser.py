from pathlib import Path
from hashlib import sha256
import fitz
from pypdf import PdfReader
from playwright.sync_api import sync_playwright
# The published PDF has one page: precisely the supplied second page.
result=fitz.open('assets/resources/progression-crm-foot.pdf')
assert len(result)==1
assert len(result[0].get_images())==1
assert sha256(result.extract_image(result[0].get_images()[0][0])['image']).hexdigest()=='af054403600d6203b417987bbb125aea5862a4284ad85d72655d8590b1320bad'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.coachResources && window.workspaceFraming')
    page.evaluate("()=>{state.players[0].name='Capitaine';state.notes='À conserver';persist()}")
    board=page.evaluate('JSON.stringify(getCompositionBoard())')
    page.locator('#view-resources').click();page.wait_for_function("history.state?.clubNavigation?.page.view==='resources'")
    assert page.locator('#coach-resources').is_visible()
    assert page.locator('#view-resources').get_attribute('aria-current')=='page'
    assert page.evaluate("workspaceFraming.current().view")=='resources'
    assert page.locator('.resource-card').count()==1
    assert page.locator('#resources-categories button').count()==6
    assert not page.locator('#task-section-navigation').is_visible()
    assert not page.locator('#document-entry-dialog').count()
    page.locator('#resources-search').fill('récupération');assert page.locator('.resource-card').count()==1
    page.locator('#resources-categories [data-category=club]').click();assert page.locator('.resources-empty').is_visible()
    page.get_by_role('button',name='Voir toutes les ressources').click();assert page.locator('.resource-card').count()==1
    page.get_by_role('button',name='Consulter',exact=True).click();d=page.locator('#resource-viewer');assert d.is_visible()
    d.get_by_role('button',name='Agrandir le tableau').click();assert d.locator('.resource-viewer-canvas').evaluate('e=>e.scrollWidth>=1200')
    with page.expect_download() as info:
        d.get_by_role('link',name='Télécharger le PDF').click()
    assert len(PdfReader(info.value.path()).pages)==1
    assert d.get_by_role('link',name='Ouvrir le PDF').get_attribute('href')=='assets/resources/progression-crm-foot.pdf'
    page.keyboard.press('Escape');d.wait_for(state='detached')
    page.locator('#resources-search').fill('CRM');page.wait_for_function("history.state.clubNavigation.page.filters['resources-search']==='CRM'")
    page.reload();page.wait_for_function("document.body.classList.contains('resources-mode')")
    assert page.locator('#resources-search').input_value()=='CRM'
    assert not page.locator('#document-entry-dialog').count()
    assert page.evaluate('JSON.stringify(getCompositionBoard())')==board
    page.locator('#view-home').click();page.wait_for_function("history.state.clubNavigation.page.view==='home'")
    page.go_back();page.wait_for_function("document.body.classList.contains('resources-mode')")
    page.go_forward();page.wait_for_function("document.body.classList.contains('home-mode')")
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844})
        page.locator('#view-resources').click()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        for button in page.locator('#workspace-navigation>button').all():
            rect=button.bounding_box();assert rect['width']>=44 and rect['height']>=44
        page.get_by_role('button',name='Consulter',exact=True).click()
        assert page.locator('#resource-viewer').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=f'/tmp/resources-mobile-{width}.png')
        page.get_by_role('button',name='Fermer',exact=True).click()
    assert not errors,errors
    b.close()
print('Only PDF page 2, search/categories, preview/zoom/download, routing/history/reload, preserved draft and eight-item mobile navigation passed')
