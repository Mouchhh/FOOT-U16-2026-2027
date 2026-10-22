"""Shared originals, independent copies and server-sourced revision-specific endorsements."""
from pathlib import Path
exec(Path(__file__).with_name('club-network-browser.py').read_text().split('with sync_playwright() as p:')[0])
base_api=api
reviews={};lead=True;installed=True;review_failure=False

def api(route):
 req=route.request;path=urlparse(req.url).path;actor=req.headers.get('authorization','').replace('Bearer token-','')
 if req.method!='OPTIONS' and path in ['/rest/v1/rpc/club_reference_overview','/rest/v1/rpc/club_review_reference']:
  def reply(obj,status=200):route.fulfill(status=status,headers={'Access-Control-Allow-Origin':'*'},content_type='application/json',body=json.dumps(obj))
  if not installed:return reply({'code':'PGRST202'},404)
  if actor not in [A,B]:return reply({'code':'42501'},403)
  if path.endswith('club_reference_overview'):
   refs=[]
   for r in rows:
    if r['payload'].get('clubReference') is True:
     approved=lead and reviews.get(r['id'])==r['revision']
     refs.append(dict(document_id=r['id'],revision=r['revision'],reviewer_id=A if approved else None,reviewed_at='2026-10-22T15:00:00Z' if approved else None,pole='jeunes',can_review=actor==A and lead))
   return reply(dict(scope_version=2,can_review=actor==A and lead,poles=['jeunes'] if actor==A and lead else [],references=refs))
  body=req.post_data_json
  if actor!=A or not lead:return reply({'code':'42501'},403)
  r=next((r for r in rows if r['id']==body['p_document_id']),None)
  if review_failure or not r or r['revision']!=body['p_expected_revision']:return reply({'code':'40001'},409)
  if body['p_approve']:reviews[r['id']]=r['revision']
  else:reviews.pop(r['id'],None)
  return reply(None)
 return base_api(route)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ca,a=setup(browser);cb,b=setup(browser);login(a,'a@example.test');login(b,'b@example.test')
 # Save and propose an actual session as ordinary educator B.
 b.evaluate("()=>{currentTraining.title='Pressing côté ballon';currentTraining.category='U17';currentTraining.clubApproval='forged';document.querySelector('#view-training').click();syncTrainingForm();document.querySelector('#training-save').click()}");wait_sync(b);club(b)
 card=b.locator('.club-network-card',has_text='Pressing côté ballon');card.get_by_role('button',name='Proposer comme repère',exact=True).click();wait_sync(b)
 assert 'Repère proposé par Coach B' in card.inner_text()
 assert 'Repère validé' not in card.inner_text()
 original=copy.deepcopy(rows[0]);original_id=original['id'];source_id=original['source_id']
 # Own read-only preview leaves the active unfinished draft untouched.
 b.evaluate("currentTraining.notes='Brouillon non enregistré'");before=b.evaluate('JSON.stringify(currentTraining)')
 card.get_by_role('button',name='Consulter sans modifier',exact=True).click();b.wait_for_selector('#club-network-preview',state='visible')
 assert b.evaluate('JSON.stringify(currentTraining)')==before
 assert b.get_by_role('button',name='Valider cette version comme repère',exact=True).count()==0
 b.locator('#club-network-preview-close').click()
 # Lead reviews a colleague's exact version in a read-only preview.
 club(a);a.evaluate('clubNetworkQueueSync()');wait_sync(a);carda=a.locator('.club-network-card',has_text='Pressing côté ballon')
 carda.get_by_role('button',name='Consulter',exact=True).click();a.get_by_role('button',name='Valider cette version comme repère',exact=True).click();wait_sync(a)
 assert reviews[original_id]==original['revision'];assert rows[0]['payload']==original['payload']
 assert 'Repère validé par Coach A' in a.locator('#club-reference-preview').inner_text()
 a.locator('#club-network-preview-close').click();b.evaluate('clubNetworkQueueSync()');wait_sync(b)
 assert 'Repère validé · Coach A' in card.inner_text()
 # Filter by official club decision rather than editable payload.
 a.evaluate("clubDocumentSearch={category:'',theme:'',from:'',to:'',reference:false,validation:'approved'};clubDocumentLoadBatch()")
 a.wait_for_function("document.querySelector('#club-document-search-status').textContent.includes('Recherche terminée')")
 assert a.locator('.club-network-card').count()==1
 a.evaluate('clubDocumentReset()');carda=a.locator('.club-network-card',has_text='Pressing côté ballon');carda.get_by_role('button',name='Consulter',exact=True).click()
 a.locator('#club-network-copy').click();wait_sync(a)
 copied=next(r for r in rows if r['owner_id']==A)
 assert copied['source_id']!=source_id and not copied['payload'].get('clubReference') and 'clubApproval' not in copied['payload']
 assert next(r for r in rows if r['id']==original_id)['payload']==original['payload']
 # Changing original content invalidates old approval and rejects stale decisions.
 b.evaluate("()=>{currentTraining.notes='Nouvelle organisation';document.querySelector('#view-training').click();syncTrainingForm();document.querySelector('#training-save').click()}");wait_sync(b)
 a.evaluate('clubNetworkQueueSync()');wait_sync(a);club(a);carda=a.locator('.club-network-card',has_text='Pressing côté ballon').filter(has=a.get_by_role('button',name='Consulter',exact=True));assert 'Repère proposé par Coach B' in carda.inner_text()
 carda.get_by_role('button',name='Consulter',exact=True).click();review_failure=True
 a.get_by_role('button',name='Valider cette version comme repère',exact=True).click();wait_sync(a)
 assert 'Décision non confirmée' in a.locator('#club-reference-preview').inner_text();assert reviews[original_id]!=next(r for r in rows if r['id']==original_id)['revision']
 review_failure=False;a.locator('#club-network-preview-close').click()
 # Own preview's Copy action creates a fresh document and preserves the active draft.
 club(b);card=b.locator('.club-network-card',has_text='Pressing côté ballon');card.get_by_role('button',name='Consulter sans modifier',exact=True).click()
 before=b.evaluate('JSON.stringify(currentTraining)');b.locator('#club-network-copy').click();wait_sync(b)
 assert b.evaluate('JSON.stringify(currentTraining)')==before
 assert len([r for r in rows if r['owner_id']==B])==2
 # Missing migration never fabricates endorsements; documents still browse normally.
 installed=False;a.evaluate('clubNetworkQueueSync()');wait_sync(a)
 assert 'club-references.sql' in a.locator('#club-reference-status').inner_text();assert a.locator('.club-network-card').count()==3
 assert a.locator('.club-reference-badge[data-state="approved"]').count()==0
 a.set_viewport_size({'width':390,'height':844});assert a.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 a.evaluate('clubNetworkClear()');assert a.evaluate('clubReferenceRows.size===0&&!clubReferenceCanReview')
 assert not errors,errors
 browser.close();print('PASS club references: own read-only, lead review, version binding, source preserved, independent copy, server decision filters, stale rejection, missing migration, logout and mobile.')
