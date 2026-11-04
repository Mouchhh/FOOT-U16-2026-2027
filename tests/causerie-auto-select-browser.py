from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.compositionPlayerPicker');page.locator('#view-pitch').click();page.locator('#match-new').click()
 page.evaluate(r'''()=>{
 const source=newBlankMatch();source.documentId='auto-causerie';source.title='Match référence';source.notes='Notes tactiques complètes';source.benchSlotCount=2;
 source.players=[{id:'auto-starter',name:'Basile',number:8,photo:'',role:'starter',x:35,y:45,formationSlot:0},{id:'auto-sub',name:'Tobias',number:12,photo:'',role:'sub',x:92,y:20,benchX:92,benchY:20,subSlot:0}];
 source.matchPreparation.date='2026-11-08';source.matchPreparation.opponent='Adversaire';source.matchPreparation.match='Championnat';source.matchPreparation.objectives[0]='Presser ensemble';source.matchPreparation.defensive='Bloc compact\nFermer l’axe';
 saves.push({date:new Date().toISOString(),state:source});renderSaves();window.autoOriginal=JSON.stringify(source);
 }''')
 page.locator('#causerie-archive-select').select_option('auto-causerie')
 assert page.evaluate('getCompositionBoard().documentId')=='auto-causerie'
 assert page.evaluate('getCompositionBoard().players.length')==2
 assert page.evaluate('getCompositionBoard().players[0].x')==35
 assert page.evaluate("getCompositionBoard().players.filter(p=>p.role==='sub').length")==1
 assert page.locator('#match-plan-defensive').input_value()=='Bloc compact\nFermer l’axe'
 assert page.evaluate('getCompositionBoard().title')=='Match référence'
 assert page.locator('#document-entry-dialog').count()==0
 assert page.locator('#causerie-archive-select').input_value()=='auto-causerie'
 page.locator('#match-new').click()
 assert page.evaluate('getCompositionBoard().players.length')==0
 assert page.evaluate('getCompositionBoard().notes')==''
 assert page.locator('#match-plan-defensive').input_value()==''
 assert page.locator('#causerie-archive-select').input_value()==''
 assert page.locator('.player-empty-sub').count()==0
 assert page.locator('#players .player-empty-slot').count()==11
 assert page.evaluate("JSON.stringify(saves.find(s=>s.state.documentId==='auto-causerie').state)===autoOriginal")
 # An unavailable store must not replace the current match.
 before=page.evaluate('getCompositionBoard().documentId')
 page.evaluate("()=>{window.autoWriter=coachStorageSet;coachStorageSet=()=>{throw Error('quota')}}")
 page.locator('#causerie-archive-select').select_option('auto-causerie')
 assert page.evaluate('getCompositionBoard().documentId')==before
 page.evaluate('coachStorageSet=autoWriter')
 assert not errors,errors
 b.close()
print('Auto-select restores complete composition/bench/text without confirmation, new-match reset and archive/quota preservation passed')
