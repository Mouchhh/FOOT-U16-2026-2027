"""Structured match preparation persists with the composition without changing the pitch-only PDF."""
from playwright.sync_api import sync_playwright
def terrain(page,index):page.locator('#terrain-step-link-'+str(index)).click()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:3016/?mode=local')
 terrain(page,1);assert page.locator('#match-plan-open').is_visible();assert page.locator('#legacy-tactical-notes').is_hidden()
 page.evaluate("state.notes='Anciennes notes du coach';render();persist()");assert page.locator('#legacy-tactical-notes').is_visible();assert page.locator('#notes').input_value()=='Anciennes notes du coach'
 terrain(page,1);page.locator('#match-plan-open').click();fields={'date':'2026-10-24','title':'Championnat · Journée 4','match':'Stade Mayennais – Équipe visiteuse','context':'Terrain humide\nGarder la concentration','opponent':'Bloc médian en 4-4-2','defensive':'Garder les distances et protéger l’axe','offensive':'Créer des angles de passe','specific':'CPA : rôles à préciser'}
 for key,value in fields.items():page.locator('#match-plan-'+key).fill(value)
 for i,value in enumerate(['Maintenir les attitudes','Progresser ensemble','Réagir à la perte','Rester exigeants']):page.locator('#match-plan-objective-'+str(i)).fill(value)
 page.locator('#match-plan-form button[type=submit]').click();assert page.locator('#match-plan-dialog').is_hidden();assert page.evaluate('saves.length')==1;assert page.evaluate("saves[0].state.matchPreparation.objectives[2]")=='Réagir à la perte';assert page.locator('#match-plan-priorities li').count()==4;assert 'Journée 4' in page.locator('#match-plan-summary').inner_text()
 saved=page.evaluate('structuredClone(state.matchPreparation)');page.reload();assert page.evaluate('state.matchPreparation')==saved;terrain(page,1);page.locator('#match-plan-open').click();assert page.locator('#match-plan-context').input_value()==fields['context'];page.locator('#match-plan-close').click()
 # Switching drafts keeps the composition preparation intact; a new form in the tactical draft is independent.
 page.locator('#mode-focus').click();page.evaluate("state.matchPreparation.objectives[0]='Objectif propre à cette vue';persist()");page.locator('#mode-team').click();assert page.evaluate('state.matchPreparation')==saved
 # Library reload restores the saved preparation, not later unsaved edits.
 terrain(page,1);page.locator('#match-plan-open').click();page.locator('#match-plan-context').fill('Modification du brouillon');page.locator('#match-plan-close').click();terrain(page,2);page.locator('#saved .saved-entry>button').first.click();assert page.evaluate('state.matchPreparation')==saved
 assert not page.evaluate('valid({...state,matchPreparation:{...state.matchPreparation,date:"2026-02-30"}})');assert not page.evaluate('valid({...state,matchPreparation:{...state.matchPreparation,objectives:["one"]}})');assert page.evaluate('valid({...state,matchPreparation:undefined})')
 # Match preparation is readable in colleague previews and kept out of the composition PDF.
 text=page.evaluate('matchPreparationDocument(state.matchPreparation).textContent');assert fields['specific'] in text;assert 'Objectif du jour' in text
 terrain(page,2);page.locator('#pdf').click();page.wait_for_function('compositionCanvas!==null');assert page.evaluate('(()=>{const p=compositionCanvas.getContext("2d").getImageData(0,0,1,1).data;return p[1]>p[0]&&p[1]>p[2]})()');page.locator('#composition-export-close').click()
 page.set_viewport_size({'width':390,'height':844});terrain(page,1);page.locator('#match-plan-open').click();assert page.locator('#match-plan-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors
 print('PASS: match board fields, four priorities, saved/reloaded composition, legacy notes, independent tactical draft, schema validation, colleague preview, pitch-only export and mobile.')
 b.close()
