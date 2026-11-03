"""Authenticated educator profiles and team-specific shared folders; no live accounts."""
from pathlib import Path
exec(Path(__file__).with_name('club-network-browser.py').read_text().split('with sync_playwright() as p:')[0])
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx,page=setup(browser);login(page,'a@example.test');page.emulate_media(reduced_motion='reduce')
    documents=page.evaluate("""()=>{const result=[],senior={id:'team-peer-senior',label:'Groupe Senior',category:'Seniors',team:'Équipe Senior'},youth={id:'team-peer-youth',label:'Groupe U15',category:'U15',team:'Équipe U15'},reserve={id:'team-own-reserve',label:'Ma réserve',category:'Espoirs',team:'Équipe réserve'};
      const add=(owner,kind,payload,team)=>{const source=clubNetworkSource(kind,payload);if(team)source.payload.teamContext=team;result.push({owner,...source});};
      for(let i=0;i<14;i++){const report=newReport();report.title='Bilan Senior '+String(i).padStart(2,'0');report.info.category='Seniors';add('b','report',report,senior);}
      const r=newReport();r.title='Bilan U15';r.info.category='U15';add('b','report',r,youth);
      const training=newTraining();training.title='Séance U15';training.category='U15';add('b','training',training,youth);
      const own=newReport();own.title='Mon bilan actif';add('a','report',own,null);const extra=newReport();extra.title='Mon bilan réserve';extra.info.category='Espoirs';add('a','report',extra,reserve);return result;}
    """)
    for d in documents: rows.append({'id':str(uuid.uuid4()),'owner_id':A if d['owner']=='a' else B,'kind':d['kind'],'source_id':d['id'],'title':d['title'],'revision':1,'updated_at':'2026-11-03T10:00:00Z','payload':d['payload']})
    page.evaluate('clubNetworkQueueSync()');wait_sync(page);page.locator('#view-club-network').click()
    assert page.locator('#task-club-1').count()==0
    assert page.locator('#task-section-navigation').get_by_role('button',name='Documents partagés',exact=True).count()==0
    before=page.evaluate('JSON.stringify([activeCoachTeam,currentTraining,currentReport,getCompositionBoard()])')
    page.locator(f'.club-coach-card[data-user-id="{B}"]').click();page.wait_for_function('clubEducatorState.owner==="'+B+'" && !clubEducatorState.loading')
    assert page.locator('#club-educator-profile').is_visible()
    assert page.locator('#club-educator-title').inner_text()=='Coach B'
    assert page.get_by_role('tab',name='Profil',exact=True).get_attribute('aria-selected')=='true'
    assert page.get_by_label('Équipe consultée',exact=True).input_value()==''
    assert page.get_by_role('tab',name='Documents partagés',exact=True).is_disabled()
    page.get_by_label('Équipe consultée',exact=True).select_option('team-peer-senior');page.get_by_role('tab',name='Documents partagés',exact=True).click()
    grid=page.locator('#club-document-folder-grid');assert '14 documents' in grid.locator('[data-folder=report]').inner_text()
    grid.locator('[data-folder=report]').click();assert page.locator('.club-network-card').count()==12
    assert all('Bilan Senior' in title for title in page.locator('.club-network-card h3').all_text_contents())
    page.locator('#club-network-more').click();assert page.locator('.club-network-card').count()==14
    page.get_by_label('Trouver un document',exact=True).fill('13');assert page.locator('.club-network-card').count()==1
    page.get_by_label('Équipe consultée',exact=True).select_option('team-peer-youth')
    assert page.get_by_label('Trouver un document',exact=True).input_value()==''
    assert '1 document' in grid.locator('[data-folder=report]').inner_text()
    grid.locator('[data-folder=training]').click();assert page.locator('.club-network-card').count()==1 and 'Séance U15' in page.locator('.club-network-card').inner_text()
    assert page.evaluate('JSON.stringify([activeCoachTeam,currentTraining,currentReport,getCompositionBoard()])')==before
    page.locator('.club-network-card').get_by_role('button',name='Consulter',exact=True).click();dialog=page.locator('#club-network-preview');dialog.wait_for(state='visible');cross=dialog.locator('.external-modal-close');cross.wait_for();assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)';cross.click()
    assert page.evaluate('JSON.stringify([activeCoachTeam,currentTraining,currentReport,getCompositionBoard()])')==before
    # The selected educator/team/tab are restored without exposing a mixed document list.
    page.wait_for_function("history.state?.clubNavigation?.page?.educator?.team==='team-peer-youth' && history.state.clubNavigation.page.educator.tab==='documents'")
    page.reload();page.wait_for_function('window.clubEducatorProfile && clubNetworkBound() && !clubEducatorState.loading && clubEducatorState.team==="team-peer-youth"');wait_sync(page)
    assert page.get_by_role('tab',name='Documents partagés',exact=True).get_attribute('aria-selected')=='true'
    assert page.locator('.club-network-card').count()==1 and 'Séance U15' in page.locator('.club-network-card').inner_text()
    for width,height in [(1366,900),(390,844),(320,740),(844,390)]:
        page.set_viewport_size({'width':width,'height':height});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=f'/tmp/educator-profile-{width}.png')
    # A response for a previously selected educator cannot repopulate the current profile.
    page.evaluate("""()=>{window.educatorRequest=clubNetworkRequest;clubNetworkRequest=(path,options)=>{const u=new URL('https://test.invalid'+path);if(u.searchParams.get('select')?.includes('teamContext:')&&u.searchParams.get('owner_id')==='eq.'+clubEducatorState.owner)return new Promise(resolve=>window.releaseEducatorMetadata=resolve);return educatorRequest(path,options)};window.oldEducatorLoad=clubEducatorProfile.refresh();}""")
    page.get_by_role('button',name='← Tous les éducateurs',exact=True).click()
    page.evaluate('()=>{clubNetworkRequest=educatorRequest}')
    page.locator('#club-my-educator-profile').click();page.wait_for_function('clubEducatorState.owner==="'+A+'" && !clubEducatorState.loading')
    page.evaluate('async()=>{releaseEducatorMetadata([]);await oldEducatorLoad}')
    assert page.evaluate('clubEducatorState.owner')==A
    page.get_by_role('button',name='← Tous les éducateurs',exact=True).click();page.locator(f'.club-coach-card[data-user-id="{B}"]').click();page.wait_for_function('clubEducatorState.owner==="'+B+'" && !clubEducatorState.loading')
    page.get_by_label('Équipe consultée',exact=True).select_option('team-peer-youth')
    # The view selector never switches another educator's workspace; an own-team action is explicit.
    assert page.get_by_role('button',name='Utiliser cette équipe pour mon travail',exact=True).is_hidden()
    page.get_by_role('button',name='← Tous les éducateurs',exact=True).click();assert page.evaluate('workspaceFlows.club.index()')==0
    page.locator('#club-my-educator-profile').click();page.wait_for_function('clubEducatorState.owner==="'+A+'" && !clubEducatorState.loading')
    old_id=page.evaluate('activeCoachTeam.id');page.get_by_label('Équipe consultée',exact=True).select_option('team-own-reserve');assert page.evaluate('activeCoachTeam.id')==old_id
    page.get_by_role('button',name='Utiliser cette équipe pour mon travail',exact=True).click();page.wait_for_function('typeof activeCoachTeam!=="undefined" && activeCoachTeam.id==="team-own-reserve"')
    assert not errors,errors
    browser.close()
print('Educator profile tabs, team choice/isolation, folders/search/pagination, authorized preview, history reload, own-team switch and responsive layout passed')
