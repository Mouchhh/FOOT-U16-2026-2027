from collections import Counter
from PIL import Image
from playwright.sync_api import sync_playwright
# The header loads this logo by default; validate the sampled red against the asset.
logo=Image.open('assets/club-logo.jpg').convert('RGB')
reds=Counter(p for p in logo.get_flattened_data() if p[0]>160 and p[1]<85 and p[2]<100)
assert reds.most_common(1)[0][0]==(228,31,40)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(1366,768),(390,844),(320,640)]:
        page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.externalModalClose')
        page.evaluate("""()=>{let d=document.createElement('dialog');d.id='multi-close';let title=document.createElement('h2');title.textContent='Fermeture uniforme';let close=document.createElement('button');close.textContent='Fermer cette fenêtre';close.onclick=()=>{window.closedWithOriginal=true;d.close()};let footer=document.createElement('button');footer.textContent='Fermer';footer.onclick=()=>d.close();let link=document.createElement('a');link.href='#';link.textContent='Fermer le panneau';link.onclick=e=>{e.preventDefault();d.close()};d.append(title,close,footer,link);document.body.append(d);d.showModal()}""")
        page.locator('#multi-close .external-modal-close').wait_for()
        assert page.locator('#multi-close .duplicate-modal-close').count()==2
        assert page.locator('#multi-close .duplicate-modal-close:visible').count()==0
        cross=page.locator('#multi-close .external-modal-close')
        assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        assert cross.evaluate("e=>getComputedStyle(e,'::before').content")=='"×"'
        assert cross.evaluate("e=>getComputedStyle(e).fontSize")=='0px'
        page.wait_for_function("()=>{let d=document.getElementById('multi-close'),x=d.querySelector('.external-modal-close'),r=x.getBoundingClientRect();return r.bottom<=d.getBoundingClientRect().top&&r.top>=0&&document.elementFromPoint(r.left+22,r.top+22)===x}")
        cross.click();assert page.evaluate('window.closedWithOriginal')
        page.locator('#view-resources').click();page.get_by_role('button',name='Consulter',exact=True).click()
        page.locator('#resource-viewer .external-modal-close').wait_for()
        assert page.locator('#resource-viewer .external-modal-close').evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        page.screenshot(path=f'/tmp/red-close-{width}.png')
        page.get_by_role('button',name='Fermer',exact=True).click()
        assert not errors,errors
        page.close()
    b.close()
print('Exact logo red, external X, long labels/links, duplicate removal and preserved original close handlers passed on desktop/mobile')
