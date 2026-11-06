"""Synthetic fixtures test parsing and rendering; no invented live FFF ranking is shipped."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('typeof homeFFFParse==="function"');page.wait_for_selector('.home-fff-ranking')
 assert 'à importer' in page.locator('.home-fff-ranking').inner_text()
 assert page.locator('.home-live-group-strip').evaluate('(n)=>getComputedStyle(n).gridArea')=='group'
 table='<table><tr><th>Rg</th><th>Équipe</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th>Diff.</th></tr><tr><td>1</td><td>Club test A</td><td>12</td><td>4</td><td>4</td><td>0</td><td>0</td><td>12</td><td>2</td><td>10</td></tr><tr><td>2</td><td>MAYENNE STADE FC 2</td><td>8</td><td>4</td><td>3</td><td>0</td><td>1</td><td>10</td><td>3</td><td>7</td></tr><tr><td>3</td><td>Club test B</td><td>3</td><td>4</td><td>1</td><td>0</td><td>3</td><td>2</td><td>11</td><td>-9</td></tr></table>'
 page.locator('.home-fff-actions button').click();form=page.locator('#home-fff-import')
 form.get_by_label('Lien officiel FFF',exact=True).fill('https://epreuves.fff.fr/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/saison')
 form.get_by_label('Notre équipe dans le classement',exact=True).fill('MAYENNE STADE FC 2')
 form.get_by_label('Classement FFF copié avec ses en-têtes',exact=True).fill(table)
 page.wait_for_timeout(200);assert form.get_by_label('Classement FFF copié avec ses en-têtes',exact=True).input_value()==table
 form.get_by_role('button',name='Importer le classement',exact=True).click()
 assert page.locator('.home-fff-table-wrap tbody tr').count()==3
 assert page.locator('.home-fff-own').inner_text().find('8')>=0
 assert page.evaluate('homeFFFRead().rows[1].points')==8
 assert page.evaluate('homeFFFRead().rows[2].goalDifference')==-9
 assert page.evaluate("homeFFFOpponent({fff:{home:'Club test B',away:activeCoachTeam.team||state.team}})")=='Club test B'
 assert page.evaluate("coachStorageKey(homeFFFKey).includes(':team:')")
 assert page.evaluate("()=>{const old=coachStorageGet(homeFFFKey);try{homeFFFParse('bad',{sourceURL:'https://evil.example',teamName:'x',competition:'x'});return false}catch{}return coachStorageGet(homeFFFKey)===old}")
 page.evaluate("()=>{const data=homeFFFRead();data.matches=[{date:'2025-11-01',home:'MAYENNE STADE FC 2',away:'Club test B',goalsHome:2,goalsAway:1}];coachStorageSet(homeFFFKey,JSON.stringify(data));window.homeOriginalSnapshot=homeWidgetsSnapshot;homeWidgetsSnapshot=()=>({...homeOriginalSnapshot(),match:{date:'2026-11-07',time:'15:00',title:'Club test B',fff:{opponent:'Club test B'}}});renderHomeWidgets()}")
 assert '2–1' in page.locator('.home-live-form').inner_text()
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 # Automatic login refresh uses the authenticated relay and preserves last good data.
 page.evaluate("""()=>{coachFFFEnsure=async()=>true;window.fffCalls=0;window.fffResponseHTML='<table><tr><th>Rg</th><th>Equipe</th><th>Pts</th></tr><tr><td>1</td><td>Club automatique</td><td>17</td></tr></table>';clubNetworkBound=()=>true;clubNetworkRequest=async(path,options)=>{window.fffCalls++;window.fffPath=path;await new Promise(r=>setTimeout(r,50));return {sourceURL:options.body.sourceURL,html:fffResponseHTML,fetchedAt:'2026-11-06T12:00:00.000Z'}};document.dispatchEvent(new Event('club-session-ready'));homeFFFRefresh()}""")
 page.wait_for_function('homeFFFRead()?.acquisition==="automatic"')
 assert page.evaluate('fffCalls')==1
 assert page.evaluate('fffPath')=='/functions/v1/fff-standings'
 assert page.evaluate('homeFFFRead().rows[0].points')==17
 assert 'FFF vérifiée le' in page.locator('.home-fff-ranking').inner_text()
 page.evaluate("""async()=>{window.fffGood=coachStorageGet(homeFFFKey);clubNetworkRequest=async()=>{throw Error('503')};await homeFFFRefresh()}""")
 assert page.evaluate('coachStorageGet(homeFFFKey)===fffGood')
 assert 'dernier classement conservé' in page.locator('.home-fff-ranking').inner_text()
 # A JS-only/unrecognised upstream page must never replace official points.
 page.evaluate("""async()=>{clubNetworkRequest=async(p,o)=>({sourceURL:o.body.sourceURL,html:'<main>Loading</main>',fetchedAt:new Date().toISOString()});await homeFFFRefresh()}""")
 assert page.evaluate('coachStorageGet(homeFFFKey)===fffGood')
 assert 'aucun classement HTML exploitable' in page.locator('.home-fff-ranking').inner_text()
 page.evaluate("""async()=>{clubNetworkRequest=async()=>{const e=Error('FFF');e.code='fff_http_error';e.upstreamStatus=403;e.reference='00000000-0000-4000-8000-000000000000';throw e};await homeFFFRefresh()}""")
 assert 'HTTP 403' in page.locator('.home-fff-ranking').inner_text()
 assert '00000000-0000-4000-8000-000000000000' in page.locator('.home-fff-ranking').inner_text()
 assert page.evaluate('coachStorageGet(homeFFFKey)===fffGood')
 assert not errors,errors;b.close()
print('PASS: explicit FFF source, official points preserved, goals/difference table, stable import typing, history, scoped storage and mobile')
