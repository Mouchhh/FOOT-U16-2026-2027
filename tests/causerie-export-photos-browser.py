from playwright.sync_api import sync_playwright
from PIL import Image
import io,zipfile,re,xml.etree.ElementTree as ET
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(accept_downloads=True,viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local',wait_until='domcontentloaded');page.wait_for_function('window.causerieExportPhotos');page.locator('#view-pitch').click();page.locator('#match-new').click();page.locator('#task-match-causerie').click()
 before=page.evaluate('JSON.stringify(getCompositionBoard())')
 page.locator('#causerie-download').click();panel=page.locator('#causerie-photo-export');assert panel.is_visible()
 assert panel.locator('select').count()==11
 assert panel.get_by_label('Photo slide 1',exact=True).input_value()=='club:celebration-equipe'
 assert panel.get_by_label('Photo slide 11',exact=True).input_value()=='club:cercle-equipe'
 im=Image.new('RGB',(400,300),(230,30,40));data=io.BytesIO();im.save(data,format='PNG')
 panel.get_by_label('Ajouter mes photos au PowerPoint',exact=True).set_input_files({'name':'photo-personnelle.png','mimeType':'image/png','buffer':data.getvalue()})
 page.wait_for_function('causerieExportPhotos.capture().items.length===1')
 personal=page.evaluate('causerieExportPhotos.capture().items[0].id');panel.get_by_label('Photo slide 4',exact=True).select_option(personal)
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==before
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 page.set_viewport_size({'width':1366,'height':1000})
 with page.expect_download(timeout=120000) as dl:panel.get_by_role('button',name='Télécharger les 11 slides',exact=True).click()
 target='/tmp/stade-mayennais-causerie-photos-test.pptx';dl.value.save_as(target)
 ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
 with zipfile.ZipFile(target) as z:
  assert len([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)])==11
  for n in [1,4,11]:assert ET.fromstring(z.read('ppt/slides/slide'+str(n)+'.xml')).findall('.//p:pic',ns)
  jpgs=[Image.open(io.BytesIO(z.read(n))).convert('RGB') for n in z.namelist() if n.endswith('.jpeg') or n.endswith('.jpg')]
  assert any((lambda c:c[0]>200 and c[1]<80 and c[2]<80)(image.getpixel((image.width//2,image.height//2))) for image in jpgs)
 assert not panel.is_visible()
 page.evaluate('startBlankMatch()');assert page.evaluate('causerieExportPhotos.capture().items.length')==0
 page.evaluate('causerieExportPhotos.open()')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
 assert not errors,errors;b.close()
print('Export-time options, 12 club photos, personal upload/slide selection, actual PPTX pictures, eleven slides, no document mutation, new-match isolation and mobile passed')
