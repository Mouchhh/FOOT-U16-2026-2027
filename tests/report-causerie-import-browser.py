"""Import own matching preparation without duplicate stats, data loss or modal UI."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('window.documentEntry && window.workspaceSheets')
 page.locator('#view-reports').click()
 page.evaluate('''()=>{
  squadSave([{id:'import-a',name:'Alex',number:9,position:'Attaquant',photo:''},{id:'import-b',name:'Noé',number:8,position:'Milieu',photo:''}]);
  const source=structuredClone(getCompositionBoard());source.documentId='import-match';delete source.squadDirectory;source.title='Causerie dimanche';source.formation='4-4-2';source.players=source.players.slice(0,2);Object.assign(source.players[0],{id:'import-a',name:'Alex',number:9,role:'starter'});Object.assign(source.players[1],{id:'import-b',name:'Noé',number:8,role:'sub'});
  source.matchPreparation={...newMatchPreparation(),date:'2026-11-01',opponent:'Adversaire',offensive:'Écarter le bloc',defensive:'Fermer l’axe',objectives:['Presser ensemble','Attaquer la profondeur','','']};
  saves.unshift({date:new Date().toISOString(),state:source});
  const other=structuredClone(source);other.documentId='foreign-import';other.teamContext={id:'team-foreign',label:'Autre',category:'U15',team:'Club'};saves.unshift({date:new Date().toISOString(),state:other});
  const different=structuredClone(source);different.documentId='wrong-match';different.matchPreparation.date='2026-12-05';saves.unshift({date:new Date().toISOString(),state:different});
  currentReport.info.date='2026-11-01';currentReport.info.opponent='Adversaire';currentReport.players=[{id:'already',squadPlayerId:'import-a',name:'Alex',number:'9',role:'Titulaire',minutes:'75',score:'',note:'',objective:'',goals:'2'}];currentReport.analysis.topAttack='Observation conservée';currentReport.plan.priority='Priorité déjà saisie';currentReport.events=[{minute:'10',type:'Autre',detail:'À garder'}];renderReportContent();
 }''')
 source=page.locator('#report-causerie-source');assert source.locator('option').count()==2
 assert 'Causerie dimanche' in source.inner_text()
 page.locator('#report-causerie-import-button').click()
 assert page.evaluate('currentReport.players.length')==2
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="import-a").minutes')=='75'
 assert page.evaluate('currentReport.players.find(r=>r.squadPlayerId==="import-b").role')=='Impacteur / Finisseur'
 assert page.evaluate('currentReport.info.formation')=='4-4-2'
 assert page.evaluate('currentReport.preparation.plan.offensive')=='Écarter le bloc'
 assert page.evaluate('currentReport.plan.priority')=='Priorité déjà saisie'
 assert page.evaluate('currentReport.analysis.topAttack')=='Observation conservée'
 assert page.evaluate('currentReport.events[0].detail')=='À garder'
 page.locator('#report-causerie-import-button').click();assert page.evaluate('currentReport.players.length')==2
 assert page.locator('dialog[open]').count()==0
 # Blank priorities are populated, while a failed write leaves every existing field intact.
 page.evaluate("()=>{currentReport.plan.priority='';window.importSet=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-report-draft')throw Error('quota');return importSet(k,v)}}")
 before=page.evaluate('JSON.stringify(currentReport)');page.locator('#report-causerie-import-button').click()
 assert page.evaluate('JSON.stringify(currentReport)')==before
 assert 'quota' in page.locator('.report-causerie-status').inner_text()
 page.evaluate('()=>{coachStorageSet=importSet}');page.locator('#report-causerie-import-button').click()
 assert page.evaluate('currentReport.plan.priority')=='Presser ensemble\nAttaquer la profondeur'
 # Short/long modules and every scroll position keep actions at viewport bottom, above mobile dock.
 for width in [1366,390,320]:
  page.set_viewport_size({'width':width,'height':844})
  for tab in ['general','sport','players','plan','preview']:
   page.evaluate('(tab)=>{reportTab=tab;renderReportTabs();renderReportContent()}',tab)
   page.wait_for_timeout(100)
   for scroll in [0,100000]:
    page.evaluate('(y)=>scrollTo(0,y)',scroll);page.wait_for_timeout(50)
    assert page.locator('#report-next').is_visible()
    assert page.locator('.report-actions-dock').evaluate("e=>Math.abs(e.getBoundingClientRect().bottom-(innerHeight-parseFloat(getComputedStyle(document.body).getPropertyValue('--navigation-bottom-space')||'0')))<3")
    assert page.locator('.report-actions-dock').evaluate('e=>e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth+1')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=f'/tmp/report-import-actions-{width}.png')
 page.locator('#view-home').click();assert not page.locator('.report-actions-dock').is_visible()
 assert not errors,errors
 b.close()
print('Causerie matching/team isolation, roster merge/reimport, formation/priorities, quota rollback, fixed footer on all tabs, scrolling and mobile passed')
