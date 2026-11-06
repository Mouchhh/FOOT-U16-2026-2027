"""Probe UI uses simulated FFF responses; frame load alone must never mean success."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def source(route):
  if route.request.resource_type=='document':route.fulfill(status=200,content_type='text/html',body='<p>Frame fixture, not a live ranking</p>')
  else:route.fulfill(status=200,content_type='text/html',headers={'Access-Control-Allow-Origin':'*'},body='<table><tr><th>Equipe</th><th>Pts</th></tr><tr><td>Test only</td><td>3</td></tr></table>')
 page.route('https://epreuves.fff.fr/**',source)
 page.goto('http://localhost:3016/fff-integration-check.html');page.get_by_role('button',name='Tester le classement FFF').click()
 page.wait_for_function('JSON.parse(document.getElementById("report").value).tableauHTML===true')
 assert page.evaluate('JSON.parse(document.getElementById("report").value).cadre')=='non vérifié'
 page.get_by_label('Non : cadre vide, refus de connexion, erreur ou autre page').check()
 assert 'non visible' in page.evaluate('JSON.parse(document.getElementById("report").value).cadre')
 page.get_by_label('Oui, le classement est visible').check()
 assert 'confirmé par l’utilisateur' in page.evaluate('JSON.parse(document.getElementById("report").value).cadre')
 page.unroute('https://epreuves.fff.fr/**')
 page.route('https://epreuves.fff.fr/**',lambda route:route.fulfill(status=403,content_type='text/html',headers={'Access-Control-Allow-Origin':'*'},body='Access denied'))
 page.get_by_role('button',name='Tester le classement FFF').click()
 page.wait_for_function('JSON.parse(document.getElementById("report").value).http===403')
 report=page.evaluate('JSON.parse(document.getElementById("report").value)');assert not report['tableauHTML'];assert report['cadre']=='non vérifié'
 assert 'HTTP 403' in page.locator('#reading-status').inner_text()
 assert not errors,errors;b.close()
print('PASS: probe reports direct HTML read separately from user-confirmed frame visibility; no load-only success')
