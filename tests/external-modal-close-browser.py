from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(1366,768),(390,844),(320,640)]:
        page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.externalModalClose')
        def external(dialog):
            dialog.locator('.external-modal-close').wait_for()
            page.wait_for_function("()=>[...document.querySelectorAll('dialog[open]')].every(d=>{let b=d.querySelector('.external-modal-close');if(!b)return false;let r=b.getBoundingClientRect(),p=d.getBoundingClientRect();return r.bottom<=p.top && r.top>=0 && r.right<=innerWidth && r.left>=0 && document.elementFromPoint(r.left+22,r.top+22)===b})")
            assert dialog.locator('.external-modal-close').count()==1
            rect=dialog.locator('.external-modal-close').bounding_box();assert rect['width']>=44 and rect['height']>=44
        page.locator('#view-resources').click();page.get_by_role('button',name='Consulter',exact=True).click()
        d=page.locator('#resource-viewer');external(d)
        d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='detached')
        # Static dialog reopening must never duplicate icons or alter its form.
        page.locator('#view-training').click();page.locator('#task-training-bible').click()
        for _ in range(2):
            page.locator('#training-custom-add').click();d=page.locator('#custom-training-dialog');external(d)
            assert d.locator('#custom-training-form').count()==1
            d.get_by_role('button',name='Fermer',exact=True).click();d.wait_for(state='hidden')
        # A dynamic dialog's original discard guard still decides whether it closes.
        page.evaluate("()=>{let d=document.createElement('dialog');d.id='guarded-close';let h=document.createElement('h2');h.textContent='Test';let close=document.createElement('button');close.textContent='Annuler';close.onclick=()=>{window.closeCalls=(window.closeCalls||0)+1;if(window.allowClose)d.close()};d.append(h,close);document.body.append(d);d.showModal()}")
        d=page.locator('#guarded-close');external(d);d.get_by_role('button',name='Annuler',exact=True).click()
        assert d.is_visible() and page.evaluate('closeCalls')==1
        page.evaluate('window.allowClose=true');d.get_by_role('button',name='Annuler',exact=True).click();d.wait_for(state='hidden')
        assert page.evaluate('closeCalls')==2
        assert not errors,errors
        page.close()
    b.close()
print('External reachable icons on desktop/mobile, 44px targets, static reopening, original forms and discard guards passed')
