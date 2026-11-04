"""Team isolation, legacy preservation, switching, concurrent tabs and cloud hydration."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce')
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    def ready(page): page.wait_for_function('window.externalModalClose && window.workspaceFraming && document.getElementById("coach-team-select")')
    page.goto('http://127.0.0.1:3016/?mode=local');ready(page)
    def select_team(value):
        page.locator('#team-space-trigger').click()
        if value=='__add': page.locator('#team-space-add').click()
        elif value=='__edit': page.locator('.team-space-edit').click()
        else: page.locator(f'.team-space-card[data-team-id="{value}"]').click()
    # Existing technical content is preserved verbatim and discovered by its actual category.
    ids=page.evaluate("""()=>{
      const sessions=[],reports=[],boards=[];
      for(const [category,name] of [['Seniors','Alice'],['U15','Benoît']]){
        const session=newTraining();delete session.teamContext;session.category=category;session.title='Séance '+category;session.date='2026-11-10';sessions.push(session);
        const report=newReport();delete report.teamContext;report.info.category=category;report.info.goalsFor=category==='U15'?'1':'4';report.info.goalsAgainst='0';report.title='Bilan '+category;reports.push(report);
        const board=structuredClone(state);delete board.teamContext;board.category=category;board.documentId='directory-'+category;board.squadDirectory={version:1,players:[{id:'player-'+category,name,number:7,photo:'',position:'Milieu',foot:'Droit'}]};boards.push({date:new Date().toISOString(),state:board});
      }
      const unknown=newTraining();delete unknown.teamContext;unknown.category='';unknown.title='Sans catégorie';sessions.push(unknown);
      localStorage.setItem(coachTeamBaseKey('vestiaire-training-library'),JSON.stringify(sessions));
      localStorage.setItem(coachTeamBaseKey('vestiaire-reports'),JSON.stringify(reports));
      localStorage.setItem(coachTeamBaseKey('vestiaire-saves'),JSON.stringify(boards));
      localStorage.setItem(coachTeamBaseKey('vestiaire-save-journal:vestiaire-training-library'),JSON.stringify({key:'vestiaire-training-library',value:JSON.stringify(sessions),jobs:sessions.map(s=>({kind:'training',id:s.id,op:'save'}))}));sessionStorage.setItem(coachTeamSelectionKey,coachTeamCategoryId('Seniors'));
      return {senior:coachTeamCategoryId('Seniors'),youth:coachTeamCategoryId('U15')};
    }""")
    page.reload();ready(page)
    assert page.evaluate('trainingLibrary.map(s=>s.title)')==['Séance Seniors']
    assert page.evaluate('reportLibrary.map(r=>r.info.goalsFor)')==['4']
    assert page.evaluate('squadPlayers().map(p=>p.name)')==['Alice']
    assert page.evaluate('state.category')=='Seniors'
    assert page.evaluate("clubNetworkRecoveryCandidates().map(c=>c.payload.title)")==['Séance Seniors']
    page.evaluate("()=>{coachStorageSet(agendaRecurringKey,JSON.stringify({version:1,scope:'month',revision:1,enabled:true,from:'2026-11-01',to:'2026-11-30',category:'Seniors',statuses:{},slots:[{id:'slot-test',day:2,type:'training',time:'19:00',title:'Seniors récurrent',status:'pending'}]}));currentTraining.title='Brouillon Seniors';saveTrainingDraft();squadSave([...squadPlayers(),{id:'extra',name:'Carole',number:8,photo:'',position:'Milieu',foot:''}])}")
    page.locator('#workspace-squad-entry').click()
    select_team(ids['youth']);ready(page);page.wait_for_function('(id)=>activeCoachTeam.id===id',arg=ids['youth'])
    assert page.evaluate('trainingLibrary.map(s=>s.title)')==['Séance U15']
    assert page.evaluate("document.body.classList.contains('squad-mode')")
    assert page.evaluate('reportLibrary.map(r=>r.info.goalsFor)')==['1']
    assert page.evaluate('squadPlayers().map(p=>p.name)')==['Benoît']
    assert page.evaluate('currentTraining.title||""')!='Brouillon Seniors'
    assert page.evaluate('state.category')=='U15'
    assert page.evaluate('agendaRecurringRead()') is None
    # Team writes never rewrite the historical libraries or another team's keys.
    page.evaluate("()=>{coachStorageSet('vestiaire-training-library','[]');trainingLibrary=[]}")
    assert page.evaluate("JSON.parse(localStorage.getItem(coachTeamBaseKey('vestiaire-training-library'))).map(s=>s.title).sort()")==['Sans catégorie','Séance Seniors','Séance U15']
    select_team(ids['senior']);page.wait_for_function('(id)=>activeCoachTeam.id===id',arg=ids['senior']);ready(page)
    assert page.evaluate('currentTraining.title')=='Brouillon Seniors'
    assert page.evaluate("agendaRecurringOccurrences(agendaRecurringRead(),{from:'2026-11-01',to:'2026-11-30'}).length")==4
    assert page.evaluate('squadPlayers().map(p=>p.name)')==['Alice','Carole']
    # A second tab independently selects a team; stale callbacks in the first keep their scope.
    other=context.new_page();other.on('pageerror',lambda e:errors.append(str(e)));other.goto('http://127.0.0.1:3016/?mode=local');ready(other)
    other.evaluate('(id)=>sessionStorage.setItem(coachTeamSelectionKey,id)',ids['youth']);other.reload();ready(other)
    assert other.evaluate('activeCoachTeam.id')==ids['youth']
    page.evaluate("()=>{const session=newTraining();session.title='Seniors supplémentaire';coachStorageSet('vestiaire-training-library',JSON.stringify([...trainingLibrary,session]));trainingLibrary.push(session)}")
    other.evaluate("()=>{const session=newTraining();session.title='U15 supplémentaire';coachStorageSet('vestiaire-training-library',JSON.stringify([session]));trainingLibrary=[session]}")
    assert page.evaluate('activeCoachTeam.id')==ids['senior']
    assert page.evaluate("JSON.parse(coachStorageGet('vestiaire-training-library')).length")==2
    other.close()
    # Server hydration discovers other teams but cannot inject their documents into the active list.
    page.evaluate("""async()=>{
      const existingTeam={id:'team-other-tab-empty',label:'Groupe enregistré dans un autre onglet',category:'Espoirs',team:'Club'};localStorage.setItem(coachTeamManifestKey,JSON.stringify([...coachTeams,existingTeam]));const originals={bound:clubNetworkBound,member:clubNetworkLoadMember,presence:clubNetworkUpdatePresence,pending:clubNetworkFlushPending,request:clubNetworkRequest,reference:clubReferenceRefresh,session:clubNetworkSession};
      clubNetworkBound=()=>true;clubNetworkSession={user:{id:'team-test'}};clubNetworkLoadMember=async()=>true;clubNetworkUpdatePresence=async()=>{};clubNetworkFlushPending=async()=>{};clubReferenceRefresh=async()=>{};
      const own=newTraining();own.id='remote-senior';own.title='Distant Seniors';own.teamContext={...activeCoachTeam};
      const foreign=newTraining();foreign.id='remote-youth';foreign.title='Distant U15';foreign.category='U15';foreign.teamContext={id:'team-remote-youth',label:'Groupe distant U15',category:'U15',team:'Stade Mayennais'};
      const rows=[own,foreign].map(payload=>({id:'server-'+payload.id,source_id:payload.id,owner_id:'team-test',kind:'training',title:payload.title,revision:1,updated_at:new Date().toISOString(),payload}));
      clubNetworkRequest=async path=>{const url=new URL('https://test.invalid'+path);if(url.searchParams.get('select')==='*')return rows.filter(r=>'eq.'+r.id===url.searchParams.get('id'));return rows.map(({payload,...row})=>row);};
      try{await clubNetworkSync();window.teamHydratedTitles=trainingLibrary.map(s=>s.title);}
      finally{clubNetworkBound=originals.bound;clubNetworkLoadMember=originals.member;clubNetworkUpdatePresence=originals.presence;clubNetworkFlushPending=originals.pending;clubNetworkRequest=originals.request;clubReferenceRefresh=originals.reference;clubNetworkSession=originals.session;}
    }""")
    assert 'Distant Seniors' in page.evaluate('teamHydratedTitles')
    assert 'Distant U15' not in page.evaluate('teamHydratedTitles')
    assert page.evaluate("JSON.parse(localStorage.getItem(coachTeamManifestKey)).some(t=>t.id==='team-other-tab-empty')")
    # Coach supplies all setup data; another team can share the same football category.
    select_team('__add');dialog=page.locator('.coach-team-dialog');dialog.locator('.external-modal-close').wait_for()
    dialog.get_by_label('Nom affiché (ex. Seniors A)',exact=True).fill('Mon groupe B');dialog.get_by_label('Catégorie (ex. Seniors, U15)',exact=True).fill('Seniors');dialog.get_by_label('Nom de l’équipe',exact=True).fill('Club B')
    dialog.get_by_role('button',name='Créer et ouvrir cette équipe',exact=True).click();page.wait_for_function("activeCoachTeam.label==='Mon groupe B'");ready(page)
    assert page.evaluate('trainingLibrary.length+reportLibrary.length+squadPlayers().length')==0
    assert page.evaluate('state.team')=='Club B'
    assert page.evaluate('state.category')=='Seniors'
    assert page.evaluate("clubNetworkRecoveryCandidates().length")==0
    # Quota failure cannot partially replace another team's library.
    assert page.evaluate("""()=>{const before=localStorage.getItem(coachTeamBaseKey('vestiaire-training-library')),set=Storage.prototype.setItem;let rejected=false;Storage.prototype.setItem=function(){throw Error('quota')};try{coachStorageSet('vestiaire-training-library',JSON.stringify([newTraining()]));}catch{rejected=true}finally{Storage.prototype.setItem=set}return rejected&&localStorage.getItem(coachTeamBaseKey('vestiaire-training-library'))===before;}""")
    assert page.evaluate("""(target)=>{const set=Storage.prototype.setItem;let result;Storage.prototype.setItem=function(){throw Error('quota')};try{result=coachTeamSwitch(target);}finally{Storage.prototype.setItem=set}return result===false&&document.getElementById('coach-team-select').value===activeCoachTeam.id;}""",ids['senior'])
    for width in [1366,390,320]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        select_team('__edit');dialog=page.locator('.coach-team-dialog');cross=dialog.locator('.external-modal-close');cross.wait_for()
        assert cross.evaluate("e=>getComputedStyle(e,'::before').color")=='rgb(228, 31, 40)'
        assert dialog.evaluate('e=>e.scrollWidth<=e.clientWidth+2')
        dialog.get_by_role('button',name='Fermer',exact=True).click();dialog.wait_for(state='detached')
    select_team('__edit');dialog=page.locator('.coach-team-dialog')
    team_id=page.evaluate('activeCoachTeam.id')
    dialog.get_by_label('Nom affiché (ex. Seniors A)',exact=True).fill('Mon équipe espoir');dialog.get_by_label('Catégorie (ex. Seniors, U15)',exact=True).fill('Espoirs')
    dialog.get_by_role('button',name='Enregistrer mon équipe',exact=True).click();page.wait_for_function("activeCoachTeam.label==='Mon équipe espoir'");ready(page)
    assert page.evaluate('activeCoachTeam.id')==team_id
    assert page.evaluate('newTraining().category')=='Espoirs'
    assert not errors,errors
    browser.close()
print('Team libraries, roster, drafts, historical backup preservation, independent tabs, cloud hydration, manual setup, quota and responsive external close passed')
