"""Report entry is a nonblocking strip, acknowledged until reload or logout."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:3016/?mode=local')
    page.wait_for_function('window.documentEntry && window.reportEntryBanner')
    page.locator('#view-reports').click()
    page.evaluate("()=>{currentReport.title='Test bannière';currentReport.info.date='2026-11-01';currentReport.info.opponent='Adversaire';currentReport.analysis.topAttack='Conserver';saveReport();reportEntryBanner.reset();}")
    page.locator('#view-home').click();page.locator('#view-reports').click()
    banner=page.locator('#report-entry-banner');banner.wait_for(state='visible')
    assert page.locator('dialog#document-entry-dialog').count()==0
    assert not page.locator('dialog[open]').count()
    page.locator('#view-home').click();page.locator('#view-reports').click()
    assert banner.count()==1
    for width in [1366,390,320]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert banner.evaluate('e=>e.getBoundingClientRect().height')<85
    page.locator('.report-entry-close').click()
    assert banner.count()==0 and page.evaluate('reportEntryBanner.dismissed()')
    page.locator('#view-home').click();page.locator('#view-reports').click()
    assert banner.count()==0 and page.locator('#report-content').is_visible()
    page.reload();page.wait_for_function('window.documentEntry && window.reportEntryBanner')
    page.locator('#view-reports').click();banner.wait_for(state='visible')
    page.evaluate("()=>{currentReport.analysis.topAttack='Modification conservée';reportAutosave();}")
    page.locator('#report-entry-open').click()
    assert banner.count()==0
    assert page.evaluate('currentReport.analysis.topAttack')=='Modification conservée'
    assert page.locator('#report-content').is_visible()
    page.locator('#view-home').click();page.locator('#view-reports').click()
    assert banner.count()==0
    page.evaluate('reportEntryBanner.reset()')
    page.locator('#view-home').click();page.locator('#view-reports').click();banner.wait_for(state='visible')
    page.evaluate('()=>saveReport()')
    assert banner.count()==0 and page.evaluate('reportEntryBanner.dismissed()')
    # Logout clears only notification acknowledgements, never unrelated session data.
    page.evaluate("()=>{sessionStorage.setItem('banner-test-unrelated','keep');sessionStorage.setItem('vestiaire-report-banner:other:team','1');clubNetworkClear();}")
    assert page.evaluate("sessionStorage.getItem('banner-test-unrelated')")=='keep'
    assert page.evaluate("sessionStorage.getItem('vestiaire-report-banner:other:team')") is None
    assert not page.evaluate('reportEntryBanner.dismissed()')
    assert not errors,errors
    browser.close()
print('Nonblocking report banner, session acknowledgement, reload reset, fresh draft, save and mobile passed')
