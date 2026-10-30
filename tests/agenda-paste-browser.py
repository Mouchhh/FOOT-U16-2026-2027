from playwright.sync_api import sync_playwright
PLAIN='''septembre
sam 19 sep 2026 - 17h00
U17 Division 1 - U17 - U16 Journée 2
GJ HAUT-ANJOU
GJ HAUT-ANJOU
1
1
MAYENNE STADE FC 2
MAYENNE STADE FC 2
novembre
sam 07 nov 2026 - 10h30
U17 Division 1 - U17 - U16 Journée 6
MÉRAL COSSÉ US
MÉRAL COSSÉ US
10:30
MAYENNE STADE FC 2
MAYENNE STADE FC 2'''
CUP='''ven 25 sep 2026 - 21h15
Coupe des Réserves Poivre et Sel - Senior 1er Tour
AMBRIERES CIGNE F. 2
AMBRIERES CIGNE F. 2
1
1
TAB 5 - 3
MAYENNE STADE FC 3
MAYENNE STADE FC 3'''
MARKDOWN='''**sam 19 sep 2026 - 15h30**
[**Régional 2 U15 - U15 - U14&#x20;**](https://epreuves.fff.fr/competition/engagement/452627)[Journée 2](https://epreuves.fff.fr/competition/engagement/452627)
[BEAUCOUZE SC](https://epreuves.fff.fr/competition/club/522033)
[**BEAUCOUZE SC**](https://epreuves.fff.fr/competition/club/522033)
&#x20;([image](https://cdn-transverse.azureedge.net/phlogos/BC522033.jpg))
[**02**](https://epreuves.fff.fr/competition/match/56168930-s-c-beaucouze-st-mayennais-f-c)
[MAYENNE STADE FC](https://epreuves.fff.fr/competition/club/548126)
[**MAYENNE STADE FC**](https://epreuves.fff.fr/competition/club/548126)
&#x20;([image](https://cdn-transverse.azureedge.net/phlogos/BC548126.jpg))'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Paul Test'}]))");page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaPasteParse==='function' && window.trainingWizard")
 def parse(t): return page.evaluate('(t)=>agendaPasteParse(t)',t)
 plain=parse(PLAIN);assert len(plain['fixtures'])==2 and not plain['issues'];assert plain['fixtures'][0]['score']=={'home':1,'away':1};assert 'score' not in plain['fixtures'][1]
 assert parse(PLAIN.replace('1\n1\n','1 1\n'))['fixtures'][0]['score']=={'home':1,'away':1}
 assert parse(PLAIN.replace('\n10:30\n','\n14:00\n'))['issues']
 cup=parse(CUP);assert cup['fixtures'][0]['penalties']=={'home':5,'away':3}
 md=parse(MARKDOWN);assert len(md['fixtures'])==1 and not md['issues'];assert md['fixtures'][0]['score']=={'home':0,'away':2};assert md['fixtures'][0]['fffMatchId']=='56168930';assert md['fixtures'][0]['category']=='U15'
 assert parse(MARKDOWN.replace('**02**','**80**'))['fixtures'][0]['score']=={'home':8,'away':0}
 assert parse(MARKDOWN.replace('**02**','**102**'))['issues']
 assert page.evaluate("()=>{try{agendaPasteParse('pas de rencontre');return false}catch{return true}}")
 assert page.evaluate("()=>{try{agendaPasteParse('sam 31 fév 2027 - 15h00');return false}catch{return true}}")
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.locator('#agenda-paste-open').click();d=page.locator('#agenda-paste-dialog');d.locator('#agenda-paste-text').fill(PLAIN);d.locator('#agenda-paste-analyse').click();assert d.locator('#agenda-paste-team').input_value()=='MAYENNE STADE FC 2';assert page.evaluate('agendaPasteRead().fixtures.length')==0
 d.locator('#agenda-paste-confirm').click();assert d.is_hidden();assert page.evaluate('agendaPasteRead().fixtures.length')==2;assert page.locator('#coach-agenda-month').input_value()=='2026-11';assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==1
 def import_text(t):
  page.locator('#agenda-paste-open').click();d.locator('#agenda-paste-text').fill(t);d.locator('#agenda-paste-analyse').click();d.locator('#agenda-paste-confirm').click()
 import_text(PLAIN);assert page.evaluate('agendaPasteRead().fixtures.length')==2
 moved=PLAIN.replace('sam 07 nov 2026 - 10h30','sam 14 nov 2026 - 11h00').replace('\n10:30\n','\n11:00\n');import_text(moved);assert page.evaluate('agendaPasteRead().fixtures.length')==2;assert page.evaluate("agendaPasteRead().fixtures.some(f=>f.date==='2026-11-14')")
 # Confirming a match creates a preparation, not a second agenda event, even after explicit save/reload.
 page.once('dialog',lambda x:x.accept());page.locator('[data-date="2026-11-14"] .agenda-calendar-event').click();assert page.evaluate('getCompositionBoard().matchPreparation.date')=='2026-11-14';page.locator('#save').click();page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');assert page.locator('[data-date="2026-11-14"] .agenda-calendar-event').count()==1
 page.reload();page.wait_for_function("typeof agendaPasteRead==='function'");assert page.evaluate('agendaPasteRead().fixtures.length')==2
 page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');page.locator('#agenda-paste-open').click();d.locator('#agenda-paste-text').fill(PLAIN);d.locator('#agenda-paste-analyse').click();before=page.evaluate("coachStorageGet('vestiaire-pasted-fixtures')")
 page.evaluate("()=>{window.pasteWriter=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-pasted-fixtures')throw Error('quota');return pasteWriter(k,v)}}");d.locator('#agenda-paste-confirm').click();assert page.evaluate("coachStorageGet('vestiaire-pasted-fixtures')")==before;assert 'non enregistré' in d.inner_text();page.evaluate('()=>{coachStorageSet=pasteWriter}')
 page.set_viewport_size({'width':390,'height':844});assert d.evaluate('e=>e.scrollWidth<=e.clientWidth+2');page.screenshot(path='/tmp/agenda-paste-mobile.png',full_page=True);d.get_by_role('button',name='Fermer',exact=True).click()
 # Assistant shortcut opens the same personal tool.
 page.evaluate("document.querySelector('#club-assistant').showModal()");page.locator('#assistant-paste-calendar').click();assert d.is_visible();page.once('dialog',lambda x:x.accept());d.locator('#agenda-paste-remove').click();assert page.evaluate('agendaPasteRead().fixtures.length')==0;assert page.evaluate('!!getCompositionBoard().fffFixtureKey');d.get_by_role('button',name='Fermer',exact=True).click()
 page.evaluate("document.querySelector('#club-assistant').showModal()");page.locator('#crakito-question').fill('Je veux importer mon calendrier FFF');page.locator('#crakito-form button[type=submit]').click();page.locator('#crakito-messages').get_by_role('button',name='Coller mes rencontres',exact=True).last.click();assert d.is_visible();d.get_by_role('button',name='Fermer',exact=True).click()
 # An assigned coach can paste the existing supplied calendar without duplicate events.
 enzo=b.new_context();enzo.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))");p2=enzo.new_page();p2.goto('http://127.0.0.1:3016/?mode=local');p2.wait_for_function("typeof agendaPasteRead==='function'");assert p2.evaluate('agendaPasteRead().fixtures.length')==0
 p2.locator('#view-coach-agenda').click();p2.evaluate('workspaceFlows.agenda.go(1)');p2.locator('#agenda-paste-open').click();p2.locator('#agenda-paste-text').fill(PLAIN);p2.locator('#agenda-paste-analyse').click();p2.locator('#agenda-paste-confirm').click();assert p2.evaluate("agendaCalendarEvents().filter(e=>e.kind==='match').length")==9
 assert not errors,errors
 enzo.close();ctx.close();b.close();print('FFF paste: plain/Markdown, scores/TAB, malformed text, preview, explicit personal import, reschedule/dedup, saved preparation, reload, quota, assistant and mobile passed')
