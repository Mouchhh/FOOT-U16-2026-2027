from playwright.sync_api import sync_playwright, expect
# One player profile everywhere: no shirt number, several positions, nickname on the pion.
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function('!!window.compositionPlayerPicker')
 # Legacy records (number, single free-text position) still load.
 assert page.evaluate("squadSave([{id:'legacy-1',name:'Karim Benz',number:9,photo:'',position:'Défenseur central',foot:'Droit'},{id:'legacy-2',name:'Léo',number:8,photo:'',position:'Milieu'}])")
 page.locator('#workspace-squad-entry').click();d=page.locator('#coach-squad-dialog');assert 'Défenseur central' in d.locator('.squad-list').inner_text()
 page.evaluate("squadEdit('legacy-1')");editor=page.locator('#coach-squad-editor')
 assert editor.get_by_label('Prénom',exact=True).input_value()=='Karim';assert editor.get_by_label('Nom (facultatif)',exact=True).input_value()=='Benz'
 assert editor.get_by_label('Défenseur central',exact=True).is_checked();assert editor.get_by_label('Numéro habituel',exact=True).count()==0
 editor.get_by_label('Surnom (facultatif)',exact=True).fill('KB9');editor.get_by_label('Attaquant',exact=True).check();editor.get_by_label('Numéro de licence (facultatif)',exact=True).fill('2543123456')
 editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();expect(editor).to_be_hidden()
 karim=page.evaluate("squadPlayers().find(p=>p.id==='legacy-1')")
 assert karim['number']==9 and karim['nickname']=='KB9' and karim['license']=='2543123456' and sorted(karim['positions'])==['Attaquant','Défenseur central'],karim
 assert page.evaluate("squadPositionMatches(squadPlayers().find(p=>p.id==='legacy-1'),'Attaquant')")
 # A legacy one-word name can still be saved (last name optional).
 page.evaluate("squadEdit('legacy-2')");editor.get_by_label('Pied préféré',exact=True).select_option('Gauche');editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();expect(editor).to_be_hidden()
 assert page.evaluate("squadPlayers().find(p=>p.id==='legacy-2').foot")=='Gauche'
 # Placing a profile keeps the place's match number and shows the nickname.
 page.locator('#view-pitch').click();page.locator('#document-entry-resume').click();page.wait_for_function("document.body.classList.contains('composition-slot-editing')")
 slot=page.evaluate("state.players.find(p=>p.number===9).id");page.evaluate(f"compositionPlayerPicker.open('{slot}')");picker=page.locator('#composition-player-picker')
 assert picker.get_by_label('Numéro pour ce match',exact=True).input_value()=='9';picker.get_by_role('button',name='Sélectionner Karim Benz',exact=True).click();expect(picker).to_have_count(0)
 pion=page.evaluate("state.players.find(p=>p.squadPlayerId==='legacy-1')");assert pion['name']=='Karim Benz' and pion['number']==9
 assert page.locator(f"#players .player[data-id='{pion['id']}'] .player-name").inner_text()=='KB9'
 # « Ajouter un joueur » opens the same profile form; the record has no number.
 page.evaluate("document.getElementById('add').click()");assert picker.locator('h2').inner_text()=='Ajouter un joueur'
 picker.get_by_role('tab',name='Créer un joueur',exact=True).click();picker.get_by_label('Prénom',exact=True).fill('Enzo');picker.get_by_label('Nom (facultatif)',exact=True).fill('Martin')
 picker.get_by_label('Milieu',exact=True).check();picker.get_by_label('Attaquant',exact=True).check();picker.get_by_label('Numéro pour ce match',exact=True).fill('14')
 picker.get_by_role('button',name='Enregistrer et placer le joueur',exact=True).click();expect(picker).to_have_count(0)
 enzo=page.evaluate("squadPlayers().find(p=>p.firstName==='Enzo')");assert 'number' not in enzo and enzo['positions']==['Milieu','Attaquant'],enzo
 placed=page.evaluate(f"state.players.find(p=>p.squadPlayerId==='{enzo['id']}')");assert placed['number']==14 and placed['name']=='Enzo Martin'
 assert page.locator(f"#players .player[data-id='{placed['id']}'] .player-name").inner_text()=='Enzo';assert page.evaluate('valid(state)')
 # Linked pion settings: name and photo come from the profile.
 page.evaluate(f"compositionPlayerPicker.open('{placed['id']}')");picker.get_by_role('button',name='Autres réglages du pion',exact=True).click()
 assert page.evaluate("document.getElementById('player-name').readOnly");assert page.locator('#player-linked-hint').is_visible();assert page.locator('#photo').is_hidden();page.locator('#close').click()
 # From the second terrain step, « + Impacteur » also opens the shared form (bench place).
 page.locator('#terrain-next').click();page.evaluate("document.getElementById('add-sub').click()");assert picker.locator('h2').inner_text()=='Ajouter un joueur'
 picker.get_by_role('tab',name='Créer un joueur',exact=True).click();picker.get_by_label('Prénom',exact=True).fill('Sacha');picker.get_by_role('button',name='Enregistrer et placer le joueur',exact=True).click();expect(picker).to_have_count(0)
 sacha=page.evaluate("(()=>{const s=squadPlayers().find(p=>p.firstName==='Sacha');const p=state.players.find(x=>x.squadPlayerId===s.id);return {hasNumber:'number' in s,role:p.role,number:p.number}})()")
 assert sacha['hasNumber'] is False and sacha['role']=='sub' and 1<=sacha['number']<=99,sacha
 # Legacy pions whose id is a profile id: not offered twice, and a swap keeps both identities.
 page.locator('#terrain-previous').click();page.wait_for_function('workspaceFlows.terrain.index()===0')
 assert page.evaluate("squadSave([...squadPlayers(),{id:'A1',name:'Alpha Un',photo:'',position:''},{id:'B1',name:'Beta Deux',photo:'',position:''}])")
 page.evaluate("()=>{const b=getCompositionBoard();for(const [i,id,name] of [[2,'A1','Alpha Un'],[3,'B1','Beta Deux']]){b.players[i].id=id;b.players[i].name=name;delete b.players[i].squadPlayerId;}persist();render();}")
 assert not page.evaluate("[...document.getElementById('match-roster-add').options].some(o=>o.value==='A1')")
 page.evaluate("compositionPlayerPicker.open('A1')");picker.get_by_role('button',name='Échanger avec Beta Deux',exact=True).click();expect(picker).to_have_count(0)
 assert page.evaluate("getCompositionBoard().players.filter(p=>['A1','B1'].includes(p.id)).map(p=>p.name+'>'+playerStatsResolve(p)?.id).sort()")==['Alpha Un>A1','Beta Deux>B1']
 # Swapping a generic pion with a legacy profile-id pion leaves only one pion resolving to that profile.
 page.evaluate("(()=>{const b=getCompositionBoard();b.players[5].name='Joueur 6';delete b.players[5].squadPlayerId;persist();render();})()")
 generic=page.evaluate("getCompositionBoard().players[5].id");page.evaluate(f"compositionPlayerPicker.open('{generic}')");picker.get_by_role('button',name='Échanger avec Beta Deux',exact=True).click();expect(picker).to_have_count(0)
 assert page.evaluate("getCompositionBoard().players.filter(p=>playerStatsResolve(p)?.id==='B1').length")==1
 # A legacy one-word name of exactly 25 characters can be saved unchanged.
 assert page.evaluate("squadSave([...squadPlayers(),{id:'long',name:'Abcdefghijklmnopqrstuvwxy',photo:'',position:''}])");page.evaluate("squadEdit('long')");editor.get_by_role('button',name='Enregistrer le joueur',exact=True).click();expect(editor).to_be_hidden()
 assert page.evaluate("squadSave(squadPlayers().filter(p=>p.id!=='long'))")
 # Plans keep independent names: no profile lock, no nickname label.
 plan=page.evaluate("(()=>{const saved=state;state={...structuredClone(getCompositionBoard()),boardKind:'plan'};const p=state.players.find(x=>x.squadPlayerId==='legacy-1');openEditor(p.id);const r=[document.getElementById('player-name').readOnly,pionLabel(p)];document.getElementById('editor').close();state=saved;render();return r})()")
 assert plan==[False,'Karim Benz'],plan
 # Reports read numbers only from their own composition snapshot.
 numbers=page.evaluate(f"()=>{{const r=newReport();return [reportMatchNumber(r,squadPlayers().find(p=>p.id==='legacy-1')),reportMatchNumber(r,squadPlayers().find(p=>p.id==='{enzo['id']}')),reportMatchNumber({{preparation:{{roster:[]}}}},squadPlayers()[0]),reportPreparationValid(r.preparation)]}}")
 assert numbers==['9','14','',True],numbers
 assert page.evaluate("playerStatsResolve({name:'Karim Benz',number:'14'})?.id")=='legacy-1'
 page.reload();page.wait_for_function('!!window.compositionPlayerPicker');assert page.evaluate('squadPlayers().length')==6
 assert 'undefined' not in page.locator('body').inner_text()
 # Blank match: « Ajouter un joueur » takes a free formation place, never an occupied one.
 slots=page.evaluate("(()=>{const b=getCompositionBoard();const k=b.players.find(p=>p.squadPlayerId==='legacy-1');k.role='starter';k.formationSlot=1;b.players=[k];b.matchCreation='blank';persist();render();return true})()")
 page.evaluate("document.getElementById('add').click()");picker.get_by_role('button',name='Sélectionner Léo',exact=True).click();expect(picker).to_have_count(0)
 assert page.evaluate("getCompositionBoard().players.map(p=>p.formationSlot).sort()")==[0,1]
 # Mobile: the shared form fits 390 px.
 page.set_viewport_size({'width':390,'height':844});page.locator('#workspace-squad-entry').click();page.evaluate('squadEdit()');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 ctx.close();b.close();print('Legacy profiles, several positions, nickname on pion, profile creation from the pitch, match numbers in reports, reload and mobile passed')
