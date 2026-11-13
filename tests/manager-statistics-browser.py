import os,json,csv,io
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3065');out=Path('/workspace/cruza-documents/responsable');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1600,'height':1100},locale='fr-FR',timezone_id='Europe/Paris');errors=[];network=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:network.append(r.url) if 'supabase.co' in r.url else None)
 page.goto(base+'/manager.html?demo=1');page.wait_for_selector('#content:not([hidden])');page.locator('.sidebar [data-tab=statistics]').click();page.wait_for_selector('#stats-body:not([hidden])');page.evaluate('document.fonts.ready')
 assert page.locator('#stats-groups tr').count()==6
 page.screenshot(path=str(out/'CRUZA-statistiques-club.png'),full_page=True)
 page.get_by_role('button',name='Explorer U17 · Camille Laurent',exact=True).click();assert page.locator('#stats-owner').input_value()=='c1';assert page.locator('#stats-category').input_value()=='U17';assert page.locator('#stats-groups tr').count()==1
 assert page.locator('#stats-players tr').count()==12
 page.get_by_role('button',name='Afficher davantage de joueurs').click();assert page.locator('#stats-players tr').count()==18
 page.evaluate('scrollTo(0,0)')
 page.screenshot(path=str(out/'CRUZA-statistiques-U17.png'),full_page=True)
 page.screenshot(path=str(out/'CRUZA-statistiques-U17-ecran.png'))
 assert page.locator('#stats-week-chart .stats-bar-column').count()>0;assert page.locator('#stats-ratings .stats-rating-row').count()==7
 with page.expect_download() as d:page.get_by_role('button',name='Exporter la synthèse CSV').click()
 download=d.value;download.save_as(out/'CRUZA-exemple-statistiques-U17.csv');csvrows=list(csv.reader((out/'CRUZA-exemple-statistiques-U17.csv').read_text(encoding='utf-8-sig').splitlines(),delimiter=';'));assert len(csvrows)==2 and csvrows[1][0]=='U17' and csvrows[1][1]=='Camille Laurent'
 page.fill('#stats-from','2026-12-31');page.fill('#stats-to','2026-01-01');page.locator('#stats-to').blur();assert page.locator('#stats-body').is_hidden();assert 'date de début' in page.locator('#stats-status').inner_text()
 page.get_by_role('button',name='Réinitialiser les filtres').click(force=True) if page.locator('#stats-reset').is_visible() else None
 # Restore via the date inputs when invalid-date state hides the reset control.
 page.select_option('#stats-range','30');assert page.locator('#stats-body').is_visible()
 page.select_option('#stats-owner','');page.select_option('#stats-category','');page.select_option('#scope','formation');assert page.locator('#stats-groups tr').count()==4
 page.select_option('#scope','all');page.locator('.sidebar [data-tab=educators]').click();page.get_by_role('button',name='Voir les statistiques de Alex Martin',exact=True).click();assert page.locator('#stats-owner').input_value()=='c2';assert page.locator('#stats-groups tr').count()==1
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/'CRUZA-statistiques-mobile.png'),full_page=True)
 assert not network,network
 assert not errors,errors
 page.close();b.close()
print('PASS statistics browser: category/educator drilldown, date ranges, 7 rating axes, 18-player pagination, scoped filters, CSV, mobile, no cloud calls in demo, no JS errors.')
