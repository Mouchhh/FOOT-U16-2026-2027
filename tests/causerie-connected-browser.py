"""Configured gateway UI with fake credentials and intercepted HTTP; no real Canva calls."""
import json
from urllib.parse import parse_qs
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/canva-config.js*',lambda route:route.fulfill(content_type='application/javascript',body="window.CLUB_CANVA_GATEWAY='https://canva.test';"))
    requests=[];connected=True;latest=None;wakeups=1;holding=False;held=[]
    def gateway(route):
        global connected,latest,wakeups
        request=route.request
        headers={'Access-Control-Allow-Origin':'http://127.0.0.1:3016','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Design-Title','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS'}
        if request.method=='OPTIONS':
            route.fulfill(status=204,headers=headers);return
        if request.url=='https://canva.test/oauth/start':
            form=parse_qs(request.post_data)
            assert request.method=='POST' and form['credential']==['fake-club-session']
            assert form['return_url']==['http://127.0.0.1:3016/canva-return.html']
            requests.append((request.method,request.url))
            connected=True  # Simulated successful consent; never calls Canva.
            route.fulfill(status=303,headers={'Location':'http://127.0.0.1:3016/canva-return.html'});return
        assert request.headers['authorization']=='Bearer fake-club-session'
        requests.append((request.method,request.url))
        path=request.url.removeprefix('https://canva.test')
        status=200
        if path=='/api/status':
            if holding:
                held.append(route);return
            if wakeups:
                wakeups-=1;status=503;value={'error':'Service en réveil'}
            else:value={'connected':connected,'latest_job_id':latest}
        elif path=='/api/imports' and request.method=='POST':
            assert request.headers['content-type']=='application/vnd.openxmlformats-officedocument.presentationml.presentation'
            assert request.post_data_buffer[:4]==b'PK\x03\x04'
            latest='job-test';value={'id':latest,'status':'in_progress'}
        elif path=='/api/imports/job-test':
            value={'id':'job-test','status':'success','designs':[{'id':'design-test','edit_url':'https://www.canva.com/design/test/edit'}]}
        elif path=='/api/connection' and request.method=='DELETE':
            connected=False;latest=None;value={'connected':False,'revoked':True}
        else:status=404;value={'error':'Unknown route'}
        route.fulfill(status=status,headers=headers,content_type='application/json',body=json.dumps(value))
    page.context.route('https://canva.test/**',gateway)
    page.context.route('https://www.canva.com/**',lambda route:route.fulfill(content_type='text/html',body='<p>Présentation Canva simulée</p>'))
    page.goto('http://127.0.0.1:3016/?mode=local')
    page.wait_for_function("typeof causerieExport==='object'")
    page.evaluate("clubNetworkSession={access_token:'fake-club-session',user:{id:'coach-a'}};state.title='Causerie du coach';document.querySelector('[data-causerie-export]').click()")
    page.wait_for_function("!document.querySelector('#causerie-upload').disabled")
    assert 'Votre compte Canva est connecté' in page.locator('#causerie-dialog').inner_text()
    assert not any(method=='POST' for method,_ in requests), 'Opening the dialog must not upload content'
    before=page.evaluate('JSON.stringify(state)')
    page.locator('#causerie-upload').click()
    result=page.locator('#causerie-results a');result.wait_for(state='visible',timeout=30000)
    assert result.get_attribute('href')=='https://www.canva.com/design/test/edit'
    assert page.evaluate('JSON.stringify(state)')==before
    assert page.locator('#personal-canva-last').get_attribute('href')=='https://www.canva.com/design/test/edit'
    assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-last-canva-presentation')).url")=='https://www.canva.com/design/test/edit'
    assert sum(method=='POST' and url.endswith('/api/imports') for method,url in requests)==1
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#causerie-dialog').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    # A changed coach must not send the previous coach's captured document.
    page.evaluate("clubNetworkSession={access_token:'other-session',user:{id:'coach-b'}}")
    page.locator('#causerie-upload').click()
    page.wait_for_function("document.querySelector('#causerie-status').textContent.includes('rouvrez')")
    assert sum(method=='POST' and url.endswith('/api/imports') for method,url in requests)==1
    page.evaluate("clubNetworkSession={access_token:'fake-club-session',user:{id:'coach-a'}}")
    page.locator('#causerie-refresh').click();page.wait_for_function("!document.querySelector('#causerie-disconnect').disabled")
    page.get_by_role('button',name='Fermer la préparation Canva',exact=True).click()
    page.evaluate("document.querySelector('#view-pitch').click();workspaceFlows.terrain.go(1)")
    # The small card now creates and opens the completed design with one click.
    with page.expect_popup() as automatic_popup:
        page.locator('#personal-canva-create').click()
    automatic_popup.value.wait_for_url('https://www.canva.com/design/test/edit',timeout=30000)
    assert sum(method=='POST' and url.endswith('/api/imports') for method,url in requests)==2
    assert page.evaluate('JSON.stringify(state)')==before
    automatic_popup.value.close()
    page.locator('#causerie-disconnect').click()
    page.wait_for_function("document.querySelector('#causerie-status').textContent==='Canva est déconnecté.'")
    assert not connected
    page.get_by_role('button',name='Fermer la préparation Canva',exact=True).click()
    # First-use consent resumes that same creation and opens the result automatically.
    with page.expect_popup() as popup:
        page.locator('#personal-canva-create').click()
    popup.value.wait_for_url('https://www.canva.com/design/test/edit',timeout=30000)
    assert ('POST','https://canva.test/oauth/start') in requests
    assert sum(method=='POST' and url.endswith('/api/imports') for method,url in requests)==3
    popup.value.close()
    page.get_by_role('button',name='Fermer la préparation Canva',exact=True).click()
    # Closing during a cold start cancels the creation intent: no late upload.
    holding=True
    count_before=sum(method=='POST' and url.endswith('/api/imports') for method,url in requests)
    with page.expect_popup() as waiting_popup:
        page.locator('#personal-canva-create').click()
    page.wait_for_timeout(150)
    assert held
    page.get_by_role('button',name='Fermer la préparation Canva',exact=True).click()
    for route in held:
        route.fulfill(headers={'Access-Control-Allow-Origin':'http://127.0.0.1:3016'},content_type='application/json',body=json.dumps({'connected':True,'latest_job_id':None}))
    page.wait_for_timeout(300)
    assert sum(method=='POST' and url.endswith('/api/imports') for method,url in requests)==count_before
    assert waiting_popup.value.is_closed()
    assert not errors,errors
    browser.close()
    print('PASS: one-click card creates and opens the actual returned design; first consent resumes creation; authenticated upload, retained draft, mobile, changed-coach protection and disconnect (mock service).')
