"""Real navigation, repeated tabs, nested scrolling and motion preferences."""
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:3016/?mode=local'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for mobile in (False, True):
        page = browser.new_page(viewport={'width': 390 if mobile else 1366, 'height': 844 if mobile else 900}, reduced_motion='reduce' if mobile else 'no-preference')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(URL)
        page.wait_for_function('window.workspaceFraming && workspaceFraming.getState().revision > 0')
        def settled():
            page.wait_for_function("()=>{const s=workspaceFraming.getState();return s.phase==='idle' && Math.abs(scrollY-Math.min(s.expectedY,document.scrollingElement.scrollHeight-innerHeight))<4}")
        def click(selector, view):
            revision = page.evaluate('workspaceFraming.getState().revision')
            page.locator(selector).click()
            page.wait_for_function('(a)=>{let s=workspaceFraming.getState();return s.revision>a.r && s.view===a.v}', arg={'r': revision, 'v': view})
            try:
                settled()
            except Exception:
                print(selector, page.evaluate('({s:workspaceFraming.getState(),y:scrollY,max:document.scrollingElement.scrollHeight-innerHeight})'), flush=True)
                raise
        settled()
        for selector, view in [('#view-training','training'), ('#task-training-bible','training'), ('#task-training-library','training'), ('#view-coach-agenda','agenda'), ('#view-reports','report'), ('#workspace-squad-entry','squad'), ('#view-home','home'), ('#view-pitch','terrain')]:
            click(selector, view)
        click('#view-training', 'training')
        # A long nested pane and long document make the reset measurable.
        page.evaluate("""()=>{let root=document.getElementById('training-library-page');let pane=document.createElement('div');pane.id='framing-test-pane';pane.style.cssText='height:120px;overflow-y:auto';pane.innerHTML='<div style="height:1600px">Test</div>';root.prepend(pane);pane.scrollTop=900;let spacer=document.createElement('div');spacer.style.height='2400px';document.body.append(spacer);window.scrollTo({top:1000,behavior:'instant'})}""")
        click('#task-training-library','training')
        assert page.evaluate("document.getElementById('framing-test-pane').scrollTop") == 0
        assert page.evaluate('workspaceFraming.getState().behavior') == ('instant' if mobile else 'smooth')
        # Repeated main clicks frame the root, not the previous scroll position.
        click('#view-training','training')
        assert page.evaluate('workspaceFraming.getState().targetId') == 'training-space'
        # Ordinary modal closing does not trigger navigation. Pending navigation waits.
        page.evaluate("()=>{let d=document.createElement('dialog');d.id='framing-test-dialog';document.body.append(d);d.showModal()}")
        revision = page.evaluate('workspaceFraming.getState().revision')
        page.evaluate("workspaceFraming.request({scope:'main'})")
        page.wait_for_function("workspaceFraming.getState().phase==='waiting-dialog'")
        assert page.evaluate('workspaceFraming.getState().revision') == revision
        page.evaluate("document.getElementById('framing-test-dialog').close()")
        page.wait_for_function('(r)=>workspaceFraming.getState().revision>r',arg=revision)
        settled()
        revision = page.evaluate('workspaceFraming.getState().revision')
        page.evaluate("()=>{let d=document.getElementById('framing-test-dialog');d.showModal();d.close()}")
        page.wait_for_timeout(120)
        assert page.evaluate('workspaceFraming.getState().revision') == revision
        assert not errors, errors
        page.close()
    browser.close()
print('Desktop/mobile framing, repeated tabs, nested panes, modal deferral and reduced motion passed')
