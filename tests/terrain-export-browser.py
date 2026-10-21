"""Export uses each board's visibility, frozen title, lane overlay and all three formats."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':768}); errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof compositionPDF==='function'")
 page.evaluate("document.querySelector('#view-pitch').click();workspaceFlows.terrain.go(0);state.title='Match U18';state.lanes=true;state.benchVisible=false;ensureOpponents().visible=true;state.arrows=[[20,70,40,50]];persist();render();document.querySelector('#composition-export').click()")
 page.wait_for_function('compositionCanvas!==null')
 for key,value in [('lanes',True),('opponents',True),('arrows',True),('bench',False)]:
  assert page.locator('#composition-export-'+key).is_checked()==value
 before=page.evaluate('JSON.stringify(state)')
 first=page.locator('#composition-export-preview').get_attribute('src')
 page.locator('#composition-export-lanes').uncheck()
 page.wait_for_function("old=>compositionCanvas!==null&&document.querySelector('#composition-export-preview').src!==old",arg=first)
 assert page.evaluate('JSON.stringify(state)')==before
 # Canvas pixels change when only the lane option changes.
 plain=page.evaluate('compositionCanvas.toDataURL()')
 page.locator('#composition-export-lanes').check();page.wait_for_function('compositionCanvas!==null')
 assert page.evaluate('compositionCanvas.toDataURL()')!=plain
 for fmt,size,box in [('portrait',[2480,3508],'595.28 841.89'),('landscape',[3508,2480],'841.89 595.28'),('slides',[2560,1440],'960 540')]:
  page.locator('#composition-export-format').select_option(fmt);page.wait_for_function('compositionCanvas!==null')
  assert page.evaluate('[compositionCanvas.width,compositionCanvas.height]')==size
  assert page.evaluate("async box=>(await (await compositionPDF(compositionCanvas)).text()).includes('/MediaBox [0 0 '+box+']')",box)
 assert page.evaluate('compositionExportName')=='Match U18'
 page.evaluate("state.title='Autre document'");assert page.evaluate('compositionExportName')=='Match U18'
 page.locator('#composition-export-close').click()
 page.evaluate("activateTerrainBoard('plan');state.lanes=false;state.opponents=undefined;state.arrows=[];persist();document.querySelector('#composition-export').click()")
 page.wait_for_function('compositionCanvas!==null')
 for key in ['lanes','opponents','arrows','bench']:assert not page.locator('#composition-export-'+key).is_checked()
 # The minimal board never paints portrait photos or name labels; numbers remain.
 assert page.evaluate("()=>{const texts=[],ctx=new Proxy({}, {set:()=>true,get:(_,key)=>key==='fillText'?t=>texts.push(String(t)):()=>{}});const s=structuredClone(state);s.players[0].name='Nom à ne pas afficher';compositionPitch(ctx,{x:0,y:0,w:2560,h:1440},true,s,new Map(),{});return texts.includes(String(s.players[0].number))&&!texts.includes('Nom à ne pas afficher');}")
 assert not errors,errors
 b.close();print('PASS terrain export: visibility per board, lane pixels, immutable document, 3 PDF formats, frozen title and numbered minimal tokens.')
