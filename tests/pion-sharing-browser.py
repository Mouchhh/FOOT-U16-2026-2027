"""Standalone explanations: shared copies, own second device, offline retry and isolation."""
from pathlib import Path
exec(Path(__file__).with_name('club-network-browser.py').read_text().split('with sync_playwright() as p:')[0])
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ca,a=setup(b);login(a,'a@example.test');cb,other=setup(b);login(other,'b@example.test')
 original=a.evaluate('JSON.stringify(getCompositionBoard())')
 a.evaluate("()=>{document.querySelector('#view-pitch').click();document.querySelector('#mode-simple').click();document.querySelector('#custom-arrow').click();simpleState.customSteps[0]=[{id:simpleState.tokens[0].id,x:40,y:65,type:'move'},{id:'ball',x:45,y:60,type:'pass'}];simpleState.customSteps.push([{id:simpleState.tokens[0].id,x:30,y:50,type:'move'}]);renderSimple();workspaceFlows.terrain.go(2)}")
 a.locator('#simple-sequence-name').fill('Pressing à partager');a.locator('#simple-sequence-save').click();wait_sync(a)
 source=a.evaluate('simpleState.sequenceId');remote=next(r for r in rows if r['source_id']==source);payload=copy.deepcopy(remote['payload']);entry=payload['pionExplanation']
 assert len(entry['state']['customSteps'])==2 and len(entry['state']['customSteps'][0])==2
 assert payload['players']==[] and payload['arrows']==[] and 'photo' not in json.dumps(payload)
 assert a.evaluate('JSON.stringify(getCompositionBoard())')==original
 assert a.locator('#saved .saved-entry').count()==0
 # The normal shared-document list can isolate explanations without mixing compositions.
 other.evaluate('clubNetworkQueueSync()');wait_sync(other)
 other.evaluate("document.querySelector('#view-club-network').click();workspaceFlows.club.go(1)")
 other.locator('#club-network-kind').select_option('explanation');untouched=other.evaluate('JSON.stringify(simpleState)')
 card=other.locator('.club-network-card').filter(has_text='Pressing à partager');assert card.count()==1
 card.get_by_role('button',name='Consulter',exact=True).click();other.locator('#club-network-preview').wait_for(state='visible')
 assert other.locator('#club-network-preview-content canvas').count()==1
 other.locator('#club-network-preview-content select').select_option('1');assert other.evaluate('JSON.stringify(simpleState)')==untouched
 other.locator('#club-network-copy').click();wait_sync(other)
 assert other.evaluate("document.body.classList.contains('simple-mode')")
 copied=other.evaluate('structuredClone(simpleState)');assert copied['sequenceId']!=source
 assert copied['customSteps']==entry['state']['customSteps'] and copied['tokens']==entry['state']['tokens']
 assert next(r for r in rows if r['source_id']==source)['payload']==payload
 other.locator('#animation-speed').select_option('2');other.locator('#animation-play').click()
 other.wait_for_function("document.querySelector('#animation-status').textContent==='Séquence terminée'",timeout=12000)
 assert other.evaluate('simpleState.tokens[0].x===30&&simpleState.tokens[0].y===50&&simpleState.ball.x===45&&simpleState.ball.y===60')
 other.evaluate("workspaceFlows.terrain.go(2)");other.locator('#simple-sequence-name').fill('Ma variante');other.locator('#simple-sequence-save').click();wait_sync(other)
 assert next(r for r in rows if r['source_id']==source)['payload']==payload
 # A second independent browser context with A's account obtains the same explanation.
 cc,second=setup(b);login(second,'a@example.test');assert second.evaluate('simpleLibrary.length')==1
 assert second.evaluate('simpleLibrary[0].state.customSteps')==entry['state']['customSteps']
 second.evaluate("document.querySelector('#view-pitch').click();document.querySelector('#mode-simple').click();workspaceFlows.terrain.go(2)")
 second.locator('#simple-library').select_option(source);second.locator('#simple-sequence-open').click()
 assert second.evaluate('simpleState.tokens')==entry['state']['tokens']
 second.evaluate("()=>clubNetworkOpen(clubNetworkRows.find(r=>r.source_id===simpleState.sequenceId))")
 assert second.evaluate("document.body.classList.contains('simple-mode')&&!!workspaceRecoveryEntries().explanation")
 assert second.evaluate('simpleState.customSteps')==entry['state']['customSteps']

 # Quota refuses the canonical write without losing the previous saved document.
 a.evaluate("()=>{window.nativeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===coachStorageKey('vestiaire-saves'))throw new DOMException('Full','QuotaExceededError');return nativeSet.call(this,k,v);};}")
 a.locator('#simple-sequence-name').fill('Quota refused');a.locator('#simple-sequence-save').click()
 assert a.evaluate('simpleLibrary[0].title')=='Pressing à partager'
 a.evaluate('()=>{Storage.prototype.setItem=window.nativeSet;}')
 offline=True;a.locator('#simple-sequence-name').fill('Pressing hors ligne');a.locator('#simple-sequence-save').click();wait_sync(a)
 assert a.evaluate('clubNetworkPendingJobs().length')>0
 assert next(r for r in rows if r['source_id']==source)['title']=='Explication · Pressing à partager'
 offline=False;a.evaluate('clubNetworkQueueSync()');wait_sync(a)
 assert next(r for r in rows if r['source_id']==source)['title']=='Explication · Pressing hors ligne'
 # Invalid embedded identities are refused before opening/importing.
 assert a.evaluate("()=>{const p=structuredClone(saves.find(s=>s.state.pionExplanation).state);p.pionExplanation.id='other';return !clubNetworkPayloadValid('composition',p)}")
 a.reload();a.wait_for_function("typeof clubNetworkBound==='function'&&clubNetworkBound()&&!clubNetworkBusy");wait_sync(a)
 assert a.evaluate('simpleLibrary[0].title')=='Pressing hors ligne'
 assert a.evaluate('JSON.stringify(getCompositionBoard())')==original
 # Deletion affects only A's original, never the independent copy owned by B.
 a.evaluate("document.querySelector('#view-pitch').click();document.querySelector('#mode-simple').click();workspaceFlows.terrain.go(2)")
 a.locator('#simple-library').select_option(source);a.locator('#simple-sequence-delete').click();wait_sync(a)
 assert not any(r['source_id']==source for r in rows)
 assert any(r['owner_id']==B and r['title']=='Explication · Ma variante' for r in rows)
 a.set_viewport_size({'width':390,'height':844});assert a.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 # Legacy named sequences stay available and migrate durably on explicit saving.
 localctx,local=setup(b,local=True)
 local.evaluate("entry=>coachStorageSet('vestiaire-simple-library',JSON.stringify([entry]))",entry)
 local.reload();local.wait_for_function('typeof simpleExplanationOpen==="function"')
 assert local.evaluate('simpleLibrary.length')==1
 local.evaluate("()=>{document.querySelector('#view-pitch').click();document.querySelector('#mode-simple').click();workspaceFlows.terrain.go(2)}")
 local.locator('#simple-library').select_option(entry['id']);local.locator('#simple-sequence-open').click()
 local.evaluate('workspaceFlows.terrain.go(2)');local.locator('#simple-sequence-save').click()
 assert local.evaluate("JSON.parse(coachStorageGet('vestiaire-simple-library')).length===0&&saves.filter(s=>s.state.pionExplanation).length===1")
 local.reload();assert local.evaluate('simpleLibrary.length')==1
 assert not errors,errors
 b.close();print('PASS explanations: custom arrows/steps, standalone payload, read-only preview, independent coach copy, second-device refresh, quota, offline retry, reload, delete isolation, validation and mobile. Supabase simulated.')
