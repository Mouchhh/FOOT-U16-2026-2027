"""New match has zero players, no formation or preparation, and an independent durable ID."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.documentEntry && typeof startBlankMatch==="function"')
 page.locator('#view-pitch').click()
 if page.locator('#document-entry-dialog').count():page.locator('#document-entry-resume').click()
 page.locator('#task-match-causerie').click()
 page.locator('#match-plan-date').fill('2026-11-01');page.locator('#match-plan-opponent').fill('Match A');page.locator('#match-plan-objective-0').fill('Ancienne priorité');page.locator('#match-plan-defensive').fill('Ancien bloc')
 page.locator('#match-plan-form button[type=submit]').click()
 original=page.evaluate('getCompositionBoard().documentId');snapshot=page.evaluate('(id)=>JSON.stringify(saves.find(s=>s.state.documentId===id))',original)
 page.locator('#view-pitch').click()
 page.evaluate("()=>{squadSave([{id:'fresh-player',name:'Alex',number:9,position:'Attaquant',photo:''}]);gamePlanBoard=structuredClone(getCompositionBoard());gamePlanBoard.boardKind='plan';gamePlanBoard.documentId='old-plan';gamePlanBoard.sourceCompositionId=getCompositionBoard().documentId;gamePlanBoard.notes='Ancien plan';coachStorageSet('vestiaire-gameplan-draft',JSON.stringify(gamePlanBoard));coachStorageSet('vestiaire-last-canva-presentation',JSON.stringify({url:'https://www.canva.com/design/old',title:'A'}));beforeTactic=structuredClone(state);}")
 page.locator('#match-new').click()
 fresh=page.evaluate('getCompositionBoard().documentId');assert fresh!=original
 def blank():
  assert page.evaluate('getCompositionBoard().players.length')==0
  assert page.evaluate('getCompositionBoard().formation')=='4-3-3'
  assert page.evaluate('getCompositionBoard().notes')==''
  assert page.evaluate('getCompositionBoard().arrows.length')==0
  assert page.evaluate('Object.values(getCompositionBoard().matchPreparation).flat().every(v=>v==="")')
  assert page.locator('#players .player:not(.player-empty-slot)').count()==0
  assert page.locator('#formation').input_value()=='4-3-3'
  assert page.locator('dialog[open]').count()==0
 blank()
 assert page.evaluate('gamePlanBoard===null && beforeTactic===null')
 assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-gameplan-draft'))") is None
 assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-last-canva-presentation'))") is None
 assert page.evaluate('squadPlayers().length')==1
 assert page.evaluate('(id)=>JSON.stringify(saves.find(s=>s.state.documentId===id))',original)==snapshot
 page.reload();page.wait_for_function('window.documentEntry');page.locator('#view-pitch').click();blank()
 assert page.evaluate('getCompositionBoard().documentId')==fresh
 # Explicitly choosing a player and formation is the only way to populate the new board.
 page.locator('#match-roster-add').select_option('fresh-player');page.locator('#match-roster-add-button').click()
 assert page.evaluate('getCompositionBoard().players.length')==1;assert page.evaluate("getCompositionBoard().players[0].squadPlayerId==='fresh-player'&&getCompositionBoard().players[0].id!=='fresh-player'")
 page.locator('#formation').select_option('4-4-2')
 assert page.evaluate('getCompositionBoard().formation')=='4-4-2'
 assert page.evaluate('(id)=>JSON.stringify(saves.find(s=>s.state.documentId===id))',original)==snapshot
 page.evaluate("()=>saveNamedComposition()")
 # The old decision screen still rejects a stale click instead of replacing modified work.
 page.locator('#view-home').click();page.locator('#view-pitch').click()
 choice=page.locator('#document-entry-dialog');choice.wait_for(state='visible')
 page.evaluate("()=>{state.notes='Modification pendant le choix';persist()}")
 choice.locator('#document-entry-create').click()
 assert 'Le compte ou le document a changé' in choice.inner_text()
 assert page.evaluate('getCompositionBoard().documentId')==fresh
 choice.get_by_role('button',name='Fermer',exact=True).click();choice.wait_for(state='detached')
 page.locator('#view-pitch').click()
 if choice.count():choice.locator('#document-entry-resume').click()
 # Failed reset leaves both the visible match and its draft unchanged.
 page.evaluate("()=>{window.freshSet=coachStorageSet;coachStorageSet=(key,value)=>{if(key==='vestiaire-gameplan-draft')throw Error('quota');return freshSet(key,value)}}")
 prior=page.evaluate('JSON.stringify(getCompositionBoard())');page.locator('#match-new').click()
 assert page.evaluate('JSON.stringify(getCompositionBoard())')==prior
 assert page.evaluate("coachStorageGet('vestiaire-draft')")==prior
 page.evaluate('()=>{coachStorageSet=freshSet}')
 # The existing new-causerie command also bypasses the old heavy choice window.
 page.evaluate("()=>documentEntry.request('causerie',()=>{}, {force:true,newDocument:true})");blank()
 # New FFF/agenda preparations preserve only the chosen fixture context, never the last players.
 page.evaluate("()=>agendaFFFPrepare({key:'fixture-new',date:'2026-11-14',title:'Match C',opponent:'Adversaire C'})")
 assert page.evaluate('getCompositionBoard().players.length')==0
 assert page.evaluate('getCompositionBoard().formation')=='4-3-3'
 assert page.evaluate('getCompositionBoard().matchPreparation.opponent')=='Adversaire C'
 assert page.evaluate('getCompositionBoard().matchPreparation.defensive')==''
 assert page.locator('dialog[open]').count()==0
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844});page.locator('#match-new').click();blank()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 b.close()
print('Blank composition/formation/causerie, unique IDs, durable reload, sealed prior archive, roster retention, explicit additions, quota rollback, new-causerie and FFF/mobile passed')
