"""Coach creations filter into four phases and export from immutable snapshots."""
from playwright.sync_api import sync_playwright
import zipfile,re,xml.etree.ElementTree as ET
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(accept_downloads=True,viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.causerieClubSituations&&window.causerieVisualLibrary')
 page.locator('#view-pitch').click();page.locator('#match-new').click()
 page.evaluate('''()=>{
 const object={id:'equipment-1',type:'blue',x:20,y:50,rotation:0,scale:1,label:'',color:'#2855a2'};
 const custom={title:'Sortie de balle du coach',goal:'Conserver le fond original',organisation:'Organisation originale',instructions:'Consigne originale',material:'Ballon',success:'Critère original',kind:'game',width:40,length:50,board:{version:1,lines:true,seconds:1,frames:[{objects:[object]},{objects:[{...object,x:60}]}]}};
 const block={id:'personal-1',exerciseId:'custom',duration:15,notes:'',custom};
 if(!trainingKeepPersonalExercise(block))throw Error('Personal exercise not saved');
 currentTraining.blocks=[{...structuredClone(block),id:'draft-only',custom:{...structuredClone(custom),title:'Brouillon non enregistré'}}];
 createCustomSequence();simpleState.sequenceTitle='Animation du coach';simpleState.sequenceId='own-anim';simpleState.customSteps=[[{id:simpleState.tokens[0].id,x:55,y:30,type:'move'}]];
 simpleCommitLibrary([{id:'own-anim',title:'Animation du coach',updatedAt:new Date().toISOString(),speed:'1',choice:'forward',state:structuredClone(simpleState)}]);
 window.sourceBefore=JSON.stringify({personal:trainingStoredPersonalExercises(),animations:simpleLibrary});renderMatchPreparation();
 }''')
 assert page.evaluate('causerieClubSituations.exercises().length')==1
 page.locator('#task-match-causerie').click();page.locator('.causerie-clean-library > summary').evaluate_all('(rows)=>rows.forEach(row=>row.parentElement.open=true)')
 page.get_by_label('Type de contenu · Animation Offensive',exact=True).select_option('exercise')
 assert page.get_by_label('Animation Offensive · Animation du coach',exact=True).is_hidden()
 page.get_by_label('Animation Offensive · Exercice · Sortie de balle du coach',exact=True).check()
 page.get_by_label('Animation Défensive · Animation du coach',exact=True).check()
 assert page.evaluate('valid(getCompositionBoard())')
 assert page.evaluate('getCompositionBoard().causerieSlideExercises.offensive[0].custom.instructions')=='Consigne originale'
 # Source edits after linkage must not mutate the selected exercise snapshot.
 page.evaluate("()=>{const store=trainingPersonalExerciseStore();store.entries[0].block.custom.instructions='Nouvelle consigne';coachStorageSet('vestiaire-personal-exercises',JSON.stringify(store));}")
 assert page.evaluate('getCompositionBoard().causerieSlideExercises.offensive[0].custom.instructions')=='Consigne originale'
 page.reload();page.wait_for_function('window.causerieClubSituations&&window.causerieVisualLibrary')
 assert page.evaluate('getCompositionBoard().causerieSlideExercises.offensive[0].custom.instructions')=='Consigne originale'
 assert page.evaluate('valid(getCompositionBoard())')
 page.locator('#view-pitch').click();page.locator('#task-match-causerie').click()
 with page.expect_download(timeout=120000) as dl:page.locator('#causerie-download').click()
 target='/tmp/stade-causerie-club-situations.pptx';dl.value.save_as(target)
 ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
 with zipfile.ZipFile(target) as z:
  assert len([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)])==11
  root=ET.fromstring(z.read('ppt/slides/slide8.xml'));assert root.findall('.//p:pic',ns)
  assert 'Sortie de balle du coach' in ''.join(root.itertext())
  assert any(n.endswith('.gif') for n in z.namelist())
  assert 'Consigne originale' in z.read('ppt/notesSlides/notesSlide8.xml').decode()
  assert ET.fromstring(z.read('ppt/slides/slide6.xml')).findall('p:timing',ns)
 page.evaluate('startBlankMatch()');assert page.evaluate('getCompositionBoard().causerieSlideExercises===undefined')
 assert page.evaluate('causerieClubSituations.exercises().length')==1
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors;b.close()
print('PASS: saved exercises only, animation/exercise filter, isolated snapshot, actual PPTX/GIF exercise, native tactical animation, 11 slides, unchanged pedagogy, new-match reset and mobile.')
