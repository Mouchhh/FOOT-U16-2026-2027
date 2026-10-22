"""The live reader distinguishes a shot, a loose ball and a goalkeeper's actual control."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1366,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof openBibleSheet==='function'")
 for exercise in ['finish','far-post','finish-rebound','keeper-duel']:
  result=page.evaluate('''id=>{
   document.querySelector('#bible-sheet-dialog')?.close();const e=trainingExercises.find(e=>e.id===id);
   Object.assign(currentTraining,{players:e.target,keepers:1,space:'full',category:'U17',age:17,level:'developing'});openBibleSheet(e);
   const root=document.querySelector('#bible-sheet-dialog .bible-diagram'),c=root.bibleAnimation;
   const print=root.querySelector('.training-diagram-print').innerHTML;
   const shot=c.plan.steps.find(s=>s.action==='shot');if(!shot)throw Error(id+' no shot');c.seek(shot.start+shot.duration*.5);
   const shotText=root.querySelector('.bible-game-state').textContent;
   let looseText='',controlText='';
   const loose=c.plan.steps.find(s=>s.phase==='loose');if(loose){c.seek(loose.start+loose.duration*.5);looseText=root.querySelector('.bible-game-state').textContent;}
   const control=c.plan.steps.find(s=>s.action==='control');if(control){c.seek(control.start+control.duration*.5);controlText=root.querySelector('.bible-game-state').textContent;}
   return {shotText,looseText,controlText,samePrint:print===root.querySelector('.training-diagram-print').innerHTML};
  }''',exercise)
  assert 'Finition' in result['shotText'] and 'tir des' in result['shotText'],(exercise,result)
  assert result['samePrint'],exercise
  if exercise=='finish-rebound':assert 'Second ballon à disputer' in result['looseText'] and 'ballon aux' not in result['looseText'],result
  if exercise=='keeper-duel':assert 'Gardien · ballon maîtrisé' in result['controlText'] and 'ballon aux rouges' in result['controlText'],result
 page.set_viewport_size({'width':390,'height':844})
 assert page.locator('#bible-sheet-dialog').evaluate('e=>e.scrollWidth<=e.clientWidth+2')
 assert not errors,errors
 b.close();print('PASS live football phases: finish, cross, rebound, goalkeeper shot/control, independent print and mobile.')
