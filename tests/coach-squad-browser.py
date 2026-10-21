"""Coach-owned directory, photos, slot replacement, bench, sync and offline safety."""
import json,base64
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:3016/?mode=local'
A='00000000-0000-4000-8000-000000000001';B='00000000-0000-4000-8000-000000000002'
def init(ctx,who):
 ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'account-"+A+"',name:'Coach A'},{id:'account-"+B+"',name:'Coach B'}]));if(!localStorage.getItem('vestiaire-active-coach'))localStorage.setItem('vestiaire-active-coach','account-"+who+"');")
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':1100});init(ctx,A);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(URL);page.wait_for_function("typeof squadSave==='function'")
 page.evaluate("document.querySelector('#view-pitch').click()")
 page.locator('#coach-squad-open').click();d=page.locator('#coach-squad-dialog');assert d.is_visible()
 d.get_by_role('button',name='+ Nouveau joueur',exact=True).click();editor=page.locator('#coach-squad-editor');editor.get_by_label('Prénom et nom',exact=True).fill('Alex Martin');editor.get_by_label('Numéro habituel',exact=True).fill('8');editor.get_by_label('Poste habituel',exact=True).select_option('Milieu')
 # Real upload conversion, not a mocked data URI.
 image=page.evaluate("()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.fillStyle='#2855a2';x.fillRect(0,0,32,32);return c.toDataURL('image/png').split(',')[1]}")
 editor.get_by_label('Photo du joueur',exact=True).set_input_files({'name':'alex.png','mimeType':'image/png','buffer':base64.b64decode(image)})
 page.wait_for_function("document.querySelector('#coach-squad-editor .squad-photo-preview').src.startsWith('data:image/jpeg')")
 editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();assert d.get_by_text('Alex Martin',exact=True).is_visible()
 saved=page.evaluate('squadDocument()');assert saved['squadDirectory']['players'][0]['photo'].startswith('data:image/jpeg');assert saved['players']==[]
 assert page.locator('#saved .saved-entry').count()==0
 before=page.evaluate('structuredClone(getCompositionBoard().players[0])')
 d.get_by_role('button',name='Utiliser Alex Martin',exact=True).click();page.locator('#coach-squad-picker').get_by_role('button',name='Ajouter à cette place').click()
 after=page.evaluate('getCompositionBoard().players[0]');assert after['name']=='Alex Martin' and after['id']==before['id'] and after['x']==before['x'] and after['y']==before['y'] and after['photo']
 page.reload();page.wait_for_function("typeof squadPlayers==='function'");assert page.evaluate('squadPlayers().length')==1;assert page.evaluate('getCompositionBoard().players[0].name')=='Alex Martin'
 # No duplicate addition; profile edits affect future selections, not old compositions.
 page.evaluate('openCoachSquad()');d.get_by_role('button',name='Utiliser Alex Martin',exact=True).click();assert not page.locator('#coach-squad-picker').is_visible()
 d.get_by_role('button',name='Modifier Alex Martin',exact=True).click();editor.get_by_label('Numéro habituel',exact=True).fill('10');editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();assert page.evaluate('getCompositionBoard().players[0].number')==8
 d.get_by_role('button',name='+ Nouveau joueur',exact=True).click();editor.get_by_label('Prénom et nom',exact=True).fill('Sam');editor.get_by_label('Numéro habituel',exact=True).fill('12');editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click()
 page.evaluate("()=>{activateTerrainBoard('plan');window.oldPlan=JSON.stringify(getGamePlanBoard())}")
 d.get_by_role('button',name='Utiliser Sam',exact=True).click();picker=page.locator('#coach-squad-picker');picker.get_by_label('Place dans la composition',exact=True).select_option('__bench');picker.get_by_role('button',name='Ajouter à cette place').click()
 assert page.evaluate("getCompositionBoard().players.some(p=>p.name==='Sam'&&p.role==='sub')")
 assert page.evaluate('JSON.stringify(getGamePlanBoard())===window.oldPlan')
 # Account-scoped persistence feeds the actual versioned publishing queue.
 result=page.evaluate('''async ()=>{clubNetworkQueueSync=()=>Promise.resolve();clubNetworkSession={user:{id:activeCoach.id.slice(8)}};clubNetworkMember={user_id:clubNetworkSession.user.id};window.published=null;clubNetworkRequest=async(path,o={})=>{if(path.includes('club_publish_document')){window.published=o.body;return [{id:'directory-remote',owner_id:clubNetworkSession.user.id,source_id:o.body.p_source_id,revision:1}];}return [];};const players=structuredClone(squadPlayers());players[0].position='Attaquant';if(!squadSave(players))throw Error('save');const pending=clubNetworkPendingJobs();await clubNetworkFlushPending();return {pending,published:window.published,remaining:clubNetworkPendingJobs()};}''')
 assert len(result['pending'])==1 and result['published']['p_kind']=='composition' and result['published']['p_payload']['squadDirectory']['players'][0]['position']=='Attaquant' and not result['remaining']
 remote=result['published']['p_payload']
 ctx2=b.new_context();init(ctx2,A);other=ctx2.new_page();other.goto(URL);other.wait_for_function("typeof squadPlayers==='function'");assert other.evaluate('squadPlayers().length')==0
 other.evaluate("payload=>clubNetworkSetLibrary('composition',[payload])",remote);assert other.evaluate('squadPlayers().length')==2
 # Local failure leaves the old directory intact.
 fail=other.evaluate("()=>{const old=JSON.stringify(squadPlayers()),writer=coachStorageSet;coachStorageSet=()=>{throw Error('quota')};const ok=squadSave([]);coachStorageSet=writer;return !ok&&JSON.stringify(squadPlayers())===old}");assert fail
 # A concurrent directory edit requires a per-player choice, preserving distinct players.
 conflict=page.evaluate("payload=>{const local=structuredClone(squadPlayers());local.push({id:'local-only',name:'Noé',number:3,photo:'',position:'Défenseur'});squadSave(local);const remote=structuredClone(payload);remote.squadDirectory.players[1].number=20;remote.squadDirectory.players.push({id:'remote-only',name:'Léo',number:18,photo:'',position:'Milieu'});squadResolveRemote({id:'directory-remote',kind:'composition',source_id:remote.documentId,revision:2,payload:remote});return true}",remote)
 merge=page.locator('#coach-squad-conflict');merge.get_by_label('Version de Sam',exact=True).select_option('remote');merge.get_by_role('button',name='Réunir et partager',exact=True).click()
 assert page.evaluate("squadPlayers().length===4&&squadPlayers().find(p=>p.name==='Sam').number===20")
 assert page.evaluate("clubNetworkPendingJobs()[0].expected.revision===2")
 # Another account has no directory in the same browser; switching back retains A.
 page.evaluate("localStorage.setItem('vestiaire-active-coach','account-"+B+"')");page.reload();page.wait_for_function("typeof squadPlayers==='function'")
 assert page.evaluate('squadPlayers().length')==0
 page.evaluate("localStorage.setItem('vestiaire-active-coach','account-"+A+"')");page.reload();page.wait_for_function("typeof squadPlayers==='function'")
 assert page.evaluate('squadPlayers().length')==4
 other.set_viewport_size({'width':390,'height':844});other.evaluate('openCoachSquad()');assert other.evaluate('document.documentElement.scrollWidth<=innerWidth+1');other.screenshot(path='/tmp/coach-squad-mobile.png',full_page=True)
 other.evaluate("()=>{getCompositionBoard().players[0].name='Chris';getCompositionBoard().players[0].number=9;}")
 other.locator('#coach-squad-dialog').get_by_role('button',name='Récupérer les joueurs de la compo',exact=True).click()
 assert other.evaluate('squadPlayers().length')==3
 other.locator('#coach-squad-dialog').get_by_role('button',name='Utiliser Chris',exact=True).click()
 assert not other.locator('#coach-squad-picker').is_visible()
 assert other.evaluate("valid({...squadDocument(),squadDirectory:{version:1,players:[null]}})===false")
 assert not errors,errors
 b.close();print('PASS squad: real photo, per-coach directory, reload, preserved slot and plan, bench, duplicate prevention, profile edits, publishing queue, second-device merge, storage failure and mobile.')
