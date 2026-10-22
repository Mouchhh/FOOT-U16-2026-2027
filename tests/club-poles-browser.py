"""Scope-specific actions and fail-closed compatibility with the previous migration."""
from pathlib import Path
exec(Path(__file__).with_name('club-network-browser.py').read_text().split('with sync_playwright() as p:')[0])
base_api=api
reviews={};legacy=False

def document_pole(r):
 import re
 category=(r['payload'].get('info',{}) if r['kind']=='report' else r['payload']).get('category','').lower()
 if re.fullmatch(r'u(?:[6-9]|1[0-9]|20)(?:\s+[rd][1-9])?',category):return 'jeunes'
 if category=='seniors':return 'seniors'
 return None

def api(route):
 req=route.request;path=urlparse(req.url).path;actor=req.headers.get('authorization','').replace('Bearer token-','')
 if req.method!='OPTIONS' and path in ['/rest/v1/rpc/club_reference_overview','/rest/v1/rpc/club_review_reference']:
  def reply(obj,status=200):route.fulfill(status=status,headers={'Access-Control-Allow-Origin':'*'},content_type='application/json',body=json.dumps(obj))
  pole='seniors' if actor==A else 'jeunes' if actor==B else None
  if not pole:return reply({'code':'42501'},403)
  if path.endswith('club_reference_overview'):
   if legacy:return reply(dict(can_review=True,references=[]))
   refs=[]
   for r in rows:
    if r['payload'].get('clubReference') is True:
     sector=document_pole(r);review=reviews.get(r['id']);ok=review and review[0]==r['revision']
     refs.append(dict(document_id=r['id'],revision=r['revision'],pole=sector,can_review=sector is not None and pole==sector,reviewer_id=review[1] if ok else None,reviewed_at='2026-10-22T15:00:00Z' if ok else None))
   return reply(dict(scope_version=2,can_review=True,poles=[pole],references=refs))
  body=req.post_data_json;r=next((r for r in rows if r['id']==body['p_document_id']),None)
  if not r or r['revision']!=body['p_expected_revision']:return reply({'code':'40001'},409)
  if document_pole(r)!=pole:return reply({'code':'42501'},403)
  if body['p_approve']:reviews[r['id']]=(r['revision'],actor)
  else:reviews.pop(r['id'],None)
  return reply(None)
 return base_api(route)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ca,a=setup(browser);cb,b=setup(browser);login(a,'a@example.test');login(b,'b@example.test')
 for title,category in [('Jeunes U17','U17 R2'),('Adultes','Seniors'),('À préciser','')]:
  b.evaluate("([title,category])=>{currentTraining=newTraining();document.querySelector('#view-training').click();Object.assign(currentTraining,{title,category,clubReference:true});syncTrainingForm();document.querySelector('#training-save').click()}",[title,category]);wait_sync(b)
 club(b)
 def preview(page,title,own=False):
  card=page.locator('.club-network-card').filter(has=page.get_by_role('heading',name=title,exact=True))
  card.get_by_role('button',name='Consulter sans modifier' if own else 'Consulter',exact=True).click();page.wait_for_selector('#club-network-preview',state='visible')
 preview(b,'Jeunes U17',True);assert 'Pôle jeunes' in b.locator('#club-reference-preview').inner_text()
 b.get_by_role('button',name='Valider cette version comme repère',exact=True).click();wait_sync(b);b.locator('#club-network-preview-close').click()
 preview(b,'Adultes',True);assert 'Pôle seniors' in b.locator('#club-reference-preview').inner_text();assert b.get_by_role('button',name='Valider cette version comme repère',exact=True).count()==0;b.locator('#club-network-preview-close').click()
 preview(b,'À préciser',True);assert 'Pôle à préciser' in b.locator('#club-reference-preview').inner_text();assert b.get_by_role('button',name='Valider cette version comme repère',exact=True).count()==0;b.locator('#club-network-preview-close').click()
 club(a);preview(a,'Jeunes U17');assert 'Repère validé par Coach B' in a.locator('#club-reference-preview').inner_text();assert a.get_by_role('button',name='Retirer la validation sportive',exact=True).count()==0;a.locator('#club-network-preview-close').click()
 preview(a,'Adultes');a.get_by_role('button',name='Valider cette version comme repère',exact=True).click();wait_sync(a);assert 'Repère validé par Coach A' in a.locator('#club-reference-preview').inner_text();a.locator('#club-network-preview-close').click()
 legacy=True;a.evaluate('clubNetworkQueueSync()');wait_sync(a)
 assert a.evaluate("clubReferenceState==='missing'&&!clubReferenceCanReview")
 assert a.locator('.club-reference-badge[data-state="approved"]').count()==0
 preview(a,'Adultes');assert a.get_by_role('button',name='Valider cette version comme repère',exact=True).count()==0
 a.set_viewport_size({'width':390,'height':844});assert a.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
 assert not errors,errors
 browser.close();print('PASS scoped UI: youth and senior leads, category level, unknown category, cross-pole buttons absent, versioned decisions, legacy migration disabled and mobile.')
