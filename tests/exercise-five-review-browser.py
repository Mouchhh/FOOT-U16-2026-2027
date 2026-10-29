"""Pilot sheets use the live roster, keep personal work, and print their coaching brief."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('/tmp/exercise-five-review');out.mkdir(exist_ok=True)
ids=['rondo','build','finish-opposition','cover','transition']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof exerciseFiveReview==='object'")
 page.locator('#view-training').click();page.locator('#task-training-bible').click();page.locator('.bible-search-options>summary').click();page.locator('#bible-five-only').check()
 assert page.locator('#bible-results').inner_text()=='5 exercices trouvés'
 page.locator('#view-home').click();page.go_back();page.wait_for_function("document.body.classList.contains('training-mode')")
 assert page.locator('#bible-five-only').is_checked()
 page.locator('#bible-reset').click();assert page.locator('#bible-results').inner_text()=='65 exercices trouvés'
 # Inspect real enlarged sheets at the session count. Personal instructions stay intact.
 page.evaluate("currentTraining.players=13;currentTraining.keepers=1;currentTraining.space='full';currentTraining.notes='Consigne personnelle à garder';syncTrainingForm();saveTrainingDraft()")
 before=page.evaluate('JSON.stringify(currentTraining)')
 for eid in ids:
  page.evaluate('id=>openBibleSheet(trainingExercises.find(e=>e.id===id))',eid)
  sheet=page.locator('#bible-sheet-dialog');assert sheet.is_visible()
  if eid=='finish-opposition':
   assert sheet.locator('.bible-rotation-choice').count()>0
   sheet.locator('.bible-distributions>summary').click()
   sheet.locator('.bible-rotation-choice').first.click()
  sheet.locator('.bible-depth-panel>summary').click()
  roles=sheet.locator('.exercise-five-roles');roles.locator('summary').click()
  numbers=roles.locator('li').all_text_contents();drawn=sheet.locator('.training-diagram-screen .bible-player').count()
  assert len(numbers)==drawn,(eid,len(numbers),drawn)
  assert sheet.locator('.exercise-five-reset').is_visible()
  if eid=='rondo':
   sheet.get_by_label('Atelier illustré · Conserver sous pression',exact=True).select_option('1')
   assert sheet.locator('.exercise-five-roles li').count()==6
  sheet.get_by_role('button',name='Fermer',exact=True).click()
 assert page.evaluate('JSON.stringify(currentTraining)')==before
 # Build review artifacts from the same live diagram/brief functions used by the sheets.
 page.evaluate("document.body.className=''")
 page.add_style_tag(content='body{margin:0!important;padding:0!important;background:#f5f8fc!important}body>*:not(#five-review-host):not(script):not(style){display:none!important}#five-review-host{display:block!important;max-width:1000px;margin:auto;padding:20px;box-sizing:border-box}#five-review-host .bible-diagram-svg{max-height:none!important;width:100%;height:auto}#five-review-host .training-diagram-print{display:none}#five-review-host p,#five-review-host li{overflow-wrap:anywhere}')
 for eid in ids:
  for count in [6,8,10,14,18]:
   result=page.evaluate('''({id,count})=>{
    let host=document.querySelector('#five-review-host');if(!host){host=document.createElement('main');host.id='five-review-host';document.body.append(host);}host.replaceChildren();
    const e=trainingExercises.find(e=>e.id===id),s={...currentTraining,players:count,keepers:id==='finish-opposition'?1:0,space:'full',category:'U16',age:16,level:'developing'},plan=biblePlan(e,s,{organisation:'auto'}),context=bibleSequenceContext(e,s,{organisation:'auto'},0);
    host.append(el('h2','',e.title+' · '+count+' joueurs'));
    if(!plan.fits){host.append(el('p','training-alert',plan.warnings.join(' ')));return {fits:false};}
    const g=plan.groups[0],svg=bibleDiagramSVG(e,g,{designIndex:0});host.append(svg,bibleCoachGuide(e,context,0),bibleExerciseEssentials(e,context,bibleTimeline(e,12,s).sequences[0]));
    const personal={...bibleInitialVariant(e,s),autoProfile:false,sequenceRules:['Ma consigne exacte : ne pas modifier','','','']};if(JSON.stringify(bibleInitialVariant(e,{...s,players:18},personal))!==JSON.stringify(personal))throw Error('personal variant changed');
    return {fits:true,players:g.players,drawn:svg.querySelectorAll('.bible-player').length,roles:host.querySelectorAll('.exercise-five-roles li').length};
   }''',{'id':eid,'count':count})
   if result['fits']:assert result['drawn']==result['roles']==result['players'],(eid,count,result)
   if count==8:
    page.locator('#five-review-host .exercise-five-roles').evaluate('e=>e.open=true')
    page.locator('#five-review-host').screenshot(path=str(out/f'{eid}-8.png'))
    page.locator('#five-review-host>svg').screenshot(path=str(out/f'{eid}-terrain.png'))
  if eid=='rondo':
   for w in [320,390,768,1366]:
    page.set_viewport_size({'width':w,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),w
   page.set_viewport_size({'width':1366,'height':900})
 # Actual print path opens disclosures and includes all five reviewed exercise briefs.
 page.evaluate('''()=>{const host=document.querySelector('#five-review-host');host.replaceChildren();for(const id of Object.keys(exerciseFiveReview)){const e=trainingExercises.find(e=>e.id===id),s={...currentTraining,players:8,keepers:id==='finish-opposition'?1:0,space:'full',age:16,category:'U16'},article=el('article');article.style.breakAfter='page';article.append(el('h2','',e.title),bibleExerciseDetail(e,s,{printing:true,variant:bibleInitialVariant(e,s)}));host.append(article);}}''')
 page.emulate_media(media='print');page.pdf(path=str(out/'cinq-exercices-reperes.pdf'),print_background=True)
 assert not errors,errors
 b.close()
print('PASS five real sheets, keeper rotation, workshop/role updates, saved notes/personal variants, 25 roster setups, mobile and PDF:',out)
