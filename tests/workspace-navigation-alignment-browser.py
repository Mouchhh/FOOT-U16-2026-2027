"""The rail reserves a column; header and main share one centered geometry."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height,touch in [(1366,768,False),(1920,1080,False),(2560,1440,False),(1024,768,True),(390,844,True)]:
        page=b.new_page(viewport={'width':width,'height':height},has_touch=touch,reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:3016/?mode=local')
        page.wait_for_function('document.body.classList.contains("responsive-navigation")')
        for selector in ['#view-home','#view-training','#view-coach-agenda','#view-reports','#workspace-squad-entry','#view-pitch']:
            page.locator(selector).click()
            page.wait_for_function("workspaceFraming.getState().phase==='idle'")
            geometry=page.evaluate("""()=>{
              const n=document.getElementById('workspace-navigation'),m=document.querySelector('body>main'),h=document.querySelector('body>header');
              const r=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width}};
              return {nav:r(n),main:r(m),header:r(h),left:getComputedStyle(m).paddingLeft,right:getComputedStyle(m).paddingRight,headerLeft:getComputedStyle(h).paddingLeft,radius:getComputedStyle(n).borderTopLeftRadius,dock:n.dataset.dock,overflow:document.documentElement.scrollWidth-innerWidth};
            }""")
            n,m,h=geometry['nav'],geometry['main'],geometry['header']
            assert abs(m['left']-h['left'])<1 and abs(m['right']-h['right'])<1,geometry
            assert geometry['left']==geometry['right']==geometry['headerLeft'],geometry
            expected_center=(width+n['right'])/2 if geometry['dock']=='left' else width/2
            assert abs((m['left']+m['right'])/2-expected_center)<1,geometry
            assert geometry['overflow']<=1 and geometry['radius']=='0px',geometry
            if geometry['dock']=='left':
                assert n['left']==0 and n['top']==0 and abs(n['bottom']-height)<1,geometry
                assert m['left']>=n['right'],geometry
            else:
                assert n['left']==0 and n['right']==width and abs(n['bottom']-height)<1,geometry
        assert not errors,errors
        page.close()
    b.close()
print('Reserved rail, centered available column, shared header/content gutters, mobile edges and no overflow passed')
