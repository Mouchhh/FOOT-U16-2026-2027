"""Authenticated folder browsing with simulated API; no real account or document is used."""
from pathlib import Path
exec(Path(__file__).with_name('club-network-browser.py').read_text().split('with sync_playwright() as p:')[0])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx,page=setup(browser);login(page,'a@example.test');page.emulate_media(reduced_motion='reduce')
 # Metadata is produced through the actual publishing source function.
 documents=page.evaluate('''()=>{const result=[];for(let i=0;i<27;i++){const r=newReport();r.title='Bilan A '+i;r.updatedAt='2026-10-30T10:00:00Z';result.push({owner:'a',...clubNetworkSource('report',r)});}const session=newTraining();session.title='Séance de conservation';result.push({owner:'b',...clubNetworkSource('training',session)});for(const [title,kind]of [['Causerie avant match','causeries'],['Sortie de balle face au pressing','build'],['Placement défensif','tactics'],['Composition de samedi','composition']]){const board=structuredClone(getCompositionBoard());board.documentId=crypto.randomUUID();board.title=title;board.clubFolder=kind;result.push({owner:'b',...clubNetworkSource('composition',board)});}return result;}''')
 for d in documents:rows.append({'id':str(uuid.uuid4()),'owner_id':A if d['owner']=='a' else B,'kind':d['kind'],'source_id':d['id'],'title':d['title'],'revision':1,'updated_at':'2026-10-30T10:00:00Z','payload':d['payload']})
 page.evaluate('clubNetworkQueueSync()');wait_sync(page);page.locator('#view-club-network').click();page.locator('#task-club-1').click()
 assert page.locator('.club-network-card').count()==0;assert 'Choisissez l’éducateur' in page.locator('#club-network-list').inner_text()
 assert page.get_by_label('Choisir un dossier',exact=True).is_disabled()
 page.get_by_label('Choisir l’éducateur',exact=True).select_option(B)
 grid=page.locator('#club-document-folder-grid');assert grid.is_visible();assert grid.locator('button').count()==8;assert '1 document' in grid.locator('[data-folder=causeries]').inner_text();assert '1 document' in grid.locator('[data-folder=build]').inner_text();assert page.locator('.club-network-card').count()==0
 page.screenshot(path='/tmp/club-folders-desktop.png')
 grid.locator('[data-folder=causeries]').click();assert page.locator('.club-network-card').count()==1;assert 'Causerie avant match' in page.locator('.club-network-card').inner_text()
 page.get_by_label('Trouver un document',exact=True).fill('inexistant');assert page.locator('.club-network-card').count()==0
 page.get_by_role('button',name='Dossiers de Coach B',exact=True).click();grid.locator('[data-folder=build]').click();assert page.get_by_label('Trouver un document',exact=True).input_value()=='';assert 'Sortie de balle' in page.locator('.club-network-card').inner_text()
 before=page.evaluate('JSON.stringify(currentTraining)');page.get_by_role('button',name='Dossiers de Coach B',exact=True).click();grid.locator('[data-folder=training]').click();page.locator('.club-network-card').get_by_role('button',name='Consulter',exact=True).click();page.wait_for_selector('#club-network-preview',state='visible');assert page.evaluate('JSON.stringify(currentTraining)')==before;page.locator('#club-network-preview-close').click()
 page.get_by_label('Choisir l’éducateur',exact=True).select_option(A);assert grid.is_visible();assert '27 documents' in grid.locator('[data-folder=report]').inner_text();grid.locator('[data-folder=report]').click();assert page.locator('.club-network-card').count()==12
 page.locator('#club-network-more').click();assert page.locator('.club-network-card').count()==24;page.locator('#club-network-more').click();assert page.locator('.club-network-card').count()==27;assert page.locator('#club-network-more').is_hidden()
 page.get_by_label('Trouver un document',exact=True).fill('Bilan A 26');assert page.locator('.club-network-card').count()==1
 # An existing title/legacy plan stays available; automatic labels don't mutate payloads.
 assert page.evaluate("clubFolderForRow({kind:'composition',title:'Plan de jeu · Couverture'})==='tactics'&&clubFolderForRow({kind:'composition',title:'Ancienne composition'})==='composition'")
 assert page.evaluate("(()=>{const b=structuredClone(getCompositionBoard());b.documentId=crypto.randomUUID();b.title='Sans titre de causerie';b.matchPreparation=newMatchPreparation();b.matchPreparation.offensive='Trouver le côté libre';const before=JSON.stringify(b),s=clubNetworkSource('composition',b);return s.title.startsWith('Causerie · ')&&JSON.stringify(b)===before&&JSON.stringify(s.payload)===before})()")
 for w,h in [(320,740),(390,844),(844,390),(1366,768)]:
  page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(w,h)
  if w==390:page.screenshot(path='/tmp/club-folders-mobile.png')
 # Manual override updates only a draft until the existing Save action.
 page.locator('#view-pitch').click();page.locator('#task-match-causerie').click();page.locator('#terrain-next').click();page.get_by_label('Dossier dans les documents partagés',exact=True).select_option('build');assert page.evaluate('getCompositionBoard().clubFolder')=='build'
 page.locator('#save').click();wait_sync(page);source=page.evaluate('getCompositionBoard().documentId');published=next(r for r in rows if r['owner_id']==A and r['source_id']==source);assert published['title'].startswith('Sortie de balle · ') and published['payload']['clubFolder']=='build'
 page.reload();page.wait_for_function("typeof clubFolderForSource==='function'");assert page.evaluate('getCompositionBoard().clubFolder')=='build'
 page.evaluate('clubNetworkClear()');assert page.locator('.club-network-card').count()==0;assert page.locator('#club-document-folder-grid button').count()==0
 assert not errors,errors;browser.close()
print('PASS educator-first folders, exact counts, distinct causerie/build-up, 12-item paging, search reset, read-only preview, draft classification, legacy documents, logout and responsive layout (mock API).')
