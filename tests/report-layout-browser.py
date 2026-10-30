"""Five report stages, paired match cards, retained human analysis and real storage."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof renderReportQuick==='function'");page.locator('#view-reports').click()
 assert page.locator('#report-tabs button').all_text_contents()==['1 · Le match','2 · Analyse','3 · Joueurs','4 · Plan d’action','5 · Synthèse']
 quick=page.locator('#report-quick-panel');quick.get_by_label('Adversaire',exact=True).fill('Laval');quick.get_by_label('Buts marqués',exact=True).fill('3');quick.get_by_label('Buts encaissés',exact=True).fill('2');quick.get_by_label('Buts marqués à la pause',exact=True).fill('1');quick.get_by_label('Buts encaissés à la pause',exact=True).fill('0');quick.get_by_label('Titre du bilan',exact=True).fill('Bilan de référence')
 assert 'Victoire' in page.locator('#report-quick-result').inner_text();assert quick.locator('[data-score-team=away]').inner_text()=='Laval'
 score=quick.locator('.report-match-columns>.report-panel').first.bounding_box();facts=quick.locator('.report-match-columns>.report-panel').last.bounding_box();assert score['x']<facts['x'] and abs(score['y']-facts['y'])<2
 page.locator('#report-tabs [data-report-tab=sport]').click()
 assert 'Étape 2 / 5' in page.locator('#report-previous').locator('..').inner_text()
 page.get_by_role('button',name='Collectif & suivi humain',exact=True).click();assert page.evaluate('reportTab')=='human'
 page.locator('#report-content').get_by_label('Focus individuel / joueurs à relayer',exact=True).fill('Accompagner la prise de parole du capitaine.')
 page.locator('#report-next').click();assert page.evaluate('reportTab')=='players'
 page.locator('#report-next').click();assert page.evaluate('reportTab')=='plan'
 page.locator('#report-next').click();assert page.evaluate('reportTab')=='preview'
 assert 'Accompagner la prise de parole du capitaine.' in page.locator('#report-content').inner_text()
 page.locator('#report-save').click();assert page.evaluate('reportLibrary[0].title')=='Bilan de référence'
 page.locator('#report-tabs [data-report-tab=general]').click()
 for w,h in [(320,740),(390,844),(844,390),(1366,768)]:
  page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h)
  assert page.locator('#report-tabs').evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(w,h)
  if w<700:
   score=quick.locator('.report-match-columns>.report-panel').first.bounding_box();facts=quick.locator('.report-match-columns>.report-panel').last.bounding_box();assert score['y']<facts['y'] and abs(score['x']-facts['x'])<2
  if w in [390,1366]:page.screenshot(path=f'/tmp/report-layout-{w}.png',full_page=True)
 page.reload();page.wait_for_function("document.body.classList.contains('reports-mode')");assert page.evaluate("currentReport.title==='Bilan de référence'&&currentReport.info.halfFor==='1'&&currentReport.analysis.individualFocus.includes('capitaine')")
 assert not errors,errors
 b.close()
print('PASS five report stages, match cards, live score/opponent, retained human analysis, footer order, real save/reload and responsive layout.')
