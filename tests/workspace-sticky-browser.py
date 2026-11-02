"""Persistent main navigation and framing clearance at laptop/mobile sizes."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, height in [(1440, 900), (1366, 768), (390, 844)]:
        page = browser.new_page(viewport={'width':width,'height':height}, reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto('http://127.0.0.1:3016/?mode=local')
        page.wait_for_function('window.workspaceFraming && workspaceFraming.getState().revision>0')
        page.add_style_tag(content='body>main {min-height:4000px!important}')
        for selector in ['#view-home','#view-training','#view-coach-agenda','#view-reports','#workspace-squad-entry','#view-pitch']:
            revision=page.evaluate('workspaceFraming.getState().revision')
            page.locator(selector).click()
            page.wait_for_function('(r)=>workspaceFraming.getState().revision>r',arg=revision)
            page.wait_for_function("workspaceFraming.getState().phase==='idle'")
            page.evaluate("window.scrollTo({top:1000,behavior:'instant'})")
            page.wait_for_function("Math.abs(document.getElementById('workspace-navigation').getBoundingClientRect().top)<1")
            before=page.evaluate("()=>{let n=document.getElementById('workspace-navigation');return {height:n.offsetHeight,width:n.offsetWidth}}")
            assert page.evaluate("()=>{let n=document.getElementById('workspace-navigation'),r=n.getBoundingClientRect();return getComputedStyle(n).position==='sticky' && document.elementFromPoint(r.left+15,r.top+15).closest('#workspace-navigation')!==null}")
            # Same active menu frames its module below the pinned menu.
            revision=page.evaluate('workspaceFraming.getState().revision')
            page.locator(selector).click()
            page.wait_for_function('(r)=>workspaceFraming.getState().revision>r',arg=revision)
            page.wait_for_function("workspaceFraming.getState().phase==='idle'")
            assert page.evaluate("()=>{let s=workspaceFraming.getState(),n=document.getElementById('workspace-navigation'),t=document.getElementById(s.targetId);return t.getBoundingClientRect().top>=n.getBoundingClientRect().bottom-1}")
            assert before==page.evaluate("()=>{let n=document.getElementById('workspace-navigation');return {height:n.offsetHeight,width:n.offsetWidth}}")
        page.emulate_media(media='print')
        assert page.locator('#workspace-navigation').evaluate("n=>getComputedStyle(n).position")=='static'
        assert not errors,errors
        page.close()
    browser.close()
print('Sticky navigation, overlap, framing, stable dimensions and printing passed at desktop/laptop/mobile sizes')
