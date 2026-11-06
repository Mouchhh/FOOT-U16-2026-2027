"""Direct workshop view: diagrams, short source extracts and separate adaptations, no data rewriting."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('window.trainingAssistantAZ')
 assert page.evaluate(r'''()=>{
 const ref=exerciseReferenceIndex.entries[0],source=exerciseReferenceIndex.resolve(ref.id),before=JSON.stringify(source);
 const block=suppliedExerciseBlock(source,{players:13,keepers:2,category:'U17',level:'confirme',moment:'libre',space:[68,105]}).block;
 const session={...newTraining(),players:13,keepers:2,level:'advanced',category:'U17'};
 const snapshot=JSON.stringify(block),card=clubTrainingBlockCard(block,0,{session});
 document.body.append(card);
 if(card.querySelectorAll('.training-workshop-diagram svg').length!==1)throw Error('Missing reference diagram');
 const geometry=svg=>[...svg.querySelectorAll('rect,path,circle,ellipse,line,polyline,polygon,text')].map(n=>[n.tagName,[...n.attributes].filter(a=>!['id','aria-labelledby'].includes(a.name)).map(a=>[a.name,a.value.replace(/url\(#[^)]+\)/g,'url(#reference)')]),n.textContent]);
 if(JSON.stringify(geometry(card.querySelector('svg')))!==JSON.stringify(geometry(suppliedReferenceBoard(source).svg)))throw Error('Different library diagram');
 if(card.querySelector('details'))throw Error('Unexpected accordion');
 if(card.querySelectorAll('.training-sequence-rules li').length>2)throw Error('Too many rules');
 if(!card.querySelector('.training-sequence-rules').textContent.includes(source.rules[0].slice(0,90)))throw Error('Rewritten rule');
 const text=card.querySelector('.training-workshop-adaptation').textContent;
 if(!text.includes('11 joueurs de champ + 2 G')||!text.includes('Confirmé'))throw Error('Missing adaptations');
 if(JSON.stringify(source)!==before||JSON.stringify(block)!==snapshot)throw Error('Source mutated');
 card.remove();
 const generated=trainingAssistantGenerate({objectives:['ball-build'],level:'Seniors Régional',players:'14 + 2',space:'half'});
 const actual=clubTrainingBlockCard(generated.blocks[0],0,{session:generated});
 if(!actual.querySelector('.training-workshop-adaptation').textContent.includes('Seniors Régional'))throw Error('Wrong inherited category');
 return true;
 }''')
 page.locator('#view-training').click();page.locator('#task-training-assistant').click()
 form=page.locator('.training-assistant-form');form.locator('[data-intention=ball]').evaluate('(node)=>node.open=true');form.locator('input[value=ball-build]').check()
 form.get_by_label('Niveau du groupe',exact=True).fill('U17 Régional');form.get_by_label('Joueurs de champ + gardiens',exact=True).fill('19 + 3')
 form.get_by_label('Organisation du groupe',exact=True).select_option('two');page.locator('#training-assistant-generate').click()
 preview=page.locator('.training-assistant-preview')
 assert preview.locator('.training-workshop').count()==8
 assert preview.locator('.training-workshop-no-diagram').count()==8
 assert preview.locator('.training-workshop-diagram svg').count()==0
 assert preview.locator('.training-workshop-adaptation').count()==8
 assert preview.locator('.training-workshop-body h4').all_text_contents().count('Organisation')==8
 assert preview.locator('details').count()==0
 first=preview.locator('.training-workshop').first
 first.get_by_role('button',name='Lire toutes les consignes',exact=True).click()
 assert first.locator('.training-workshop-full').is_visible()
 first.get_by_role('button',name='Lire toutes les consignes',exact=True).click()
 assert not first.locator('.training-workshop-full').is_visible()
 # The print path includes the same direct diagrams and separate adaptations.
 page.evaluate('window.print=()=>{}');page.get_by_role('button',name='Exporter en PDF',exact=True).click()
 assert page.locator('#training-assistant-print .training-workshop-no-diagram').count()==8
 page.evaluate("window.dispatchEvent(new Event('afterprint'))")
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.set_viewport_size({'width':1440,'height':1000});first.scroll_into_view_if_needed();page.screenshot(path='/tmp/training-workshop-direct.png')
 page.get_by_role('button',name='Ajuster dans l’éditeur',exact=True).click()
 assert page.locator('#training-blocks .training-workshop').count()==8
 assert page.locator('#training-blocks > article > details').count()==0
 assert page.locator('#training-blocks .training-workshop-adaptation').count()==8
 assert not errors,errors;b.close()
print('PASS: direct diagrams, source extracts, separate group/level/space adaptations, original content unchanged, PDF, full-text access and mobile')
