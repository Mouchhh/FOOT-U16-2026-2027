"""Real player: decision pauses, measured placement cues, variants and isolation."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bibleDecisionGuide==='function'")
 result=page.evaluate('''()=>{let count=0,decisions=0;for(const e of trainingExercises){const k=bibleKnowledge[e.id],keepers=k.format.keeperMode==='single'?1:k.format.keeperMode==='feet'?0:Math.min(2,k.format.goals||0),session={...currentTraining,players:k.format.ideal,keepers,space:'full',age:17,level:'developing'};for(const g of biblePlan(e,session,{organisation:'single'}).groups)for(let d=0;d<3;d++){const plan=bibleAnimationPlan(e,g,{designIndex:d,sequenceIndex:1}),guide=bibleDecisionGuide(e,g,{designIndex:d,sequenceIndex:1},plan);for(const key of ['trigger','choice','spacing','question','correction'])if(typeof guide[key]!=='string'||guide[key].length<20)throw Error(e.id+' lacks '+key);let last=-1;for(const m of guide.moments){if(m.time<=last||m.time<=0||m.time>=plan.duration)throw Error(e.id+' invalid stop');const step=plan.steps[m.step],flight=step.motions.find(m=>m.kind==='ball');if(step.action==='pass'&&m.time>step.start+(flight.delay||0)+.001)throw Error(e.id+' decision after pass');last=m.time;decisions++;}count++;}}return {count,decisions};}''')
 assert result['count']>=189 and result['decisions']>300,result
 page.evaluate("()=>{Object.assign(currentTraining,{players:10,keepers:0,space:'full',age:17,level:'developing'});openBibleSheet(trainingExercises.find(e=>e.id==='overlap'))}")
 sheet=page.locator('#bible-sheet-dialog');figure=sheet.locator('.bible-diagram').first
 assert not figure.locator('.bible-decision-reading').get_attribute('open')
 before=figure.locator('.training-diagram-print').inner_html()
 figure.get_by_label('Pauses pédagogiques',exact=True).check()
 target=page.evaluate("document.querySelector('#bible-sheet-dialog .bible-diagram').bibleAnimation.plan.steps.length")
 figure.get_by_label('Lire la démonstration',exact=True).click()
 page.wait_for_function("()=>{const f=document.querySelector('#bible-sheet-dialog .bible-diagram');return f.dataset.animationState==='paused'&&!f.querySelector('.bible-decision-prompt').hidden}")
 t=page.evaluate("document.querySelector('#bible-sheet-dialog .bible-diagram').bibleAnimation.state.time")
 assert t>0
 figure.get_by_role('button',name='Lire la démonstration',exact=True).click()
 page.wait_for_function("t=>{const f=document.querySelector('#bible-sheet-dialog .bible-diagram');return f.dataset.animationState==='paused'&&f.bibleAnimation.state.time>t+.05}",arg=t)
 figure.get_by_label('Revenir au départ',exact=True).click()
 figure.locator('.bible-decision-reading>summary').click()
 figure.get_by_label('Repères de placement',exact=True).check()
 choices=figure.locator('.bible-role-choices button');assert choices.count()==10
 choices.nth(1).click();assert choices.nth(1).get_attribute('aria-pressed')=='true'
 text=figure.locator('.bible-placement-reading').inner_text();assert ' m' in text and 'Distances du schéma' in text,text
 assert before==figure.locator('.training-diagram-print').inner_html()
 # Existing every-action mode stays independent of the new decision mode.
 figure.get_by_label('Arrêt après chaque action',exact=True).check()
 assert not figure.get_by_label('Pauses pédagogiques',exact=True).is_checked()
 sheet.get_by_label('Variante de l’exercice',exact=True).select_option('2')
 assert sheet.locator('.bible-decision-reading').count()==1
 assert 'Choix recherché' in sheet.locator('.bible-decision-reading').text_content()
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 sheet.locator('.bible-decision-reading>summary').click()
 page.screenshot(path='/tmp/bible-decision-mobile.png',full_page=True)
 page.evaluate("()=>{document.querySelector('#bible-sheet-dialog').close();Object.assign(currentTraining,{players:6,keepers:0,space:'full'});openBibleSheet(trainingExercises.find(e=>e.id==='wall-pass'))}")
 assert sheet.locator('.bible-decision-reading').count()==1
 sheet.get_by_label('Variante de l’exercice',exact=True).select_option('1')
 assert sheet.locator('.bible-decision-reading').count()==1
 assert not sheet.locator('.bible-decision-reading').get_attribute('open')
 page.emulate_media(media='print')
 assert sheet.locator('.bible-decision-reading').evaluate("e=>getComputedStyle(e).display")=='none'
 assert not errors,errors
 b.close();print('PASS decisions:',result,'key pauses before passes, continue, measured roles, unchanged print, mutually exclusive modes, variants, mobile')
