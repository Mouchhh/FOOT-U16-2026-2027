"""Settings media persists; export places images automatically without a photo wizard."""
from playwright.sync_api import sync_playwright
from PIL import Image
import io,zipfile,re,xml.etree.ElementTree as ET
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(accept_downloads=True,viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('window.causerieVisualLibrary')
 page.locator('#coach-account-open').click();page.locator('#settings-menu-options').get_by_role('button',name='Préférences',exact=True).click();page.locator('#causerie-visual-settings').click()
 panel=page.locator('#causerie-visual-library');assert panel.is_visible()
 im=Image.new('RGB',(400,300),(230,30,40));data=io.BytesIO();im.save(data,format='PNG')
 panel.get_by_label('Ajouter des visuels de causerie',exact=True).set_input_files({'name':'photo-personnelle.png','mimeType':'image/png','buffer':data.getvalue()})
 page.wait_for_function('document.querySelectorAll(".causerie-visual-item").length===1')
 panel.get_by_label('Usage · photo-personnelle.png',exact=True).select_option('4')
 page.wait_for_function('document.querySelector("#causerie-visual-library [role=status]").textContent.includes("Usage enregistré")')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 panel.get_by_role('button',name='Fermer les visuels',exact=True).click()
 page.reload();page.wait_for_function('window.causerieVisualLibrary')
 assert page.evaluate('(async()=>{const r=await causerieVisualLibrary.read();return r.length===1&&r[0].role==="4"})()')
 # Account/team isolation and snapshot rejection after a context switch.
 assert page.evaluate('''async()=>{const original=clubNetworkSession,snapshot=causerieExportPhotos.capture();clubNetworkSession={user:{id:'other-account'}};try{if((await causerieVisualLibrary.read()).length)return false;try{await causerieExportPhotos.resolve(snapshot);return false;}catch{return true;}}finally{clubNetworkSession=original;}}''')
 original_team=page.evaluate('activeCoachTeam.id')
 page.evaluate("()=>{coachTeamDiscover({id:'team-other',label:'Autre équipe',category:'U15',team:'Stade Mayennais'},true);sessionStorage.setItem(coachTeamSelectionKey,'team-other');}")
 page.reload();page.wait_for_function('window.causerieVisualLibrary')
 assert page.evaluate('activeCoachTeam.id')=='team-other'
 assert page.evaluate('(async()=> (await causerieVisualLibrary.read()).length)()')==0
 page.evaluate('(id)=>sessionStorage.setItem(coachTeamSelectionKey,id)',original_team)
 page.reload();page.wait_for_function('window.causerieVisualLibrary')
 assert page.evaluate('(async()=> (await causerieVisualLibrary.read()).length)()')==1

 page.set_viewport_size({'width':1366,'height':1000});page.locator('#view-pitch').click();page.locator('#match-new').click();page.locator('#task-match-causerie').click()
 before=page.evaluate('JSON.stringify(getCompositionBoard())')
 with page.expect_download(timeout=120000) as dl:page.locator('#causerie-download').click()
 target='/tmp/stade-mayennais-causerie-photos-test.pptx';dl.value.save_as(target)
 ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
 with zipfile.ZipFile(target) as z:
  assert len([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)])==11
  for n in [1,4,11]:assert ET.fromstring(z.read('ppt/slides/slide'+str(n)+'.xml')).findall('.//p:pic',ns)
  images=[Image.open(io.BytesIO(z.read(n))).convert('RGB') for n in z.namelist() if re.search(r'\.(png|jpeg|jpg)$',n)]
  assert any((lambda c:c[0]>200 and c[1]<80 and c[2]<80)(image.getpixel((image.width//2,image.height//2))) for image in images)
 assert page.locator('#causerie-photo-export').count()==0
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 page.evaluate('startBlankMatch()');assert page.evaluate('(async()=> (await causerieVisualLibrary.read()).length)()')==1
 assert not errors,errors;b.close()
print('PASS: settings upload, saved usage, reload, team isolation, rejected stale context, direct 11-slide PPTX with personal picture and club fallback, no document mutation and mobile.')
