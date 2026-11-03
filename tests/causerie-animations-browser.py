"""Real OOXML motion paths, snapshot isolation, scoped selection, and embedded GIF."""
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
NS={'p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
import subprocess
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=blue:s=160x90:d=0.3','-c:v','libx264','-pix_fmt','yuv420p','-y','/tmp/causerie-demo-test.mp4'],check=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(accept_downloads=True);errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.causerieAnimations && window.causerieExport?.downloadCurrent')
    page.locator('#view-pitch').click();page.locator('#task-match-causerie').click()
    page.evaluate('''()=>{
      state.documentId='animation-test';state.title='Démo exacte';
      const initial={tokens:[{id:'p1',label:'6',side:'own',x:20,y:40}],ball:{x:30,y:50}};
      const s={sequenceId:'native-demo',scenario:'custom',step:0,tokens:structuredClone(initial.tokens),ball:{...initial.ball},customBase:initial,customSteps:[[{id:'p1',x:50,y:30,type:'move'},{id:'ball',x:50,y:30,type:'pass'}],[{id:'p1',x:70,y:35,type:'move'}]]};
      simpleCommitLibrary([{id:'native-demo',title:'Relance exacte',updatedAt:new Date().toISOString(),state:s,speed:'1',choice:'forward'}]);
    }''')
    page.locator('#causerie-demos-open').click();dialog=page.locator('#causerie-demos')
    dialog.locator('input[type=checkbox]').check()
    for width in (390,320):
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    close=dialog.get_by_role('button',name='Fermer les démonstrations')
    assert close.evaluate("e=>e.classList.contains('external-modal-close')")
    page.set_viewport_size({'width':1366,'height':900})
    dialog.locator('input[type=file]').set_input_files({'name':'demo.gif','mimeType':'image/gif','buffer':bytes.fromhex('47494638396101000100800000000000ffffff21f90400000000002c00000000010001000002024401003b')})
    page.wait_for_function('causerieAnimations.capture().media.length===1')
    dialog.locator('input[type=file]').set_input_files('/tmp/causerie-demo-test.mp4')
    page.wait_for_function('causerieAnimations.capture().media.length===2')
    dialog.get_by_role('button',name='Fermer les démonstrations').click()
    snapshot=page.evaluate('JSON.stringify({state,simpleState,saves})')
    with page.expect_download(timeout=90000) as result: page.locator('#causerie-download').click()
    out=Path('/tmp/causerie-animated.pptx');result.value.save_as(out)
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        motions=[]
        for name in z.namelist():
            if name.startswith('ppt/slides/slide') and name.endswith('.xml'):
                root=ET.fromstring(z.read(name));ids={n.attrib['id'] for n in root.findall('.//p:cNvPr',NS)}
                for motion in root.findall('.//p:animMotion',NS):
                    assert motion.find('.//p:spTgt',NS).attrib['spid'] in ids
                    motions.append(motion)
        assert len(motions)==3, len(motions)
        assert any('0.0600000' in m.attrib['path'] for m in motions)
        gifs=[n for n in z.namelist() if n.endswith('.gif')]
        assert len(gifs)>=2
        assert any(n.endswith('.mp4') and z.read(n)==Path('/tmp/causerie-demo-test.mp4').read_bytes() for n in z.namelist())
        from PIL import Image
        import io
        animated=[Image.open(io.BytesIO(z.read(n))) for n in gifs]
        assert any(getattr(im,'n_frames',1)>20 for im in animated)
        assert any(im.size==(960,540) for im in animated)
    assert page.evaluate('JSON.stringify({state,simpleState,saves})')==snapshot
    page.evaluate("state.documentId='another-match'")
    assert page.evaluate('causerieAnimations.capture().sequences.length')==0
    assert page.evaluate('causerieAnimations.capture().media.length')==0
    assert not errors,errors
    browser.close()
print('Native paths reference real shapes; exact displacements, GIF embedding, immutable export and per-document selection passed')
