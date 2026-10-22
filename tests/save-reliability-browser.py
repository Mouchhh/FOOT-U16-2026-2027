"""Save fault injection: durable outbox, lost acknowledgements, local conflicts and recovery."""
from pathlib import Path
exec(Path(__file__).with_name('club-network-browser.py').read_text().split('with sync_playwright() as p:')[0])
base_api=api;lose_ack=False;lose_delete=False;hold_publish=False;held=[]
class Sink:
 def __init__(self,request):self.request=request
 def fulfill(self,**kw):pass
 def abort(self):pass

def api(route):
 global lose_ack,lose_delete,hold_publish
 path=urlparse(route.request.url).path
 if route.request.method!='OPTIONS':
  if hold_publish and path.endswith('/club_publish_document'):
   hold_publish=False;held.append(route);return
  if lose_ack and path.endswith('/club_publish_document'):
   lose_ack=False;base_api(Sink(route.request));route.abort();return
  if lose_delete and path.endswith('/club_remove_document'):
   lose_delete=False;base_api(Sink(route.request));route.abort();return
 return base_api(route)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context,page=setup(browser);login(page,'a@example.test')
 context.add_init_script("""(()=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(this===localStorage&&((window.blockPending&&key.includes('vestiaire-cloud-pending:'))||(window.blockJournal&&key.includes('vestiaire-save-journal:'))))throw new DOMException('Full','QuotaExceededError');return native.call(this,key,value);};})()""")
 page.reload();page.wait_for_function("typeof clubNetworkBound==='function'&&clubNetworkBound()&&!clubNetworkBusy");wait_sync(page)
 page.evaluate("()=>{document.querySelector('#view-training').click();currentTraining.title='Fiabilité';syncTrainingForm();document.querySelector('#training-save').click()}");wait_sync(page)
 source=page.evaluate('currentTraining.id')
 # Library succeeds, outbox fails: persistent journal and red status survive until repair.
 page.evaluate("()=>{window.blockPending=true;currentTraining.notes='À partager après réparation';syncTrainingForm();document.querySelector('#training-save').click()}")
 assert page.evaluate("!!localStorage.getItem(clubNetworkSaveJournalKey('vestiaire-training-library'))")
 assert page.locator('#club-save-label').inner_text()=='Échec'
 page.reload();page.wait_for_function("typeof clubNetworkBound==='function'&&clubNetworkBound()&&!clubNetworkBusy");wait_sync(page)
 assert next(r for r in rows if r['source_id']==source)['payload']['notes']=='À partager après réparation'
 assert page.evaluate("!localStorage.getItem(clubNetworkSaveJournalKey('vestiaire-training-library'))&&clubNetworkPendingJobs().length===0")
 assert page.locator('#club-save-label').inner_text()=='Enregistré et partagé'
 # Failure to reserve the write-ahead record leaves the saved library unchanged.
 old=page.evaluate("coachStorageGet('vestiaire-training-library')")
 page.evaluate("()=>{window.blockJournal=true;currentTraining.notes='Brouillon conservé malgré quota';syncTrainingForm();document.querySelector('#training-save').click()}")
 assert page.evaluate("coachStorageGet('vestiaire-training-library')")==old
 assert page.evaluate("currentTraining.notes==='Brouillon conservé malgré quota'")
 page.evaluate('clubNetworkQueueSync()');wait_sync(page);assert page.locator('#club-save-label').inner_text()=='Échec'
 page.evaluate("window.blockJournal=false;document.querySelector('#training-save').click()");wait_sync(page)
 # Server commits but answer is lost. Retry acknowledges equality, without a second revision.
 lose_ack=True
 page.evaluate("()=>{currentTraining.notes='Réponse réseau perdue';syncTrainingForm();document.querySelector('#training-save').click()}");wait_sync(page)
 remote=next(r for r in rows if r['source_id']==source);revision=remote['revision'];remote['payload']=dict(reversed(list(remote['payload'].items())))
 assert page.evaluate('clubNetworkPendingJobs().length')==1
 page.evaluate('clubNetworkQueueSync()');wait_sync(page)
 assert remote['revision']==revision and page.evaluate('clubNetworkPendingJobs().length')==0
 assert page.locator('#club-save-label').inner_text()=='Enregistré et partagé'
 # New save while the previous request is in flight must retain a distinct outbox stamp.
 hold_publish=True
 page.evaluate("()=>{currentTraining.notes='Premier envoi';syncTrainingForm();document.querySelector('#training-save').click()}")
 page.wait_for_timeout(200);assert len(held)==1
 stamp=page.evaluate("clubNetworkPending('training',currentTraining.id).stamp")
 page.evaluate("()=>{currentTraining.notes='Deuxième envoi pendant le premier';syncTrainingForm();document.querySelector('#training-save').click()}")
 assert page.evaluate("clubNetworkPending('training',currentTraining.id).stamp")!=stamp
 base_api(held.pop());wait_sync(page)
 assert next(r for r in rows if r['source_id']==source)['payload']['notes']=='Deuxième envoi pendant le premier'
 assert page.evaluate('clubNetworkPendingJobs().length')==0
 # Delete acknowledgement lost: absence is acknowledged, a recreated document would not be removed.
 lose_delete=True;page.evaluate("document.querySelector('#training-delete').click()");wait_sync(page)
 assert not any(r['source_id']==source for r in rows)
 page.evaluate('clubNetworkQueueSync()');wait_sync(page);assert page.evaluate('clubNetworkPendingJobs().length')==0
 # A deletion must never acknowledge or delete a newly recreated row with the same source ID.
 replacement=copy.deepcopy(remote);replacement['id']=str(uuid.uuid4());replacement['revision']=1;rows.append(replacement)
 page.evaluate("([source,oldId])=>clubNetworkMarkPending('training',source,'delete',{revision:1,id:oldId})",[source,str(uuid.uuid4())])
 page.evaluate('clubNetworkFlushPending()');assert page.evaluate("clubNetworkPending('training',currentTraining.id).conflict")
 assert replacement in rows
 page.evaluate("localStorage.removeItem(clubNetworkPendingKey('training',currentTraining.id))");rows.remove(replacement)
 # Simulate interruption after the journal but before library commit; candidate is recoverable.
 page.evaluate("""()=>{clearInterval(clubNetworkTimer);const next=structuredClone(currentTraining);next.id=crypto.randomUUID();next.title='Interruption récupérable';const key='vestiaire-training-library',second=structuredClone(next);second.id=crypto.randomUUID();second.title='Deuxième interruption récupérable';const value=JSON.stringify([next,second,...trainingLibrary]),jobs=clubNetworkSaveIntents('training',coachStorageGet(key),value);localStorage.setItem(clubNetworkSaveJournalKey(key),JSON.stringify({key,value,jobs}));}""")
 page.reload();page.wait_for_function("typeof clubNetworkBound==='function'&&clubNetworkBound()&&!clubNetworkBusy");wait_sync(page)
 assert page.locator('#club-save-label').inner_text()=='Échec'
 page.evaluate('workspaceOpenRecovery()')
 before=page.evaluate('currentTraining.id')
 page.evaluate("()=>{window.restoreSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('vestiaire-private-recovery:'))throw new DOMException('Full','QuotaExceededError');return window.restoreSetItem.call(this,k,v)}}")
 page.get_by_role('button',name='Ouvrir une copie du travail interrompu',exact=True).first.click()
 assert page.evaluate('currentTraining.id')==before
 assert page.evaluate("!!localStorage.getItem(clubNetworkSaveJournalKey('vestiaire-training-library'))")
 page.evaluate('()=>{Storage.prototype.setItem=window.restoreSetItem;}')
 page.get_by_role('button',name='Ouvrir une copie du travail interrompu',exact=True).first.click()
 assert page.evaluate("currentTraining.title.includes('Interruption récupérable')")
 page.evaluate("document.querySelector('#training-save').click()");wait_sync(page)
 assert any('Interruption récupérable' in r['title'] for r in rows)
 # Saving the first copy must not destroy the other document from the same journal.
 page.reload();page.wait_for_function("typeof clubNetworkBound==='function'&&clubNetworkBound()&&!clubNetworkBusy");wait_sync(page)
 assert page.evaluate("clubNetworkRecoveryArchives().length===1&&clubNetworkRecoveryCandidates().some(x=>x.payload.title==='Deuxième interruption récupérable')")
 page.evaluate('workspaceOpenRecovery()')
 page.locator('.completion-row').filter(has_text='Deuxième interruption récupérable').get_by_role('button',name='Ouvrir une copie du travail interrompu').click()
 page.evaluate("document.querySelector('#training-save').click()");wait_sync(page)
 assert any('Deuxième interruption récupérable' in r['title'] for r in rows)
 assert page.evaluate('clubNetworkRecoveryCandidates().length>=2')

 # Actual shared localStorage mutation from another tab must not be overwritten by stale memory.
 page.evaluate('clearInterval(clubNetworkTimer)');key=page.evaluate("coachStorageKey('vestiaire-training-library')")
 raw=page.evaluate("coachStorageGet('vestiaire-training-library')");changed=json.loads(raw);changed[0]['notes']='Version de l’autre onglet'
 other=context.new_page();other.goto(URL+'/?mode=local');other.evaluate('([key,value])=>localStorage.setItem(key,value)',[key,json.dumps(changed,ensure_ascii=False,separators=(',',':'))])
 expected=page.evaluate("coachStorageGet('vestiaire-training-library')")
 page.evaluate("()=>{currentTraining.notes='Mon brouillon concurrent';syncTrainingForm();document.querySelector('#training-save').click()}")
 assert page.evaluate("coachStorageGet('vestiaire-training-library')")==expected
 assert page.evaluate("currentTraining.notes==='Mon brouillon concurrent'&&clubSaveLocalConflicts.size===1")
 assert 'autre fenêtre' in page.locator('#club-save-detail').text_content(), page.evaluate('clubSaveState')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 assert not errors,errors
 browser.close();print('PASS save reliability: durable outbox reload, journal quota, lost save/delete acknowledgements, JSONB key order, in-flight edits, interrupted save recovery, stale local tab protection and mobile.')
