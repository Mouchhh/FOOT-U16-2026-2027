"""Actual action legend and numbered cues, with unchanged print/personal data."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof bibleAnimationReading==='function'")
 page.evaluate("Object.assign(currentTraining,{players:10,keepers:1,space:'full'});openBibleSheet(trainingExercises.find(e=>e.id==='transition'))")
 sheet=page.locator('#bible-sheet-dialog');figure=sheet.locator('.bible-diagram')
 assert figure.locator('.bible-animation-key [data-action]').count()==3
 assert 'Départ' in figure.locator('.bible-action-reading').inner_text()
 assert 'Déclencheur :' in figure.locator('.bible-animation-caption').inner_text()
 before=figure.locator('.training-diagram-print').inner_html()
 seen=page.evaluate('''()=>{const figure=document.querySelector('#bible-sheet-dialog .bible-diagram'),c=figure.bibleAnimation,seen=[];for(const action of ['pass','carry','recovery']){const step=c.plan.steps.find(s=>s.action===action);if(!step)continue;c.seek(step.start+.1);const text=figure.querySelector('.bible-action-reading').textContent,paths=[...figure.querySelectorAll('.bible-live-actions [data-action]')].map(p=>({kind:p.dataset.action,dash:p.getAttribute('stroke-dasharray'),d:p.getAttribute('d')}));seen.push({action,text,paths});}return seen;}''')
 assert any(x['action']=='recovery' and 'Interception en cours' in x['text'] for x in seen),seen
 assert any(x['action']=='pass' and '→' in x['text'] for x in seen),seen
 assert any(p['kind']=='run' and p['dash']=='6 5' for x in seen for p in x['paths']),seen
 assert any(p['kind']=='carry' and p['d'].count('L')>2 for x in seen for p in x['paths']),seen
 assert before==figure.locator('.training-diagram-print').inner_html()
 page.evaluate("(()=>{const c=document.querySelector('#bible-sheet-dialog .bible-diagram').bibleAnimation,s=c.plan.steps.find(s=>s.phase==='transition');c.seek(s.start+.1)})()")
 assert 'réaction à la perte' in figure.locator('.bible-action-reading').inner_text()
 for w,h in [(320,740),(390,844),(1280,720)]:
  page.set_viewport_size({'width':w,'height':h});assert sheet.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
  legend=figure.locator('.bible-animation-key');legend.scroll_into_view_if_needed()
  assert legend.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
  if w in [390,1280]:page.screenshot(path=f'/tmp/diagram-reading-{w}.png')
 figure.locator('.bible-animation-reset').click();assert figure.locator('.bible-action-reading').get_attribute('data-action')=='start'
 assert not errors,errors
 browser.close()
print('PASS visible legend, actual numbered actions, interception before changed roles, distinct paths, unchanged print, reset and responsive reading.')
