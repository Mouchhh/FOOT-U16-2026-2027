from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height,touch in [(1440,900,False),(1366,768,False),(1024,768,True),(1366,1024,True),(390,844,True),(320,640,True)]:
        page=b.new_page(viewport={'width':width,'height':height},has_touch=touch,is_mobile=touch,reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:3016/?mode=local')
        page.wait_for_function('document.body.classList.contains("responsive-navigation")')
        nav=page.locator('#workspace-navigation')
        assert nav.locator(':scope>button').count()==8
        assert page.locator('#task-section-navigation').evaluate('e=>e.parentElement.tagName')=='MAIN'
        assert page.locator('#workspace-menu-toggle').is_hidden()
        assert nav.locator('svg[aria-hidden=true]').count()==8
        expected='bottom' if touch or width<1100 else 'left'
        assert nav.get_attribute('data-dock')==expected
        for selector,view in [('#view-training','training'),('#view-coach-agenda','agenda'),('#view-reports','report'),('#workspace-squad-entry','squad'),('#view-pitch','terrain'),('#view-resources','resources'),('#view-home','home')]:
            revision=page.evaluate('workspaceFraming.getState().revision')
            page.locator(selector).click()
            page.wait_for_function('(a)=>{let s=workspaceFraming.getState();return s.revision>a.r&&s.view===a.v}',arg={'r':revision,'v':view})
            page.wait_for_function("workspaceFraming.getState().phase==='idle'")
            if view not in ['squad','resources','home']:
                assert page.locator('#task-section-navigation').is_visible()
            if view=='home':assert page.locator('#task-section-navigation').is_hidden()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
            assert nav.evaluate("n=>{let r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}")
            assert page.evaluate("()=>{let n=document.getElementById('workspace-navigation'),r=n.getBoundingClientRect();return document.elementFromPoint(r.left+10,r.top+10).closest('#workspace-navigation')===n}")
            for button in nav.locator(':scope>button').all():
                rect=button.bounding_box();assert rect['width']>=44 and rect['height']>=44
            if expected=='left':
                assert page.locator('main').bounding_box()['x']>=nav.bounding_box()['x']+nav.bounding_box()['width']
            else:
                assert nav.evaluate('n=>Math.abs(n.getBoundingClientRect().bottom-innerHeight)<1')
                assert page.evaluate("parseFloat(getComputedStyle(document.body).paddingBottom)>=document.getElementById('workspace-navigation').getBoundingClientRect().height")
        page.locator('#view-home').focus();page.keyboard.press('ArrowDown' if expected=='left' else 'ArrowRight')
        assert page.locator('#view-pitch').evaluate('e=>document.activeElement===e')
        page.keyboard.press('Escape');assert nav.is_visible()
        assert not errors,errors
        page.screenshot(path=f'/tmp/navigation-dock-{width}-{touch}.png')
        if width==1366 and not touch:
            page.set_viewport_size({'width':390,'height':844})
            page.wait_for_function("document.getElementById('workspace-navigation').dataset.dock==='bottom'")
            page.set_viewport_size({'width':1366,'height':768})
            page.wait_for_function("document.getElementById('workspace-navigation').dataset.dock==='left'")
        page.close()
    b.close()
print('Desktop/laptop sidebar, touch/tablet/phone bottom bar, six modules, icons, keyboard, persistent controls and no overflow passed')
